# WeeWar Next Steps

## Recent Achievements ✅

### 1. Enhanced Core API Architecture
**Completed**: Clean separation of static data from runtime instances
**Benefits**: 
- Programmatic game creation and testing
- Simplified game state management
- Better debugging and development experience
- Headless gameplay capabilities

### 2. Advanced Rendering System
**Completed**: Professional-grade Buffer architecture with compositing and vector path drawing
**Benefits**:
- Multi-layer rendering (terrain, units, UI)
- Scaling and alpha blending support
- PNG output for visualization
- Flexible canvas sizes and positioning
- Vector path drawing with FillPath and StrokePath methods
- Professional-grade graphics using tdewolff/canvas library
- WebAssembly-compatible zero-dependency rendering

### 3. Comprehensive Testing Framework
**Completed**: Full test coverage for core systems including vector path drawing
**Benefits**:
- Verified hex neighbor calculations
- Tested multi-layer composition
- Validated scaling and alpha blending
- Reliable PNG generation
- Vector path drawing test coverage (fill, stroke, alpha compositing)
- Edge case testing (empty paths, single points, two-point lines)
- Visual verification with organized test output directories

### 4. Clean Interface Architecture (NEW) ✅
**Completed**: Comprehensive interface design with clean separation of concerns
**Benefits**:
- **Core Game Interface** (game_interface.go): Pure game mechanics
- **AI Interface** (ai.go): AI decision-making and strategic analysis
- **UI Interface** (ui.go): Browser interaction and rendering
- **CLI Interface** (cli.go): Command-line gameplay and testing
- **Event System** (events.go): Observer pattern for game events
- Clear contracts for each layer of functionality
- Enables independent development of CLI, AI, and browser features

### 5. Map Editor Enhancement (NEW) ✅
**Completed**: Advanced grid visualization and editor optimization
**Benefits**:
- **GridLayer Implementation**: Hex grid lines and coordinate display
- **WASM Integration**: Global editor/world architecture for performance
- **Visual Controls**: Real-time toggles for grid and coordinate visibility
- **Client-side Optimization**: Tile dimension caching and scroll management
- **Interactive Grid**: Foundation for click-to-expand map functionality

### 6. Phaser.js Map Editor (v4.0) ✅ COMPLETED
**Completed**: Complete Phaser.js architecture with professional UX and accurate coordinate system
**Major Achievements**:
- **Coordinate System Accuracy**: Fixed coordinate conversion to match Go backend (`lib/map.go`) exactly
- **Dynamic Grid System**: Infinite grid covering entire visible area (not fixed radius)  
- **Professional Mouse Interaction**: Paint-on-release, drag-to-pan, modifier key paint modes
- **Clean Component Architecture**: PhaserPanel separation with proper event callbacks
- **UI Reorganization**: Grid/coordinate controls moved to logical Phaser panel location
- **Legacy System Removal**: Complete elimination of old canvas system
- **Enhanced User Experience**: Intuitive controls preventing accidental tile painting

### 7. Architecture Modernization (v4.0) ✅ COMPLETED  
**Completed**: Major architectural transformation to Phaser-first design
**Technical Improvements**:
- **Fixed Coordinate Conversion**: `tileWidth=64, tileHeight=64, yIncrement=48` matching backend
- **Row/Col Conversion**: Using odd-row offset layout from `lib/hex_coords.go`
- **Dynamic Viewport Grid**: Grid renders only visible hexes based on camera bounds
- **Professional Interaction**: Drag threshold detection, modifier key paint modes
- **Component Separation**: Clean PhaserPanel API with event-driven communication
- **Documentation Updates**: ARCHITECTURE.md updated to v4.0 with detailed technical specs

### 8. Map Editor UI Enhancement (v4.1) ✅ COMPLETED
**Completed**: Major improvements to terrain/unit management and theme handling
**Key Achievements**:
- **Data Consistency**: Fixed terrain categorization to match weewar-data.json exactly
- **UI Reorganization**: Moved brush controls to horizontal Phaser toolbar for better UX
- **Asset Integration**: Direct static URLs for actual tile/unit graphics instead of placeholders
- **Theme Reactivity**: Fixed canvas theme initialization to read current theme state
- **Terrain Organization**: Proper Nature vs City categorization with alphabetical sorting
- **Code Simplification**: Eliminated unnecessary AssetManager dependencies

