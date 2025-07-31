import { BaseComponent } from '../lib/Component';
import { EventBus } from '../lib/EventBus';
import Weewar_v1_servicesClient from '../gen/wasm-clients/weewar_v1_servicesClient.client';
import { ProcessMovesRequest, ProcessMovesResponse, ProcessMovesRequestSchema, GetGameRequest, GetGameRequestSchema, GetGameStateRequest, GetGameStateRequestSchema } from '../gen/weewar/v1/games_pb';
import { GameMove, WorldChange, GameMoveSchema, MoveUnitAction, MoveUnitActionSchema, AttackUnitAction, AttackUnitActionSchema, EndTurnAction, EndTurnActionSchema, TerrainDefinition, UnitDefinition, GameState as ProtoGameState, GameStateSchema as ProtoGameStateSchema, Game as ProtoGame, GameSchema as ProtoGameSchema } from '../gen/weewar/v1/models_pb';
import { create } from '@bufbuild/protobuf';
import { World } from './World';

/**
 * Legacy interface for backward compatibility with GameViewerPage  
 * TODO: Remove once GameViewerPage is updated to use new architecture
 */
export interface UnitSelectionData {
    unit: any;
    movableCoords: Array<{ coord: { Q: number; R: number }; cost: number }>;
    attackableCoords: Array<{ Q: number; R: number }>;
}

/**
 * Terrain stats class combining TerrainDefinition with tile coordinate data
 * Extends the generated TerrainDefinition with position information
 */
export class TerrainStats {
    public readonly terrainDefinition: TerrainDefinition;
    public readonly q: number;
    public readonly r: number;
    public readonly player: number;

    constructor(terrainDefinition: TerrainDefinition, q: number, r: number, player: number = 0) {
        this.terrainDefinition = terrainDefinition;
        this.q = q;
        this.r = r;
        this.player = player;
    }

    // Convenience getters that delegate to TerrainDefinition
    get id(): number { return this.terrainDefinition.id; }
    get name(): string { return this.terrainDefinition.name; }
    get baseMoveCost(): number { return this.terrainDefinition.baseMoveCost; }
    get defenseBonus(): number { return this.terrainDefinition.defenseBonus; }
    get type(): number { return this.terrainDefinition.type; }
    get description(): string { return this.terrainDefinition.description; }
}

/**
 * GameState component - Minimal controller for ProcessMoves and world state management
 * 
 * Core responsibilities:
 * 1. Process game moves via ProcessMoves service
 * 2. Apply world changes to internal state
 * 3. Notify observers (UI components) of state changes
 * 
 * This replaces the previous 13+ manual WASM methods with a clean service-based approach.
 */
export class GameState extends BaseComponent {
    private client: Weewar_v1_servicesClient;
    private wasmLoadPromise: Promise<void> | null;
    private wasmLoaded: boolean = false;
    private gameId: string = '';
    private world: World;
    status: string
    
    // Local cache of Game and GameState protos for query optimization (avoid WASM calls)
    // Source of truth is WASM, this is just a performance cache
    private cachedGame: ProtoGame;
    private cachedGameState: ProtoGameState;
    
    // Cached rules engine data (loaded from page JSON)
    private terrainDefinitions: { [id: number]: TerrainDefinition } = {};
    private unitDefinitions: { [id: number]: UnitDefinition } = {};

    constructor(rootElement: HTMLElement, eventBus: EventBus, debugMode: boolean = false) {
        super('game-state', rootElement, eventBus, debugMode);
        
        // Initialize WASM client and loading
        this.client = new Weewar_v1_servicesClient();
        this.wasmLoadPromise = this.loadWASMModule();
        
        // Initialize with empty objects (will be populated by loadGameDataToWasm)
        this.world = new World(eventBus, 'Loading...');
        this.status = 'loading'
        this.cachedGame = create(ProtoGameSchema, {
            id: '',
            name: 'Loading...',
            creatorId: '',
            worldId: ''
        });
        this.cachedGameState = create(ProtoGameStateSchema, {
            gameId: '',
            currentPlayer: 0,
            turnCounter: 1,
        });
        
        // Load rules engine data from page
        this.loadRulesEngineData();
    }

    protected initializeComponent(): void {
        this.log('Initializing WASM-centric GameState controller...');
        
        // WASM initialization happens automatically in constructor
        // Game data loading is now handled by GameViewerPage calling loadGameDataToWasm()
    }

