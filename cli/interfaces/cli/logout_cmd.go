package cli

import (
	"fmt"

	"github.com/spf13/cobra"

	"huginin/domain"
	"huginin/infrastructure/config"
)

func newLogoutCmd(ks domain.TokenRepository) *cobra.Command {
	return &cobra.Command{
		Use:   "logout",
		Short: "로그아웃 (로컬 인증 정보 삭제)",
		RunE: func(cmd *cobra.Command, args []string) error {
			if err := ks.Clear(); err != nil {
				return fmt.Errorf("로그아웃 실패: %w", err)
			}
			// 워크스페이스 정보도 초기화
			cfg, err := config.Load()
			if err == nil {
				cfg.WorkspaceID = ""
				cfg.WorkspaceName = ""
				_ = config.Save(cfg)
			}
			fmt.Println("✓ 로그아웃 완료")
			return nil
		},
	}
}
