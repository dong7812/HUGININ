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

			eventID, err := projUC.CollectEvent(wsID, projID, commitHash, prompt, response, diff, branch, "")
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

	return []*cobra.Command{tokenCmd, collectCmd}
}
