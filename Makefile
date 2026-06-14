CLI_DIR   = ./cli
BIN_NAME  = huginin
INSTALL   = $(HOME)/.local/bin/$(BIN_NAME)
DIST      = dist

.PHONY: build install uninstall cross clean

## 로컬 빌드 (현재 플랫폼)
build:
	cd $(CLI_DIR) && go build -ldflags="-s -w" -o $(BIN_NAME) .

## 빌드 후 ~/.local/bin 에 설치 (sudo 불필요)
install: build
	mkdir -p $(dir $(INSTALL))
	cp $(CLI_DIR)/$(BIN_NAME) $(INSTALL)
	@echo "✓ huginin installed → $(INSTALL)"
	@echo "  PATH에 없으면: export PATH=\"\$$HOME/.local/bin:\$$PATH\""

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