    protected destroyComponent(): void {
        // this.client = null;
        this.wasmLoadPromise = null;
    }

    /**
     * Load rules engine data from embedded JSON in page
     */
    private loadRulesEngineData(): void {
        // Load terrain definitions
        const terrainElement = document.getElementById('terrain-data-json');
        if (terrainElement && terrainElement.textContent) {
            const terrainData = JSON.parse(terrainElement.textContent);
            this.terrainDefinitions = terrainData;
            this.log('Loaded terrain definitions:', { count: Object.keys(this.terrainDefinitions).length });
        }

        // Load unit definitions  
        const unitElement = document.getElementById('unit-data-json');
        if (unitElement && unitElement.textContent) {
            const unitData = JSON.parse(unitElement.textContent);
            this.unitDefinitions = unitData;
            this.log('Loaded unit definitions:', { count: Object.keys(this.unitDefinitions).length });
        }
    }

    /**
     * Load the WASM module using generated client
     */
    private async loadWASMModule(): Promise<void> {
        this.log('Loading WASM module with generated client...');
    
        await this.client.loadWasm('/static/wasm/weewar-cli.wasm');
        
        this.wasmLoaded = true;

        this.log('WASM module loaded successfully via generated client');
        this.emit('wasm-loaded', { success: true }, this);
    }

    /**
     * Ensure WASM module is loaded before API calls
     */
    private async ensureWASMLoaded(): Promise<Weewar_v1_servicesClient> {
        if (this.wasmLoaded && this.client.isReady()) {
            return this.client;
        }

        if (!this.wasmLoadPromise) {
            throw new Error('WASM loading not started');
        }

        await this.wasmLoadPromise;

        if (!this.wasmLoaded || !this.client.isReady()) {
            throw new Error('WASM module failed to load');
        }
        return this.client;
    }

    /**
     * Check if WASM is ready for operations
     */
    public isReady(): boolean {
        return this.wasmLoaded;
    }

    /**
     * Wait for WASM to be ready (use during initialization)
     */
    public async waitUntilReady(): Promise<void> {
        await this.ensureWASMLoaded();
    }
    
    /**
     * Get the current game ID
     */
    public getGameId(): string {
        return this.cachedGameState.gameId;
    }
    
    /**
     * Get the shared world object (used by all UI components)
     */
    public getWorld(): World {
        return this.world;
    }

    /**
     * CORE METHOD: Process game moves and apply world changes
     * 
     * This is the primary interface for all game actions:
     * - Unit movements
     * - Unit attacks  
     * - End turn actions
     * - Any other game state modifications
     */
    public async processMoves(moves: GameMove[]): Promise<WorldChange[]> {
        const client = await this.ensureWASMLoaded();

        if (!this.gameId) {
            throw new Error('Game ID not set. Call setGameId() first.');
        }

        this.log('Processing moves:', moves);

        // Create request for ProcessMoves service
        const request = create(ProcessMovesRequestSchema, {
            gameId: this.gameId,
            moves: moves
        });

        // Call the ProcessMoves service  
        const response: ProcessMovesResponse = await client.gamesService.processMoves(request);

        // Extract world changes from response
        const worldChanges = response.changes || [];
        
        this.log('Received world changes:', worldChanges);

        // Apply changes to internal state and notify observers
        this.applyWorldChanges(worldChanges);
        
        return worldChanges;
    }

    /**
     * Apply world changes to World object and cached GameState for UI rendering
     * Note: Authoritative game state is maintained in WASM, this only updates UI layer
     */
    private applyWorldChanges(changes: WorldChange[]): void {
        let worldUpdated = false;
        let gameStateUpdated = false;

        // Process each world change and update both World object and cached GameState
        for (const change of changes) {
            if (change.changeType.case === 'unitMoved') {
                this.applyUnitMovedToWorld(change.changeType.value);
                worldUpdated = true;
                this.log('Applied unit move to World object:', change.changeType.value);
            }

            if (change.changeType.case === 'unitDamaged') {
                this.applyUnitDamagedToWorld(change.changeType.value);
                worldUpdated = true;
                this.log('Applied unit damage to World object:', change.changeType.value);
            }

            if (change.changeType.case === 'unitKilled') {
                this.applyUnitKilledToWorld(change.changeType.value);
                worldUpdated = true;
                this.log('Applied unit death to World object:', change.changeType.value);
            }
            
            // Update cached GameState for player changes
            if (change.changeType.case === 'playerChanged') {
                this.cachedGameState = create(ProtoGameStateSchema, {
                    ...this.cachedGameState,
                    currentPlayer: change.changeType.value.newPlayer,
                    turnCounter: change.changeType.value.newTurn
                });
                gameStateUpdated = true;
                this.log('Updated cached GameState for player change:', change.changeType.value);
            }
        }

        if (worldUpdated || gameStateUpdated) {
            this.notifyObservers(changes);
        }
    }

