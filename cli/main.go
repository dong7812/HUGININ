package main

import (
	"os"
	"os/signal"
	"syscall"

	"huginin/interfaces/cli"
)

func main() {
	// promptui가 터미널을 raw 모드로 전환하면 Ctrl+C가 SIGINT 대신
	// 바이트로 전달된다. signal.Notify로 OS 레벨에서 잡아 강제 종료한다.
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-c
		// 터미널 정상 복원 후 종료
		os.Stdout.WriteString("\n")
		os.Exit(0)
	}()

	cli.Execute()
}
