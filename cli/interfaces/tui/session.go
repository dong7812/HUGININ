package tui

import (
	"fmt"
	"os"
	"os/exec"
	"strings"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"

	"huginin/application"
	"huginin/domain"
	"huginin/infrastructure/config"
)

// ── styles ────────────────────────────────────────────────────────────────────

var (
	blue   = lipgloss.NewStyle().Foreground(lipgloss.Color("#60a5fa"))
	dim    = lipgloss.NewStyle().Foreground(lipgloss.Color("#475569"))
	green  = lipgloss.NewStyle().Foreground(lipgloss.Color("#4ade80"))
	red    = lipgloss.NewStyle().Foreground(lipgloss.Color("#f87171"))
	yellow = lipgloss.NewStyle().Foreground(lipgloss.Color("#fbbf24"))
	bold   = lipgloss.NewStyle().Bold(true)

	promptPrefix = blue.Bold(true).Render("huginin") + dim.Render(" > ")
)

// ── messages ──────────────────────────────────────────────────────────────────

type claudeDoneMsg struct {
	name string
	err  error
}
type loginDoneMsg struct{ err error }
type setupDoneMsg struct{ err error }
type backfillDoneMsg struct{ err error }
type asyncLinesMsg struct{ lines []string }

// ── model ─────────────────────────────────────────────────────────────────────

type model struct {
	cfg  *config.Config
	wsUC *application.WorkspaceUseCase
	ks   domain.TokenRepository

	input    textinput.Model
	quitting bool
}

func newModel(cfg *config.Config, wsUC *application.WorkspaceUseCase, ks domain.TokenRepository) model {
	ti := textinput.New()
	ti.Prompt = promptPrefix
	ti.CharLimit = 500
	ti.Focus()
	return model{cfg: cfg, wsUC: wsUC, ks: ks, input: ti}
}

// ── Bubble Tea ────────────────────────────────────────────────────────────────

func (m model) Init() tea.Cmd {
	wsLine := yellow.Render("⚠  로그인 필요 — login 입력")
	if m.cfg.WorkspaceName != "" {
		wsLine = green.Render("✓") + " workspace: " + bold.Render(m.cfg.WorkspaceName)
	}
	tool := m.cfg.ActiveTool
	if tool == "" {
		tool = "claude-code"
	}
	toolLine := dim.Render("tool: ") + bold.Render(tool)
	sep := dim.Render(strings.Repeat("─", 44))
	return tea.Batch(
		textinput.Blink,
		tea.Println(bold.Render("HUGININ")+"  "+dim.Render("v0.1.0")),
		tea.Println(wsLine),
		tea.Println(toolLine),
		tea.Println(""),
		tea.Println(dim.Render("claude · agy · codex · setup · workspace · help · exit")),
		tea.Println(sep),
	)
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {

	case tea.KeyMsg:
		switch msg.Type {
		case tea.KeyCtrlC:
			if m.input.Value() == "" {
				m.quitting = true
				return m, tea.Quit
			}
			m.input.SetValue("")
			return m, nil

		case tea.KeyEnter:
			raw := strings.TrimSpace(m.input.Value())
			m.input.SetValue("")
			if raw == "" {
				return m, nil
			}
			echo := promptPrefix + raw
			cmd := m.dispatch(raw)
			return m, tea.Sequence(tea.Println(echo), cmd)
		}

	case asyncLinesMsg:
		cmds := make([]tea.Cmd, len(msg.lines))
		for i, l := range msg.lines {
			l := l
			cmds[i] = tea.Println(l)
		}
		return m, tea.Batch(cmds...)

	case claudeDoneMsg:
		name := msg.name
		if name == "" {
			name = "claude"
		}
		line := dim.Render("─ " + name + " 세션 종료 ─")
		if msg.err != nil {
			line = red.Render(name + " 종료 (오류): " + msg.err.Error())
		}
		return m, tea.Println(line)

	case loginDoneMsg:
		newCfg, err := config.Load()
		if err == nil {
			m.cfg = newCfg
		}
		if msg.err != nil {
			return m, tea.Println(red.Render("✗ 로그인 실패: " + msg.err.Error()))
		}
		wsLine := yellow.Render("⚠  워크스페이스 없음")
		if m.cfg.WorkspaceName != "" {
			wsLine = green.Render("✓") + " workspace: " + bold.Render(m.cfg.WorkspaceName)
		}
		return m, tea.Println(wsLine)

	case setupDoneMsg:
		newCfg, err := config.Load()
		if err == nil {
			m.cfg = newCfg
		}
		if msg.err != nil {
			return m, tea.Println(red.Render("✗ setup 실패: " + msg.err.Error()))
		}
		return m, tea.Println(green.Render("✓") + " setup 완료 — " + dim.Render("claude를 입력해 시작하세요"))

	case backfillDoneMsg:
		if msg.err != nil {
			return m, tea.Println(red.Render("✗ backfill 실패: " + msg.err.Error()))
		}
		return m, nil
	}

	var tiCmd tea.Cmd
	m.input, tiCmd = m.input.Update(msg)
	return m, tiCmd
}

// setActiveTool saves the active tool to config without blocking.
func (m *model) setActiveTool(tool string) {
	m.cfg.ActiveTool = tool
	_ = config.Save(m.cfg)
}