### 9. Unit Placement System (v4.2) ✅ COMPLETED
**Completed**: Complete unit editing functionality with terrain preservation
**Key Achievements**:
- **Three Placement Modes**: Terrain, Unit, and Clear modes with proper radio button behavior
- **Smart Clear Logic**: Units removed first, then tiles on subsequent clicks
- **Unit Toggle**: Clicking same unit type removes it (intuitive UX)
- **Terrain Preservation**: Units placed on top of existing terrain without modification
- **Brush Size Control**: Units always use size 1, terrain uses selected brush size
- **Data Integrity**: Units stored separately in mapData.units with proper player assignment
- **Input Validation**: Units can only be placed on existing tiles

### 10. TileStats Panel & Layout (v4.3) ✅ COMPLETED  
**Completed**: Professional statistics panel and optimized layout design
**Key Achievements**:
- **TileStats Panel**: Real-time statistics showing terrain types, unit counts, and player distribution
- **Border Layout**: Fixed-width sidebars (Tools: 270px, Advanced: 260px) with maximized map editor
- **Auto-refresh**: Stats update automatically when map changes, plus manual refresh button
- **Visual Organization**: Color-coded statistics with icons and proper grouping
- **Layout Optimization**: TileStats below Advanced Tools, maximizing map editor space
- **Professional UI**: Clean design matching existing theme with responsive dark/light mode

### 11. Map Data Persistence & Loading (v4.4) ✅ COMPLETED
**Completed**: Full map save/load functionality with proper data formats and user experience
**Key Achievements**:
- **CreateMap API Integration**: Fixed data format to match backend protobuf definitions
- **URL Management**: Automatic URL replacement after first save (new → /maps/{id}/edit)
- **PATCH Updates**: Proper use of UpdateMap API for existing map modifications
- **Server-side Data Loading**: Hidden template element for pre-loading map data
- **Phaser Data Loading**: Automatic loading of tiles and units into editor on page load
- **Loading UX**: Professional loading indicator during map data initialization
- **Error Handling**: Comprehensive error handling and user feedback for save/load operations

### 12. Mouse-Cursor Zoom (v4.5) ✅ COMPLETED
**Completed**: Professional zoom behavior that centers on mouse cursor position
**Key Achievements**:
- **Zoom-to-Cursor**: Fixed zoom to center around mouse position instead of arbitrary point
- **Proper Coordinate Conversion**: Uses camera.centerX/Y for accurate world-to-screen mapping
- **Smooth Navigation**: Eliminates disorienting zoom jumps for better user experience
- **Professional Feel**: Matches behavior of modern map editors and design tools
- **Mathematical Precision**: Calculates world coordinates before/after zoom to maintain cursor position

### 13. Map Class Architecture Refactoring (v4.6) ✅ COMPLETED
**Completed**: Major code architecture improvement with dedicated Map class and centralized data management
**Key Achievements**:
- **Dedicated Map Class**: Created `/web/frontend/components/Map.ts` with clean interfaces for tiles, units, and metadata
- **Data Centralization**: Replaced scattered `mapData` object with structured Map class managing all map state
- **Consistent API**: Implemented `tileExistsAt()`, `getTileAt()`, `setTileAt()`, `removeTileAt()` and unit equivalents
- **Robust Serialization**: Enhanced `serialize()`/`deserialize()` supporting both client and server data formats
- **Player Color Support**: Full support for city terrain ownership with proper player ID tracking
- **Data Validation**: Built-in validation methods ensuring map data integrity
- **Type Safety**: Comprehensive TypeScript interfaces with proper error handling
- **Backwards Compatibility**: Seamless migration from old mapData format without data loss

