package cli

import (
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"time"

	"github.com/manifoldco/promptui"
	"github.com/spf13/cobra"

	"huginin/application"
	"huginin/infrastructure/config"
)

func newLoginCmd(uc *application.LoginUseCase, wsUC *application.WorkspaceUseCase, cfg *config.Config) *cobra.Command {
	var usePassword bool

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

			if usePassword {
				return passwordLogin(cmd, uc, wsUC, cfg)
			}
			return browserLogin(uc, wsUC, cfg)
		},
	}

	cmd.Flags().BoolVar(&usePassword, "password", false, "이메일+비밀번호로 로그인 (브라우저 없는 환경)")
	cmd.Flags().String("email", "", "이메일 (--password 모드)")
	cmd.Flags().String("pw", "", "비밀번호 (--password 모드)")
	cmd.Flags().String("server", "", "서버 URL 재설정")

	cmd.AddCommand(newMcpTokenCmd(uc, cfg))

	return cmd
}

func browserLogin(uc *application.LoginUseCase, wsUC *application.WorkspaceUseCase, cfg *config.Config) error {
	sessionID, authURL, err := uc.BrowserLogin()
	if err != nil {
		return fmt.Errorf("세션 생성 실패: %w", err)
	}

	fmt.Println()
	fmt.Println("브라우저에서 HUGININ에 로그인하세요:")
	fmt.Println()
	fmt.Printf("  %s\n", authURL)
	fmt.Println()

	if err := openBrowser(authURL); err != nil {
		fmt.Println("브라우저를 자동으로 열 수 없습니다. 위 URL을 직접 복사해 주세요.")
	} else {
		fmt.Println("브라우저가 열렸습니다. 로그인을 완료하면 자동으로 진행됩니다.")
	}
	fmt.Println()

	// 최대 5분 polling
	timeout := time.After(5 * time.Minute)
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	fmt.Print("대기 중")
	for {
		select {
		case <-timeout:
			fmt.Println()
			return fmt.Errorf("타임아웃: 5분 내에 로그인이 완료되지 않았습니다")
		case <-ticker.C:
			fmt.Print(".")
			status, token, userID, err := uc.PollSession(sessionID)
			if err != nil {
				continue
			}
			if status == "complete" && token != "" {
				fmt.Println()
				fmt.Println()
				if err := uc.SaveToken(token, userID); err != nil {
					return fmt.Errorf("토큰 저장 실패: %w", err)
				}
				fmt.Println("✓ 로그인 완료")
				fmt.Println()
				if err := runWorkspacePicker(wsUC, cfg); err != nil {
					fmt.Println("⚠ 워크스페이스 선택 건너뜀:", err)
				}
				return nil
			}
		}
	}
}

func passwordLogin(cmd *cobra.Command, uc *application.LoginUseCase, wsUC *application.WorkspaceUseCase, cfg *config.Config) error {
	email, _ := cmd.Flags().GetString("email")
	password, _ := cmd.Flags().GetString("pw")

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

	if err := uc.Login(email, password); err != nil {
		return fmt.Errorf("login failed: %w", err)
	}
	fmt.Println("✓ 로그인 완료")
	fmt.Println()
	if err := runWorkspacePicker(wsUC, cfg); err != nil {
		fmt.Println("⚠ 워크스페이스 선택 건너뜀:", err)
	}
	return nil
}

func openBrowser(url string) error {
	var cmd string
	var args []string
	switch runtime.GOOS {
	case "darwin":
		cmd = "open"
		args = []string{url}
	case "linux":
		cmd = "xdg-open"
		args = []string{url}
	default:
		return fmt.Errorf("unsupported OS")
	}
	return exec.Command(cmd, args...).Start()
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