// dispatch returns a tea.Cmd for the given input line.
func (m *model) dispatch(raw string) tea.Cmd {
	parts := strings.Fields(raw)
	verb := parts[0]
	args := parts[1:]

	switch verb {

	case "exit", "quit", "q":
		m.quitting = true
		return tea.Quit

	case "help":
		return tea.Batch(
			tea.Println(""),
			tea.Println(blue.Render("  claude")+"               Claude Code 실행"),
			tea.Println(blue.Render("  agy")+"                  Antigravity CLI 실행"),
			tea.Println(blue.Render("  codex")+"                Codex CLI 실행"),
			tea.Println(blue.Render("  pick")+"                 CLI 선택 후 실행"),
			tea.Println(dim.Render(`  실행 중 Ctrl+\ → CLI 전환 (다른 CLI 잠들어 있다 깨어남)`)),
			tea.Println(dim.Render("  ──────────────────────────────────────────")),
			tea.Println(blue.Render("  login")+"               로그인 + 워크스페이스 선택"),
			tea.Println(blue.Render("  setup")+"               현재 repo 연결 + hook 설치"),
			tea.Println(blue.Render("  backfill")+"            누락 커밋 소급 수집"),
			tea.Println(blue.Render("  import <file>")+"      문서 임포트 (ETL + 코드 검증)"),
			tea.Println(blue.Render("  workspace list")+"      워크스페이스 목록"),
			tea.Println(blue.Render("  logout")+"              로그아웃"),
			tea.Println(blue.Render("  exit")+"                종료  (Ctrl+C)"),
			tea.Println(""),
		)

	case "pick", "claude", "agy", "codex":
		return tea.Sequence(
			tea.Println(dim.Render(`─ `+verb+` 시작 (Ctrl+\: CLI 전환) ─`)),
			tea.ExecProcess(
				exec.Command(os.Args[0], "__mux", verb),
				func(err error) tea.Msg { return claudeDoneMsg{name: verb, err: err} },
			),
		)

	case "login":
		return tea.ExecProcess(
			exec.Command(os.Args[0], "login"),
			func(err error) tea.Msg { return loginDoneMsg{err: err} },
		)

	case "setup":
		return tea.ExecProcess(
			exec.Command(os.Args[0], "setup"),
			func(err error) tea.Msg { return setupDoneMsg{err: err} },
		)

	case "backfill":
		backfillArgs := append([]string{"backfill"}, args...)
		return tea.ExecProcess(
			exec.Command(os.Args[0], backfillArgs...),
			func(err error) tea.Msg { return backfillDoneMsg{err: err} },
		)

	case "import":
		if len(args) == 0 {
			return tea.Println(red.Render("사용법: import <파일경로>"))
		}
		importArgs := append([]string{"import"}, args...)
		return tea.ExecProcess(
			exec.Command(os.Args[0], importArgs...),
			func(err error) tea.Msg {
				if err != nil {
					return asyncLinesMsg{lines: []string{red.Render("✗ import 실패: " + err.Error())}}
				}
				return asyncLinesMsg{lines: []string{green.Render("✓ import 완료")}}
			},
		)

	case "logout":
		if err := m.ks.Clear(); err != nil {
			return tea.Println(red.Render("✗ 로그아웃 실패: " + err.Error()))
		}
		m.cfg.WorkspaceName = ""
		m.cfg.WorkspaceID = ""
		_ = config.Save(m.cfg)
		return tea.Println(green.Render("✓") + " 로그아웃 완료")

	case "uninstall":
		binary := os.Args[0]
		return tea.Sequence(
			tea.Println(yellow.Render("huginin을 삭제합니다: ")+binary),
			tea.Println(dim.Render("sudo rm "+binary)),
			tea.ExecProcess(
				exec.Command("sudo", "rm", binary),
				func(err error) tea.Msg {
					if err != nil {
						return asyncLinesMsg{lines: []string{red.Render("✗ 삭제 실패: " + err.Error())}}
					}
					return asyncLinesMsg{lines: []string{green.Render("✓ huginin 삭제 완료")}}
				},
			),
		)

	case "workspace":
		sub := ""
		if len(args) > 0 {
			sub = args[0]
		}
		switch sub {
		case "", "current":
			if m.cfg.WorkspaceName != "" {
				return tea.Println(fmt.Sprintf("  %s %s  %s",
					green.Render("▸"),
					bold.Render(m.cfg.WorkspaceName),
					dim.Render(m.cfg.WorkspaceID),
				))
			}
			return tea.Println(yellow.Render("  워크스페이스 없음"))

		case "list":
			wsUC := m.wsUC
			return func() tea.Msg {
				workspaces, err := wsUC.List()
				if err != nil {
					return asyncLinesMsg{lines: []string{red.Render("✗ " + err.Error())}}
				}
				lines := make([]string, len(workspaces))
				for i, w := range workspaces {
					marker := "  "
					if w.ID == m.cfg.WorkspaceID {
						marker = green.Render("▸ ")
					}
					lines[i] = fmt.Sprintf("%s%s  %s", marker, bold.Render(w.Name), dim.Render("/"+w.Slug))
				}
				return asyncLinesMsg{lines: lines}
			}
		}
		return tea.Println(dim.Render("  workspace [list | current]"))

	default:
		return tea.Println(red.Render("알 수 없는 명령: "+verb) + "  " + dim.Render("(help)"))
	}
}

// ── view ──────────────────────────────────────────────────────────────────────

func (m model) View() string {
	if m.quitting {
		return ""
	}
	return m.input.View()
}

// ── entry ─────────────────────────────────────────────────────────────────────

func StartSession(cfg *config.Config, wsUC *application.WorkspaceUseCase, ks domain.TokenRepository) error {
	m := newModel(cfg, wsUC, ks)
	p := tea.NewProgram(m)
	_, err := p.Run()
	return err
}
