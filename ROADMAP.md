# TurnEngine Implementation Roadmap

## Phase 1: Core Engine Foundation (Weeks 1-3)

### Week 1: Basic Game State & ECS
**Goals**: Get basic entity system working locally

**Tasks**:
- [ ] Set up project structure (monorepo with turnengine/ and games/weewar/)
- [ ] Implement basic Entity Component System
  - [ ] Component definitions (Position, Health, Movement, Combat)
  - [ ] Entity creation and management
  - [ ] System registration and execution
- [ ] Create basic game state structure
- [ ] Write tests for core ECS functionality

**Deliverable**: Can create entities with components and run basic systems

### Week 2: Rule Engine & Commands  
**Goals**: Game-specific behavior configuration

**Tasks**:
- [ ] Design rule configuration format (JSON schema)
- [ ] Implement command pattern for all actions
- [ ] Create command validation pipeline
- [ ] Build WeeWar-specific rule set
  - [ ] Unit types and stats
  - [ ] Terrain types and effects
  - [ ] Movement rules
  - [ ] Combat calculation
- [ ] Add turn management for sequential play

**Deliverable**: Can configure WeeWar rules and process movement commands

### Week 3: Board System & Movement
**Goals**: Spatial game mechanics working

**Tasks**:
- [ ] Implement hex grid system
- [ ] Add pathfinding algorithm (A*)
- [ ] Create movement validation
- [ ] Implement fog of war calculations
- [ ] Add basic combat resolution
- [ ] Build victory condition checking

**Deliverable**: Playable WeeWar game logic (no UI)

## Phase 2: Local Play & AI (Weeks 4-5)

### Week 4: Local Storage & State Management
**Goals**: Persistent local gameplay

**Tasks**:
- [ ] Implement IndexedDB wrapper for game storage
- [ ] Add save/load game functionality  
- [ ] Create checkpoint system (every N turns)
- [ ] Build replay system from command history
- [ ] Add undo/redo functionality for local play

**Deliverable**: Can save and resume games locally

### Week 5: Basic AI Implementation
**Goals**: Single player mode against AI

**Tasks**:
- [ ] Design AI interface and personality system
- [ ] Implement basic AI strategies:
  - [ ] Random AI (for testing)
  - [ ] Aggressive AI (rush tactics)  
  - [ ] Defensive AI (economic focus)
- [ ] Add AI difficulty scaling
- [ ] Integrate AI with turn system

**Deliverable**: Playable single-player WeeWar with AI opponents

## Phase 3: Minimal Server & Multiplayer (Weeks 6-7)

### Week 6: Server Foundation
**Goals**: Basic server for persistence

**Tasks**:
- [ ] Set up minimal server (Go + Gin)
- [ ] Add user authentication (JWT)
- [ ] Implement game persistence APIs
- [ ] Create checkpoint storage system
- [ ] Add basic game lobby functionality

**Deliverable**: Server can store and retrieve games

### Week 7: Multiplayer Sync
**Goals**: Two players can play together

**Tasks**:
- [ ] Implement optimistic locking with version numbers
- [ ] Add conflict resolution for simultaneous moves
- [ ] Create player invitation system
- [ ] Build turn notification system
- [ ] Add spectator mode APIs

**Deliverable**: Two players can play WeeWar together asynchronously

## Phase 4: Polish & UI (Weeks 8-9)

### Week 8: Basic Web UI
**Goals**: Playable web interface

**Tasks**:
- [ ] Create minimal web interface for WeeWar
- [ ] Implement hex grid rendering (SVG or Canvas)
- [ ] Add unit sprites and animations
- [ ] Build game lobby interface
- [ ] Add player authentication UI

**Deliverable**: Fully playable WeeWar in browser

### Week 9: Testing & Deployment
**Goals**: Production-ready system

**Tasks**:
- [ ] Comprehensive testing (unit, integration, load)
- [ ] Performance optimization
- [ ] Deploy to cloud (Vercel/Railway for simplicity)
- [ ] Add monitoring and logging
- [ ] Write user documentation

**Deliverable**: Live WeeWar game ready for beta testing

## Phase 5: Neptune's Pride (Weeks 10-12)

### Week 10: Engine Extensions
**Goals**: Extend engine for real-time gameplay

**Tasks**:
- [ ] Add continuous time management system
- [ ] Implement graph-based board (vs hex grid)
- [ ] Create scheduled event system for fleet arrivals
- [ ] Add real-time command processing

**Deliverable**: Engine supports both turn-based and real-time games

### Week 11: Neptune's Pride Game Logic
**Goals**: NP-specific features

**Tasks**:
- [ ] Implement star and fleet entities
- [ ] Add technology research system
- [ ] Create diplomacy messaging system
- [ ] Build economic modeling (production rates)
- [ ] Add alliance/treaty mechanics

**Deliverable**: Neptune's Pride game logic complete

### Week 12: NP UI & Integration
**Goals**: Second game fully working

**Tasks**:
- [ ] Create space-themed UI for Neptune's Pride
- [ ] Add galaxy map rendering
- [ ] Implement diplomacy interface
- [ ] Add technology tree visualization
- [ ] Integration testing with existing infrastructure

**Deliverable**: Two complete games sharing same engine

## Technical Stack Decisions

### Frontend
- **Framework**: Vanilla JS or lightweight framework (Lit, Alpine.js)
- **Rendering**: SVG for board graphics (scales well, easy to manipulate)
- **State**: Custom state management integrated with engine
- **Storage**: IndexedDB via Dexie.js wrapper

### Backend  
- **Runtime**: Node.js with Express (simple, well-known)
- **Database**: PostgreSQL with JSON columns for game state
- **Authentication**: JWT tokens with refresh mechanism
- **Deployment**: Railway or Vercel for ease

### Development
- **Language**: Go for all game logic, JavaScript for UI
- **WASM**: TinyGo for smaller browser bundles
- **Testing**: Go's built-in testing, Playwright for integration
- **Build**: Make + Go toolchain
- **Monorepo**: Go modules with shared core package

## Success Metrics

### Phase 1-2 Success
- [ ] Engine supports multiple game types via configuration
- [ ] Local gameplay works offline with AI
- [ ] Test suite covers core engine functionality

### Phase 3-4 Success  
- [ ] Server costs under $10/month for 100+ concurrent games
- [ ] Players can complete full games without technical issues
- [ ] Load testing shows engine scales to target limits

### Phase 5 Success
- [ ] Two completely different games share 80%+ of engine code
- [ ] New game types can be added with minimal engine changes
- [ ] Performance stays consistent across game types
