import { BasePage } from '../lib/BasePage';
import { EventBus } from '../lib/EventBus';
import { GameViewer } from './GameViewer';
import { Unit, Tile, World } from './World';
import { GameState, GameStateData, GameCreateData, UnitSelectionData } from './GameState';
import { LCMComponent } from '../lib/LCMComponent';
import { LifecycleController } from '../lib/LifecycleController';
import { PLAYER_BG_COLORS } from './ColorsAndNames';
import { TerrainStatsPanel } from './TerrainStatsPanel';
import { WorldEventTypes } from './events';

/**
 * Game Viewer Page - Interactive game play interface
 * Responsible for:
 * - Loading world as a game instance
 * - Coordinating WASM game engine
 * - Managing game state and turn flow
 * - Handling player interactions (unit selection, movement, attacks)
 * - Providing game controls and UI feedback
 */
class GameViewerPage extends BasePage implements LCMComponent {
    private currentGameId: string | null;
    private world: World
    private worldViewer: GameViewer
    private gameState: GameState
    private terrainStatsPanel: TerrainStatsPanel
    
    // Game configuration from URL parameters
    private playerCount: number = 2;
    private maxTurns: number = 0;
    private gameConfig: GameConfiguration;
    
    // UI state
    private selectedUnit: any = null;
    private gameLog: string[] = [];

    // =============================================================================
    // LCMComponent Interface Implementation
    // =============================================================================

    /**
     * Phase 1: Initialize DOM and discover child components
     */
    performLocalInit(): LCMComponent[] {
        console.log('GameViewerPage: performLocalInit() - Phase 1');

        // Load game config first
        this.loadGameConfiguration(); // Load game config here since constructor calls this
        
        // Subscribe to events BEFORE creating components
        this.subscribeToGameStateEvents();
        
        // Create child components
        this.createComponents();
        
        // Initialize basic UI state
        this.updateGameStatus('Game Loading...');
        this.initializeGameLog();
        
        console.log('GameViewerPage: DOM initialized, returning child components');

        console.assert(this.worldViewer != null, "World viewer could not be created")
        console.assert(this.gameState != null, "gameState could not be created")
        console.assert(this.terrainStatsPanel != null, "terrainStatsPanel could not be created")
        
        // Return child components for lifecycle management
        return [
            this.worldViewer,
            this.gameState,
            this.terrainStatsPanel,
        ]
    }

    /**
     * Phase 3: Activate component when all dependencies are ready
     */
    async activate(): Promise<void> {
        console.log('GameViewerPage: activate() - Phase 3');
        
        // Bind events now that all components are ready
        this.bindGameSpecificEvents();
        
        console.log('GameViewerPage: activation complete');
    }

    public destroy(): void {
        if (this.worldViewer) {
            this.worldViewer.destroy();
            this.worldViewer = null as any;
        }
        
        if (this.gameState) {
            this.gameState.destroy();
            this.gameState = null as any;
        }

        if (this.terrainStatsPanel) {
            this.terrainStatsPanel.destroy();
            this.terrainStatsPanel = null as any;
        }
        
        this.world = null as any;
        this.currentGameId = null;
        this.selectedUnit = null;
        this.gameLog = [];
    }

