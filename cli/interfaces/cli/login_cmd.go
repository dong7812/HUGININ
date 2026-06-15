package cli

import (
	"fmt"

	"github.com/spf13/cobra"

	"huginin/application"
	"huginin/infrastructure/config"
)

func newLoginCmd(uc *application.LoginUseCase, wsUC *application.WorkspaceUseCase, cfg *config.Config) *cobra.Command {
	var register bool

	cmd := &cobra.Command{
		Use:   "login",
		Short: "HUGININ 계정으로 로그인",
		RunE: func(cmd *cobra.Command, args []string) error {
			email, _ := cmd.Flags().GetString("email")
			password, _ := cmd.Flags().GetString("password")

			if register {
				name, _ := cmd.Flags().GetString("name")
				if err := uc.Register(email, name, password); err != nil {
					return fmt.Errorf("register failed: %w", err)
				}
				fmt.Println("✓ 가입 완료")
			} else {
				if err := uc.Login(email, password); err != nil {
					return fmt.Errorf("login failed: %w", err)
				}
				fmt.Println("✓ 로그인 완료")
			}

			fmt.Println()
			if err := runWorkspacePicker(wsUC, cfg); err != nil {
				fmt.Println("⚠ 워크스페이스 선택 건너뜀:", err)
			}
			return nil
		},
	}

	cmd.Flags().String("email", "", "이메일 주소")
	cmd.Flags().String("password", "", "비밀번호")
	cmd.Flags().String("name", "", "이름 (신규 가입 시)")
	cmd.Flags().BoolVar(&register, "register", false, "신규 가입")
	cmd.MarkFlagRequired("email")
	cmd.MarkFlagRequired("password")

	cmd.AddCommand(newMcpTokenCmd(uc))

	return cmd
}

func newMcpTokenCmd(uc *application.LoginUseCase) *cobra.Command {
	return &cobra.Command{
		Use:   "mcp-token",
		Short: "MCP/Git hook용 장기 토큰 발급 (365일)",
		RunE: func(cmd *cobra.Command, args []string) error {
			token, err := uc.CreateServiceToken()
			if err != nil {
				return err
			}
			fmt.Println("✓ Service token (365일):")
			fmt.Println()
			fmt.Println(token)
			fmt.Println()
			fmt.Println(".mcp.json에 아래를 추가하세요:")
			fmt.Println(`{
  "mcpServers": {
    "huginin": {
      "url": "http://localhost:8000/mcp",
      "type": "sse",
      "headers": { "Authorization": "Bearer ` + token + `" }
    }
  }
}`)
			return nil
		},
	}
}