    /**
     * Apply unit movement to the shared World object
     */
    private applyUnitMovedToWorld(unitMoved: any): void {
        // Get the unit at the source position
        const unit = this.world.getUnitAt(unitMoved.fromQ, unitMoved.fromR);
        if (!unit) {
            this.log(`No unit found at (${unitMoved.fromQ}, ${unitMoved.fromR}) to move`);
            return;
        }

        // Remove unit from source position
        this.world.removeUnitAt(unitMoved.fromQ, unitMoved.fromR);
        
        // Place unit at destination position
        this.world.setUnitAt(unitMoved.toQ, unitMoved.toR, unit.unitType, unit.player);
        
        this.log(`Moved unit from (${unitMoved.fromQ}, ${unitMoved.fromR}) to (${unitMoved.toQ}, ${unitMoved.toR})`);
    }

    /**
     * Apply unit damage to the shared World object
     */
    private applyUnitDamagedToWorld(unitDamaged: any): void {
        // Get the unit at the specified position
        const unit = this.world.getUnitAt(unitDamaged.q, unitDamaged.r);
        if (!unit) {
            this.log(`No unit found at (${unitDamaged.q}, ${unitDamaged.r}) to damage`);
            return;
        }

        // Note: The World class doesn't currently track health, so we just log this change
        // The actual health tracking would happen in a more detailed unit model
        this.log(`Unit at (${unitDamaged.q}, ${unitDamaged.r}) damaged: ${unitDamaged.previousHealth} -> ${unitDamaged.newHealth}`);
    }

    /**
     * Apply unit death to the shared World object
     */
    private applyUnitKilledToWorld(unitKilled: any): void {
        // Remove the unit from the world
        const removed = this.world.removeUnitAt(unitKilled.q, unitKilled.r);
        if (removed) {
            this.log(`Removed killed unit at (${unitKilled.q}, ${unitKilled.r}): player ${unitKilled.player} unit type ${unitKilled.unitType}`);
        } else {
            this.log(`No unit found at (${unitKilled.q}, ${unitKilled.r}) to remove`);
        }
    }

    /**
     * Notify all observers (UI components) of world state changes
     */
    private notifyObservers(changes: WorldChange[]): void {
        // Emit specific events for different types of changes
        this.emit('world-changed', { 
            changes: changes,
            world: this.world
        }, this);

        // Emit granular events for specific UI components
        for (const change of changes) {
            if (change.changeType.case === 'playerChanged') {
                this.emit('turn-ended', {
                    previousPlayer: change.changeType.value.previousPlayer,
                    currentPlayer: change.changeType.value.newPlayer,
                    turnCounter: change.changeType.value.newTurn
                }, this);
            }

            if (change.changeType.case === 'unitMoved') {
                this.emit('unit-moved', {
                    from: { q: change.changeType.value.fromQ, r: change.changeType.value.fromR },
                    to: { q: change.changeType.value.toQ, r: change.changeType.value.toR }
                }, this);
            }

            if (change.changeType.case === 'unitDamaged') {
                this.emit('unit-damaged', {
                    position: { q: change.changeType.value.q, r: change.changeType.value.r },
                    previousHealth: change.changeType.value.previousHealth,
                    newHealth: change.changeType.value.newHealth
                }, this);
            }

            if (change.changeType.case === 'unitKilled') {
                this.emit('unit-killed', {
                    position: { q: change.changeType.value.q, r: change.changeType.value.r },
                    player: change.changeType.value.player,
                    unitType: change.changeType.value.unitType
                }, this);
            }
        }
    }