### 14. Readonly Map Viewer Implementation (v4.7) ✅ COMPLETED
**Completed**: Professional readonly map viewer with critical debugging and architectural improvements
**Key Achievements**:
- **PhaserViewer Component**: Complete readonly map display using Phaser.js WebGL rendering without editing capabilities
- **MapDetailsPage Integration**: Full integration with template system, backend data loading, and frontend statistics
- **Critical DOM Safety**: Fixed dangerous CSS selectors that were causing entire page content replacement
- **Phaser Timing Resolution**: Solved WebGL framebuffer errors through proper initialization sequencing and container sizing
- **Template Integration**: Proper JavaScript bundle loading and script inclusion in template generation system
- **Error Handling**: Comprehensive error handling for WebGL context issues and initialization failures
- **Real-time Statistics**: Dynamic calculation and display of map statistics from actual loaded map data
- **Copy Functionality**: Working copy map feature for creating new maps from existing ones

### 15. Critical Debugging Learnings (v4.7) ✅ COMPLETED
**Completed**: Major debugging session with critical architectural insights for future development
**Key Learnings**:
- **DOM Corruption Prevention**: CSS selectors like `.text-gray-900, .text-white` can match `<body>` element, causing page-wide content replacement
- **Scope-Safe DOM Queries**: Always use container-scoped queries (`container.querySelectorAll()`) instead of global document queries
- **Phaser WebGL Context**: Timing and container sizing are critical for WebGL framebuffer creation - requires proper element dimensions before initialization
- **Race Condition Management**: Map data loading must be sequenced after Phaser initialization to prevent DOM corruption
- **Template Build System**: JavaScript bundle inclusion requires careful coordination between template structure and build system output

## Current Development Focus

### Phase 4: Phaser.js Polish and Integration ✅ COMPLETED

#### A. Coordinate System Accuracy ✅ COMPLETED
**Goal**: Perfect coordinate mapping between frontend and backend  
**Components**:
- [x] Fixed pixelToHex/hexToPixel to match Go backend exactly
- [x] Implemented tileWidth=64, tileHeight=64, yIncrement=48 from lib/map.go
- [x] Added hexToRowCol/rowColToHex conversion from lib/hex_coords.go
- [x] Pixel-perfect click-to-hex coordinate mapping
- [x] Row/col coordinate display with proper odd-row offset layout

#### B. Dynamic Grid System ✅ COMPLETED
**Goal**: Infinite grid covering entire visible area  
**Components**:
- [x] Camera viewport bounds calculation for grid rendering
- [x] Dynamic hex coordinate range based on visible area
- [x] Efficient rendering of only visible grid hexes
- [x] Automatic grid updates when camera moves or zooms
- [x] Performance optimization for large coordinate ranges

#### C. Professional Mouse Interaction ✅ COMPLETED
**Goal**: Intuitive editing without accidental painting
**Components**:
- [x] Paint on mouse up (not down) for normal clicks
- [x] Drag detection with threshold to prevent accidental painting
- [x] Camera pan on drag without modifier keys
- [x] Paint mode with Alt/Cmd/Ctrl + drag for continuous painting
- [x] Immediate paint on modifier key down for responsive feedback

#### D. UI Architecture Improvements ✅ COMPLETED
**Goal**: Clean component separation and logical UI organization
**Components**:
- [x] PhaserPanel class for editor logic separation
- [x] Grid and coordinate toggles moved from ToolsPanel to PhaserPanel
- [x] Removed "Switch to Canvas" button (legacy system eliminated)
- [x] Event callback system for tile clicks and map changes
- [x] Clean initialization and cleanup methods

### Phase 5: Keyboard Shortcut System (v5.0) ✅ COMPLETED
**Goal**: Implement comprehensive keyboard shortcut system for rapid map building
**Status**: Production-ready keyboard shortcuts with full functionality

**Completed Features**:
- **KeyboardShortcutManager**: Generic, reusable class with state machine architecture
- **Multi-key Commands**: `n12`, `c5`, `u3`, `p2`, `b4`, `esc` with number argument support
- **Help System**: `?` key displays categorized overlay with all available shortcuts
- **Visual Feedback**: State indicators, toast notifications, and UI synchronization
- **Context Awareness**: Automatically disabled in input fields and modals
- **Clean Architecture**: Separation of concerns between input handling and UI updates

