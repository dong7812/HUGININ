package cli

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/spf13/cobra"

	"huginin/application"
)

func newProjectCmd(uc *application.ProjectUseCase) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "project",
		Short: "프로젝트 관리",
	}

	// huginin project link --workspace <id> --name "my-service"
	// git remote origin URL 자동 감지
	linkCmd := &cobra.Command{
		Use:   "link",
		Short: "현재 git 저장소를 워크스페이스 프로젝트에 연결",
		RunE: func(cmd *cobra.Command, args []string) error {
			wsID, _ := cmd.Flags().GetString("workspace")
			name, _ := cmd.Flags().GetString("name")
			remote, _ := cmd.Flags().GetString("remote")

			if remote == "" {
				out, err := exec.Command("git", "remote", "get-url", "origin").Output()
				if err == nil {
					remote = strings.TrimSpace(string(out))
				}
			}

			id, err := uc.Link(wsID, name, remote)
			if err != nil {
				return err
			}

			// .huginin/projects.json 자동 생성 (Git Hook이 읽음)
			if err := writeProjectsJSONAt(".", wsID, id); err != nil {
				fmt.Fprintf(os.Stderr, "warning: could not write .huginin/projects.json: %v\n", err)
			}

			// Git Hook 자동 설치
			if err := installHooks("."); err != nil {
				fmt.Fprintf(os.Stderr, "warning: hook install skipped: %v\n", err)
			} else {
				fmt.Println("✓ Git hooks installed (.git/hooks/)")
			}

			fmt.Printf("✓ Project linked: %s (id: %s)\n", name, id)
			return nil
		},
	}
	linkCmd.Flags().String("workspace", "", "워크스페이스 ID")
	linkCmd.Flags().String("name", "", "프로젝트 이름")
	linkCmd.Flags().String("remote", "", "git remote URL (미지정 시 origin 자동 감지)")
	linkCmd.MarkFlagRequired("workspace")
	linkCmd.MarkFlagRequired("name")

	cmd.AddCommand(linkCmd)
	return cmd
}

func writeProjectsJSONAt(repoPath, workspaceID, projectID string) error {
	dir := filepath.Join(repoPath, ".huginin")
	if err := os.MkdirAll(dir, 0700); err != nil {
		return err
	}
	data, _ := json.MarshalIndent(map[string]string{
		"workspace_id": workspaceID,
		"project_id":   projectID,
	}, "", "  ")
	return os.WriteFile(filepath.Join(dir, "projects.json"), data, 0600)
}