    /**
     * Load game configuration from URL parameters and hidden inputs
     */
    private loadGameConfiguration(): void {
        // Get gameId from hidden input
        
        // Initialize gameConfig before calling super() to ensure it's available in initializeSpecificComponents()
        this.gameConfig = this.gameConfig || {
            playerCount: 2,
            maxTurns: 0,
            unitRestrictions: {},
            playerTypes: {},
            playerTeams: {}
        };
        const gameIdInput = document.getElementById("gameIdInput") as HTMLInputElement | null;
        this.currentGameId = gameIdInput?.value.trim() || null;

        // Get basic config from hidden inputs
        const playerCountInput = document.getElementById("playerCount") as HTMLInputElement | null;
        const maxTurnsInput = document.getElementById("maxTurns") as HTMLInputElement | null;

        this.gameConfig.playerCount = parseInt(playerCountInput?.value || '2');
        this.gameConfig.maxTurns = parseInt(maxTurnsInput?.value || '0');

        // Parse URL parameters for detailed configuration
        const urlParams = new URLSearchParams(window.location.search);
        
        // Parse unit restrictions
        for (const [key, value] of urlParams.entries()) {
            if (key.startsWith('unit_') && value === 'allowed') {
                const unitId = key.substring(5);
                this.gameConfig.unitRestrictions[unitId] = 'allowed';
            } else if (key.startsWith('player_') && key.includes('_type')) {
                const playerId = key.split('_')[1];
                this.gameConfig.playerTypes[playerId] = value;
            } else if (key.startsWith('player_') && key.includes('_team')) {
                const playerId = key.split('_')[1];
                this.gameConfig.playerTeams[playerId] = parseInt(value);
            }
        }

        console.log('Game configuration loaded:', this.gameConfig);
    }

    /**
     * Subscribe to GameState events
     */
    private subscribeToGameStateEvents(): void {
        // GameViewer ready event - set up interaction callbacks and load world
        this.addSubscription(WorldEventTypes.WORLD_VIEWER_READY, this);
        
        // GameState notification events (for system coordination, not user interaction responses)
        this.addSubscription('game-loaded', this);
        this.addSubscription('game-created', this);
        this.addSubscription('unit-moved', this);
        this.addSubscription('unit-attacked', this);
        this.addSubscription('turn-ended', this);
    }

    /**
     * Handle events from the EventBus
     */
    public handleBusEvent(eventType: string, data: any, target: any, emitter: any): void {
        switch(eventType) {
            case WorldEventTypes.WORLD_VIEWER_READY:
                console.log('GameViewerPage: GameViewer ready event received', data);
                
                // Now that GameViewer scene is ready, set up the interaction callbacks
                if (this.worldViewer) {
                    console.log('GameViewerPage: Setting interaction callbacks after scene ready');
                    this.worldViewer.setInteractionCallbacks(
                        this.onTileClicked,
                        this.onUnitClicked
                    );
                    console.log('GameViewerPage: Interaction callbacks set after scene ready');
                }
                
                if (this.currentGameId) {
                    console.log('GameViewerPage: WorldId found, proceeding to load world:', this.currentGameId);
                    // WebGL context timing - wait for next event loop tick
                    setTimeout(async () => {
                        console.log('GameViewerPage: Starting loadWorldAndInitializeGame...');
                        await this.loadWorldAndInitializeGame();
                    }, 10);
                } else {
                    console.warn('GameViewerPage: No currentGameId found!');
                }
                break;
            
            case 'game-loaded':
                console.log('GameViewerPage: Game loaded from page data', data);
                // Update UI with the loaded game state
                if (this.gameState) {
                    const gameData = this.gameState.getGameData();
                    this.updateGameUIFromState(this.convertGameStateToLegacyFormat(gameData));
                    this.logGameEvent(`Game loaded: ${gameData.gameId}`);
                }
                break;
            
            case 'game-created':
                console.log('GameViewerPage: Game created notification', data);
                // Game UI already updated synchronously, this is just for logging/coordination
                break;
            
            case 'unit-moved':
                console.log('GameViewerPage: Unit moved notification', data);
                // Could trigger animations, sound effects, etc.
                break;
            
            case 'unit-attacked':
                console.log('GameViewerPage: Unit attacked notification', data);
                // Could trigger combat animations, sound effects, etc.
                break;
            
            case 'turn-ended':
                console.log('GameViewerPage: Turn ended notification', data);
                // Could trigger end-of-turn animations, notifications, etc.
                break;
            
            default:
                // Call parent implementation for unhandled events
                super.handleBusEvent(eventType, data, target, emitter);
        }
    }