**Core Commands Implemented**:
- `n<index>` - Select nature terrain by index (1-5: Grass, Desert, Water, Mountain, Rock)
- `c<index>` - Select city terrain by index (1-4: city variants)
- `u<index>` - Select unit type for current player (1-20: all unit types)
- `p<number>` - Set current player (1-4)
- `b<size>` - Set brush size (0-5: Single to XX-Large)
- `esc` - Reset all tools to defaults
- `?` - Show help overlay with categorized shortcuts

**Technical Implementation**:
- **State Machine**: NORMAL ↔ AWAITING_ARGS with 3-second timeout
- **Input Validation**: Proper bounds checking with error feedback
- **UI Synchronization**: Updates terrain/unit buttons, dropdowns, and visual state
- **Toast Integration**: Success/error feedback for all shortcut actions
- **Help Generation**: Auto-generated help content from shortcut configuration

**User Experience**:
- **One-handed Operation**: Optimized for mouse + keyboard workflow
- **Smart Number Handling**: Support for single/double digits with backspace editing
- **Professional Feedback**: Toast notifications with descriptive messages
- **Error Handling**: Clear validation messages for invalid inputs
- **Responsive UI**: Immediate visual updates in tool panels

### Phase 6: Next Development Priorities (Upcoming) 🚧

#### A. WASM Integration Enhancement
**Goal**: Connect Phaser editor to Go backend for data persistence
**Components**:
- [ ] PhaserPanel integration with existing WASM functions
- [ ] Map loading from backend into Phaser scene
- [ ] Save functionality to persist Phaser editor changes
- [ ] Unit placement and editing via Phaser interface
- [ ] Export functionality for complete maps

#### B. Advanced Editor Features  
**Goal**: Professional map editing capabilities
**Components**:
- [ ] Multi-tile selection and area operations
- [ ] Copy/paste functionality for map sections
- [ ] Template system for common patterns
- [ ] Undo/redo system with history management
- [ ] Advanced brushes (pattern fills, gradients)

#### C. Performance and Polish
**Goal**: Production-ready editor experience
**Components**:
- [ ] Sprite batching for improved rendering performance
- [ ] Memory management for large maps
- [ ] Visual feedback for editor operations
- [ ] Error handling and user feedback systems
- [ ] Responsive design for different screen sizes

### Phase 3: Unified Game Implementation (Planned) 🚧

#### A. Core Game Struct Implementation
**Goal**: Create unified Game struct implementing GameInterface
**Components**:
- [x] Clean interface architecture with separated concerns
- [ ] Unified Game struct combining best of core.go and new interfaces
- [ ] GameController implementation (lifecycle, turns, state)
- [ ] MapInterface implementation (queries, pathfinding, coordinates)
- [ ] UnitInterface implementation (management, movement, combat)
- [ ] Event system integration for game state changes

#### B. CLI System Implementation
**Goal**: Complete command-line interface for testing and gameplay
**Components**:
- [ ] Command parsing and execution system
- [ ] Interactive gameplay loop
- [ ] Game state visualization (ASCII map, unit lists)
- [ ] Save/load functionality
- [ ] PNG rendering for validation
- [ ] Comprehensive help system

#### C. Testing and Validation
**Goal**: Ensure unified system works correctly
**Components**:
- [ ] Unit tests for all GameInterface methods
- [ ] Integration tests for complete game scenarios
- [ ] CLI command testing
- [ ] Game state persistence testing
- [ ] Visual validation with PNG output

### Phase 3: Advanced Features (Planned)

#### A. AI Player System 🎯
**Goal**: Implement intelligent AI opponents for single-player games
**Components**:
- [ ] Basic AI decision making (move, attack, base capture)
- [ ] Unit evaluation and targeting algorithms
- [ ] Strategic planning (resource management, positioning)
- [ ] Difficulty levels (easy, medium, hard)
- [ ] AI vs AI testing for validation

