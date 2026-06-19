package cli

import (
	"fmt"
	"os"
	"os/exec"

	"github.com/manifoldco/promptui"
	"github.com/spf13/cobra"

	"huginin/application"
	"huginin/domain"
	"huginin/infrastructure/config"
)

// newSetupCmd는 현재 git repo를 HUGININ에 연결하고 hook을 설치하는 setup 위저드다.
// TUI에서 "setup" 입력 시 tea.ExecProcess로 호출된다.
func newSetupCmd(wsUC *application.WorkspaceUseCase, projUC *application.ProjectUseCase, ks domain.TokenRepository, cfg *config.Config) *cobra.Command {
	return &cobra.Command{
		Use:   "setup [path]",
		Short: "현재 git repo를 워크스페이스에 연결하고 hook 설치",
		Args:  cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			repoPath := "."
			if len(args) > 0 {
				repoPath = args[0]
			}

			// 로그인 확인
			token, _, err := ks.Load()
			if err != nil || token == "" {
				return fmt.Errorf("로그인이 필요합니다 — TUI에서 login을 먼저 실행하세요")
			}

			// 워크스페이스 확인 — 없으면 picker
			if cfg.WorkspaceID == "" {
				if err := runWorkspacePicker(wsUC, cfg); err != nil {
					return err
				}
			} else {
				fmt.Printf("워크스페이스: %s\n", cfg.WorkspaceName)
				changePrompt := promptui.Prompt{
					Label:     "다른 워크스페이스로 연결하시겠습니까 (y/N)",
					Default:   "N",
					IsConfirm: true,
				}
				if _, err := changePrompt.Run(); err == nil {
					if err := runWorkspacePicker(wsUC, cfg); err != nil {
						return err
					}
				}
			}
			if cfg.WorkspaceID == "" {
				return fmt.Errorf("워크스페이스를 선택해주세요")
			}

			// 프로젝트 이름 — git remote origin 기반 기본값
			defaultName := repoBaseName(repoPath)
			namePrompt := promptui.Prompt{
				Label:   "프로젝트 이름",
				Default: defaultName,
			}
			projectName, err := namePrompt.Run()
			if err != nil {
				if err == promptui.ErrInterrupt || err == promptui.ErrEOF {
					return nil
				}
				return err
			}
			if projectName == "" {
				projectName = defaultName
			}

			// 프로젝트 링크 → .huginin/projects.json 저장
			remote := gitRemote(repoPath)
			projID, err := projUC.Link(cfg.WorkspaceID, projectName, remote)
			if err != nil {
				return fmt.Errorf("프로젝트 연결 실패: %w", err)
			}
			if err := writeProjectsJSONAt(repoPath, cfg.WorkspaceID, projID); err != nil {
				fmt.Fprintf(os.Stderr, "warning: projects.json 저장 실패: %v\n", err)
			}

			// hook 설치
			if err := installHooks(repoPath); err != nil {
				return err
			}

			fmt.Println()
			fmt.Println("✓ 설정 완료")
			fmt.Printf("  워크스페이스: %s\n", cfg.WorkspaceName)
			fmt.Printf("  프로젝트:     %s\n", projectName)
			fmt.Println()
			fmt.Println("이제 커밋하면 자동으로 HUGININ에 기록됩니다.")
			fmt.Println("claude를 입력해 코드 작업을 시작하세요.")
			return nil
		},
	}
}

// runSetupAsProcess는 TUI에서 huginin setup을 서브프로세스로 실행할 때 쓰는 helper다.
func runSetupAsProcess() *exec.Cmd {
	return exec.Command(os.Args[0], "setup")
}
