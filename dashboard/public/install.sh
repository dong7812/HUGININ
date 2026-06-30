#!/usr/bin/env bash
set -euo pipefail

BASE_URL="https://huginin.com/cli"
BINARY="huginin"

# 이미 설치된 위치 우선 재사용 — 없으면 쓰기 가능한 곳 선택
EXISTING=$(command -v huginin 2>/dev/null || true)
if [ -n "$EXISTING" ]; then
  INSTALL_DIR=$(dirname "$EXISTING")
elif [ -w "/opt/homebrew/bin" ]; then
  INSTALL_DIR="/opt/homebrew/bin"
elif [ -w "/usr/local/bin" ]; then
  INSTALL_DIR="/usr/local/bin"
else
  INSTALL_DIR="$HOME/.local/bin"
  mkdir -p "$INSTALL_DIR"
fi

# 언인스톨 모드
if [ "${1:-}" = "uninstall" ]; then
  TARGET="$INSTALL_DIR/$BINARY"
  if [ ! -f "$TARGET" ]; then
    echo "[huginin] 설치된 huginin을 찾을 수 없습니다."
    exit 0
  fi
  if [ -w "$TARGET" ]; then
    rm -f "$TARGET"
  else
    sudo rm -f "$TARGET"
  fi
  echo "[huginin] 삭제 완료 → $TARGET"
  echo "[huginin] 설정 파일(~/.huginin/)은 수동으로 삭제하세요."
  exit 0
fi

echo "[huginin] 설치를 시작합니다..."

# OS / 아키텍처 감지
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)
case "$ARCH" in
  x86_64)        ARCH="amd64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *)
    echo "[huginin] 지원하지 않는 아키텍처: $ARCH"
    exit 1 ;;
esac

case "$OS" in
  darwin|linux) ;;
  *)
    echo "[huginin] 지원하지 않는 OS: $OS"
    exit 1 ;;
esac

TARBALL="${BINARY}_${OS}_${ARCH}.tar.gz"
DOWNLOAD_URL="${BASE_URL}/${TARBALL}"

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

echo "[huginin] 다운로드 중 ($OS/$ARCH)..."
curl -sSfL "$DOWNLOAD_URL" -o "$TMP/$TARBALL"
tar -xzf "$TMP/$TARBALL" -C "$TMP"
chmod +x "$TMP/$BINARY"

# 기존 바이너리 제거 후 설치 (Gatekeeper 캐시 초기화)
if [ -w "$INSTALL_DIR" ] && { [ ! -f "$INSTALL_DIR/$BINARY" ] || [ -w "$INSTALL_DIR/$BINARY" ]; }; then
  rm -f "$INSTALL_DIR/$BINARY"
  mv "$TMP/$BINARY" "$INSTALL_DIR/$BINARY"
elif sudo -n true 2>/dev/null; then
  sudo rm -f "$INSTALL_DIR/$BINARY"
  sudo mv "$TMP/$BINARY" "$INSTALL_DIR/$BINARY"
else
  # sudo TTY 없음 — ~/.local/bin으로 fallback
  INSTALL_DIR="$HOME/.local/bin"
  mkdir -p "$INSTALL_DIR"
  rm -f "$INSTALL_DIR/$BINARY"
  mv "$TMP/$BINARY" "$INSTALL_DIR/$BINARY"
  echo "[huginin] ~/.local/bin에 설치됨. PATH에 없으면 추가하세요:"
  echo "  echo 'export PATH=\"\$HOME/.local/bin:\$PATH\"' >> ~/.zshrc && source ~/.zshrc"
fi

# macOS Gatekeeper 격리 속성 제거
if [ "$OS" = "darwin" ]; then
  xattr -d com.apple.quarantine "$INSTALL_DIR/$BINARY" 2>/dev/null || true
fi

echo "[huginin] 설치 완료 → $INSTALL_DIR/$BINARY"
"$INSTALL_DIR/$BINARY" --version
