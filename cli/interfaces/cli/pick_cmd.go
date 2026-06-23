package cli

import (
	"os"
	"os/exec"

	"github.com/manifoldco/promptui"
	"github.com/spf13/cobra"

	"huginin/infrastructure/config"
)

var toolChoices = []struct {
	label   string
	tool    string
	binary  string
}{
	{"claude-code  (claude)", "claude-code", "claude"},
	{"antigravity  (agy)", "antigravity", "agy"},
	{"codex", "codex", "codex"},
}

func newPickCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "pick",
		Short: "LLM CLI 선택 후 즉시 실행",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, err := config.Load()
			if err != nil {
				return err
			}
			current := cfg.ActiveTool
			if current == "" {
				current = "claude-code"
			}

			items := make([]string, len(toolChoices))
			for i, t := range toolChoices {
				if t.tool == current {
					items[i] = t.label + "  ← 현재"
				} else {
					items[i] = t.label
				}
			}

			sel := promptui.Select{
				Label: "LLM CLI 선택  (↑↓ 이동, Enter 확인)",
				Items: items,
				Templates: &promptui.SelectTemplates{
					Label:    "{{ . }}",
					Active:   "▸ {{ . | cyan }}",
					Inactive: "  {{ . }}",
					Selected: "✓ {{ . | green }}",
				},
			}

			idx, _, err := sel.Run()
			if err != nil {
				if err == promptui.ErrInterrupt || err == promptui.ErrEOF {
					return nil
				}
				return err
			}

			chosen := toolChoices[idx]
			cfg.ActiveTool = chosen.tool
			if err := config.Save(cfg); err != nil {
				return err
			}

			c := exec.Command(chosen.binary, args...)
			c.Stdin = os.Stdin
			c.Stdout = os.Stdout
			c.Stderr = os.Stderr
			c.Run()
			return nil
		},
	}
}
