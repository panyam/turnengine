# TurnEngine - Go + WebAssembly Architecture

## Overview
Use Go for all TurnEngine game logic, compile to both native server binary and WebAssembly for browsers. This gives you maximum code reuse and ensures identical behavior between client and server.

## Code Reuse Strategy

### Shared Core (~80% reuse)
Write once in Go, runs everywhere:
- **Game state management**
- **Rule validation**
- **Combat calculations**  
- **AI algorithms**
- **Turn processing**
- **Victory conditions**

### Platform-Specific (~20%)
- **Server**: Database, networking, authentication
- **Client**: UI rendering, input handling, local storage

## Project Structure

```
turnengine/
├── cmd/
│   ├── server/           # Go server binary
│   └── wasm/            # WASM build target
├── internal/
│   ├── turnengine/      # Shared game logic (CORE)
│   ├── server/          # Server-only code  
│   └── wasm/            # WASM-only bindings
├── web/
│   ├── static/          # HTML, CSS, assets
│   ├── wasm/            # Generated WASM files
│   └── js/              # JavaScript glue code
├── games/
│   ├── weewar/          # WeeWar game definitions
│   └── neptunespride/   # Neptune's Pride definitions
└── pkg/                 # Public Go packages
```

## Core Go Engine

### Game State (Shared)
```go
package turnengine

import (
    "encoding/json"
    "time"
)

type GameState struct {
    ID          string            `json:"id"`
    Version     int              `json:"version"`
    GameType    string           `json:"gameType"`
    CurrentTurn int              `json:"currentTurn"`
    Phase       string           `json:"phase"`
    Players     []Player         `json:"players"`
    Entities    []Entity         `json:"entities"`
    Board       Board            `json:"board"`
    Rules       GameRules        `json:"rules"`
    Events      []Event          `json:"events"`
    CreatedAt   time.Time        `json:"createdAt"`
    UpdatedAt   time.Time        `json:"updatedAt"`
}

func (gs *GameState) ProcessCommand(cmd Command) (*GameState, error) {
    // Validate command
    if err := gs.ValidateCommand(cmd); err != nil {
        return nil, err
    }
    
    // Apply command
    newState := gs.Clone()
    if err := newState.ApplyCommand(cmd); err != nil {
        return nil, err
    }
    
    // Update version and timestamp
    newState.Version++
    newState.UpdatedAt = time.Now()
    
    return newState, nil
}

func (gs *GameState) ValidateCommand(cmd Command) error {
    // Same validation logic on client and server
    switch cmd.Type {
    case "move_unit":
        return gs.validateMoveUnit(cmd)
    case "attack_unit":
        return gs.validateAttack(cmd)
    default:
        return fmt.Errorf("unknown command type: %s", cmd.Type)
    }
}
```

### Entity Component System
```go
type Entity struct {
    ID         string                 `json:"id"`
    Components map[string]interface{} `json:"components"`
}

type Component interface {
    Type() string
}

type PositionComponent struct {
    X, Y, Z int `json:"x,y,z"`
}

func (p PositionComponent) Type() string { return "position" }

type HealthComponent struct {
    Current, Max int `json:"current,max"`
}

func (h HealthComponent) Type() string { return "health" }

// System interface
type System interface {
    Update(entities []Entity, rules GameRules) error
}

type MovementSystem struct{}

func (ms MovementSystem) Update(entities []Entity, rules GameRules) error {
    for _, entity := range entities {
        if pos, hasPos := entity.GetComponent("position"); hasPos {
            if movement, hasMove := entity.GetComponent("movement"); hasMove {
                // Process movement logic
            }
        }
    }
    return nil
}
```

## WebAssembly Integration

### WASM Exports (Go → JavaScript)
```go
// cmd/wasm/main.go
package main

import (
    "encoding/json"
    "syscall/js"
    "strategy-game-engine/internal/gameengine"
)

func main() {
    // Export functions to JavaScript
    js.Global().Set("gameEngine", js.ValueOf(map[string]interface{}{
        "createGame":     js.FuncOf(createGame),
        "processCommand": js.FuncOf(processCommand),
        "validateMove":   js.FuncOf(validateMove),
        "runAI":         js.FuncOf(runAI),
    }))
    
    // Keep the program running
    select {}
}

func createGame(this js.Value, args []js.Value) interface{} {
    gameType := args[0].String()
    configJSON := args[1].String()
    
    var config turnengine.GameConfig
    json.Unmarshal([]byte(configJSON), &config)
    
    game := turnengine.NewGame(gameType, config)
    gameJSON, _ := json.Marshal(game)
    
    return js.ValueOf(string(gameJSON))
}

func processCommand(this js.Value, args []js.Value) interface{} {
    gameStateJSON := args[0].String()
    commandJSON := args[1].String()
    
    var gameState turnengine.GameState
    var command turnengine.Command
    
    json.Unmarshal([]byte(gameStateJSON), &gameState)
    json.Unmarshal([]byte(commandJSON), &command)
    
    newState, err := gameState.ProcessCommand(command)
    if err != nil {
        return js.ValueOf(map[string]interface{}{
            "error": err.Error(),
        })
    }
    
    resultJSON, _ := json.Marshal(newState)
    return js.ValueOf(string(resultJSON))
}
```

