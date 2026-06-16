#!/usr/bin/env bash
set -euo pipefail

REPO="https://github.com/dong7812/HUGININ"
INSTALL_DIR="/usr/local/bin"
BINARY="huginin"

echo "[huginin] 설치를 시작합니다..."

# OS / 아키텍처 감지
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)
case "$ARCH" in
  x86_64)  ARCH="amd64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *)
    echo "[huginin] 지원하지 않는 아키텍처: $ARCH"
    exit 1
    ;;
esac

# GitHub Releases에서 최신 버전 확인
LATEST=$(curl -sSf "https://api.github.com/repos/dong7812/HUGININ/releases/latest" \
  | grep '"tag_name"' | head -1 | sed 's/.*"tag_name": "\(.*\)".*/\1/')

if [ -z "$LATEST" ]; then
  echo "[huginin] 릴리즈 버전을 찾을 수 없습니다."
  echo "  → 소스에서 직접 빌드하려면: https://github.com/dong7812/HUGININ#install"
  exit 1
fi

TARBALL="${BINARY}_${OS}_${ARCH}.tar.gz"
DOWNLOAD_URL="${REPO}/releases/download/${LATEST}/${TARBALL}"

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

echo "[huginin] $LATEST 다운로드 중 ($OS/$ARCH)..."
curl -sSfL "$DOWNLOAD_URL" -o "$TMP/$TARBALL"
tar -xzf "$TMP/$TARBALL" -C "$TMP"

# /usr/local/bin 쓰기 권한 확인
if [ -w "$INSTALL_DIR" ]; then
  mv "$TMP/$BINARY" "$INSTALL_DIR/$BINARY"
else
  sudo mv "$TMP/$BINARY" "$INSTALL_DIR/$BINARY"
fi

chmod +x "$INSTALL_DIR/$BINARY"

echo "[huginin] 설치 완료 → $INSTALL_DIR/$BINARY"
huginin --version
