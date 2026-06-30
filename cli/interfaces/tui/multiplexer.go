package tui

import (
	"fmt"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/creack/pty"
	"github.com/manifoldco/promptui"
	"golang.org/x/term"

	"huginin/infrastructure/config"
)

const escKey = byte(0x1c) // Ctrl+\

const (
	quietPeriod = 600 * time.Millisecond
	maxWait     = 5 * time.Second
	ctxBufSize  = 4096
)

// Matches CSI (including private-mode params like ?/>/<), OSC, and 2-char escapes.
var ansiEscape = regexp.MustCompile(
	`\x1b\[[\x30-\x3f]*[\x20-\x2f]*[\x40-\x7e]` + // CSI: ESC [ params final
		`|\x1b][^\a\x1b]*(?:\a|\x1b\\)` + // OSC: ESC ] ... BEL/ST
		`|\x1b[^\[^\]]` + // 2-char escape sequences
		`|\x07|\x0d`, // lone BEL, CR
)

var cliTools = []struct {
	name   string
	binary string
	label  string
}{
	{"claude-code", "claude", "claude-code"},
	{"antigravity", "agy", "antigravity  (agy)"},
	{"codex", "codex", "codex"},
}

type ptySession struct {
	pty      *os.File
	cmd      *exec.Cmd
	outputCh chan struct{}
	outBuf   []byte
	outMu    sync.Mutex
}

type Multiplexer struct {
	sessions      map[string]*ptySession
	active        string
	paused        bool
	suppressing   bool
	suppressedBuf []byte
	exitCh        chan string
	mu            sync.Mutex

	// stdin reader goroutine management
	stdinCh  chan []byte
	stopRead chan struct{}
	stdinDup int
	readerWg sync.WaitGroup
}

func RunMultiplexer(initial string) error {
	m := &Multiplexer{
		sessions: make(map[string]*ptySession),
		exitCh:   make(chan string, 8),
		stdinCh:  make(chan []byte, 64),
	}

	name := normalizeTool(initial)
	if name == "pick" {
		name = m.pickUI()
		if name == "" {
			return nil
		}
	}

	fd := int(os.Stdin.Fd())
	oldState, err := term.MakeRaw(fd)
	if err != nil {
		return err
	}
	defer term.Restore(fd, oldState)

	sigWinch := make(chan os.Signal, 1)
	signal.Notify(sigWinch, syscall.SIGWINCH)
	go func() {
		for range sigWinch {
			m.mu.Lock()
			s := m.sessions[m.active]
			m.mu.Unlock()
			if s != nil {
				if ws, err := pty.GetsizeFull(os.Stdout); err == nil {
					pty.Setsize(s.pty, ws)
				}
			}
		}
	}()

	// ponytail: SIGQUIT (Ctrl+\) may bypass raw mode on some macOS versions;
	// treat it identically to the escKey byte so tool-switch always works.
	sigQuit := make(chan os.Signal, 1)
	signal.Notify(sigQuit, syscall.SIGQUIT)
	go func() {
		for range sigQuit {
			m.stdinCh <- []byte{escKey}
		}
	}()

	if err := m.startCLI(name); err != nil {
		return err
	}
	m.active = name
	m.saveActiveTool(name)
	showBanner(name)

	m.startStdinReader()

	for {
		select {
		case data, ok := <-m.stdinCh:
			if !ok {
				return nil
			}
			if len(data) == 1 && data[0] == escKey {
				m.mu.Lock()
				m.paused = true
				m.mu.Unlock()

				// stdin 고루틴 중지 → promptui가 독점 접근
				m.stopStdinReader()
				term.Restore(fd, oldState)
				next := m.pickUI()
				oldState, _ = term.MakeRaw(fd)
				m.startStdinReader()

				if next == "" {
					// 취소: 화면 건드리지 않고 현재 CLI 복귀
					m.mu.Lock()
					m.paused = false
					m.mu.Unlock()
					continue
				}
				// switchTo 먼저(paused=true 상태) → clearScreen → paused=false 순으로
				// active 교체와 화면 정리가 완전히 끝난 뒤 새 CLI 출력 허용
				var ctx string
				if next != m.active {
					ctx = m.extractContext(m.active)
					m.switchTo(next)
				}
				clearScreen()
				showBanner(m.active)

				m.mu.Lock()
				m.paused = false
				m.mu.Unlock()

				if ctx != "" {
					go m.injectContext(m.active, ctx)
				}
				continue
			}

			m.mu.Lock()
			s := m.sessions[m.active]
			m.mu.Unlock()
			if s != nil {
				s.pty.Write(data)
			}

		case name := <-m.exitCh:
			m.mu.Lock()
			delete(m.sessions, name)
			wasActive := m.active == name
			remaining := len(m.sessions)
			m.mu.Unlock()

			if !wasActive {
				continue
			}
			if remaining == 0 {
				m.stopStdinReader()
				return nil
			}
			m.stopStdinReader()
			term.Restore(fd, oldState)
			next := m.pickUI()
			oldState, _ = term.MakeRaw(fd)
			m.startStdinReader()

			if next == "" {
				return nil
			}
			var ctx string
			if next != m.active {
				ctx = m.extractContext(m.active)
				m.switchTo(next)
			}
			clearScreen()
			showBanner(next)

			m.mu.Lock()
			m.paused = false
			m.mu.Unlock()

			if ctx != "" {
				go m.injectContext(next, ctx)
			}
		}
	}
}

