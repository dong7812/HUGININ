package cli

import (
	"bufio"
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/spf13/cobra"

	"huginin/application"
	"huginin/domain"
	"huginin/infrastructure/config"
)

func newImportCmd(projUC *application.ProjectUseCase, cfg *config.Config) *cobra.Command {
	return &cobra.Command{
		Use:   "import <file>",
		Short: "문서를 HUGININ에 임포트 (ETL + 코드 검증)",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			wsID, projID, err := loadProjectsJSON(".")
			if err != nil {
				return fmt.Errorf("프로젝트 미연결 — 먼저 huginin setup을 실행하세요")
			}

			path := args[0]
			data, err := os.ReadFile(path)
			if err != nil {
				return fmt.Errorf("파일 읽기 실패: %w", err)
			}

			sections := splitSections(string(data))
			if len(sections) == 0 {
				return fmt.Errorf("섹션을 찾을 수 없습니다 (## 헤딩 기준 분리)")
			}

			fmt.Printf("📄 %s — %d개 섹션 감지\n", filepath.Base(path), len(sections))
			fmt.Println("코드베이스 검색 중...")

			for i := range sections {
				sections[i].CodebaseSnippets = grepCodebase(sections[i].Content)
			}

			fmt.Println("서버에 전송 중...")
			_, count, err := projUC.ImportDoc(wsID, projID, path, sections)
			if err != nil {
				return fmt.Errorf("임포트 실패: %w", err)
			}

			fmt.Printf("\n✓ %d개 섹션 임포트 완료\n", count)
			fmt.Printf("검토: %s/workspace/%s/docs\n", cfg.FrontendURL(), wsID)
			return nil
		},
	}
}

// ── 섹션 분리 (# / ## / ### 헤딩 기준) ──────────────────────────────────────

var headingRe = regexp.MustCompile(`(?m)^#{1,3} .+`)

func splitSections(text string) []domain.DocSection {
	locs := headingRe.FindAllStringIndex(text, -1)
	if len(locs) == 0 {
		trimmed := strings.TrimSpace(text)
		if trimmed == "" {
			return nil
		}
		return []domain.DocSection{{Heading: "(전체)", Content: trimmed}}
	}

	var sections []domain.DocSection
	for i, loc := range locs {
		heading := text[loc[0]:loc[1]]
		var body string
		if i+1 < len(locs) {
			body = text[loc[1]:locs[i+1][0]]
		} else {
			body = text[loc[1]:]
		}
		content := strings.TrimSpace(body)
		if len(content) < 30 {
			continue
		}
		sections = append(sections, domain.DocSection{Heading: heading, Content: content})
	}
	return sections
}

// ── 코드베이스 grep ──────────────────────────────────────────────────────────

var identRe = regexp.MustCompile(`[A-Za-z][A-Za-z0-9_]{3,}`)

func grepCodebase(content string) string {
	words := identRe.FindAllString(content, -1)
	seen := map[string]bool{}
	var terms []string
	for _, w := range words {
		lower := strings.ToLower(w)
		if !seen[lower] && !isStopWord(lower) {
			seen[lower] = true
			terms = append(terms, w)
		}
		if len(terms) >= 5 {
			break
		}
	}
	if len(terms) == 0 {
		return ""
	}

	pattern := strings.Join(terms, "|")
	out, err := exec.Command("grep", "-rl",
		"--include=*.go", "--include=*.py", "--include=*.ts", "--include=*.tsx",
		"-E", pattern, ".").Output()
	if err != nil || len(out) == 0 {
		return ""
	}

	files := strings.Split(strings.TrimSpace(string(out)), "\n")
	if len(files) > 3 {
		files = files[:3]
	}

	var buf bytes.Buffer
	for _, f := range files {
		if f == "" {
			continue
		}
		snippet := readFirstLines(f, 40)
		if snippet != "" {
			fmt.Fprintf(&buf, "// %s:\n%s\n\n", f, snippet)
		}
	}
	return buf.String()
}

func readFirstLines(path string, n int) string {
	f, err := os.Open(path)
	if err != nil {
		return ""
	}
	defer f.Close()

	var lines []string
	sc := bufio.NewScanner(f)
	for sc.Scan() && len(lines) < n {
		lines = append(lines, sc.Text())
	}
	return strings.Join(lines, "\n")
}

var stopWords = map[string]bool{
	"this": true, "that": true, "with": true, "from": true, "have": true,
	"will": true, "when": true, "where": true, "which": true, "been": true,
	"were": true, "they": true, "their": true, "what": true, "should": true,
}

func isStopWord(w string) bool { return stopWords[w] }
