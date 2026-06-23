package tui

import (
	"os"
	"os/exec"
	"os/signal"
	"regexp"
	"strings"
	"sync"
	"syscall"
	"time"

	"fmt"

	"github.com/creack/pty"
	"github.com/manifoldco/promptui"
	"golang.org/x/term"

	"huginin/infrastructure/config"
)

const escKey = byte(0x00) // Ctrl+Space

const (
	quietPeriod = 600 * time.Millisecond // 출력 없으면 ready로 판단
	maxWait     = 5 * time.Second        // fallback: 최대 대기 시간
	ctxBufSize  = 4096                   // 컨텍스트 버퍼 (bytes)
)

var ansiEscape = regexp.MustCompile(`\x1b\[[0-9;]*[a-zA-Z]|\x1b[^[\x1b]`)

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
	outputCh chan struct{} // 출력 있을 때 신호 (quiet period 감지용)
	outBuf   []byte       // ANSI 제거된 최근 출력 (컨텍스트 전달용)
	outMu    sync.Mutex
}

type Multiplexer struct {
	sessions map[string]*ptySession
	active   string
	paused   bool
	exitCh   chan string
	mu       sync.Mutex
}

func RunMultiplexer(initial string) error {
	m := &Multiplexer{
		sessions: make(map[string]*ptySession),
		exitCh:   make(chan string, 8),
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

	stdinCh := make(chan []byte, 64)
	go func() {
		buf := make([]byte, 4096)
		for {
			n, err := os.Stdin.Read(buf)
			if n > 0 {
				cp := make([]byte, n)
				copy(cp, buf[:n])
				stdinCh <- cp
			}
			if err != nil {
				close(stdinCh)
				return
			}
		}
	}()

	for {
		select {
		case data, ok := <-stdinCh:
			if !ok {
				return nil
			}
			if len(data) == 1 && data[0] == escKey {
				m.mu.Lock()
				m.paused = true
				m.mu.Unlock()

				term.Restore(fd, oldState)
				next := m.pickUI()
				oldState, _ = term.MakeRaw(fd)

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
			term.Restore(fd, oldState)
			next := m.pickUI()
			oldState, _ = term.MakeRaw(fd)
			if next == "" {
				return nil
			}
			ctx := m.extractContext(m.active)
			m.switchTo(next)
			go m.injectContext(next, ctx)
		}
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
			// 컨텍스트 버퍼 업데이트 (ANSI 제거)
			clean := ansiEscape.ReplaceAll(buf[:n], nil)
			s.outMu.Lock()
			s.outBuf = append(s.outBuf, clean...)
			if len(s.outBuf) > ctxBufSize {
				s.outBuf = s.outBuf[len(s.outBuf)-ctxBufSize:]
			}
			s.outMu.Unlock()

			// quiet period 감지용 신호
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

// injectContext: CLI가 준비되면 이전 컨텍스트를 주입한다.
// Stage 1: 출력이 quietPeriod 동안 없으면 ready로 판단
// Stage 2: maxWait 초과 시 강제 주입 (fallback)
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
			// 출력 감지 → quiet timer 리셋
			if !quiet.Stop() {
				select {
				case <-quiet.C:
				default:
				}
			}
			quiet.Reset(quietPeriod)

		case <-quiet.C:
			// 600ms 조용 → ready
			msg := fmt.Sprintf("[huginin 컨텍스트 전달]\n%s\n", ctx)
			s.pty.Write([]byte(msg))
			return

		case <-deadline.C:
			// 5초 fallback
			msg := fmt.Sprintf("[huginin 컨텍스트 전달]\n%s\n", ctx)
			s.pty.Write([]byte(msg))
			return
		}
	}
}

// extractContext: 현재 CLI의 최근 출력 버퍼에서 컨텍스트를 추출한다.
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
	// 마지막 2000자만 (너무 길면 새 CLI가 소화 못 함)
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