    /**
     * Create WorldViewer and GameState component instances
     */
    private createComponents(): void {
        const worldViewerContainer = document.getElementById('phaser-viewer-container');
        if (!worldViewerContainer) {
            throw new Error('GameViewerPage: phaser-viewer-container not found');
        }
        // Pass element directly (not string ID) as per UI_DESIGN_PRINCIPLES.md
        this.worldViewer = new GameViewer(worldViewerContainer, this.eventBus, true);

        // Create GameState component (no specific container needed)
        const gameStateContainer = document.createElement('div');
        gameStateContainer.style.display = 'none'; // Hidden data component
        document.body.appendChild(gameStateContainer);
        this.gameState = new GameState(gameStateContainer, this.eventBus, true);
        console.log('GameViewerPage: GameState created:', this.gameState);

        // Create TerrainStatsPanel component
        const terrainStatsContainer = document.getElementById('terrain-stats-container');
        if (!terrainStatsContainer) {
            throw new Error('GameViewerPage: terrain-stats-container not found');
        }
        this.terrainStatsPanel = new TerrainStatsPanel(terrainStatsContainer, this.eventBus, true);
        console.log('GameViewerPage: TerrainStatsPanel created:', this.terrainStatsPanel);
    }

    /**
     * Load world data and initialize game
     */
    private async loadWorldAndInitializeGame(): Promise<void> {
        console.log('Loading world and initializing game...');

        // Load game data from hidden elements
        const gameDataResult = this.loadGameDataFromElements();
        if (!gameDataResult) {
            throw new Error('No game data found');
        }
        
        const { game, gameState, gameHistory } = gameDataResult;
        
        if (!gameState) {
            throw new Error('No game state data found in game');
        }

        // Deserialize world for the WorldViewer component
        this.world = World.deserialize(this.eventBus, gameState.world_data);
        
        // Load world into viewer
        if (this.worldViewer) {
            await this.worldViewer.loadWorld(this.world);
            this.showToast('Success', `Game loaded: ${game.name || this.world.getName() || 'Untitled'}`, 'success');
        }

        // Initialize game using WASM
        console.log('About to initialize game with WASM...');
        try {
            await this.initializeGameWithWASM();
            console.log('WASM initialization completed successfully');
        } catch (error) {
            console.error('WASM initialization failed, but continuing with world display:', error);
            // Continue without WASM for now - still show the map
            this.updateGameStatus('Map loaded - WASM initialization failed');
        }
        
        // Update UI will be handled by GameState events
    }

    /**
     * Initialize game using WASM game engine
     */
    private async initializeGameWithWASM(): Promise<void> {
        if (!this.gameState) {
            throw new Error('GameState component not initialized');
        }

        // Wait for WASM to be ready (only async part)
        await this.gameState.waitUntilReady();
        
        // Load game data from page elements - this will trigger 'game-loaded' event
        // which will update the UI via the event handler
        this.gameState.loadGameFromPageData();
        
        // Debug: Log the loaded game data
        const gameData = this.gameState.getGameData();
        const gameDataResult = this.loadGameDataFromElements();
        console.log('[GameViewerPage] Game initialization debug:', {
            gameStateData: gameData,
            rawGameData: gameDataResult?.game,
            rawGameState: gameDataResult?.gameState,
            worldData: gameDataResult?.worldData,
            // Show units in world data to see their player ownership
            units: gameDataResult?.worldData?.units || []
        });
        
        console.log('Game initialized with WASM engine - UI updates handled by game-loaded event');
    }

    /**
     * Bind page-specific events (required by BasePage)
     * This method is called by BasePage constructor, but we're using external LifecycleController
     * so we make this a no-op and handle event binding in LCMComponent.activate()
     */
    protected bindSpecificEvents(): void {
        console.log('GameViewerPage: bindSpecificEvents() called by BasePage - deferred to activate() phase');
    }

