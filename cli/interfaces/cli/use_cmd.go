package cli

import (
	"fmt"

	"github.com/spf13/cobra"

	"huginin/infrastructure/config"
)

func newUseCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "use <tool>",
		Short: "활성 LLM CLI 전환 (claude-code | codex | antigravity)",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			tool := args[0]
			switch tool {
			case "claude-code", "codex", "antigravity":
			default:
				return fmt.Errorf("unknown tool %q — use: claude-code | codex | antigravity", tool)
			}
			cfg, err := config.Load()
			if err != nil {
				return err
			}
			cfg.ActiveTool = tool
			if err := config.Save(cfg); err != nil {
				return err
			}
			fmt.Printf("active tool: %s\n", tool)
			return nil
		},
	}
}
