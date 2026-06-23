package cli

// Git Hook에서 호출하는 내부 커맨드 (__token, __collect).
// 사용자 노출 없음 — huginin help에 표시되지 않는다.

import (
	"fmt"
	"os"
	"os/exec"
	"strings"

	"github.com/spf13/cobra"

	"huginin/application"
	"huginin/infrastructure/config"
	"huginin/interfaces/tui"
)

func newInternalCmds(projUC *application.ProjectUseCase, ks interface {
	Load() (string, string, error)
}) []*cobra.Command {

	// __token: 저장된 access token 출력 (Git Hook용)
	tokenCmd := &cobra.Command{
		Use:    "__token",
		Hidden: true,
		RunE: func(cmd *cobra.Command, args []string) error {
			token, _, err := ks.Load()
			if err != nil || token == "" {
				return fmt.Errorf("not logged in")
			}
			fmt.Print(token)
			return nil
		},
	}

	// __collect: /collect/event 직접 호출 (Git Hook용)
	collectCmd := &cobra.Command{
		Use:    "__collect",
		Hidden: true,
		RunE: func(cmd *cobra.Command, args []string) error {
			wsID, _ := cmd.Flags().GetString("workspace")
			projID, _ := cmd.Flags().GetString("project")
			commitHash, _ := cmd.Flags().GetString("commit")
			prompt, _ := cmd.Flags().GetString("prompt")
			response, _ := cmd.Flags().GetString("response")
			diff, _ := cmd.Flags().GetString("diff")
			tool, _ := cmd.Flags().GetString("tool")

			// branch: 플래그 미지정 시 현재 git branch 자동 감지
			branch, _ := cmd.Flags().GetString("branch")
			if branch == "" {
				if out, err := exec.Command("git", "rev-parse", "--abbrev-ref", "HEAD").Output(); err == nil {
					branch = strings.TrimSpace(string(out))
					if branch == "HEAD" {
						branch = "" // detached HEAD는 저장하지 않음
					}
				}
			}

			eventID, err := projUC.CollectEvent(wsID, projID, commitHash, prompt, response, diff, branch, "", tool)
			if err != nil {
				fmt.Fprintf(os.Stderr, "[huginin] collect error: %v\n", err)
				return nil // 훅 실패가 커밋을 막으면 안 됨
			}
			fmt.Fprintf(os.Stderr, "[huginin] collected event %s\n", eventID)
			return nil
		},
	}
	collectCmd.Flags().String("workspace", "", "")
	collectCmd.Flags().String("project", "", "")
	collectCmd.Flags().String("commit", "", "")
	collectCmd.Flags().String("prompt", "", "")
	collectCmd.Flags().String("response", "", "")
	collectCmd.Flags().String("diff", "", "")
	collectCmd.Flags().String("branch", "", "git branch (미지정 시 자동 감지)")
	collectCmd.Flags().String("tool", "", "LLM tool (claude-code | codex | gemini)")

	// __set-tool: active_tool 강제 갱신 (TUI/tmux hook용)
	setToolCmd := &cobra.Command{
		Use:    "__set-tool <tool>",
		Hidden: true,
		Args:   cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			tool := args[0]
			switch tool {
			case "claude-code", "codex", "antigravity":
			case "claude":
				tool = "claude-code"
			case "agy":
				tool = "antigravity"
			default:
				return fmt.Errorf("unknown tool %q", tool)
			}
			cfg, err := config.Load()
			if err != nil {
				return err
			}
			cfg.ActiveTool = tool
			return config.Save(cfg)
		},
	}

	// __mux: PTY 멀티플렉서 진입점 (TUI에서 claude/agy/codex/pick 실행 시 호출)
	muxCmd := &cobra.Command{
		Use:    "__mux <tool>",
		Hidden: true,
		Args:   cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			return tui.RunMultiplexer(args[0])
		},
	}

	return []*cobra.Command{tokenCmd, collectCmd, setToolCmd, muxCmd}
}
