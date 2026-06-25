# HUGININ Multi-LLM 지원 계획

현재 HUGININ은 Claude Code 전용으로 `~/.claude/projects/*.jsonl`에서 세션을 읽는다.
이 문서는 Gemini CLI · Codex CLI · Cursor를 동일한 수집 파이프라인에 연결하는 방법을 정리한다.

---

## 현재 구조 (Claude Code 전용)

```bash
# hooks/post-commit 현재 동작
CLAUDE_LOG_DIR="$HOME/.claude/projects"

# → 최근 수정된 .jsonl 파일을 읽어 prompt/response 추출
# → huginin __collect 로 서버 전송
```

확장 전략: **세션 감지 레이어**만 도구별로 교체, 수집·전송 로직(`huginin __collect`)은 그대로 재사용.

---

## 도구별 비교

| 도구 | 세션 파일 | MCP 지원 | git hook 감지 | 수집 난이도 |
|------|----------|---------|--------------|-----------|
| Claude Code | `~/.claude/projects/*.jsonl` (명확) | ✅ | 직접 읽기 | 완료 |
| Gemini CLI | `~/.gemini/` (구조 유사) | ✅ | 파일 감지 | 보통 |
| Codex CLI | `~/.codex/` (비영속화 가능성) | ✅ | 프로세스 감지 | 어려움 |
| Cursor | LevelDB/SQLite (비공개) | ❌ (Extension API) | 프로세스 감지만 | 매우 어려움 |

---

## 1. Gemini CLI

### 파일 구조

```
~/.gemini/
  settings.json          # 전역 설정 (모델, MCP 서버 등)
  GEMINI.md              # 전역 system prompt (CLAUDE.md 등가)
  tmp/                   # 임시 세션 데이터 (추정)
  sessions/              # 세션별 JSON (추정, 실제 경로 확인 필요)
```

### 실제 경로 확인 커맨드 (설치 후)

```bash
ls -la ~/.gemini/
find ~/.gemini -name "*.json" -not -name "settings.json" | head -20
find ~/.gemini -name "*.jsonl" | head -10
# macOS 대체 경로
ls ~/Library/Application\ Support/gemini-cli/ 2>/dev/null
```

### MCP로 수집하는 방법 (권장)

Gemini CLI는 MCP를 완전 지원한다. HUGININ MCP 서버를 `~/.gemini/settings.json`에 등록하면
git hook 없이도 MCP `collect_event` 도구로 직접 수집 가능하다.

```json
// ~/.gemini/settings.json
{
  "mcpServers": {
    "huginin": {
      "url": "https://api.huginin.com/mcp",
      "type": "sse",
      "headers": { "Authorization": "Bearer <service-token>" }
    }
  }
}
```

Gemini CLI가 작업 완료 후 자동으로 `collect_event`를 호출하도록
`GEMINI.md`에 지시문을 추가한다:

```markdown
<!-- ~/.gemini/GEMINI.md -->
## HUGININ 수집 규칙
git commit 직전 또는 직후에 huginin MCP의 collect_event 도구를 호출해
현재 세션의 핵심 결정과 AI 기여 내용을 기록한다.
```

### git hook 감지 로직 (MCP 불가 환경 fallback)

`hooks/post-commit`에 아래 블록을 추가한다:

```bash
# ── Gemini CLI 세션 감지 ──────────────────────────────────────
GEMINI_DIR="$HOME/.gemini"

detect_gemini_session() {
  # 1) 프로세스 실행 중
  pgrep -f "^gemini" > /dev/null 2>&1 && return 0
  # 2) 최근 30분 내 수정된 세션 파일 존재
  find "$GEMINI_DIR" \( -name "*.json" -o -name "*.jsonl" \) \
    -not -name "settings.json" \
    -newer "$HUGININ_DIR/session.lock" \
    2>/dev/null | grep -q . && return 0
  return 1
}

extract_gemini_session() {
  # 가장 최근 세션 파일에서 마지막 user/model 메시지 추출
  local latest
  latest=$(find "$GEMINI_DIR" \( -name "*.json" -o -name "*.jsonl" \) \
    -not -name "settings.json" -newer "$HUGININ_DIR/session.lock" \
    2>/dev/null | xargs ls -t 2>/dev/null | head -1)

  [ -z "$latest" ] && return

  python3 - "$latest" <<'PY'
import json, sys
path = sys.argv[1]
try:
    with open(path) as f:
        # jsonl 형식 시도
        lines = [json.loads(l) for l in f if l.strip()]
except Exception:
    try:
        with open(path) as f:
            lines = json.load(f)
            if isinstance(lines, dict): lines = [lines]
    except Exception:
        sys.exit(0)

prompt = response = ""
for msg in reversed(lines):
    role = msg.get("role", msg.get("type", ""))
    content = msg.get("content", msg.get("text", ""))
    if isinstance(content, list):
        content = " ".join(x.get("text","") for x in content if isinstance(x,dict))
    if not response and role in ("model", "assistant"):
        response = str(content)[:2000]
    if not prompt and role in ("user", "human"):
        prompt = str(content)[:2000]
    if prompt and response:
        break

print(f"GEMINI_PROMPT={prompt[:1000]}")
print(f"GEMINI_RESPONSE={response[:1000]}")
PY
}

if detect_gemini_session; then
  eval "$(extract_gemini_session)"
  PROMPT="${GEMINI_PROMPT:-[gemini session detected, no content]}"
  RESPONSE="${GEMINI_RESPONSE:-}"
  AI_TOOL="gemini-cli"
fi
# ─────────────────────────────────────────────────────────────
```

---

## 2. OpenAI Codex CLI

### 파일 구조

```
~/.codex/
  config.json            # API 키, 모델, 승인 모드, MCP 서버 설정
  instructions.md        # 전역 system prompt (CLAUDE.md 등가)
  history/               # 세션 히스토리 (비영속화 가능성 높음 — 확인 필요)
```

### 실제 경로 확인 커맨드 (설치 후)

```bash
ls -la ~/.codex/
find ~/.codex -type f | sort
cat ~/.codex/config.json
# 세션 파일 비영속화 확인: codex 실행 후
find ~/.codex -newer /tmp/test_marker -type f
```

### MCP로 수집하는 방법 (권장)

Codex CLI도 MCP를 지원한다. `~/.codex/config.json`에 추가:

```json
{
  "model": "codex-mini-latest",
  "approvalMode": "suggest",
  "mcpServers": {
    "huginin": {
      "command": "npx",
      "args": ["-y", "@huginin/mcp-proxy"],
      "env": {
        "HUGININ_URL": "https://api.huginin.com/mcp",
        "HUGININ_TOKEN": "<service-token>"
      }
    }
  }
}
```

`instructions.md`에 수집 지시문 추가:

```markdown
<!-- ~/.codex/instructions.md -->
## HUGININ
작업 완료 후 huginin MCP의 collect_event를 호출해 결정 맥락을 기록한다.
```

### git hook 감지 로직

Codex CLI는 세션을 파일로 저장하지 않을 가능성이 높다.
프로세스 감지 + 환경변수 감지를 조합한다:

```bash
# ── Codex CLI 세션 감지 ───────────────────────────────────────
detect_codex_session() {
  # 1) 프로세스 감지
  pgrep -f "codex" > /dev/null 2>&1 && return 0
  # 2) 환경변수 (Codex가 자식 프로세스에 주입할 경우)
  [ -n "${CODEX_SESSION_ID:-}" ] && return 0
  [ -n "${OPENAI_CODEX_SESSION:-}" ] && return 0
  # 3) ~/.codex/ 내 최근 수정 파일 (설정 외)
  find "$HOME/.codex" -newer "$HUGININ_DIR/session.lock" \
    -not -name "config.json" \
    2>/dev/null | grep -q . && return 0
  return 1
}

if detect_codex_session && [ -z "$PROMPT" ]; then
  PROMPT="[codex session detected — MCP 수집 권장]"
  RESPONSE="[codex session file not found — add huginin to ~/.codex/config.json mcpServers]"
  AI_TOOL="codex-cli"
fi
# ─────────────────────────────────────────────────────────────
```

### 한계 및 권고

- **세션 파일 비영속화**: Codex CLI는 기본적으로 대화를 파일로 저장하지 않을 수 있다.
  MCP 방식이 유일한 신뢰할 수 있는 수집 경로다.
- **OpenAI API `store: true`**: Codex가 API 레벨에서 대화를 저장하는 경우
  OpenAI API를 통해 별도 polling 가능하나 API 키 접근 필요 — 구현 복잡도 높음.