    /**
     * Helper function to create GameMove for unit movement
     */
    public static createMoveUnitAction(fromQ: number, fromR: number, toQ: number, toR: number, playerId: number): GameMove {
        const moveAction = create(MoveUnitActionSchema, {
            fromQ: fromQ,
            fromR: fromR,
            toQ: toQ,
            toR: toR
        });

        return create(GameMoveSchema, {
            player: playerId,
            moveType: {
                case: 'moveUnit',
                value: moveAction
            }
        });
    }

    /**
     * Helper function to create GameMove for unit attack
     */
    public static createAttackUnitAction(attackerQ: number, attackerR: number, defenderQ: number, defenderR: number, playerId: number): GameMove {
        const attackAction = create(AttackUnitActionSchema, {
            attackerQ: attackerQ,
            attackerR: attackerR,
            defenderQ: defenderQ,
            defenderR: defenderR
        });

        return create(GameMoveSchema, {
            player: playerId,
            moveType: {
                case: 'attackUnit',
                value: attackAction
            }
        });
    }

    /**
     * Helper function to create GameMove for end turn
     */
    public static createEndTurnAction(playerId: number): GameMove {
        const endTurnAction = create(EndTurnActionSchema, {});

        return create(GameMoveSchema, {
            player: playerId,
            moveType: {
                case: 'endTurn',
                value: endTurnAction
            }
        });
    }

    /**
     * Load game data into WASM singletons from page elements
     * This populates the WASM singleton objects that serve as the source of truth
     */
    public async loadGameDataToWasm(): Promise<void> {
        await this.ensureWASMLoaded();
        
        // Get raw JSON data from page elements
        const gameElement = document.getElementById('game.data-json');
        const gameStateElement = document.getElementById('game-state-data-json');
        const historyElement = document.getElementById('game-history-data-json');
        
        if (!gameElement?.textContent || gameElement.textContent.trim() === 'null') {
            throw new Error('No game data found in page elements');
        }
        
        // Convert JSON strings to Uint8Array for WASM
        const gameBytes = new TextEncoder().encode(gameElement.textContent);
        const gameStateBytes = new TextEncoder().encode(
            gameStateElement?.textContent && gameStateElement.textContent.trim() !== 'null' 
                ? gameStateElement.textContent 
                : '{}'
        );
        const historyBytes = new TextEncoder().encode(
            historyElement?.textContent && historyElement.textContent.trim() !== 'null'
                ? historyElement.textContent
                : '{"gameId":"","groups":[]}'
        );
        
        // Call WASM loadGameData function
        const wasmResult = (window as any).weewar.loadGameData(gameBytes, gameStateBytes, historyBytes);
        
        if (!wasmResult.success) {
            throw new Error(`WASM load failed: ${wasmResult.error}`);
        }
        
        this.log('Game data loaded into WASM singletons:', wasmResult.message);
        
        // Now get the loaded game data from WASM to initialize our World object
        await this.initializeWorldFromWasm();
    }

    /**
     * Initialize local World and cached GameState from WASM data
     */
    private async initializeWorldFromWasm(): Promise<void> {
        const client = await this.ensureWASMLoaded();
        
        // Get game data from WASM to extract game ID and world data
        const gameResponse = await client.gamesService.getGame(create(GetGameRequestSchema, { id: '' }));
        
        if (!gameResponse.game || !gameResponse.state) {
            throw new Error('No game data returned from WASM');
        }
        
        // Update cached Game and GameState from WASM response
        this.cachedGame = gameResponse.game;
        this.cachedGameState = gameResponse.state;
        
        // Update World object from game data for UI rendering
        if (gameResponse.state.worldData) {
            this.world.setName(gameResponse.game.name || 'Untitled Game');
            this.world.loadTilesAndUnits(
                gameResponse.state.worldData.tiles || [],
                gameResponse.state.worldData.units || []
            );
        }
        
        this.log('World and cached GameState initialized from WASM data');
        
        // Notify observers that world has been loaded/updated
        this.emit('world-loaded', { world: this.world }, this);
    }


    /**
     * Legacy method for compatibility with GameViewerPage
     * Creates an EndTurn action and processes it
     */
    public async endTurn(playerId: number): Promise<void> {
        const endTurnMove = GameState.createEndTurnAction(playerId);
        await this.processMoves([endTurnMove]);
    }

    /**
     * Legacy method for compatibility with GameViewerPage
     * Returns current game state data from local cache (avoids WASM calls)
     */
    public getGameState(): ProtoGameState {
        return this.cachedGameState;
    }
    