    /**
     * Internal method to bind game-specific events (called from activate() phase)
     */
    private bindGameSpecificEvents(): void {
        // End Turn button
        const endTurnBtn = document.getElementById('end-turn-btn');
        if (endTurnBtn) {
            endTurnBtn.addEventListener('click', this.endTurn.bind(this));
        }

        // Undo Move button
        const undoBtn = document.getElementById('undo-move-btn');
        if (undoBtn) {
            undoBtn.addEventListener('click', this.undoMove.bind(this));
        }

        // Unit selection buttons
        const moveUnitBtn = document.getElementById('move-unit-btn');
        if (moveUnitBtn) {
            moveUnitBtn.addEventListener('click', this.selectMoveMode.bind(this));
        }

        const attackUnitBtn = document.getElementById('attack-unit-btn');
        if (attackUnitBtn) {
            attackUnitBtn.addEventListener('click', this.selectAttackMode.bind(this));
        }

        // Utility buttons
        const showAllUnitsBtn = document.getElementById('select-all-units-btn');
        if (showAllUnitsBtn) {
            showAllUnitsBtn.addEventListener('click', this.showAllPlayerUnits.bind(this));
        }

        const centerActionBtn = document.getElementById('center-on-action-btn');
        if (centerActionBtn) {
            centerActionBtn.addEventListener('click', this.centerOnAction.bind(this));
        }
    }

    /**
     * Load game data from hidden JSON elements (Game, GameState, GameHistory)
     */
    private loadGameDataFromElements(): { game: any; gameState: any; gameHistory: any; worldData: any } | null {
        // Load Game data
        const gameElement = document.getElementById('game.data-json');
        let gameData = null;
        if (gameElement && gameElement.textContent && gameElement.textContent.trim() !== 'null') {
            gameData = JSON.parse(gameElement.textContent);
            console.log('GameViewerPage: Loaded game data:', gameData);
        }
        
        // Load GameState data
        const gameStateElement = document.getElementById('game-state-data-json');
        let gameStateData = null;
        if (gameStateElement && gameStateElement.textContent && gameStateElement.textContent.trim() !== 'null') {
            gameStateData = JSON.parse(gameStateElement.textContent);
            console.log('GameViewerPage: Loaded game state data:', gameStateData);
        }
        
        // Load GameHistory data
        const gameHistoryElement = document.getElementById('game-history-data-json');
        let gameHistoryData = null;
        if (gameHistoryElement && gameHistoryElement.textContent && gameHistoryElement.textContent.trim() !== 'null') {
            gameHistoryData = JSON.parse(gameHistoryElement.textContent);
            console.log('GameViewerPage: Loaded game history data:', gameHistoryData);
        }
        
        // Extract world data from Game for backward compatibility with WorldViewer
        let worldData = null;
        if (gameData && gameData.world) {
            // Combine World metadata with WorldData for the WorldViewer component
            worldData = {
                name: gameData.world.name || 'Untitled Game',
                Name: gameData.world.name || 'Untitled Game',
                id: gameData.world.id,
                width: 40,  // Default
                height: 40, // Default
                tiles: gameData.world.worldData?.tiles || [],
                units: gameData.world.worldData?.units || []
            };
            
            // Calculate actual dimensions from tile bounds
            if (worldData.tiles && worldData.tiles.length > 0) {
                let maxQ = 0, maxR = 0, minQ = 0, minR = 0;
                worldData.tiles.forEach((tile: any) => {
                    if (tile.q > maxQ) maxQ = tile.q;
                    if (tile.q < minQ) minQ = tile.q;
                    if (tile.r > maxR) maxR = tile.r;
                    if (tile.r < minR) minR = tile.r;
                });
                worldData.width = maxQ - minQ + 1;
                worldData.height = maxR - minR + 1;
            }
            
            console.log('GameViewerPage: Extracted world data for WorldViewer:', {
                name: worldData.name,
                tiles: worldData.tiles.length,
                units: worldData.units.length,
                dimensions: `${worldData.width}x${worldData.height}`
            });
        }
        
        if (!gameData) {
            console.error('GameViewerPage: No game data found');
            return null;
        }
        
        return {
            game: gameData,
            gameState: gameStateData,
            gameHistory: gameHistoryData,
            worldData: worldData
        };
    }

