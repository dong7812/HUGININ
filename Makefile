CLI_DIR      = ./cli
BIN_NAME     = huginin
LOCAL_BIN    = $(HOME)/.local/bin
INSTALL      = $(LOCAL_BIN)/$(BIN_NAME)
DIST         = dist

# Homebrew bin이 있으면 거기 설치 (이미 PATH에 포함됨)
BREW_BIN     = /opt/homebrew/bin
ifneq ($(wildcard $(BREW_BIN)),)
  INSTALL = $(BREW_BIN)/$(BIN_NAME)
endif

.PHONY: build install uninstall cross clean

## 로컬 빌드 (현재 플랫폼)
build:
	cd $(CLI_DIR) && go build -ldflags="-s -w" -o $(BIN_NAME) .

## 빌드 후 설치: Homebrew bin 있으면 거기, 없으면 ~/.local/bin + PATH 자동 추가
install: build
	mkdir -p $(dir $(INSTALL))
	cp $(CLI_DIR)/$(BIN_NAME) $(INSTALL)
	@echo "✓ huginin installed → $(INSTALL)"
	@# ~/.local/bin 경로면 PATH 자동 등록
	@if echo "$(INSTALL)" | grep -q "$(LOCAL_BIN)"; then \
	  RC=""; \
	  case "$$(basename $${SHELL:-zsh})" in \
	    zsh)  RC="$$HOME/.zshrc" ;; \
	    bash) RC="$$HOME/.bashrc" ;; \
	  esac; \
	  if [ -n "$$RC" ] && ! grep -q '\.local/bin' "$$RC" 2>/dev/null; then \
	    echo 'export PATH="$$HOME/.local/bin:$$PATH"' >> "$$RC"; \
	    echo "  → PATH 추가됨: $$RC"; \
	  fi; \
	  echo "  → 현재 쉘에 바로 적용: source $$RC"; \
	fi
	@# 현재 디렉토리가 git 레포면 hook 자동 설치
	@if [ -d ".git" ]; then \
	  $(INSTALL) hook install . 2>/dev/null && echo "  → git hooks installed (.git/hooks/)" || true; \
	fi

## 제거
uninstall:
	rm -f $(INSTALL)
	@echo "✓ huginin removed"

## 크로스 컴파일 (GitHub Releases용)
cross:
	mkdir -p $(DIST)
	GOOS=darwin  GOARCH=arm64  go build -C $(CLI_DIR) -ldflags="-s -w" -o ../$(DIST)/huginin-darwin-arm64  .
	GOOS=darwin  GOARCH=amd64  go build -C $(CLI_DIR) -ldflags="-s -w" -o ../$(DIST)/huginin-darwin-amd64  .
	GOOS=linux   GOARCH=amd64  go build -C $(CLI_DIR) -ldflags="-s -w" -o ../$(DIST)/huginin-linux-amd64   .
	GOOS=windows GOARCH=amd64  go build -C $(CLI_DIR) -ldflags="-s -w" -o ../$(DIST)/huginin-windows-amd64.exe .
	@echo "✓ binaries in $(DIST)/"

clean:
	rm -f $(CLI_DIR)/$(BIN_NAME)
	rm -rf $(DIST)