// startStdinReader: dup한 fd로 고루틴 시작.
// syscall.Select 10ms 폴링으로 stopRead 신호를 빠르게 감지 (macOS에서
// close(fd)가 블로킹 Read를 깨우지 못하는 문제 우회).
func (m *Multiplexer) startStdinReader() {
	m.stopRead = make(chan struct{})
	dupFd, err := syscall.Dup(int(os.Stdin.Fd()))
	if err != nil {
		return
	}
	m.stdinDup = dupFd

	m.readerWg.Add(1)
	go func() {
		defer m.readerWg.Done()
		defer syscall.Close(dupFd)
		buf := make([]byte, 4096)
		for {
			// stopRead 확인
			select {
			case <-m.stopRead:
				return
			default:
			}
			// 10ms 타임아웃으로 폴링 → 블로킹 없이 stop 신호 수신 가능
			if !stdinReady(dupFd, 10) {
				continue
			}
			n, err := syscall.Read(dupFd, buf)
			if n > 0 {
				cp := make([]byte, n)
				copy(cp, buf[:n])
				select {
				case m.stdinCh <- cp:
				case <-m.stopRead:
					return
				}
			}
			if err != nil {
				return
			}
		}
	}()
}

// stdinReady is defined in stdin_darwin.go / stdin_linux.go

// stopStdinReader: stopRead 채널 닫기 → 고루틴이 최대 10ms 내 종료.
func (m *Multiplexer) stopStdinReader() {
	close(m.stopRead)
	m.readerWg.Wait()
	// 혹시 남은 buffered 입력 drain
	for len(m.stdinCh) > 0 {
		<-m.stdinCh
	}
}

func (m *Multiplexer) startCLI(name string) error {
	m.mu.Lock()
	_, exists := m.sessions[name]
	m.mu.Unlock()
	if exists {
		return nil
	}

	binary := toolBinary(name)
	cmd := exec.Command(binary)
	ptmx, err := pty.Start(cmd)
	if err != nil {
		return fmt.Errorf("%s 시작 실패: %w", binary, err)
	}
	if ws, err := pty.GetsizeFull(os.Stdout); err == nil {
		pty.Setsize(ptmx, ws)
	}

	s := &ptySession{
		pty:      ptmx,
		cmd:      cmd,
		outputCh: make(chan struct{}, 32),
	}
	m.mu.Lock()
	m.sessions[name] = s
	m.mu.Unlock()

	go m.outputLoop(name, s)
	if name == "claude-code" {
		go trackActiveJsonl(s)
	}
	return nil
}

// trackActiveJsonl detects which JSONL file Claude Code creates for this session
// and writes its path to .huginin/active-jsonl so the post-commit hook uses it.
func trackActiveJsonl(s *ptySession) {
	projectDir := claudeProjectDir()
	if projectDir == "" {
		return
	}
	before := jsonlSnapshot(projectDir)
	// wait for first output (up to 15s)
	select {
	case <-s.outputCh:
	case <-time.After(15 * time.Second):
	}
	// small buffer for file creation to complete
	time.Sleep(300 * time.Millisecond)

	after := jsonlSnapshot(projectDir)
	for path := range after {
		if !before[path] {
			_ = os.MkdirAll(".huginin", 0755)
			_ = os.WriteFile(".huginin/active-jsonl", []byte(path), 0644)
			return
		}
	}
}


