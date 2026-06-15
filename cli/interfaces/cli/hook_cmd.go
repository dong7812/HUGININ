package cli

import (
	_ "embed"
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
)

//go:embed hooks/post-commit
var postCommitScript []byte

//go:embed hooks/post-push
var postPushScript []byte

func newHookCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "hook",
		Short: "Git hook 관리",
	}
	cmd.AddCommand(newHookInstallCmd())
	return cmd
}

func newHookInstallCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "install [path]",
		Short: "현재(또는 지정) Git 레포에 HUGININ hook 설치",
		Args:  cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			repoPath := "."
			if len(args) > 0 {
				repoPath = args[0]
			}
			if err := installHooks(repoPath); err != nil {
				return err
			}
			fmt.Printf("✓ hooks installed → %s/.git/hooks/\n", repoPath)
			fmt.Println("  post-commit: AI 세션 자동 수집")
			fmt.Println("  post-push:   force-push 감지")
			return nil
		},
	}
}

// installHooks는 repoPath의 .git/hooks/에 hook 스크립트를 설치한다.
// project link 이후 자동 호출된다.
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
		// 기존 파일이 심볼릭 링크가 아닌 일반 파일이면 백업
		if info, err := os.Lstat(dst); err == nil && info.Mode()&os.ModeSymlink == 0 {
			_ = os.Rename(dst, dst+".bak")
		}
		if err := os.WriteFile(dst, content, 0755); err != nil {
			return fmt.Errorf("failed to write %s: %w", name, err)
		}
	}
	return nil
}
