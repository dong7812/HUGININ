package cli

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"

	"huginin/application"
	httpinfra "huginin/infrastructure/http"
	"huginin/infrastructure/config"
	"huginin/infrastructure/keystore"
	"huginin/interfaces/tui"
)

var root = &cobra.Command{
	Use:     "huginin",
	Short:   "HUGININ — 팀 AI 협업 가시화",
	Version: "0.1.0",
	// 서브커맨드 없이 실행하면 TUI 세션 진입
	SilenceUsage: true,
}

func init() {
	root.SetVersionTemplate("huginin v{{.Version}}\n")
}

func Execute() {
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintln(os.Stderr, "config error:", err)
		os.Exit(1)
	}

	api := httpinfra.New(cfg.BaseURL)
	ks := keystore.New()

	loginUC := application.NewLoginUseCase(api, ks)
	wsUC := application.NewWorkspaceUseCase(api, ks)
	projUC := application.NewProjectUseCase(api, ks)

	root.RunE = func(cmd *cobra.Command, args []string) error {
		return tui.StartSession(cfg, wsUC, ks)
	}

	root.AddCommand(newLoginCmd(loginUC, wsUC, cfg))
	root.AddCommand(newLogoutCmd(ks))
	root.AddCommand(newWorkspaceCmd(wsUC, cfg))
	root.AddCommand(newProjectCmd(projUC))
	root.AddCommand(newHookCmd())
	for _, cmd := range newInternalCmds(projUC, ks) {
		root.AddCommand(cmd)
	}

	if err := root.Execute(); err != nil {
		os.Exit(1)
	}
}
