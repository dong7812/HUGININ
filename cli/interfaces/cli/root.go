package cli

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"

	"huginin/application"
	httpinfra "huginin/infrastructure/http"
	"huginin/infrastructure/keystore"
	"huginin/infrastructure/config"
)

var root = &cobra.Command{
	Use:   "huginin",
	Short: "HUGININ — 팀 AI 협업 가시화",
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

	root.AddCommand(newLoginCmd(loginUC, wsUC, cfg))
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
