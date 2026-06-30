//go:build linux

package tui

import (
	"os"

	"golang.org/x/sys/unix"
)

func disableEcho(ptym *os.File) func() {
	t, err := unix.IoctlGetTermios(int(ptym.Fd()), unix.TCGETS)
	if err != nil {
		return func() {}
	}
	orig := *t
	t.Lflag &^= unix.ECHO
	_ = unix.IoctlSetTermios(int(ptym.Fd()), unix.TCSETS, t)
	return func() {
		_ = unix.IoctlSetTermios(int(ptym.Fd()), unix.TCSETS, &orig)
	}
}
