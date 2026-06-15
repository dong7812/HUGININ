package cli

import (
	"fmt"

	"github.com/spf13/cobra"

	"huginin/application"
	"huginin/infrastructure/config"
)

func newWorkspaceCmd(uc *application.WorkspaceUseCase, cfg *config.Config) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "workspace",
		Short: "워크스페이스 관리",
	}

	// huginin workspace select
	selectCmd := &cobra.Command{
		Use:   "select",
		Short: "활성 워크스페이스 전환",
		RunE: func(cmd *cobra.Command, args []string) error {
			return runWorkspacePicker(uc, cfg)
		},
	}
	cmd.AddCommand(selectCmd)

	// huginin workspace create --name "My Team"
	createCmd := &cobra.Command{
		Use:   "create",
		Short: "워크스페이스 생성",
		RunE: func(cmd *cobra.Command, args []string) error {
			name, _ := cmd.Flags().GetString("name")
			id, slug, err := uc.Create(name)
			if err != nil {
				return err
			}
			fmt.Printf("✓ Created workspace: %s (slug: %s, id: %s)\n", name, slug, id)
			return nil
		},
	}
	createCmd.Flags().String("name", "", "워크스페이스 이름")
	createCmd.MarkFlagRequired("name")

	// huginin workspace join --code <invite-code>
	joinCmd := &cobra.Command{
		Use:   "join",
		Short: "초대코드로 워크스페이스 참여",
		RunE: func(cmd *cobra.Command, args []string) error {
			code, _ := cmd.Flags().GetString("code")
			id, role, err := uc.Join(code)
			if err != nil {
				return err
			}
			fmt.Printf("✓ Joined workspace %s as %s\n", id, role)
			return nil
		},
	}
	joinCmd.Flags().String("code", "", "초대코드")
	joinCmd.MarkFlagRequired("code")

	// huginin workspace list
	listCmd := &cobra.Command{
		Use:   "list",
		Short: "참여 중인 워크스페이스 목록",
		RunE: func(cmd *cobra.Command, args []string) error {
			workspaces, err := uc.List()
			if err != nil {
				return err
			}
			if len(workspaces) == 0 {
				fmt.Println("참여 중인 워크스페이스가 없습니다.")
				return nil
			}
			for _, w := range workspaces {
				fmt.Printf("  %s  %-30s  /%s\n", w.ID, w.Name, w.Slug)
			}
			return nil
		},
	}

	// huginin workspace invite --workspace <id> --role member
	inviteCmd := &cobra.Command{
		Use:   "invite",
		Short: "초대코드 발급",
		RunE: func(cmd *cobra.Command, args []string) error {
			wsID, _ := cmd.Flags().GetString("workspace")
			role, _ := cmd.Flags().GetString("role")
			expires, _ := cmd.Flags().GetInt("expires")
			code, err := uc.Invite(wsID, role, expires)
			if err != nil {
				return err
			}
			fmt.Printf("✓ Invite code: %s  (role: %s)\n", code, role)
			return nil
		},
	}
	inviteCmd.Flags().String("workspace", "", "워크스페이스 ID")
	inviteCmd.Flags().String("role", "member", "역할 (member|guest|admin)")
	inviteCmd.Flags().Int("expires", 72, "만료 시간 (시간, 0=무제한)")
	inviteCmd.MarkFlagRequired("workspace")

	// huginin workspace members --workspace <id>
	membersCmd := &cobra.Command{
		Use:   "members",
		Short: "멤버 목록 조회",
		RunE: func(cmd *cobra.Command, args []string) error {
			wsID, _ := cmd.Flags().GetString("workspace")
			members, err := uc.Members(wsID)
			if err != nil {
				return err
			}
			for _, m := range members {
				fmt.Printf("  %-36s  %-10s  %s\n", m.UserID, m.Role, m.JoinedAt)
			}
			return nil
		},
	}
	membersCmd.Flags().String("workspace", "", "워크스페이스 ID")
	membersCmd.MarkFlagRequired("workspace")

	// huginin workspace role --workspace <id> --user <uid> --role admin
	roleCmd := &cobra.Command{
		Use:   "role",
		Short: "멤버 역할 변경",
		RunE: func(cmd *cobra.Command, args []string) error {
			wsID, _ := cmd.Flags().GetString("workspace")
			userID, _ := cmd.Flags().GetString("user")
			role, _ := cmd.Flags().GetString("role")
			if err := uc.ChangeRole(wsID, userID, role); err != nil {
				return err
			}
			fmt.Printf("✓ Changed role of %s to %s\n", userID, role)
			return nil
		},
	}
	roleCmd.Flags().String("workspace", "", "워크스페이스 ID")
	roleCmd.Flags().String("user", "", "대상 유저 ID")
	roleCmd.Flags().String("role", "", "새 역할")
	roleCmd.MarkFlagRequired("workspace")
	roleCmd.MarkFlagRequired("user")
	roleCmd.MarkFlagRequired("role")

	cmd.AddCommand(createCmd, joinCmd, listCmd, inviteCmd, membersCmd, roleCmd)
	return cmd
}
