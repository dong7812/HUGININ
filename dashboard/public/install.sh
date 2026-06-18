#!/usr/bin/env bash
set -euo pipefail

BASE_URL="https://huginin.com/cli"
BINARY="huginin"

# Homebrew prefix 우선 (Apple Silicon Mac)
if [ -d "/opt/homebrew/bin" ]; then
  INSTALL_DIR="/opt/homebrew/bin"
else
  INSTALL_DIR="/usr/local/bin"
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
if [ -w "$INSTALL_DIR" ]; then
  rm -f "$INSTALL_DIR/$BINARY"
  mv "$TMP/$BINARY" "$INSTALL_DIR/$BINARY"
else
  sudo rm -f "$INSTALL_DIR/$BINARY"
  sudo mv "$TMP/$BINARY" "$INSTALL_DIR/$BINARY"
fi

# macOS Gatekeeper 격리 속성 제거
if [ "$OS" = "darwin" ]; then
  xattr -d com.apple.quarantine "$INSTALL_DIR/$BINARY" 2>/dev/null || true
fi

echo "[huginin] 설치 완료 → $INSTALL_DIR/$BINARY"
"$INSTALL_DIR/$BINARY" --version
