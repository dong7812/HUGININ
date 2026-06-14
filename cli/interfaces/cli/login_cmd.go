package cli

import (
	"fmt"

	"github.com/spf13/cobra"

	"huginin/application"
)

func newLoginCmd(uc *application.LoginUseCase) *cobra.Command {
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
				fmt.Println("✓ Registered and logged in")
				return nil
			}

			if err := uc.Login(email, password); err != nil {
				return fmt.Errorf("login failed: %w", err)
			}
			fmt.Println("✓ Logged in")
			return nil
		},
	}

	cmd.Flags().String("email", "", "이메일 주소")
	cmd.Flags().String("password", "", "비밀번호")
	cmd.Flags().String("name", "", "이름 (신규 가입 시)")
	cmd.Flags().BoolVar(&register, "register", false, "신규 가입")
	cmd.MarkFlagRequired("email")
	cmd.MarkFlagRequired("password")

	return cmd
}
