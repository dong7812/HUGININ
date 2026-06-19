package cli

import (
	"bufio"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/spf13/cobra"

	"huginin/application"
	httpinfra "huginin/infrastructure/http"
)

func newBackfillCmd(projUC *application.ProjectUseCase) *cobra.Command {
	var count int
	var since string

	cmd := &cobra.Command{
		Use:   "backfill",
		Short: "로그인 전 누락된 커밋을 소급 수집",
		RunE: func(cmd *cobra.Command, args []string) error {
			wsID, projID, err := loadProjectsJSON(".")
			if err != nil {
				return fmt.Errorf("프로젝트 미연결 — 먼저 huginin setup을 실행하세요")
			}

			commits, err := gitLog(count, since)
			if err != nil {
				return fmt.Errorf("git log 실패: %w", err)
			}
			if len(commits) == 0 {
				fmt.Println("커밋 없음")
				return nil
			}

			fmt.Printf("총 %d개 커밋 확인 중...\n\n", len(commits))
			ok, skipped, failed := 0, 0, 0

			for _, c := range commits {
				diff := gitDiff(c.hash)
				prompt, response := findClaudeSession(c.ts)
				if prompt == "" {
					prompt = "[git commit] " + c.msg
				}
				if response == "" {
					response = "[no AI session detected]"
				}

				_, err := projUC.CollectEvent(wsID, projID, c.hash, prompt, response, diff, c.branch)
				short := c.hash[:8]
				msg := firstLine(c.msg)
				if len(msg) > 50 {
					msg = msg[:50] + "…"
				}

				switch {
				case err == nil:
					fmt.Printf("  ✓ %s  %s\n", short, msg)
					ok++
				case errors.Is(err, httpinfra.ErrDuplicate):
					fmt.Printf("  · %s  %s (already collected)\n", short, msg)
					skipped++
				default:
					fmt.Printf("  ✗ %s  %s — %v\n", short, msg, err)
					failed++
				}
			}

			fmt.Printf("\n완료: ✓ %d 수집  · %d 중복 스킵  ✗ %d 실패\n", ok, skipped, failed)
			return nil
		},
	}

	cmd.Flags().IntVarP(&count, "count", "n", 50, "소급할 최대 커밋 수")
	cmd.Flags().StringVar(&since, "since", "", "이 날짜 이후 커밋만 (YYYY-MM-DD)")
	return cmd
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
		// 최초 커밋은 parent가 없음
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
		// try string
		var s string
		if json.Unmarshal(raw, &s) == nil {
			return truncate(s, 2000)
		}
		// try array of blocks
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
