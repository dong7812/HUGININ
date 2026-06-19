package cli

import (
	_ "embed"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/manifoldco/promptui"
	"github.com/spf13/cobra"

	"huginin/application"
	"huginin/domain"
	"huginin/infrastructure/config"
)

//go:embed hooks/post-commit
var postCommitScript []byte

//go:embed hooks/post-push
var postPushScript []byte

func newHookCmd(wsUC *application.WorkspaceUseCase, projUC *application.ProjectUseCase, ks domain.TokenRepository, cfg *config.Config) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "hook",
		Short: "Git hook 관리",
	}
	cmd.AddCommand(newHookInstallCmd(wsUC, projUC, ks, cfg))
	return cmd
}

func newHookInstallCmd(wsUC *application.WorkspaceUseCase, projUC *application.ProjectUseCase, ks domain.TokenRepository, cfg *config.Config) *cobra.Command {
	return &cobra.Command{
		Use:   "install [path]",
		Short: "현재(또는 지정) Git 레포에 HUGININ hook 설치 + 프로젝트 연결",
		Args:  cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			repoPath := "."
			if len(args) > 0 {
				repoPath = args[0]
			}

			// 1. 로그인 확인 — 없으면 login 서브커맨드 실행
			token, _, err := ks.Load()
			if err != nil || token == "" {
				fmt.Println("로그인이 필요합니다.")
				fmt.Println()
				loginProc := exec.Command(os.Args[0], "login")
				loginProc.Stdin = os.Stdin
				loginProc.Stdout = os.Stdout
				loginProc.Stderr = os.Stderr
				if err := loginProc.Run(); err != nil {
					return fmt.Errorf("로그인 실패")
				}
				// config + token 재로드
				newCfg, _ := config.Load()
				if newCfg != nil {
					*cfg = *newCfg
				}
			}

			// 2. 워크스페이스 선택
			if cfg.WorkspaceID != "" {
				fmt.Printf("현재 워크스페이스: %s\n", cfg.WorkspaceName)
				changePrompt := promptui.Prompt{
					Label:     "다른 워크스페이스로 연결하시겠습니까 (Y/n)",
					Default:   "n",
					IsConfirm: true,
				}
				if _, err := changePrompt.Run(); err == nil {
					if err := runWorkspacePicker(wsUC, cfg); err != nil {
						return err
					}
				}
			} else {
				if err := runWorkspacePicker(wsUC, cfg); err != nil {
					return err
				}
			}
			if cfg.WorkspaceID == "" {
				return fmt.Errorf("워크스페이스를 선택해주세요")
			}

			// 3. 프로젝트 이름 — git remote origin 기반 기본값
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

			// 4. 프로젝트 링크 → .huginin/projects.json 저장
			remote := gitRemote(repoPath)
			projID, err := projUC.Link(cfg.WorkspaceID, projectName, remote)
			if err != nil {
				return fmt.Errorf("프로젝트 연결 실패: %w", err)
			}
			if err := writeProjectsJSONAt(repoPath, cfg.WorkspaceID, projID); err != nil {
				fmt.Fprintf(os.Stderr, "warning: projects.json 저장 실패: %v\n", err)
			}

			// 5. hook 설치
			if err := installHooks(repoPath); err != nil {
				return err
			}

			fmt.Println()
			fmt.Println("✓ 설정 완료")
			fmt.Printf("  워크스페이스: %s\n", cfg.WorkspaceName)
			fmt.Printf("  프로젝트:     %s\n", projectName)
			fmt.Println()
			fmt.Println("이제 커밋하면 자동으로 HUGININ에 기록됩니다.")
			return nil
		},
	}
}

// installHooks는 repoPath의 .git/hooks/에 hook 스크립트를 설치한다.
func installHooks(repoPath string) error {
	hookDir := filepath.Join(repoPath, ".git", "hooks")
	if _, err := os.Stat(hookDir); os.IsNotExist(err) {
		return fmt.Errorf("%s is not a git repository", repoPath)
	}
	hooks := map[string][]byte{
		"post-commit": postCommitScript,
		"post-push":   postPushScript,
	}
	for name, content := range hooks {
		dst := filepath.Join(hookDir, name)
		if info, err := os.Lstat(dst); err == nil && info.Mode()&os.ModeSymlink == 0 {
			_ = os.Rename(dst, dst+".bak")
		}
		if err := os.WriteFile(dst, content, 0755); err != nil {
			return fmt.Errorf("failed to write %s: %w", name, err)
		}
	}
	return nil
}

func repoBaseName(repoPath string) string {
	if out, err := exec.Command("git", "-C", repoPath, "remote", "get-url", "origin").Output(); err == nil {
		remote := strings.TrimSpace(string(out))
		parts := strings.Split(remote, "/")
		if len(parts) > 0 {
			name := strings.TrimSuffix(parts[len(parts)-1], ".git")
			if name != "" {
				return name
			}
		}
	}
	if repoPath == "." {
		if cwd, err := os.Getwd(); err == nil {
			return filepath.Base(cwd)
		}
	}
	return filepath.Base(repoPath)
}

func gitRemote(repoPath string) string {
	if out, err := exec.Command("git", "-C", repoPath, "remote", "get-url", "origin").Output(); err == nil {
		return strings.TrimSpace(string(out))
	}
	return ""
}
