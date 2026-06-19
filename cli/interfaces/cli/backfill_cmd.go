package cli

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/spf13/cobra"

	"huginin/application"
)

func newBackfillCmd(projUC *application.ProjectUseCase) *cobra.Command {
	var count int
	var since string

	cmd := &cobra.Command{
		Use:   "backfill",
		Short: "서버에 없는 누락 커밋만 소급 수집",
		RunE: func(cmd *cobra.Command, args []string) error {
			wsID, projID, err := loadProjectsJSON(".")
			if err != nil {
				return fmt.Errorf("프로젝트 미연결 — 먼저 huginin setup을 실행하세요")
			}

			// 1. 서버에 이미 있는 commit hash 목록 조회
			fmt.Print("서버에서 수집된 커밋 목록 조회 중... ")
			serverHashes, err := projUC.GetCommitHashes(wsID)
			if err != nil {
				return fmt.Errorf("서버 조회 실패: %w", err)
			}
			known := make(map[string]bool, len(serverHashes))
			for _, h := range serverHashes {
				known[h] = true
				// 8자 prefix도 등록 (git log short hash 매칭용)
				if len(h) >= 8 {
					known[h[:8]] = true
				}
			}
			fmt.Printf("%d개 확인\n", len(serverHashes))

			// 2. 로컬 git log
			commits, err := gitLog(count, since)
			if err != nil {
				return fmt.Errorf("git log 실패: %w", err)
			}

			// 3. 누락 커밋 필터링
			var missing []commitInfo
			for _, c := range commits {
				if !known[c.hash] && !known[c.hash[:min(8, len(c.hash))]] {
					missing = append(missing, c)
				}
			}

			// 누락 여부와 관계없이 항상 타임스탬프 보정 실행
			fmt.Print("기존 기록 타임스탬프 보정 중... ")
			timestamps := make(map[string]string, len(commits))
			for _, c := range commits {
				timestamps[c.hash] = c.ts.UTC().Format(time.RFC3339)
			}
			if n, err := projUC.FixCommitTimestamps(wsID, timestamps); err != nil {
				fmt.Printf("⚠ %v\n", err)
			} else {
				fmt.Printf("%d개 보정됨\n", n)
			}

			if len(missing) == 0 {
				fmt.Printf("누락 커밋 없음 (로컬 %d개 확인)\n", len(commits))
				return nil
			}

			// 마지막으로 수집된 커밋 표시
			for _, c := range commits {
				if known[c.hash] || known[c.hash[:min(8, len(c.hash))]] {
					fmt.Printf("서버 기준 마지막 수집: %s  %s\n", c.hash[:8], firstLine(c.msg))
					break
				}
			}

			fmt.Printf("누락 커밋 %d개 발견 (branch: %s):\n", len(missing), missing[0].branch)
			for _, c := range missing {
				msg := firstLine(c.msg)
				if len(msg) > 60 {
					msg = msg[:60] + "…"
				}
				fmt.Printf("  → %s  %s\n", c.hash[:8], msg)
			}
			fmt.Println()
			fmt.Println("업로드 중...")

			ok, failed := 0, 0
			// 오래된 것부터 (역순)
			for i := len(missing) - 1; i >= 0; i-- {
				c := missing[i]
				diff := gitDiff(c.hash)
				prompt, response := findClaudeSession(c.ts)
				if prompt == "" {
					prompt = "[git commit] " + c.msg
				}
				if response == "" {
					response = "[no AI session detected]"
				}

				committedAt := c.ts.UTC().Format(time.RFC3339)
				_, err := projUC.CollectEvent(wsID, projID, c.hash, prompt, response, diff, c.branch, committedAt)
				msg := firstLine(c.msg)
				if len(msg) > 50 {
					msg = msg[:50] + "…"
				}
				if err != nil {
					fmt.Printf("  ✗ %s  %s — %v\n", c.hash[:8], msg, err)
					failed++
				} else {
					fmt.Printf("  ✓ %s  %s\n", c.hash[:8], msg)
					ok++
				}
			}

			fmt.Printf("\n완료: ✓ %d 수집  ✗ %d 실패\n", ok, failed)
			return nil
		},
	}

	cmd.Flags().IntVarP(&count, "count", "n", 100, "비교할 최대 로컬 커밋 수")
	cmd.Flags().StringVar(&since, "since", "", "이 날짜 이후 커밋만 (YYYY-MM-DD)")
	return cmd
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// ── git helpers ────────────────────────────────────────────────────────────

type commitInfo struct {
	hash   string
	ts     time.Time
	msg    string
	branch string
}

func gitLog(n int, since string) ([]commitInfo, error) {
	args := []string{"log", fmt.Sprintf("--max-count=%d", n),
		"--pretty=format:%H\t%ct\t%s"}
	if since != "" {
		args = append(args, "--since="+since)
	}
	out, err := exec.Command("git", args...).Output()
	if err != nil {
		return nil, err
	}

	branchOut, _ := exec.Command("git", "rev-parse", "--abbrev-ref", "HEAD").Output()
	branch := strings.TrimSpace(string(branchOut))

	var commits []commitInfo
	for _, line := range strings.Split(strings.TrimSpace(string(out)), "\n") {
		if line == "" {
			continue
		}
		parts := strings.SplitN(line, "\t", 3)
		if len(parts) != 3 {
			continue
		}
		unix, err := strconv.ParseInt(parts[1], 10, 64)
		if err != nil {
			continue
		}
		commits = append(commits, commitInfo{
			hash:   parts[0],
			ts:     time.Unix(unix, 0),
			msg:    parts[2],
			branch: branch,
		})
	}
	return commits, nil
}

func gitDiff(hash string) string {
	out, err := exec.Command("git", "diff", hash+"~1", hash, "--stat").Output()
	if err != nil {
		out, _ = exec.Command("git", "show", "--stat", hash).Output()
	}
	lines := strings.Split(string(out), "\n")
	if len(lines) > 50 {
		lines = lines[:50]
	}
	return strings.Join(lines, "\n")
}

// ── Claude session JSONL 매칭 ───────────────────────────────────────────────

func findClaudeSession(commitTime time.Time) (prompt, response string) {
	claudeDir := filepath.Join(os.Getenv("HOME"), ".claude", "projects")
	entries, err := os.ReadDir(claudeDir)
	if err != nil {
		return "", ""
	}

	var bestFile string
	var bestDelta time.Duration = 1<<62 - 1

	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		dir := filepath.Join(claudeDir, e.Name())
		files, _ := filepath.Glob(filepath.Join(dir, "*.jsonl"))
		for _, f := range files {
			info, err := os.Stat(f)
			if err != nil {
				continue
			}
			delta := info.ModTime().Sub(commitTime)
			if delta < 0 {
				delta = -delta
			}
			if delta < 30*time.Minute && delta < bestDelta {
				bestDelta = delta
				bestFile = f
			}
		}
	}

	if bestFile == "" {
		return "", ""
	}
	return parseJSONL(bestFile)
}

