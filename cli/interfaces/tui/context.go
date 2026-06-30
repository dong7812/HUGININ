package tui

import (
	"bufio"
	"encoding/json"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

var userRequestRE = regexp.MustCompile(`(?s)<USER_REQUEST>(.*?)</USER_REQUEST>`)

// extractConversationForTool reads the actual conversation content for the
// given CLI tool and returns a human-readable summary for injection into
// another CLI. Returns "" if no conversation data is found.
func extractConversationForTool(name string) string {
	switch name {
	case "claude-code":
		return extractClaudeConversation()
	case "antigravity":
		return extractAgyConversation()
	case "codex":
		return extractCodexConversation()
	default:
		return ""
	}
}

// ── Claude Code ───────────────────────────────────────────────────────────────

func extractClaudeConversation() string {
	path := latestProjectJSONL(claudeProjectDir())
	if path == "" {
		return ""
	}
	msgs := parseClaudeJSONL(path)
	if len(msgs) == 0 {
		return ""
	}
	return formatContext("Claude Code", msgs)
}

func claudeProjectDir() string {
	cwd, err := os.Getwd()
	if err != nil {
		return ""
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return ""
	}
	encoded := strings.ReplaceAll(cwd, "/", "-")
	return filepath.Join(home, ".claude", "projects", encoded)
}

func parseClaudeJSONL(path string) []string {
	f, err := os.Open(path)
	if err != nil {
		return nil
	}
	defer f.Close()

	type Entry struct {
		Type    string          `json:"type"`
		Message json.RawMessage `json:"message"`
	}
	type Message struct {
		Role    string          `json:"role"`
		Content json.RawMessage `json:"content"`
	}

	var lines []string
	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 1<<20), 1<<20)
	for scanner.Scan() {
		var entry Entry
		if err := json.Unmarshal(scanner.Bytes(), &entry); err != nil {
			continue
		}
		if entry.Type != "user" && entry.Type != "assistant" {
			continue
		}
		var msg Message
		if err := json.Unmarshal(entry.Message, &msg); err != nil {
			continue
		}
		text := jsonlContentText(msg.Content)
		if text == "" {
			continue
		}
		role := "User"
		if entry.Type == "assistant" {
			role = "Assistant (Claude)"
		}
		lines = append(lines, role+": "+truncate(text, 400))
	}
	return lines
}

// jsonlContentText extracts plain text from a content field that may be a
// bare string or an array of typed blocks (Claude API format).
func jsonlContentText(raw json.RawMessage) string {
	if len(raw) == 0 {
		return ""
	}
	var s string
	if err := json.Unmarshal(raw, &s); err == nil {
		return strings.TrimSpace(s)
	}
	var blocks []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	}
	if err := json.Unmarshal(raw, &blocks); err != nil {
		return ""
	}
	var parts []string
	for _, b := range blocks {
		if b.Type == "text" && b.Text != "" {
			parts = append(parts, b.Text)
		}
	}
	return strings.TrimSpace(strings.Join(parts, " "))
}

// ── Antigravity (agy) ─────────────────────────────────────────────────────────

func extractAgyConversation() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return ""
	}
	brainDir := filepath.Join(home, ".gemini", "antigravity-cli", "brain")
	path := latestMatchingFile(brainDir, func(dir string) string {
		return filepath.Join(dir, ".system_generated", "logs", "transcript.jsonl")
	})
	if path == "" {
		return ""
	}
	msgs := parseAgyTranscript(path)
	if len(msgs) == 0 {
		return ""
	}
	return formatContext("Antigravity", msgs)
}

func parseAgyTranscript(path string) []string {
	f, err := os.Open(path)
	if err != nil {
		return nil
	}
	defer f.Close()

	type Entry struct {
		Source  string      `json:"source"`
		Type    string      `json:"type"`
		Content interface{} `json:"content"`
	}

	var lines []string
	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 1<<20), 1<<20)
	for scanner.Scan() {
		var entry Entry
		if err := json.Unmarshal(scanner.Bytes(), &entry); err != nil {
			continue
		}
		raw := ""
		switch v := entry.Content.(type) {
		case string:
			raw = v
		case map[string]interface{}:
			if t, ok := v["text"].(string); ok {
				raw = t
			} else if r, ok := v["response"].(string); ok {
				raw = r
			}
		}

		if entry.Source == "USER_EXPLICIT" && entry.Type == "USER_INPUT" {
			if m := userRequestRE.FindStringSubmatch(raw); m != nil {
				text := strings.TrimSpace(m[1])
				if text != "" {
					lines = append(lines, "User: "+truncate(text, 400))
				}
			}
		} else if entry.Source == "MODEL" && entry.Type == "PLANNER_RESPONSE" {
			text := strings.TrimSpace(raw)
			if text != "" {
				lines = append(lines, "Assistant (Gemini): "+truncate(text, 400))
			}
		}
	}
	return lines
}