### JavaScript Integration
```javascript
// web/js/game-engine.js
class GameEngine {
    constructor() {
        this.wasmReady = false;
        this.loadWASM();
    }
    
    async loadWASM() {
        const go = new Go();
        const result = await WebAssembly.instantiateStreaming(
            fetch("/wasm/game-engine.wasm"), 
            go.importObject
        );
        go.run(result.instance);
        this.wasmReady = true;
    }
    
    createGame(gameType, config) {
        if (!this.wasmReady) throw new Error("WASM not ready");
        return JSON.parse(gameEngine.createGame(gameType, JSON.stringify(config)));
    }
    
    processCommand(gameState, command) {
        if (!this.wasmReady) throw new Error("WASM not ready");
        const result = gameEngine.processCommand(
            JSON.stringify(gameState), 
            JSON.stringify(command)
        );
        return JSON.parse(result);
    }
    
    // Local storage integration
    async saveGame(gameState) {
        const db = await this.getDB();
        await db.put('games', gameState);
    }
    
    async loadGame(gameId) {
        const db = await this.getDB();
        return await db.get('games', gameId);
    }
}
```

## Build Process

### Makefile
```makefile
# Build server binary
.PHONY: server
server:
	go build -o bin/server cmd/server/main.go

# Build WASM
.PHONY: wasm
wasm:
	GOOS=js GOARCH=wasm go build -o web/wasm/game-engine.wasm cmd/wasm/main.go
	cp "$(shell go env GOROOT)/misc/wasm/wasm_exec.js" web/js/

# Build with TinyGo for smaller WASM (optional)
.PHONY: wasm-tiny
wasm-tiny:
	tinygo build -o web/wasm/game-engine.wasm -target wasm cmd/wasm/main.go

# Development server
.PHONY: dev
dev: wasm
	go run cmd/server/main.go

# Run tests
.PHONY: test
test:
	go test ./...

# Build everything
.PHONY: build
build: server wasm
```

### Go Module Setup
```go
// go.mod
module turnengine

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/golang-jwt/jwt/v5 v5.0.0
    github.com/lib/pq v1.10.9
)
```

## Performance Considerations

### WASM Optimizations
- **Use TinyGo** for smaller bundles (~100KB vs 2MB+)
- **Minimize JS-Go calls** - batch operations
- **Stream large data** instead of copying
- **Pool objects** to reduce GC pressure

### Memory Management
```go
// Use object pools for frequently created objects
var commandPool = sync.Pool{
    New: func() interface{} {
        return &Command{}
    },
}

func processCommand(data []byte) error {
    cmd := commandPool.Get().(*Command)
    defer commandPool.Put(cmd)
    
    // Process command...
}
```

## Development Workflow

### Local Development
```bash
# Terminal 1: Build WASM on changes
make wasm && echo "WASM rebuilt"

# Terminal 2: Run development server  
make dev

# Terminal 3: Run tests
make test
```

### Testing Strategy
```go
// Test the same logic on both server and WASM
func TestGameLogic(t *testing.T) {
    game := turnengine.NewGame("weewar", defaultConfig)
    
    cmd := turnengine.Command{
        Type: "move_unit",
        Data: map[string]interface{}{
            "unitId": "unit1",
            "from": map[string]int{"x": 0, "y": 0},
            "to": map[string]int{"x": 1, "y": 0},
        },
    }
    
    newState, err := game.ProcessCommand(cmd)
    assert.NoError(t, err)
    assert.Equal(t, 2, newState.Version)
}
```

## Benefits of This Approach

### Code Reuse
- **~80% shared logic** between client and server
- **Identical validation** prevents client-server mismatches  
- **Same AI algorithms** on both platforms
- **Single test suite** for core game logic

### Performance
- **Native speed** on server
- **Near-native speed** in browser via WASM
- **No JSON serialization** for local operations
- **Efficient memory usage** with Go's GC

### Development Speed
- **Write once, run everywhere** for game logic
- **Type safety** across entire stack
- **Single language** for backend developers
- **Easier debugging** with shared code paths

### Deployment
- **Single binary** for server deployment
- **Static assets** for client (WASM + HTML)
- **No Node.js dependency** on server
- **Efficient Docker images** with Go binaries

This architecture gives you the best of both worlds: local-first performance with server-authoritative validation, all while maximizing code reuse between client and server.