#### B. Browser Interface (Planned)
**Goal**: WebAssembly-based browser gameplay
**Components**:
- [ ] Canvas rendering integration
- [ ] Mouse/touch input handling
- [ ] Animation system
- [ ] UI state management
- [ ] WebAssembly compilation and deployment

### 2. Real-time and Multiplayer Features (Medium Priority)

#### A. Web Interface Development 🌐
**Goal**: Create browser-based gameplay
**Components**:
- [ ] HTML/CSS/JS frontend using Buffer rendering
- [ ] WebSocket integration for real-time updates
- [ ] Responsive design for different screen sizes
- [ ] Game lobby and room management
- [ ] Player authentication and profiles

#### B. Advanced Visualization 🎨
**Goal**: Enhanced game graphics and UI
**Components**:
- [ ] Sprite-based unit and terrain rendering
- [ ] Animation support for movement and combat
- [ ] Hex grid overlay and highlighting using vector paths
- [ ] Minimap and game state panels
- [ ] Victory/defeat screens and statistics
- [ ] Visual effects (explosions, highlights) using FillPath/StrokePath
- [ ] Movement paths and attack range indicators

### 3. Content and Data Expansion (Low Priority)

#### A. Additional Game Content 📦
**Goal**: Expand game variety and replayability
**Components**:
- [ ] More maps from WeeWar archives
- [ ] Custom map creation tools
- [ ] Scenario-based campaigns
- [ ] Unit variants and special abilities
- [ ] Tournament modes and leaderboards

#### B. Data Pipeline Improvements 🔄
**Goal**: Streamline content creation and updates
**Components**:
- [ ] Automated map extraction from web sources
- [ ] Data validation and consistency checking
- [ ] Hot-reload for development
- [ ] Version control for game data
- [ ] Community content submission system

## Testing and Validation (Medium Priority)

### 1. Unit Testing
**Goal**: Comprehensive test coverage for all systems
**Test Areas**:
- [ ] Combat system with known damage scenarios
- [ ] Movement system with various terrain types
- [ ] Map loading and initialization
- [ ] Component registration and entity creation
- [ ] Pathfinding algorithm accuracy

### 2. Integration Testing
**Goal**: Test complete game scenarios
**Test Scenarios**:
- [ ] Full game from start to victory
- [ ] Multi-player games (2-4 players)
- [ ] All 12 maps load and play correctly
- [ ] Edge cases (unit destruction, base capture)
- [ ] Performance with large maps

### 3. Data Validation
**Goal**: Verify game calculations match original WeeWar
**Validation Areas**:
- [ ] Combat outcomes against known results
- [ ] Movement costs and pathfinding
- [ ] Resource generation and costs
- [ ] Map balance and starting positions

## Quality Improvements (Low Priority)

### 1. Error Handling
**Goal**: Robust error handling throughout the system
**Improvements**:
- [ ] Graceful handling of invalid commands
- [ ] Recovery from corrupted game states
- [ ] Better error messages for debugging
- [ ] Logging for system events

### 2. Performance Optimization
**Goal**: Optimize for larger maps and longer games
**Optimizations**:
- [ ] Cache pathfinding calculations
- [ ] Optimize entity component lookups
- [ ] Reduce memory allocations
- [ ] Profile and optimize hot paths

### 3. Code Quality
**Goal**: Clean, maintainable code
**Improvements**:
- [ ] Add comprehensive code comments
- [ ] Refactor large functions
- [ ] Remove unused code and imports
- [ ] Consistent error handling patterns

## Feature Enhancements (Future)

### 1. AI Player Implementation
**Goal**: Single-player games with AI opponents
**Components**:
- [ ] Basic AI decision making (move, attack)
- [ ] Unit evaluation and targeting
- [ ] Strategic planning (base capture, resource management)
- [ ] Difficulty levels (easy, medium, hard)

### 2. Game Variants
**Goal**: Support different game modes
**Variants**:
- [ ] Fog of war implementation
- [ ] Different victory conditions
- [ ] Custom unit costs and abilities
- [ ] Time-limited turns

### 3. Map Editor
**Goal**: Tools for creating custom maps
**Features**:
- [ ] Terrain placement interface
- [ ] Unit placement tools
- [ ] Map validation and testing
- [ ] Export to game format