    /**
     * Convert new GameStateData to legacy GameCreateData format for UI compatibility
     */
    private convertGameStateToLegacyFormat(gameData: GameStateData): GameCreateData {
        // Extract units and players from world data if available
        const world = gameData.world;
        const worldData = world?.worldData;
        const allUnits = worldData?.units || [];
        const tiles = worldData?.tiles || [];
        
        // Create basic player list from units (extract unique player IDs)
        const playerIds = [...new Set(allUnits.map((unit: any) => unit.player as number))].filter((id: number) => id > 0);
        const players = playerIds.map((id: number) => ({
            id: id,
            name: `Player ${id}`,
            color: this.getPlayerColor(id),
            isHuman: true
        }));
        
        // Create basic teams (no teams for now)
        const teams: any[] = [];
        
        // Calculate map size from tiles
        const mapSize = this.calculateMapSize(tiles);
        
        return {
            currentPlayer: gameData.currentPlayer || 1,
            turnCounter: gameData.turnCounter || 1,
            status: gameData.status || 'active',
            allUnits: allUnits,
            players: players,
            teams: teams,
            mapSize: mapSize,
            winner: 0, // No winner yet
            hasWinner: false
        };
    }
    
    /**
     * Helper to get player color
     */
    private getPlayerColor(playerId: number): string {
        const colors = ['#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF00FF', '#00FFFF'];
        return colors[(playerId - 1) % colors.length] || '#FFFFFF';
    }
    
    /**
     * Helper to calculate map size from tiles
     */
    private calculateMapSize(tiles: any[]): { rows: number; cols: number } {
        if (tiles.length === 0) {
            return { rows: 0, cols: 0 };
        }
        
        const qValues = tiles.map((t: any) => t.q as number);
        const rValues = tiles.map((t: any) => t.r as number);
        
        const minQ = Math.min(...qValues);
        const maxQ = Math.max(...qValues);
        const minR = Math.min(...rValues);
        const maxR = Math.max(...rValues);
        
        return {
            cols: maxQ - minQ + 1,
            rows: maxR - minR + 1
        };
    }

    /**
     * Game action handlers - all synchronous for immediate UI feedback
     */
    private async endTurn(): Promise<void> {
        if (!this.gameState?.isReady()) {
            this.showToast('Error', 'Game not ready', 'error');
            return;
        }

        console.log('Ending current player\'s turn...');
        
        // Async WASM call
        await this.gameState.endTurn(this.gameState.getGameData().currentPlayer);
        
        // Get updated game data and update UI
        const gameData = this.gameState.getGameData();
        this.updateGameUIFromState(this.convertGameStateToLegacyFormat(gameData));
        this.clearUnitSelection();
        
        this.logGameEvent(`Player ${gameData.currentPlayer}'s turn begins`);
        this.showToast('Info', `Player ${gameData.currentPlayer}'s turn`, 'info');
    }

    private undoMove(): void {
        console.log('Undo move requested');
        // TODO: Implement undo functionality with WASM
        this.showToast('Info', 'Undo not yet implemented', 'info');
    }

    private selectMoveMode(): void {
        if (!this.selectedUnit) {
            this.showToast('Warning', 'Select a unit first', 'warning');
            return;
        }
        console.log('Move mode selected for unit:', this.selectedUnit);
        // Movement options are already loaded from unit selection
        // TODO: Integrate with Phaser to highlight valid move tiles
        this.showToast('Info', 'Click on a highlighted tile to move', 'info');
    }

    private selectAttackMode(): void {
        if (!this.selectedUnit) {
            this.showToast('Warning', 'Select a unit first', 'warning');
            return;
        }
        console.log('Attack mode selected for unit:', this.selectedUnit);
        // Attack options are already loaded from unit selection
        // TODO: Integrate with Phaser to highlight valid attack targets
        this.showToast('Info', 'Click on a highlighted enemy to attack', 'info');
    }

