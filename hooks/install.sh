#!/usr/bin/env bash
# HUGININ git hook 설치 스크립트
# 사용법: bash hooks/install.sh [git-repo-path]

set -euo pipefail

REPO_DIR="${1:-.}"
HOOK_DIR="$REPO_DIR/.git/hooks"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! -d "$HOOK_DIR" ]; then
  echo "Error: $REPO_DIR is not a git repository"
  exit 1
fi

install_hook() {
  local name="$1"
  local src="$SCRIPT_DIR/$name"
  local dst="$HOOK_DIR/$name"

  if [ ! -f "$src" ]; then
    echo "Warning: $src not found, skipping"
    return
  fi

  if [ -f "$dst" ] && [ ! -L "$dst" ]; then
    cp "$dst" "$dst.bak"
    echo "  Backed up existing $name → $name.bak"
  fi

  cp "$src" "$dst"
  chmod +x "$dst"
  echo "  ✓ Installed $name"
}

# ── CLI 설치 확인 ──────────────────────────────────────────────────
HUGININ_BIN="$(command -v huginin 2>/dev/null || true)"

if [ -z "$HUGININ_BIN" ]; then
  echo "huginin CLI not found — attempting build + install..."
  HUGININ_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
  if [ -f "$HUGININ_ROOT/Makefile" ] && [ -d "$HUGININ_ROOT/cli" ]; then
    make -C "$HUGININ_ROOT" install
    # Reload PATH so the shell finds the new binary
    export PATH="$HOME/.local/bin:$PATH"
    HUGININ_BIN="$(command -v huginin 2>/dev/null || true)"
  fi
fi

if [ -z "$HUGININ_BIN" ]; then
  echo "Warning: huginin binary not found and build failed."
  echo "  Fix: cd <huginin-repo> && make install"
  echo "  Then: export PATH=\"\$HOME/.local/bin:\$PATH\""
  echo ""
fi

# ── Hooks 설치 ────────────────────────────────────────────────────
echo "Installing HUGININ hooks into $HOOK_DIR"
install_hook post-commit
install_hook post-push

mkdir -p "$REPO_DIR/.huginin"
echo "  ✓ Created .huginin/"

if [ -n "$HUGININ_BIN" ]; then
  echo ""
  echo "  huginin found: $HUGININ_BIN"
fi

echo ""
echo "Next: huginin project link --workspace <id> --name <project-name>"
