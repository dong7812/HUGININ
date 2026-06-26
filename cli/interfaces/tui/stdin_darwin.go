//go:build darwin

package tui

import "syscall"

// stdinReady: fd에 읽을 데이터가 있으면 true. timeoutMs 동안 대기.
// darwin: FdSet.Bits [32]int32, Select returns (error).
func stdinReady(fd int, timeoutMs int) bool {
	var rfds syscall.FdSet
	rfds.Bits[fd/32] |= 1 << uint(fd%32)
	tv := syscall.Timeval{Sec: 0, Usec: int32(timeoutMs * 1000)}
	if err := syscall.Select(fd+1, &rfds, nil, nil, &tv); err != nil {
		return false
	}
	return rfds.Bits[fd/32]&(1<<uint(fd%32)) != 0
}