func jsonlSnapshot(dir string) map[string]bool {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil
	}
	m := make(map[string]bool, len(entries))
	for _, e := range entries {
		if strings.HasSuffix(e.Name(), ".jsonl") {
			m[filepath.Join(dir, e.Name())] = true
		}
	}
	return m
}

func (m *Multiplexer) outputLoop(name string, s *ptySession) {
	buf := make([]byte, 4096)
	for {
		n, err := s.pty.Read(buf)
		if n > 0 {
			clean := ansiEscape.ReplaceAll(buf[:n], nil)
			s.outMu.Lock()
			s.outBuf = append(s.outBuf, clean...)
			if len(s.outBuf) > ctxBufSize {
				s.outBuf = s.outBuf[len(s.outBuf)-ctxBufSize:]
			}
			s.outMu.Unlock()

			select {
			case s.outputCh <- struct{}{}:
			default:
			}

			m.mu.Lock()
			write := m.active == name && !m.paused
			if write && m.suppressing {
				m.suppressedBuf = append(m.suppressedBuf, buf[:n]...)
				if len(m.suppressedBuf) > 64*1024 {
					m.suppressedBuf = m.suppressedBuf[len(m.suppressedBuf)-64*1024:]
				}
				m.mu.Unlock()
			} else {
				m.mu.Unlock()
				if write {
					os.Stdout.Write(buf[:n])
				}
			}
		}
		if err != nil {
			m.exitCh <- name
			return
		}
	}
}

func (m *Multiplexer) injectContext(name, ctx string) {
	if ctx == "" {
		return
	}
	m.mu.Lock()
	s := m.sessions[name]
	m.mu.Unlock()
	if s == nil {
		return
	}

	quiet := time.NewTimer(quietPeriod)
	defer quiet.Stop()
	deadline := time.NewTimer(maxWait)
	defer deadline.Stop()

	for {
		select {
		case <-s.outputCh:
			if !quiet.Stop() {
				select {
				case <-quiet.C:
				default:
				}
			}
			quiet.Reset(quietPeriod)
		case <-quiet.C:
			m.injectSilent(s, ctx)
			return
		case <-deadline.C:
			m.injectSilent(s, ctx)
			return
		}
	}
}

// loadingAnim writes a spinner animation to stdout until done is closed.
// Called while suppressing=true so it has exclusive stdout access.
func loadingAnim(done <-chan struct{}) {
	frames := []string{"⣻", "⣽", "⣾", "⣷", "⣯", "⣟", "⡿", "⢿"}
	i := 0
	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()
	for {
		select {
		case <-done:
			return
		case <-ticker.C:
			fmt.Fprintf(os.Stdout, "\r\x1b[36m%s 컨텍스트 전달 중...\x1b[0m", frames[i%len(frames)])
			i++
		}
	}
}

// injectSilent writes context to the session's PTY stdin while holding
// exclusive stdout via suppressing=true. After injection it clears the screen
// and sends SIGWINCH to the child before releasing suppression, so the child
// redraws its full TUI from a known-blank terminal state instead of trying to
// continue from a stale cursor position.
func (m *Multiplexer) injectSilent(s *ptySession, ctx string) {
	restore := disableEcho(s.pty)
	defer restore()

	m.mu.Lock()
	m.suppressing = true
	m.suppressedBuf = nil
	m.mu.Unlock()

	done := make(chan struct{})
	go loadingAnim(done)

	s.pty.Write([]byte(ctx + "\n"))
	time.Sleep(500 * time.Millisecond)

	close(done)

	// Still suppressing here — we have exclusive stdout.
	// Clear to a known-blank state and re-draw the banner.
	m.mu.Lock()
	activeName := m.active
	m.mu.Unlock()

	clearScreen()
	showBanner(activeName)

	// Release suppression: child output starts flowing again.
	m.mu.Lock()
	m.suppressedBuf = nil
	m.suppressing = false
	m.mu.Unlock()

	// Force the child to do a full redraw onto the freshly cleared screen.
	// A brief pause lets the child finish any in-flight write before SIGWINCH.
	if s.cmd != nil && s.cmd.Process != nil {
		time.Sleep(30 * time.Millisecond)
		s.cmd.Process.Signal(syscall.SIGWINCH)
	}
}

