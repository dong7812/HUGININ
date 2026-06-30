//go:build darwin

package tui

import (
	"os"

	"golang.org/x/sys/unix"
)

// disableEcho turns off ECHO on the PTY slave (via master fd) and returns a
// restore function. Used during context injection so the injected text does
// not appear as terminal echo — without suppressing the CLI's own output.
func disableEcho(ptym *os.File) func() {
	t, err := unix.IoctlGetTermios(int(ptym.Fd()), unix.TIOCGETA)
	if err != nil {
		return func() {}
	}
	orig := *t
	t.Lflag &^= unix.ECHO
	_ = unix.IoctlSetTermios(int(ptym.Fd()), unix.TIOCSETA, t)
	return func() {
		_ = unix.IoctlSetTermios(int(ptym.Fd()), unix.TIOCSETA, &orig)
	}
}
