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

			// tmux 설치 여부 확인 및 자동 설치
			ensureTmuxInstalled()

			fmt.Println()
			fmt.Println("✓ 설정 완료")
			fmt.Printf("  워크스페이스: %s\n", cfg.WorkspaceName)
			fmt.Printf("  프로젝트:     %s\n", projectName)
			fmt.Println()
			fmt.Println("이제 커밋하면 자동으로 HUGININ에 기록됩니다.")
			fmt.Println("claude 또는 multiplex를 입력해 코드 작업을 시작하세요.")
			return nil
		},
	}
}

// runSetupAsProcess는 TUI에서 huginin setup을 서브프로세스로 실행할 때 쓰는 helper다.
func runSetupAsProcess() *exec.Cmd {
	return exec.Command(os.Args[0], "setup")
}

func ensureTmuxInstalled() {
	_, err := exec.LookPath("tmux")
	if err == nil {
		return
	}

	fmt.Println("\nHUGININ 멀티플렉서 기능에는 tmux가 필요합니다.")
	prompt := promptui.Prompt{
		Label:     "tmux를 설치하시겠습니까 (y/N)",
		Default:   "N",
		IsConfirm: true,
	}
	_, err = prompt.Run()
	if err != nil {
		fmt.Println("  → tmux 설치를 건너뜁니다. (멀티플렉서 기능을 사용하려면 수동 설치: brew install tmux)")
		return
	}

	fmt.Println("tmux 설치 중...")
	var cmd *exec.Cmd
	if _, err := exec.LookPath("brew"); err == nil {
		cmd = exec.Command("brew", "install", "tmux")
	} else if _, err := exec.LookPath("apt-get"); err == nil {
		// apt-get은 update와 install을 하나의 shell 명령어로 묶어서 쉘에서 작동하도록 함
		cmd = exec.Command("sudo", "sh", "-c", "apt-get update && apt-get install -y tmux")
	} else if _, err := exec.LookPath("yum"); err == nil {
		cmd = exec.Command("sudo", "yum", "install", "-y", "tmux")
	}

	if cmd != nil {
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		cmd.Stdin = os.Stdin
		if err := cmd.Run(); err != nil {
			fmt.Printf("✗ tmux 설치 실패: %v\n", err)
			fmt.Println("수동으로 설치해주세요.")
		} else {
			fmt.Println("✓ tmux 설치 완료!")
		}
	} else {
		fmt.Println("✗ 사용 가능한 패키지 매니저(brew, apt-get, yum)를 찾을 수 없습니다.")
		fmt.Println("수동으로 tmux를 설치해 주세요.")
	}
}
