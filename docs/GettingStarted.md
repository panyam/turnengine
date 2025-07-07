# TurnEngine - Getting Started Guide

## Quick Start

### 1. Set Up Go Development Environment

```bash
# Create project structure
mkdir turnengine
cd turnengine

# Initialize Go module
go mod init github.com/panyam/turnengine

# Create project structure
mkdir -p cmd/{server,wasm}
mkdir -p internal/{gameengine,server,wasm}
mkdir -p web/{static,wasm,js}
mkdir -p games/{weewar,neptunespride}
mkdir -p pkg
```

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
├── pkg/                 # Public Go packages
├── go.mod
├── go.sum
└── Makefile
```

### 2. Core Engine Package Structure

```bash
# Set up core game engine
cd internal/turnengine

# Create core Go files
touch entity.go component.go system.go gamestate.go rules.go
```

**Makefile setup**:
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

# Development server
.PHONY: dev
dev: wasm
	go run cmd/server/main.go

# Run tests
.PHONY: test
test:
	go test ./...
```

### 3. First Implementation: Basic ECS in Go

**internal/turnengine/component.go**:
```go
package turnengine

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

type MovementComponent struct {
	Range     int `json:"range"`
	MovesLeft int `json:"movesLeft"`
}

func (m MovementComponent) Type() string { return "movement" }
```

**internal/turnengine/entity.go**:
```go
package turnengine

import (
	"encoding/json"
	"fmt"
)

type Entity struct {
	ID         string                 `json:"id"`
	Components map[string]interface{} `json:"components"`
}

func NewEntity(id string) *Entity {
	if id == "" {
		id = generateID() // implement this helper
	}
	return &Entity{
		ID:         id,
		Components: make(map[string]interface{}),
	}
}

func (e *Entity) AddComponent(comp Component) {
	data, _ := json.Marshal(comp)
	var compData map[string]interface{}
	json.Unmarshal(data, &compData)
	e.Components[comp.Type()] = compData
}

func (e *Entity) GetComponent(compType string) (map[string]interface{}, bool) {
	comp, exists := e.Components[compType]
	if !exists {
		return nil, false
	}
	return comp.(map[string]interface{}), true
}

func (e *Entity) HasComponent(compType string) bool {
	_, exists := e.Components[compType]
	return exists
}

func (e *Entity) RemoveComponent(compType string) {
	delete(e.Components, compType)
}
```

### 4. Basic Test Setup

**internal/turnengine/entity_test.go**:
```go
package turnengine

import (
	"testing"
)

func TestEntityCreation(t *testing.T) {
	entity1 := NewEntity("")
	entity2 := NewEntity("")
	
	if entity1.ID == entity2.ID {
		t.Error("Entity IDs should be unique")
	}
}

func TestComponentManagement(t *testing.T) {
	entity := NewEntity("test-entity")
	position := PositionComponent{X: 5, Y: 3, Z: 0}
	
	entity.AddComponent(position)
	
	if !entity.HasComponent("position") {
		t.Error("Entity should have position component")
	}
	
	comp, exists := entity.GetComponent("position")
	if !exists {
		t.Error("Should be able to retrieve position component")
	}
	
	if comp["x"].(float64) != 5 || comp["y"].(float64) != 3 {
		t.Error("Component data should match")
	}
}
```

## Development Workflow

### Daily Development Process

1. **Start with tests** - Write failing tests for new features
2. **Implement incrementally** - Small, focused changes
3. **Validate locally** - Test each component in isolation  
4. **Integration test** - Ensure systems work together
5. **Commit frequently** - Small, atomic commits

### Week 1 Specific Tasks

**Day 1-2: Project Setup**
```bash
# Set up the basic structure above
# Install development dependencies
npm install -D typescript vitest @types/node

# Create tsconfig.json for engine
cat > packages/engine/tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
EOF
```

**Day 3-4: Core ECS Implementation**
- Implement Entity, Component, System classes
- Write comprehensive tests
- Create basic component types (Position, Health, Movement)

**Day 5-7: System Execution**
- Build system registry and execution engine
- Implement MovementSystem as first example
- Add query system for entities with specific components

### Key Files to Create First

1. **packages/engine/src/ecs/System.ts** - System base class and registry
2. **packages/engine/src/ecs/World.ts** - Manages all entities and systems
3. **packages/engine/src/state/GameState.ts** - Top-level game state structure
4. **packages/engine/src/rules/RuleEngine.ts** - Game rule configuration system

### Debugging Strategy

**Add extensive logging early**:
```typescript
// Create debug logger utility
export class Logger {
  static debug(system: string, message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${system}] ${message}`, data || '');
    }
  }
}
```

**Use type checking aggressively**:
```bash
# Add to package.json scripts
"type-check": "tsc --noEmit",
"type-check:watch": "tsc --noEmit --watch"
```

## Common Pitfalls to Avoid

### Architecture Mistakes
- **Don't couple UI to engine** - Keep all UI code separate
- **Avoid premature optimization** - Focus on correctness first
- **Don't hardcode game rules** - Keep everything configurable
- **Resist feature creep** - Stick to the roadmap phases

### Technical Gotchas
- **Browser storage limits** - Test with large game states early
- **Floating point precision** - Use integers for coordinates when possible
- **Memory leaks** - Clean up event listeners and references
- **Race conditions** - Test network scenarios thoroughly

### Development Process
- **Write tests first** - Especially for core engine components  
- **Small commits** - Easy to debug and revert
- **Document decisions** - Update markdown files as you learn
- **Measure performance** - Profile early and often

## Next Steps After Setup

1. **Validate the ECS works** - Create a simple test game with moving entities
2. **Add WeeWar rules** - Configure your first real game
3. **Build minimal UI** - Prove the engine works end-to-end
4. **Add persistence** - Local storage first, then server
5. **Iterate quickly** - Get feedback early and often

Remember: Start simple, prove the concept works, then add complexity incrementally. The goal is a working WeeWar clone in 9 weeks, not a perfect engine on day one.
