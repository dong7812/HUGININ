package cli

import (
	"fmt"
	"os"

	"github.com/manifoldco/promptui"
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
			if server, _ := cmd.Flags().GetString("server"); server != "" {
				cfg.BaseURL = server
				if err := config.Save(cfg); err != nil {
					return err
				}
			}

			email, _ := cmd.Flags().GetString("email")
			password, _ := cmd.Flags().GetString("password")

			var err error
			if email == "" {
				email, err = prompt("이메일", false)
				if err != nil {
					return err
				}
			}
			if password == "" {
				password, err = prompt("비밀번호", true)
				if err != nil {
					return err
				}
			}

			if register {
				name, _ := cmd.Flags().GetString("name")
				if name == "" {
					name, err = prompt("이름", false)
					if err != nil {
						return err
					}
				}
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

	cmd.Flags().String("email", "", "이메일 주소 (생략 시 대화형 입력)")
	cmd.Flags().String("password", "", "비밀번호 (생략 시 대화형 입력)")
	cmd.Flags().String("name", "", "이름 (신규 가입 시, 생략 시 대화형 입력)")
	cmd.Flags().String("server", "", "서버 URL 재설정 (예: http://localhost:8000)")
	cmd.Flags().BoolVar(&register, "register", false, "신규 가입")

	cmd.AddCommand(newMcpTokenCmd(uc, cfg))

	return cmd
}

func prompt(label string, mask bool) (string, error) {
	p := promptui.Prompt{Label: label}
	if mask {
		p.Mask = '*'
	}
	val, err := p.Run()
	if err == promptui.ErrInterrupt || err == promptui.ErrEOF {
		fmt.Println()
		os.Exit(0)
	}
	return val, err
}

func newMcpTokenCmd(uc *application.LoginUseCase, cfg *config.Config) *cobra.Command {
	return &cobra.Command{
		Use:   "mcp-token",
		Short: "MCP/Git hook용 장기 토큰 발급 (365일)",
		RunE: func(cmd *cobra.Command, args []string) error {
			token, err := uc.CreateServiceToken()
			if err != nil {
				return err
			}
			mcpURL := cfg.BaseURL + "/mcp"
			fmt.Println("✓ Service token (365일):")
			fmt.Println()
			fmt.Println(token)
			fmt.Println()
			fmt.Println(".mcp.json에 아래를 추가하세요:")
			fmt.Println(`{
  "mcpServers": {
    "huginin": {
      "url": "` + mcpURL + `",
      "type": "sse",
      "headers": { "Authorization": "Bearer ` + token + `" }
    }
  }
}`)
			return nil
		},
	}
}