    /**
     * Get cached Game proto object for instant access (avoids WASM calls)
     * Source of truth is WASM, this is just a performance cache
     */
    public getGame(): ProtoGame {
        return this.cachedGame;
    }

    /**
     * Legacy method for compatibility with GameViewerPage
     * Creates a MoveUnit action and processes it
     */
    public async moveUnit(fromQ: number, fromR: number, toQ: number, toR: number): Promise<void> {
        // Get current player from cached GameState
        const currentPlayer = this.cachedGameState.currentPlayer || 1;
        
        const moveAction = GameState.createMoveUnitAction(fromQ, fromR, toQ, toR, currentPlayer);
        await this.processMoves([moveAction]);
    }

    /**
     * Legacy method for compatibility with GameViewerPage
     * Creates an AttackUnit action and processes it
     */
    public async attackUnit(attackerQ: number, attackerR: number, defenderQ: number, defenderR: number): Promise<void> {
        // Get current player from cached GameState
        const currentPlayer = this.cachedGameState.currentPlayer || 1;
        
        const attackAction = GameState.createAttackUnitAction(attackerQ, attackerR, defenderQ, defenderR, currentPlayer);
        await this.processMoves([attackAction]);
    }

    /**
     * Get terrain stats for a tile at the specified coordinates
     * Combines World tile data with TerrainDefinition from rules engine
     */
    public async getTerrainStatsAt(q: number, r: number): Promise<TerrainStats | null> {
        // Find the tile at coordinates (q, r)
        const tile = this.world.getTileAt(q, r)
        if (!tile) {
            this.log(`No tile found at coordinates (${q}, ${r})`);
            return null;
        }

        // Look up the TerrainDefinition using the tile's tileType
        const terrainDefinition = this.terrainDefinitions[tile.tileType];
        if (!terrainDefinition) {
            this.log(`No terrain definition found for tile type ${tile.tileType}`);
            return null;
        }

        // Create and return TerrainStats instance
        const terrainStats = new TerrainStats(terrainDefinition, q, r, tile.player);
        this.log(`Created terrain stats for tile at (${q}, ${r}):`, {
            name: terrainStats.name,
            type: terrainStats.type,
            baseMoveCost: terrainStats.baseMoveCost,
            defenseBonus: terrainStats.defenseBonus
        });

        return terrainStats;
    }

    /**
     * Legacy method for compatibility with GameViewerPage
     * Uses canSelectUnit service
     */
    public async canSelectUnit(q: number, r: number, playerId: number): Promise<boolean> {
        const client = await this.ensureWASMLoaded();
        
        // TODO: Implement using gamesService.canSelectUnit
        this.log('canSelectUnit called - needs implementation');
        return false;
    }

    /**
     * Legacy method for compatibility with GameViewerPage
     * TODO: Implement using local world access
     */
    public async getTileInfo(q: number, r: number): Promise<any> {
        // TODO: Access world data directly
        this.log('getTileInfo called - needs implementation');
        return null;
    }

    /**
     * Legacy method for compatibility with GameViewerPage
     * Uses getMovementOptions service
     */
    public async getMovementOptions(q: number, r: number, playerId: number): Promise<any[]> {
        const client = await this.ensureWASMLoaded();
        
        // TODO: Implement using gamesService.getMovementOptions
        this.log('getMovementOptions called - needs implementation');
        return [];
    }

    /**
     * Legacy method for compatibility with GameViewerPage
     * Uses getAttackOptions service
     */
    public async getAttackOptions(q: number, r: number, playerId: number): Promise<any[]> {
        const client = await this.ensureWASMLoaded();
        
        // TODO: Implement using gamesService.getAttackOptions
        this.log('getAttackOptions called - needs implementation');
        return [];
    }

    /**
     * Initialize game save/load bridge functions for WASM BrowserSaveHandler
     * These functions are called by the Go BrowserSaveHandler implementation
     */
    public static initializeSaveBridge(): void {
        // Set up bridge functions that WASM BrowserSaveHandler expects
        (window as any).gameSaveHandler = async (sessionData: string): Promise<string> => {
            const response = await fetch('/api/v1/games/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: sessionData
            });
            
            if (!response.ok) {
                throw new Error(`Save failed: ${response.statusText}`);
            }
            
            const result = await response.json();
            return JSON.stringify({ success: true, sessionId: result.sessionId });
        };
        
        console.log('Game save/load bridge functions initialized');
    }
}