    private showAllPlayerUnits(): void {
        if (!this.gameState?.isReady()) {
            return;
        }

        // Synchronous WASM call
        const gameData = this.gameState.getGameState();
        
        console.log(`Showing all units for Player ${gameData.currentPlayer}`);
        // TODO: Highlight all player units and center camera
        this.showToast('Info', `Showing all Player ${gameData.currentPlayer} units`, 'info');
    }

    private centerOnAction(): void {
        console.log('Centering on action');
        // TODO: Center camera on the most recent action or selected unit
        this.showToast('Info', 'Centering view', 'info');
    }

    private handleUnitSelection(selectionData: UnitSelectionData): void {
        this.selectedUnit = selectionData.unit;
        console.log('Unit selected:', selectionData);
        
        // Update selected unit info panel
        this.updateSelectedUnitInfo(selectionData.unit);
        
        // Show unit action buttons
        const unitInfoPanel = document.getElementById('selected-unit-info');
        if (unitInfoPanel) {
            unitInfoPanel.classList.remove('hidden');
        }

        // TODO: Highlight movement and attack options on the map
        console.log('Movement options:', selectionData.movableCoords);
        console.log('Attack options:', selectionData.attackableCoords);
    }

    private async moveUnit(fromQ: number, fromR: number, toQ: number, toR: number): Promise<void> {
        if (!this.gameState?.isReady()) {
            this.showToast('Error', 'Game not ready', 'error');
            return;
        }

        // Async WASM call
        await this.gameState.moveUnit(fromQ, fromR, toQ, toR);
        
        // Immediate UI feedback
        this.logGameEvent(`Unit moved from (${fromQ},${fromR}) to (${toQ},${toR})`);
        this.showToast('Success', 'Unit moved successfully', 'success');
        
        // Clear selection after successful move
        this.clearUnitSelection();
    }

    private async attackUnit(attackerQ: number, attackerR: number, defenderQ: number, defenderR: number): Promise<void> {
        if (!this.gameState?.isReady()) {
            this.showToast('Error', 'Game not ready', 'error');
            return;
        }

        // Async WASM call
        await this.gameState.attackUnit(attackerQ, attackerR, defenderQ, defenderR);
        
        // Immediate UI feedback
        this.logGameEvent(`Attack: (${attackerQ},${attackerR}) → (${defenderQ},${defenderR})`);
        this.showToast('Success', 'Attack completed', 'success');
        
        // Clear selection after attack
        this.clearUnitSelection();
    }

    private clearUnitSelection(): void {
        this.selectedUnit = null;
        
        // Hide unit info panel
        const unitInfoPanel = document.getElementById('selected-unit-info');
        if (unitInfoPanel) {
            unitInfoPanel.classList.add('hidden');
        }
        
        // TODO: Clear visual selection highlights
    }

    /**
     * Callback methods for Phaser scene interactions
     */

    /**
     * Handle tile click from PhaserWorldScene - show terrain info in TerrainStatsPanel
     * @returns false to suppress event emission (we handle it completely)
     */
    private onTileClicked = (q: number, r: number): boolean => {
        console.log(`[GameViewerPage] Tile clicked callback: Q=${q}, R=${r}`);

        if (!this.gameState?.isReady()) {
            console.warn('[GameViewerPage] Game not ready for tile clicks');
            return false; // Suppress event emission
        }

        if (!this.terrainStatsPanel) {
            console.warn('[GameViewerPage] TerrainStatsPanel not available');
            return false; // Suppress event emission
        }

        // Get terrain info from WASM via ui.go (async)
        this.gameState?.getTerrainStatsAt(q, r).then(terrainStats => {
            if (terrainStats != null) {
            console.log('[GameViewerPage] Retrieved terrain stats:', terrainStats);
            
            // Update terrain stats panel with the data
            this.terrainStatsPanel?.updateTerrainInfo({
                name: terrainStats.name || 'Unknown Terrain',
                tileType: terrainStats.tileType || 0,
                movementCost: terrainStats.movementCost || 1.0,
                defenseBonus: terrainStats.defenseBonus || 0.0,
                description: terrainStats.description || 'No description available',
                q: q,
                r: r,
                player: terrainStats.player
            });
            }
        }).catch(error => {
            console.error('Failed to get terrain stats:', error);
        });
        
        return false; // We handled it completely, suppress event emission
    };