## WebAssembly Deployment (Future)

### 1. WASM Compilation
**Goal**: Deploy WeeWar to browsers
**Tasks**:
- [ ] Test Go to WASM compilation
- [ ] Optimize for browser constraints
- [ ] Handle file system differences
- [ ] Test performance in browsers

### 2. Web Interface
**Goal**: HTML/CSS/JS frontend for browser play
**Components**:
- [ ] Game board rendering
- [ ] Unit and terrain sprites
- [ ] Player interaction (click to move/attack)
- [ ] Game state display

### 3. Multiplayer Support
**Goal**: Multi-player games via WebSockets
**Infrastructure**:
- [ ] WebSocket server implementation
- [ ] Game room management
- [ ] Player synchronization
- [ ] Reconnection handling

## Data and Content

### 1. Additional Maps
**Goal**: Expand map selection
**Tasks**:
- [ ] Extract more maps from tinyattack.com
- [ ] Create custom maps for testing
- [ ] Balance testing for new maps
- [ ] Map difficulty classification

### 2. Game Data Validation
**Goal**: Ensure data accuracy
**Validation**:
- [ ] Cross-reference with original game
- [ ] Test edge cases and corner scenarios
- [ ] Validate probability distributions
- [ ] Check for data consistency

### 3. Content Management
**Goal**: Easy content updates
**Tools**:
- [ ] Hot-reload for game data changes
- [ ] Data validation tools
- [ ] Version control for game data
- [ ] Automated data extraction pipeline

## Documentation and Guides

### 1. Player Documentation
**Goal**: Help players understand the game
**Content**:
- [ ] Game rules and mechanics
- [ ] Unit descriptions and abilities
- [ ] Strategy guides and tips
- [ ] Map descriptions and tactics

### 2. Developer Documentation
**Goal**: Help developers extend the game
**Content**:
- [ ] API documentation
- [ ] Component creation guide
- [ ] System development guide
- [ ] Data format specifications

### 3. Deployment Guides
**Goal**: Help with game deployment
**Content**:
- [ ] Local development setup
- [ ] WebAssembly deployment
- [ ] Server configuration
- [ ] Performance tuning

## Success Metrics

### Immediate (1-2 weeks)
- [ ] All 12 maps load without errors
- [ ] Basic move and attack commands work
- [ ] Units can be placed and moved correctly
- [ ] Simple 2-player game completes successfully

### Short-term (1 month)
- [ ] Complete game loop functional
- [ ] All combat mechanics working
- [ ] Victory conditions implemented
- [ ] Basic AI player operational

### Medium-term (2-3 months)
- [ ] Comprehensive test coverage (80%+)
- [ ] Performance optimized for large maps
- [ ] WebAssembly deployment working
- [ ] Multi-player support implemented

### Long-term (3-6 months)
- [ ] Advanced AI with multiple difficulty levels
- [ ] Map editor and custom content tools
- [ ] Tournament and ranking systems
- [ ] Community features and player profiles

## Risk Assessment

### High Risk
- **Board Position Validation**: Critical for game functionality
- **Command Processing**: Essential for gameplay
- **Unit Placement**: Required for game initialization

### Medium Risk
- **Performance**: Could impact user experience
- **WebAssembly**: May have browser compatibility issues
- **Data Accuracy**: Could affect game balance

### Low Risk
- **AI Implementation**: Nice-to-have feature
- **Advanced Features**: Can be added incrementally
- **Documentation**: Important but not blocking

## Resource Allocation

### Development Time
- **Critical Issues**: 60% of development time
- **Core Functionality**: 25% of development time
- **Testing/Quality**: 10% of development time
- **Future Features**: 5% of development time

### Focus Areas
1. **Fix blocking issues** to enable basic gameplay
2. **Complete core systems** for full game functionality
3. **Add testing and validation** for reliability
4. **Enhance with features** for better user experience

The WeeWar implementation is close to completion and ready for the final push to create a fully playable, authentic turn-based strategy game that demonstrates the TurnEngine framework's capabilities.