// ── Codex ─────────────────────────────────────────────────────────────────────

func extractCodexConversation() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return ""
	}
	sessionsDir := filepath.Join(home, ".codex", "sessions")
	path := latestProjectJSONL(sessionsDir) // find most recently modified .jsonl
	if path == "" {
		return ""
	}
	msgs := parseCodexJSONL(path)
	if len(msgs) == 0 {
		return ""
	}
	return formatContext("Codex", msgs)
}

func parseCodexJSONL(path string) []string {
	f, err := os.Open(path)
	if err != nil {
		return nil
	}
	defer f.Close()

	type Block struct {
		Type string `json:"type"`
		Text string `json:"text"`
	}
	type Payload struct {
		Type    string  `json:"type"`
		Role    string  `json:"role"`
		Content []Block `json:"content"`
	}
	type Entry struct {
		Type    string  `json:"type"`
		Payload Payload `json:"payload"`
	}

	var lines []string
	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 1<<20), 1<<20)
	for scanner.Scan() {
		var entry Entry
		if err := json.Unmarshal(scanner.Bytes(), &entry); err != nil {
			continue
		}
		if entry.Type != "response_item" {
			continue
		}
		role := entry.Payload.Role
		if role != "user" && role != "assistant" {
			continue
		}
		var parts []string
		for _, b := range entry.Payload.Content {
			if (b.Type == "input_text" || b.Type == "output_text") && b.Text != "" {
				// Skip system injections
				if strings.Contains(b.Text, "<INSTRUCTIONS>") ||
					strings.Contains(b.Text, "<environment_context>") ||
					strings.Contains(b.Text, "AGENTS.md") {
					continue
				}
				parts = append(parts, b.Text)
			}
		}
		text := strings.TrimSpace(strings.Join(parts, " "))
		if text == "" {
			continue
		}
		label := "User"
		if role == "assistant" {
			label = "Assistant (Codex)"
		}
		lines = append(lines, label+": "+truncate(text, 400))
	}
	return lines
}

// ── format ────────────────────────────────────────────────────────────────────

// formatContext produces a compact, natural-language context string for
// injection into another CLI. The result intentionally reads as a brief
// handoff note rather than a raw data dump.
func formatContext(toolName string, msgs []string) string {
	recent := tail(msgs, 6) // at most 3 exchanges
	if len(recent) == 0 {
		return ""
	}
	var sb strings.Builder
	sb.WriteString("[이전 ")
	sb.WriteString(toolName)
	sb.WriteString(" 세션 컨텍스트]\n")
	for _, m := range recent {
		sb.WriteString(m)
		sb.WriteByte('\n')
	}
	sb.WriteString("위 컨텍스트를 참고해서 대화를 이어가주세요.")
	return sb.String()
}

// ── helpers ───────────────────────────────────────────────────────────────────

// latestProjectJSONL returns the path of the most recently modified .jsonl
// file in dir (walking one level of subdirectories for Codex's date layout).
func latestProjectJSONL(dir string) string {
	if dir == "" {
		return ""
	}
	var latest string
	var latestMod time.Time
	_ = filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() {
			return nil
		}
		if !strings.HasSuffix(path, ".jsonl") {
			return nil
		}
		if info.ModTime().After(latestMod) {
			latestMod = info.ModTime()
			latest = path
		}
		return nil
	})
	return latest
}

// latestMatchingFile finds the most recently modified file returned by
// pathFn(subdir) for each subdirectory in root.
func latestMatchingFile(root string, pathFn func(string) string) string {
	entries, err := os.ReadDir(root)
	if err != nil {
		return ""
	}
	var latest string
	var latestMod time.Time
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		p := pathFn(filepath.Join(root, e.Name()))
		info, err := os.Stat(p)
		if err != nil {
			continue
		}
		if info.ModTime().After(latestMod) {
			latestMod = info.ModTime()
			latest = p
		}
	}
	return latest
}

func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max] + "..."
}

func tail(s []string, n int) []string {
	if len(s) <= n {
		return s
	}
	return s[len(s)-n:]
}
