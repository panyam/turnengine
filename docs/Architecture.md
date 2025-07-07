# Technical Architecture

## Core Engine Components

### 1. Game State System
Universal representation that works across all game types:

```javascript
{
  "gameId": "uuid",
  "gameType": "weewar|neptunespride|chess", 
  "version": 42,
  "currentTurn": 15,
  "phase": "movement|combat|production",
  "timeConfig": {
    "type": "turn-based|real-time-slow",
    "turnLength": 300, // seconds for real-time games
    "maxTurnTime": 86400 // 24 hours max per turn
  },
  "players": [
    {
      "id": "player1",
      "name": "Alice",
      "team": 1,
      "status": "active|waiting|eliminated",
      "resources": { "credits": 100, "tech": 5 }
    }
  ],
  "entities": [...], // All game objects
  "board": {...}, // Grid/graph definition
  "rules": {...}, // Game-specific configuration
  "events": [...] // Action history for replay
}
```

### 2. Entity Component System (ECS)

**Components** (data only):
```javascript
// Position component
{ "type": "position", "x": 5, "y": 3, "z": 0 }

// Health component  
{ "type": "health", "current": 80, "max": 100 }

// Movement component
{ "type": "movement", "range": 3, "movesLeft": 2 }

// Combat component
{ "type": "combat", "attack": 15, "defense": 10 }
```

**Systems** (logic):
- `MovementSystem` - Handles unit movement validation and execution
- `CombatSystem` - Resolves battles between entities
- `ProductionSystem` - Manages resource generation and unit creation
- `VictorySystem` - Checks win/loss conditions
- `FogOfWarSystem` - Manages visibility calculations

### 3. Rule Engine Framework
Game-specific configurations that define behavior:

```javascript
// WeeWar configuration
{
  "gameType": "weewar",
  "boardType": "hex",
  "turnStructure": "sequential",
  "unitTypes": {
    "infantry": { "cost": 100, "movement": 3, "attack": 55, "defense": 70 },
    "tank": { "cost": 300, "movement": 2, "attack": 85, "defense": 55 }
  },
  "terrain": {
    "grass": { "defense": 100, "movement": 100 },
    "mountain": { "defense": 200, "movement": 50 }
  },
  "combatSystem": "deterministic",
  "fogOfWar": true,
  "victoryConditions": ["eliminateAll", "captureHQ"]
}

// Neptune's Pride configuration  
{
  "gameType": "neptunespride",
  "boardType": "graph",
  "turnStructure": "real-time-slow",
  "entityTypes": {
    "star": { "production": [1,5], "range": [1,10] },
    "fleet": { "ships": [1,1000], "speed": 1 }
  },
  "combatSystem": "auto-resolve",
  "diplomacy": true,
  "technology": true,
  "victoryConditions": ["starCount", "shipCount"]
}
```

### 4. Time Management System

**Discrete Turns** (WeeWar):
```javascript
{
  "currentPlayer": "player1",
  "turnNumber": 15,
  "phase": "movement", // movement → combat → production
  "deadline": null // no time pressure
}
```

**Continuous Time** (Neptune's Pride):
```javascript
{
  "gameTime": "2025-07-07T15:30:00Z",
  "scheduledEvents": [
    {
      "type": "fleet_arrival",
      "executeAt": "2025-07-07T18:30:00Z",
      "data": { "fleetId": "f123", "destination": "star456" }
    }
  ],
  "productionCycle": 480 // minutes between production
}
```

### 5. Command Processing
All actions represented as serializable commands:

```javascript
{
  "commandId": "uuid",
  "playerId": "player1", 
  "gameVersion": 42,
  "timestamp": "2025-07-07T15:30:00Z",
  "type": "move_unit",
  "data": {
    "unitId": "unit123",
    "from": {"x": 5, "y": 3},
    "to": {"x": 6, "y": 3},
    "path": [...]
  }
}
```

**Processing Pipeline**:
1. **Validate** - Check if command is legal
2. **Queue** - Add to pending commands for this turn/time
3. **Execute** - Apply changes to game state
4. **Broadcast** - Notify other players of changes
5. **Checkpoint** - Save state if needed

## API Design

### Core APIs
```
# Authentication
POST /auth/login
POST /auth/register
GET  /auth/profile

# Game Management  
POST /games                    # Create new game
GET  /games                    # List user's games
GET  /games/{id}              # Get game state
GET  /games/{id}/view/{player} # Get player's view (fog of war)

# Turn Management
POST /games/{id}/commands      # Submit command(s)
GET  /games/{id}/status       # Check turn status
GET  /games/{id}/events       # Get recent events

# Persistence
GET  /games/{id}/checkpoint   # Get latest checkpoint
POST /games/{id}/checkpoint   # Save checkpoint

# Spectator/Replay
GET  /games/{id}/spectate     # Full game view
GET  /games/{id}/replay       # Turn history

# Premium AI
POST /ai/move                 # Request AI move (premium)
GET  /ai/personalities        # Available AI types
```

## Local-First Architecture

### Client Responsibilities
- **Game Logic** - All rule validation and state updates
- **AI Execution** - Local AI for single player
- **State Management** - Keep game state in IndexedDB
- **Conflict Resolution** - Handle version conflicts
- **Offline Play** - Full functionality without server

### Server Responsibilities  
- **Persistence** - Store game checkpoints and turn history
- **Matchmaking** - Player discovery and game creation
- **Synchronization** - Resolve conflicts between players
- **Premium AI** - Advanced AI for paid users
- **Authentication** - User accounts and sessions

### Sync Strategy
1. **Optimistic Updates** - Apply moves locally immediately
2. **Periodic Sync** - Send moves to server every N seconds
3. **Conflict Detection** - Use version numbers to detect conflicts  
4. **Resolution** - Server state wins, client replays from last good checkpoint
5. **Graceful Degradation** - Continue offline if server unavailable
