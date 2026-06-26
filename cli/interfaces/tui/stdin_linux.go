//go:build linux

package tui

import "syscall"

// stdinReady: fd에 읽을 데이터가 있으면 true. timeoutMs 동안 대기.
// linux: FdSet.Bits [16]int64, Select returns (int, error).
func stdinReady(fd int, timeoutMs int) bool {
	var rfds syscall.FdSet
	rfds.Bits[fd/64] |= 1 << uint(fd%64)
	tv := syscall.Timeval{Sec: 0, Usec: int64(timeoutMs * 1000)}
	n, err := syscall.Select(fd+1, &rfds, nil, nil, &tv)
	if err != nil || n <= 0 {
		return false
	}
	return rfds.Bits[fd/64]&(1<<uint(fd%64)) != 0
}