- **결론**: Codex CLI는 MCP 통합을 1순위로, git hook 감지는 "도구 사용 여부만" 기록하는 수준으로 제한.

---

## 3. Cursor

### 파일 구조

Cursor는 IDE(Electron 기반 VS Code fork)다. CLI가 아니어서 접근 방식이 근본적으로 다르다.

```
# macOS
~/Library/Application Support/Cursor/
  User/
    globalStorage/         # 확장 기능 데이터 (LevelDB)
    workspaceStorage/      # 워크스페이스별 데이터
    History/               # 파일 편집 히스토리

~/.cursor/                 # cursor CLI 설정
.cursor/
  rules/                   # 프로젝트 AI 규칙 (.mdc 파일)
```

**핵심 문제**: AI 대화 기록이 LevelDB(바이너리)에 저장되고, 외부 API가 없다.

### 접근법 A: `.cursor/rules/` 규칙 주입 (현재 최선)

Cursor가 직접 세션 파일을 `.huginin/` 폴더에 생성하도록 규칙으로 지시한다.

```markdown
<!-- .cursor/rules/huginin.mdc -->
---
description: HUGININ AI 협업 기록
globs: ["**/*"]
alwaysApply: true
---

## HUGININ 수집 규칙

git commit 전 또는 후에 아래 파일을 생성/갱신한다:
`.huginin/cursor-session-latest.json`

```json
{
  "tool": "cursor",
  "timestamp": "<ISO8601>",
  "summary": "<이번 작업에서 AI와 함께 결정한 핵심 내용 1-3줄>",
  "problem_solved": "<해결한 문제>",
  "ai_role": "<AI가 한 것 vs 내가 한 것>",
  "tradeoffs": "<선택하지 않은 대안>",
  "files_changed": ["<수정된 파일 목록>"]
}
```
```

### 접근법 B: git hook에서 Cursor 프로세스 감지 + 규칙 파일 수집

```bash
# ── Cursor 세션 감지 ──────────────────────────────────────────
CURSOR_SESSION_FILE="$HUGININ_DIR/cursor-session-latest.json"

detect_cursor_session() {
  # 프로세스 감지
  pgrep -f "Cursor" > /dev/null 2>&1 && return 0
  # .cursor/rules/ 폴더 존재 (Cursor 프로젝트)
  [ -d ".cursor/rules" ] && return 0
  return 1
}

collect_cursor_session() {
  if ! detect_cursor_session; then return; fi

  if [ -f "$CURSOR_SESSION_FILE" ]; then
    # 규칙 주입으로 Cursor가 생성한 파일 읽기
    PROMPT=$(python3 -c "
import json, sys
d = json.load(open('$CURSOR_SESSION_FILE'))
print(d.get('summary', d.get('problem_solved', '')))
" 2>/dev/null || echo "[cursor session file found]")
    RESPONSE=$(python3 -c "
import json, sys
d = json.load(open('$CURSOR_SESSION_FILE'))
print(d.get('ai_role', ''))
" 2>/dev/null || true)
    AI_TOOL="cursor"
    # 수집 후 커밋 해시로 아카이브
    mv "$CURSOR_SESSION_FILE" "$HUGININ_DIR/cursor-session-$COMMIT_HASH.json" 2>/dev/null || true
  else
    # 세션 파일 없음 — Cursor 활성화만 기록
    PROMPT="[cursor active — .cursor/rules/huginin.mdc 설치 필요]"
    RESPONSE=""
    AI_TOOL="cursor"
  fi
}

collect_cursor_session
# ─────────────────────────────────────────────────────────────
```

### 접근법 C: Cursor Extension (장기, 가장 완전한 수집)

Cursor는 VS Code Extension API를 그대로 사용한다.
`vscode.git` API로 commit 이벤트를 감지하고, Cursor 내부 API(비공개)로 대화를 읽는다.

```typescript
// packages/cursor-extension/src/extension.ts
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const gitExt = vscode.extensions.getExtension('vscode.git');
  if (!gitExt) return;

  const git = gitExt.exports.getAPI(1);
  git.onDidOpenRepository((repo: any) => {
    repo.state.onDidChange(async () => {
      const commit = repo.state.HEAD?.commit;
      if (!commit) return;

      // Cursor 내부 AI 대화는 현재 비공개 API
      // 현실적으로는 메타데이터 + rules 파일 생성 내용만 수집
      const token = vscode.workspace.getConfiguration('huginin').get<string>('serviceToken');
      if (!token) return;

      await fetch('https://api.huginin.com/ingest/cursor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          tool: 'cursor',
          commit,
          workspace: repo.rootUri.fsPath,
          timestamp: new Date().toISOString(),
        }),
      });
    });
  });
}
```

