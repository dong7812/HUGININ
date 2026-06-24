package tui

import (
	"fmt"
	"os"
	"os/exec"
	"os/signal"
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
	sessions map[string]*ptySession
	active   string
	paused   bool
	exitCh   chan string
	mu       sync.Mutex

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

	if err := m.startCLI(name); err != nil {
		return err
	}
	m.active = name
	m.saveActiveTool(name)

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
				m.startStdinReader() // 재시작

				m.mu.Lock()
				m.paused = false
				m.mu.Unlock()

				if next != "" && next != m.active {
					ctx := m.extractContext(m.active)
					m.switchTo(next)
					go m.injectContext(next, ctx)
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
			ctx := m.extractContext(m.active)
			m.switchTo(next)
			go m.injectContext(next, ctx)
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

// stdinReady: fd에 읽을 데이터가 있으면 true. timeoutMs 동안 대기.
func stdinReady(fd int, timeoutMs int) bool {
	var rfds syscall.FdSet
	rfds.Bits[fd/32] |= 1 << uint(fd%32)
	tv := syscall.Timeval{Sec: 0, Usec: int32(timeoutMs * 1000)}
	// darwin: Select returns only error; ready fds remain set in rfds
	if err := syscall.Select(fd+1, &rfds, nil, nil, &tv); err != nil {
		return false
	}
	return rfds.Bits[fd/32]&(1<<uint(fd%32)) != 0
}

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
	return nil
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
			m.mu.Unlock()
			if write {
				os.Stdout.Write(buf[:n])
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
			msg := fmt.Sprintf("[huginin 컨텍스트 전달]\n%s\n", ctx)
			s.pty.Write([]byte(msg))
			return
		case <-deadline.C:
			msg := fmt.Sprintf("[huginin 컨텍스트 전달]\n%s\n", ctx)
			s.pty.Write([]byte(msg))
			return
		}
	}
}

func (m *Multiplexer) extractContext(name string) string {
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
	m.mu.Unlock()
	m.saveActiveTool(name)
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