func parseJSONL(path string) (prompt, response string) {
	f, err := os.Open(path)
	if err != nil {
		return "", ""
	}
	defer f.Close()

	type contentBlock struct {
		Type string `json:"type"`
		Text string `json:"text"`
	}
	type message struct {
		Content json.RawMessage `json:"content"`
	}
	type entry struct {
		Type    string  `json:"type"`
		Message message `json:"message"`
	}

	var entries []entry
	sc := bufio.NewScanner(f)
	sc.Buffer(make([]byte, 4*1024*1024), 4*1024*1024)
	for sc.Scan() {
		var e entry
		if json.Unmarshal(sc.Bytes(), &e) == nil {
			entries = append(entries, e)
		}
	}

	extractText := func(raw json.RawMessage) string {
		if raw == nil {
			return ""
		}
		var s string
		if json.Unmarshal(raw, &s) == nil {
			return truncate(s, 2000)
		}
		var blocks []contentBlock
		if json.Unmarshal(raw, &blocks) == nil {
			for _, b := range blocks {
				if b.Type == "text" && b.Text != "" {
					return truncate(b.Text, 2000)
				}
			}
		}
		return ""
	}

	for i := len(entries) - 1; i >= 0; i-- {
		e := entries[i]
		if e.Type == "user" && prompt == "" {
			prompt = extractText(e.Message.Content)
		}
		if e.Type == "assistant" && response == "" {
			response = extractText(e.Message.Content)
		}
		if prompt != "" && response != "" {
			break
		}
	}
	return prompt, response
}

func loadProjectsJSON(repoPath string) (wsID, projID string, err error) {
	data, err := os.ReadFile(filepath.Join(repoPath, ".huginin", "projects.json"))
	if err != nil {
		return "", "", err
	}
	var m map[string]string
	if err := json.Unmarshal(data, &m); err != nil {
		return "", "", err
	}
	wsID = m["workspace_id"]
	projID = m["project_id"]
	if wsID == "" {
		return "", "", fmt.Errorf("workspace_id not set")
	}
	return wsID, projID, nil
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n]
}

func firstLine(s string) string {
	if idx := strings.IndexByte(s, '\n'); idx >= 0 {
		return s[:idx]
	}
	return s
}
