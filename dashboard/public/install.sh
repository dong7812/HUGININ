#!/usr/bin/env bash
set -euo pipefail

BASE_URL="https://huginin.com/cli"
INSTALL_DIR="/usr/local/bin"
BINARY="huginin"

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

if [ -w "$INSTALL_DIR" ]; then
  mv "$TMP/$BINARY" "$INSTALL_DIR/$BINARY"
else
  sudo mv "$TMP/$BINARY" "$INSTALL_DIR/$BINARY"
fi

chmod +x "$INSTALL_DIR/$BINARY"

echo "[huginin] 설치 완료 → $INSTALL_DIR/$BINARY"
"$INSTALL_DIR/$BINARY" --version
