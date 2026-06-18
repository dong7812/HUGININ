package tui

import (
	"fmt"
	"os/exec"
	"strings"

	"github.com/charmbracelet/bubbles/textinput"
	"github.com/charmbracelet/bubbles/viewport"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"

	"huginin/application"
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

	headerStyle = lipgloss.NewStyle().
			Background(lipgloss.Color("#0f172a")).
			Foreground(lipgloss.Color("#e2e8f0")).
			Padding(0, 1)

	promptPrefix = blue.Bold(true).Render("huginin") + dim.Render(" > ")
)

// ── messages ──────────────────────────────────────────────────────────────────

type asyncResultMsg struct {
	lines []string
}

type claudeDoneMsg struct{ err error }

// ── model ─────────────────────────────────────────────────────────────────────

type model struct {
	cfg  *config.Config
	wsUC *application.WorkspaceUseCase

	input    textinput.Model
	viewport viewport.Model
	ready    bool
	width    int
	height   int

	lines []string // rendered output history
}

func newModel(cfg *config.Config, wsUC *application.WorkspaceUseCase) model {
	ti := textinput.New()
	ti.Prompt = promptPrefix
	ti.CharLimit = 500
	ti.Focus()

	m := model{cfg: cfg, wsUC: wsUC, input: ti}
	m.lines = m.welcome()
	return m
}

func (m model) welcome() []string {
	lines := []string{
		bold.Render("HUGININ") + "  " + dim.Render("v0.1.0"),
		"",
	}
	if m.cfg.WorkspaceName != "" {
		lines = append(lines, green.Render("✓")+" workspace: "+bold.Render(m.cfg.WorkspaceName))
	} else {
		lines = append(lines, yellow.Render("⚠")+" 워크스페이스가 설정되지 않았습니다 — "+dim.Render("huginin login"))
	}
	lines = append(lines,
		"",
		dim.Render("claude · workspace · help · exit"),
		dim.Render(strings.Repeat("─", 40)),
	)
	return lines
}

// ── Bubble Tea ────────────────────────────────────────────────────────────────

func (m model) Init() tea.Cmd {
	return textinput.Blink
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {

	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		vph := msg.Height - 3 // header(1) + sep(1) + input(1)
		if vph < 1 {
			vph = 1
		}
		if !m.ready {
			m.viewport = viewport.New(msg.Width, vph)
			m.ready = true
		} else {
			m.viewport.Width = msg.Width
			m.viewport.Height = vph
		}
		m.viewport.SetContent(strings.Join(m.lines, "\n"))
		m.viewport.GotoBottom()

	case tea.KeyMsg:
		switch msg.Type {
		case tea.KeyCtrlC:
			if m.input.Value() == "" {
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
			m.push(promptPrefix + raw)

			cmd, quit, teaCmd := m.dispatch(raw)
			_ = cmd
			if quit {
				return m, tea.Quit
			}
			m.sync()
			if teaCmd != nil {
				return m, teaCmd
			}
			return m, nil

		// viewport scroll
		case tea.KeyPgUp:
			m.viewport.HalfViewUp()
			return m, nil
		case tea.KeyPgDown:
			m.viewport.HalfViewDown()
			return m, nil
		}

	case asyncResultMsg:
		m.lines = append(m.lines, msg.lines...)
		m.sync()

	case claudeDoneMsg:
		if msg.err != nil {
			m.push(red.Render("claude 종료 (오류): " + msg.err.Error()))
		} else {
			m.push(dim.Render("─ claude 세션 종료 ─"))
		}
		m.sync()
	}

	var cmds []tea.Cmd
	var tiCmd tea.Cmd
	m.input, tiCmd = m.input.Update(msg)
	cmds = append(cmds, tiCmd)
	return m, tea.Batch(cmds...)
}

// dispatch parses a command and returns (output lines, quit, tea.Cmd).
func (m *model) dispatch(raw string) ([]string, bool, tea.Cmd) {
	parts := strings.Fields(raw)
	if len(parts) == 0 {
		return nil, false, nil
	}
	verb := parts[0]
	args := parts[1:]

	switch verb {

	case "exit", "quit", "q":
		return nil, true, nil

	case "help":
		m.lines = append(m.lines, m.helpLines()...)
		return nil, false, nil

	case "claude":
		m.push(dim.Render("─ claude 세션 시작 ─"))
		m.sync()
		return nil, false, tea.ExecProcess(
			exec.Command("claude", args...),
			func(err error) tea.Msg { return claudeDoneMsg{err: err} },
		)

	case "workspace":
		sub := ""
		if len(args) > 0 {
			sub = args[0]
		}
		switch sub {
		case "", "current":
			if m.cfg.WorkspaceName != "" {
				m.push("  " + green.Render("▸") + " " + bold.Render(m.cfg.WorkspaceName) +
					"  " + dim.Render(m.cfg.WorkspaceID))
			} else {
				m.push(yellow.Render("  워크스페이스 없음"))
			}

		case "list":
			wsUC := m.wsUC
			cfg := m.cfg
			return nil, false, func() tea.Msg {
				workspaces, err := wsUC.List()
				if err != nil {
					return asyncResultMsg{lines: []string{red.Render("✗ " + err.Error())}}
				}
				lines := []string{}
				for _, w := range workspaces {
					marker := "  "
					if w.ID == cfg.WorkspaceID {
						marker = green.Render("▸ ")
					}
					lines = append(lines, fmt.Sprintf("%s%s  %s",
						marker,
						bold.Render(w.Name),
						dim.Render("/"+w.Slug),
					))
				}
				return asyncResultMsg{lines: lines}
			}

		default:
			m.push(dim.Render("  workspace [list | current]"))
		}
		return nil, false, nil

	default:
		m.push(red.Render("알 수 없는 명령: "+verb) + "  " + dim.Render("(help)"))
		return nil, false, nil
	}
}

func (m *model) push(line string) {
	m.lines = append(m.lines, line)
}

func (m *model) sync() {
	m.viewport.SetContent(strings.Join(m.lines, "\n"))
	m.viewport.GotoBottom()
}

func (m model) helpLines() []string {
	return []string{
		"",
		blue.Render("  claude") + " [args]       Claude Code 실행",
		blue.Render("  workspace") + "            현재 워크스페이스",
		blue.Render("  workspace list") + "       워크스페이스 목록",
		blue.Render("  help") + "                 도움말",
		blue.Render("  exit") + "                 종료  (Ctrl+C)",
		"",
	}
}

// ── view ──────────────────────────────────────────────────────────────────────

func (m model) View() string {
	if !m.ready {
		return ""
	}

	wsLabel := dim.Render("no workspace")
	if m.cfg.WorkspaceName != "" {
		wsLabel = dim.Render(m.cfg.WorkspaceName)
	}

	title := bold.Foreground(lipgloss.Color("#93c5fd")).Render("HUGININ")
	gap := strings.Repeat(" ", max(0, m.width-lipgloss.Width(title)-lipgloss.Width(wsLabel)-2))
	header := headerStyle.Width(m.width).Render(title + gap + wsLabel)

	sep := dim.Render(strings.Repeat("─", m.width))

	return lipgloss.JoinVertical(lipgloss.Left,
		header,
		m.viewport.View(),
		sep,
		m.input.View(),
	)
}

// ── entry ─────────────────────────────────────────────────────────────────────

func StartSession(cfg *config.Config, wsUC *application.WorkspaceUseCase) error {
	m := newModel(cfg, wsUC)
	p := tea.NewProgram(m,
		tea.WithAltScreen(),
		tea.WithMouseCellMotion(),
	)
	_, err := p.Run()
	return err
}