### 한계

- **AI 대화 API 비공개**: Cursor AI 대화 내용에 외부에서 접근하는 공식 API가 없다.
  실질적으로 `.cursor/rules/` 를 통한 "Cursor에게 요약을 써달라고 부탁하는" 간접 방식이 현재 최선.
- **Background Agent**: Cursor Background Agent 결과도 외부 접근 불가.
- **LevelDB 파싱**: 가능은 하나 Cursor 업데이트마다 스키마가 바뀔 위험 — 유지보수 부담 과다.

---

## hooks/post-commit 통합 방법

현재 `hooks/post-commit`의 Claude Code 전용 블록 뒤에 아래를 추가한다.
`AI_TOOL` 변수로 어떤 도구를 감지했는지 서버에 함께 전송한다.

```bash
# ── 도구 감지 우선순위 ─────────────────────────────────────────
# 1) Claude Code (기존, 그대로 유지)
AI_TOOL="claude-code"

# 2) Gemini CLI (Claude Code 세션 미감지 시)
if [ -z "$PROMPT" ] || [ "$PROMPT" = "[git commit] $COMMIT_MSG" ]; then
  # ... detect_gemini_session / extract_gemini_session 블록
fi

# 3) Codex CLI
if [ -z "$PROMPT" ] || [ "$PROMPT" = "[git commit] $COMMIT_MSG" ]; then
  # ... detect_codex_session 블록
fi

# 4) Cursor
if [ -z "$PROMPT" ] || [ "$PROMPT" = "[git commit] $COMMIT_MSG" ]; then
  # ... collect_cursor_session 블록
fi
# ─────────────────────────────────────────────────────────────

# __collect 호출에 --tool 플래그 추가
(huginin __collect \
  --workspace "$WORKSPACE_ID" \
  --project   "$PROJECT_ID" \
  --commit    "$ORIG_HASH" \
  --prompt    "$PROMPT" \
  --response  "$RESPONSE" \
  --diff      "$DIFF" \
  --tool      "${AI_TOOL:-unknown}" \        # ← 추가
  2>>"$HUGININ_DIR/collect.log" || true) &
```

서버 스키마에도 `tool` 필드를 추가해야 한다:

```python
# server/domain/entities/event.py
@dataclass
class DecisionEvent:
    ...
    tool: str = "claude-code"   # claude-code | gemini-cli | codex-cli | cursor | unknown
```

---

## 구현 우선순위

### Phase 2 — 즉시 착수 가능

| 순서 | 작업 | 이유 |
|------|------|------|
| 1 | Hook 추상화 + `tool` 필드 추가 | 나머지 모든 작업의 기반 |
| 2 | Gemini CLI MCP 설정 문서화 | 설치 즉시 수집 가능, 코드 변경 최소 |
| 3 | Codex CLI MCP 설정 문서화 | 동일 이유 |
| 4 | Cursor `.cursor/rules/huginin.mdc` | 파일 하나로 즉시 적용 가능 |

### Phase 3 — 데이터 축적 후

| 순서 | 작업 |
|------|------|
| 5 | Gemini CLI git hook 세션 파서 (실제 파일 경로 확인 후) |
| 6 | 대시보드 Tool 필터 + 도구별 AI 기여도 비교 뷰 |
| 7 | Cursor VS Code Extension 배포 |

---

## 확인이 필요한 것 (실제 설치 후 검증)

```bash
# Gemini CLI 설치 후 실제 세션 파일 경로 확인
gem_session=$(ls -t ~/.gemini/**/*.json 2>/dev/null | head -1)
echo "Gemini session file: $gem_session"

# Codex CLI 설치 후 세션 파일 존재 여부 확인
codex_files=$(find ~/.codex -type f -not -name "config.json" 2>/dev/null)
echo "Codex files: $codex_files"

# Cursor 대화 기록 위치 (macOS)
ls ~/Library/Application\ Support/Cursor/User/globalStorage/
```

이 결과를 바탕으로 실제 파서 구현체를 작성한다.