    /**
     * Handle unit click from PhaserWorldScene - select unit or show unit info
     * @returns false to suppress event emission (we handle it completely)
     */
    private onUnitClicked = (q: number, r: number): boolean => {
        console.log(`[GameViewerPage] Unit clicked callback: Q=${q}, R=${r}`);

        if (!this.gameState?.isReady()) {
            console.warn('[GameViewerPage] Game not ready for unit clicks');
            return false; // Suppress event emission
        }

        // Handle async unit selection
        this.gameState.canSelectUnit(q, r, this.gameState.getGameData().currentPlayer).then(canSelect => {
            // Debug info to understand why selection might be failing
            console.log(`[GameViewerPage] Unit selection debug:`, {
                position: `(${q}, ${r})`,
                canSelect: canSelect,
                currentPlayer: (this.gameState as any).gameData?.currentPlayer,
                gameInitialized: (this.gameState as any).gameData?.gameInitialized
            });
            
            if (canSelect) {
                // This is a selectable unit - use existing selection logic
                this.selectUnitAt(q, r);
            } else {
                // This is an enemy or non-selectable unit - just show info
                console.log(`[GameViewerPage] Non-selectable unit at Q=${q}, R=${r}`);
                
                // Get basic tile info to show enemy unit details (async)
                this.gameState?.getTileInfo(q, r).then(tileInfo => {
                    console.log('[GameViewerPage] Enemy unit tile info:', tileInfo);
                    // For now, just show a message - could extend to show unit details panel later
                    this.showToast('Info', `Enemy unit at (${q}, ${r})`, 'info');
                }).catch(error => {
                    console.error('Failed to get tile info:', error);
                });
            }
        }).catch(error => {
            console.error('[GameViewerPage] Failed to handle unit click:', error);
        });
        
        return false; // Suppress event emission
    };

    /**
     * Select unit and show movement/attack highlights
     */
    private selectUnitAt(q: number, r: number): void {
        console.log(`[GameViewerPage] Selecting unit at Q=${q}, R=${r}`);
        
        if (!this.gameState?.isReady()) {
            console.warn('[GameViewerPage] Game not ready for unit selection');
            return;
        }

        // Get all data async with Promise.all
        Promise.all([
            this.gameState.getMovementOptions(q, r, this.gameState.getGameData().currentPlayer),
            this.gameState.getAttackOptions(q, r, this.gameState.getGameData().currentPlayer),
            this.gameState.getTileInfo(q, r)
        ]).then(([movementResult, attackResult, unitInfo]) => {
            console.log('[GameViewerPage] Movement options:', movementResult);
            console.log('[GameViewerPage] Attack options:', attackResult);
            console.log('[GameViewerPage] Unit info:', unitInfo);
            
            // Convert results to coordinate arrays (these are now direct arrays from our methods)
            const movableCoords = Array.isArray(movementResult) ? 
                movementResult.map((pos: any) => ({ q: pos.coord?.q || pos.q, r: pos.coord?.r || pos.r })) : [];
            
            const attackableCoords = Array.isArray(attackResult) ?
                attackResult.map((pos: any) => ({ q: pos.coord?.q || pos.q, r: pos.coord?.r || pos.r })) : [];
            
            console.log(`[GameViewerPage] Unit selection: ${movableCoords.length} movement options, ${attackableCoords.length} attack options`);
            
            // Update GameViewer to show highlights using layer-based approach
            if (this.worldViewer) {
                // Clear previous selection
                const selectionLayer = this.worldViewer.getSelectionHighlightLayer();
                const movementLayer = this.worldViewer.getMovementHighlightLayer();
                const attackLayer = this.worldViewer.getAttackHighlightLayer();
                
                if (selectionLayer && movementLayer && attackLayer) {
                    // Select the unit
                    selectionLayer.selectHex(q, r);
                    
                    // Show movement options
                    movementLayer.showMovementOptions(movableCoords);
                    
                    // Show attack options
                    attackLayer.showAttackOptions(attackableCoords);
                    
                    console.log('[GameViewerPage] Highlights sent to layers');
                } else {
                    console.warn('[GameViewerPage] Some highlight layers not available');
                }
            }
            
            // Update UI with unit info (unitInfo is now direct data, not wrapped in success/data)
            if (unitInfo) {
                this.updateSelectedUnitInfo(unitInfo);
            }
            
            // Add to game log
            console.log(`Unit selected at (${q}, ${r}) - ${movableCoords.length} moves, ${attackableCoords.length} attacks available`);
            
        }).catch(error => {
            console.error('[GameViewerPage] Failed to select unit:', error);
            this.showToast('Error', 'Failed to select unit', 'error');
        });
    }