func (m *Multiplexer) extractContext(name string) string {
	// Prefer structured conversation data over raw TUI output.
	if conv := extractConversationForTool(name); conv != "" {
		return conv
	}
	// Fallback: raw terminal output with ANSI stripped (TUI chrome only).
	m.mu.Lock()
	s := m.sessions[name]
	m.mu.Unlock()
	if s == nil {
		return ""
	}
	s.outMu.Lock()
	defer s.outMu.Unlock()
	if len(s.outBuf) == 0 {
		return ""
	}
	buf := s.outBuf
	if len(buf) > 2000 {
		buf = buf[len(buf)-2000:]
	}
	return strings.TrimSpace(string(buf))
}

func (m *Multiplexer) switchTo(name string) {
	m.startCLI(name)
	m.mu.Lock()
	m.active = name
	s := m.sessions[name]
	m.mu.Unlock()
	m.saveActiveTool(name)
	// Sync terminal size so the new session's TUI renders at the correct width.
	if s != nil {
		if ws, err := pty.GetsizeFull(os.Stdout); err == nil {
			pty.Setsize(s.pty, ws)
		}
	}
}

func (m *Multiplexer) pickUI() string {
	m.mu.Lock()
	active := m.active
	running := make(map[string]bool, len(m.sessions))
	for k := range m.sessions {
		running[k] = true
	}
	m.mu.Unlock()

	display := make([]string, len(cliTools))
	for i, t := range cliTools {
		label := t.label
		switch {
		case t.name == active:
			label += "  ← 현재"
		case running[t.name]:
			label += "  (실행 중)"
		}
		display[i] = label
	}

	sel := promptui.Select{
		Label: "CLI 전환  (↑↓ 이동, Enter 확인)",
		Items: display,
		Templates: &promptui.SelectTemplates{
			Label:    "{{ . }}",
			Active:   "▸ {{ . | cyan }}",
			Inactive: "  {{ . }}",
			Selected: "✓ {{ . | green }}",
		},
	}

	idx, _, err := sel.Run()
	if err != nil {
		return ""
	}
	return cliTools[idx].name
}

func (m *Multiplexer) saveActiveTool(name string) {
	cfg, err := config.Load()
	if err != nil {
		return
	}
	cfg.ActiveTool = name
	config.Save(cfg)
}

func normalizeTool(s string) string {
	switch strings.ToLower(s) {
	case "claude", "claude-code":
		return "claude-code"
	case "agy", "antigravity":
		return "antigravity"
	case "codex":
		return "codex"
	default:
		return s
	}
}

func toolBinary(name string) string {
	switch name {
	case "claude-code":
		return "claude"
	case "antigravity":
		return "agy"
	default:
		return name
	}
}

// clearScreen erases the terminal and moves the cursor to the top-left.
// Also disables all mouse tracking modes the outgoing CLI may have enabled,
// so mouse events don't leak into the incoming CLI's stdin.
func clearScreen() {
	os.Stdout.Write([]byte(
		"\x1b[?1003l" + // any-event tracking off
			"\x1b[?1002l" + // button-event tracking off
			"\x1b[?1001l" + // highlight tracking off
			"\x1b[?1000l" + // normal tracking off
			"\x1b[?1006l" + // SGR extended coords off
			"\x1b[?1015l" + // URXVT extended coords off
			"\x1b[2J\x1b[H",
	))
}

// showBanner prints a one-line header identifying the active CLI.
// Written while paused=true so it appears before any CLI output.
func showBanner(name string) {
	label := name
	for _, t := range cliTools {
		if t.name == name {
			label = t.label
			break
		}
	}
	fmt.Fprintf(os.Stdout, "\r\x1b[36m── huginin ▸ %s ──\x1b[0m  \x1b[2mCtrl+\\: 전환\x1b[0m\r\n\r\n", label)
}
