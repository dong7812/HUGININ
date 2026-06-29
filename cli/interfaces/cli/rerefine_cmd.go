package cli

import (
	"fmt"

	"github.com/spf13/cobra"

	"huginin/application"
	"huginin/infrastructure/config"
)

func newRerefinCmd(projUC *application.ProjectUseCase) *cobra.Command {
	return &cobra.Command{
		Use:   "rerefine <hash>...",
		Short: "기존 커밋의 세션을 재매핑하고 AI 분석 재실행",
		Args:  cobra.MinimumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			wsID, _, err := loadProjectsJSON(".")
			if err != nil {
				return fmt.Errorf("프로젝트 미연결 — 먼저 huginin setup을 실행하세요")
			}

			cfg, _ := config.Load()
			activeTool := "claude-code"
			if cfg != nil && cfg.ActiveTool != "" {
				activeTool = cfg.ActiveTool
			}

			commits, err := gitLog(200, "")
			if err != nil {
				return fmt.Errorf("git log 실패: %w", err)
			}
			byHash := make(map[string]commitInfo, len(commits))
			for _, c := range commits {
				byHash[c.hash] = c
				if len(c.hash) >= 8 {
					byHash[c.hash[:8]] = c
				}
			}

			for _, hash := range args {
				c, ok := byHash[hash]
				if !ok {
					fmt.Printf("  ✗ %s — git log에서 찾을 수 없음\n", hash)
					continue
				}

				diff := gitDiff(c.hash)
				prompt, response := findSession(activeTool, c.ts)
				if prompt == "" {
					prompt = "[git commit] " + c.msg
				}
				if response == "" {
					response = "[no AI session detected]"
				}

				if err := projUC.RerefinEvent(wsID, c.hash, prompt, response, diff); err != nil {
					fmt.Printf("  ✗ %s — %v\n", c.hash[:8], err)
				} else {
					fmt.Printf("  ✓ %s  재분석 요청됨\n", c.hash[:8])
				}
			}
			return nil
		},
	}
}