    /**
     * UI update functions
     */
    private updateGameStatus(status: string, currentPlayer?: number): void {
        const statusElement = document.getElementById('game-status');
        if (statusElement) {
            statusElement.textContent = status;
            
            // Use player-specific background color, fallback to green for general messages
            const playerColorClass = currentPlayer ? PLAYER_BG_COLORS[currentPlayer] : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            statusElement.className = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${playerColorClass}`;
        }
    }

    private updateGameUIFromState(gameData: GameCreateData): void {
        // Update game status with player-specific color - use player ID directly
        this.updateGameStatus(`Ready - Player ${gameData.currentPlayer}'s Turn`, gameData.currentPlayer);
        
        // Update turn counter
        const turnElement = document.getElementById('turn-counter');
        if (turnElement) {
            turnElement.textContent = `Turn ${gameData.turnCounter}`;
        }
    }

    private updateSelectedUnitInfo(unit: any): void {
        const unitDetails = document.getElementById('unit-details');
        if (unitDetails) {
            unitDetails.innerHTML = `
                <div><strong>Type:</strong> ${unit.type || 'Unknown'}</div>
                <div><strong>Position:</strong> (${unit.q}, ${unit.r})</div>
                <div><strong>Player:</strong> ${unit.playerId || 'Unknown'}</div>
                <div><strong>Health:</strong> ${unit.health || 'Unknown'}</div>
            `;
        }
    }

    private initializeGameLog(): void {
        this.gameLog = [];
    }

    private logGameEvent(message: string): void {
        this.gameLog.push(message);
        
        // Update game log UI
        const gameLogElement = document.getElementById('game-log');
        if (gameLogElement) {
            const logEntry = document.createElement('div');
            logEntry.textContent = message;
            logEntry.className = 'text-xs text-gray-600 dark:text-gray-300';
            
            gameLogElement.appendChild(logEntry);
            
            // Keep only last 20 entries
            if (gameLogElement.children.length > 20) {
                gameLogElement.removeChild(gameLogElement.firstChild!);
            }
            
            // Scroll to bottom
            gameLogElement.scrollTop = gameLogElement.scrollHeight;
        }
    }
}

// Type definitions - using type alias instead of interface for simple data structures
type GameConfiguration = {
    playerCount: number;
    maxTurns: number;
    unitRestrictions: { [unitId: string]: string };
    playerTypes: { [playerId: string]: string };
    playerTeams: { [playerId: string]: number };
};

// Initialize page when DOM is ready using LifecycleController
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, starting GameViewerPage initialization...');
    
    // Create page instance (just basic setup)
    const gameViewerPage = new GameViewerPage("GameViewerPage");
    
    // Create lifecycle controller with debug logging
    const lifecycleController = new LifecycleController(gameViewerPage.eventBus, {
        enableDebugLogging: true,
        phaseTimeoutMs: 15000, // Increased timeout for WASM loading
        continueOnError: false // Fail fast for debugging
    });
    
    // Start breadth-first initialization
    await lifecycleController.initializeFromRoot(gameViewerPage);
    
    console.log('GameViewerPage fully initialized via LifecycleController');
});
