# Build server binary
.PHONY: server
server:
	go build -o bin/server cmd/server/main.go

# Build WASM
.PHONY: wasm
wasm:
	GOOS=js GOARCH=wasm go build -o web/wasm/game-engine.wasm cmd/wasm/main.go
	cp "$(shell go env GOROOT)/misc/wasm/wasm_exec.js" web/js/

# Development server
.PHONY: dev
dev: wasm
	go run cmd/server/main.go

# Run tests
.PHONY: test
test:
	go test ./...

