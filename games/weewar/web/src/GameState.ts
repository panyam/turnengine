import { BaseComponent } from '../lib/Component';
import { EventBus } from '../lib/EventBus';
import Weewar_v1_servicesClient from '../gen/wasm-clients/weewar_v1_servicesClient.client';
import { ProcessMovesRequest, ProcessMovesResponse, GetGameRequest, GetGameStateRequest, GetOptionsAtRequest, GameMove, WorldChange, MoveUnitAction, AttackUnitAction, EndTurnAction, GameState as ProtoGameState, Game as ProtoGame, WorldData } from '../gen/wasm-clients/weewar/v1/models'
import { create } from '@bufbuild/protobuf';

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
 * GameState component - Pure WASM interface for game operations
 * 
 * Core responsibilities:
 * 1. Load and manage WASM module
 * 2. Process game moves via ProcessMoves service  
 * 3. Provide query interface to WASM game data
 * 
 * No longer caches state - components query WASM directly when needed.
 */
export class GameState extends BaseComponent {
    private client: Weewar_v1_servicesClient;
    private wasmLoadPromise: Promise<void> | null;
    private wasmLoaded: boolean = false;
    private gameId: string = '';

    constructor(rootElement: HTMLElement, eventBus: EventBus, debugMode: boolean = false) {
        super('game-state', rootElement, eventBus, debugMode);
        
        // Initialize WASM client with Go compatibility enabled
        this.client = new Weewar_v1_servicesClient();
        this.wasmLoadPromise = this.loadWASMModule();
        
        // Initialize with empty objects (will be populated by loadGameDataToWasm)
        this.world = new World(eventBus, 'Loading...');
        this.status = 'loading'
        this.cachedGame = ProtoGame.from({
            id: '',
            name: 'Loading...',
            creatorId: '',
            worldId: ''
        });
        this.cachedGameState = ProtoGameState.from({
            gameId: '',
            currentPlayer: 0,
            turnCounter: 1,
        });
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
     * Load the WASM module using generated client
     */
    private async loadWASMModule(): Promise<void> {
        this.log('Loading WASM module with generated client...');
    
        await this.client.loadWasm('/static/wasm/weewar-cli.wasm');
        
        // Wait for Go-exported functions to be available on window.weewar
        await this.waitForGoFunctions();
        
        this.wasmLoaded = true;

        this.log('WASM module loaded successfully via generated client');
        this.emit('wasm-loaded', { success: true }, this);
    }
    
    /**
     * Wait for Go-exported functions to be available on window.weewar
     */
    private async waitForGoFunctions(): Promise<void> {
        const maxWaitTime = 10000; // 10 seconds
        const checkInterval = 100; // 100ms
        let elapsed = 0;
        
        while (elapsed < maxWaitTime) {
            const weewar = (window as any).weewar;
            if (weewar && weewar.loadGameData) {
                this.log('Go functions are now available on window.weewar');
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            elapsed += checkInterval;
        }
        
        throw new Error('Timeout waiting for Go-exported functions to be available');
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

        const gameId = this.cachedGame.id
        if (!gameId) {
            throw new Error('Game ID not set. Call setGameId() first.');
        }

        this.log('Processing moves:', moves);

        // Create request for ProcessMoves service
        const request = ProcessMovesRequest.from({
            gameId: gameId,
            moves: moves
        });

        // Call the ProcessMoves service  
        const response: ProcessMovesResponse = await client.gamesService.processMoves(request);

        // Extract world changes from move results (each move result contains its own changes)
        const worldChanges: WorldChange[] = [];
        for (const moveResult of response.moveResults || []) {
            worldChanges.push(...(moveResult.changes || []));
        }
        
        this.log('Received ProcessMoves response:', {
            moveResultsCount: response.moveResults?.length || 0,
            totalWorldChanges: worldChanges.length,
            worldChanges: worldChanges
        });

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
            if (change.unitMoved) {
                this.applyUnitMovedToWorld(change.unitMoved);
                worldUpdated = true;
                this.log('Applied unit move to World object:', change.unitMoved);
            }

            if (change.unitDamaged) {
                this.applyUnitDamagedToWorld(change.unitDamaged);
                worldUpdated = true;
                this.log('Applied unit damage to World object:', change.unitDamaged);
            }

            if (change.unitKilled) {
                this.applyUnitKilledToWorld(change.unitKilled);
                worldUpdated = true;
                this.log('Applied unit death to World object:', change.unitKilled);
            }
            
            // Update cached GameState for player changes
            if (change.playerChanged) {
                this.cachedGameState = ProtoGameState.from({
                    ...this.cachedGameState,
                    currentPlayer: change.playerChanged.newPlayer,
                    turnCounter: change.playerChanged.newTurn
                });
                gameStateUpdated = true;
                this.log('Updated cached GameState for player change:', change.playerChanged);
                
                // Apply reset units to World (units with refreshed movement points)
                if (change.playerChanged.resetUnits && change.playerChanged.resetUnits.length > 0) {
                    console.log('DEBUG applying reset units:', change.playerChanged.resetUnits);
                    for (const resetUnit of change.playerChanged.resetUnits) {
                        const existingUnit = this.world.getUnitAt(resetUnit.q, resetUnit.r);
                        console.log(`DEBUG reset unit at (${resetUnit.q}, ${resetUnit.r}): distanceLeft=${resetUnit.distanceLeft}, existing unit:`, existingUnit);
                        this.world.setUnitDirect(resetUnit);
                        console.log(`DEBUG unit after setUnitDirect:`, this.world.getUnitAt(resetUnit.q, resetUnit.r));
                    }
                    worldUpdated = true;
                    this.log(`Applied ${change.playerChanged.resetUnits.length} reset units to World`);
                }
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
        console.log('DEBUG applyUnitMovedToWorld:', unitMoved);
        console.log('DEBUG previousUnit:', unitMoved.previousUnit);
        console.log('DEBUG updatedUnit:', unitMoved.updatedUnit);
        
        // Remove unit from source position using previous unit location
        if (unitMoved.previousUnit) {
            this.world.removeUnitAt(unitMoved.previousUnit.q, unitMoved.previousUnit.r);
        }
        
        // Use the complete updated unit state from the server
        if (unitMoved.updatedUnit) {
            console.log('DEBUG setting unit direct with:', unitMoved.updatedUnit);
            this.world.setUnitDirect(unitMoved.updatedUnit);
            this.log(`Moved unit from (${unitMoved.previousUnit?.q}, ${unitMoved.previousUnit?.r}) to (${unitMoved.updatedUnit.q}, ${unitMoved.updatedUnit.r})`);
        } else {
            this.log(`No updated unit data provided for move`);
        }
    }

    /**
     * Apply unit damage to the shared World object
     */
    private applyUnitDamagedToWorld(unitDamaged: any): void {
        // Use the complete updated unit state from the server
        if (unitDamaged.updatedUnit) {
            this.world.setUnitDirect(unitDamaged.updatedUnit);
            this.log(`Unit at (${unitDamaged.updatedUnit.q}, ${unitDamaged.updatedUnit.r}) damaged: ${unitDamaged.previousUnit?.availableHealth} -> ${unitDamaged.updatedUnit.availableHealth}`);
        } else {
            this.log(`No updated unit data provided for damage`);
        }
    }

    /**
     * Apply unit death to the shared World object
     */
    private applyUnitKilledToWorld(unitKilled: any): void {
        // Remove the unit from the world using previous unit location
        if (unitKilled.previousUnit) {
            const removed = this.world.removeUnitAt(unitKilled.previousUnit.q, unitKilled.previousUnit.r);
            if (removed) {
                this.log(`Removed killed unit at (${unitKilled.previousUnit.q}, ${unitKilled.previousUnit.r}): player ${unitKilled.previousUnit.player} unit type ${unitKilled.previousUnit.unitType}`);
            } else {
                this.log(`No unit found at (${unitKilled.previousUnit.q}, ${unitKilled.previousUnit.r}) to remove`);
            }
        } else {
            this.log(`No previous unit data provided for killed unit`);
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
            if (change.playerChanged) {
                this.emit('turn-ended', {
                    previousPlayer: change.playerChanged.previousPlayer,
                    currentPlayer: change.playerChanged.newPlayer,
                    turnCounter: change.playerChanged.newTurn
                }, this);
            }

            if (change.unitMoved) {
                this.emit('unit-moved', {
                    from: { q: change.unitMoved.previousUnit?.q || 0, r: change.unitMoved.previousUnit?.r || 0 },
                    to: { q: change.unitMoved.updatedUnit?.q || 0, r: change.unitMoved.updatedUnit?.r || 0 }
                }, this);
            }

            if (change.unitDamaged) {
                this.emit('unit-damaged', {
                    position: { q: change.unitDamaged.updatedUnit?.q || 0, r: change.unitDamaged.updatedUnit?.r || 0 },
                    previousHealth: change.unitDamaged.previousUnit?.availableHealth || 0,
                    newHealth: change.unitDamaged.updatedUnit?.availableHealth || 0
                }, this);
            }

            if (change.unitKilled) {
                this.emit('unit-killed', {
                    position: { q: change.unitKilled.previousUnit?.q || 0, r: change.unitKilled.previousUnit?.r || 0 },
                    player: change.unitKilled.previousUnit?.player || 0,
                    unitType: change.unitKilled.previousUnit?.unitType || 0
                }, this);
            }
        }
    }

    /**
     * Helper function to create GameMove for unit movement
     */
    public static createMoveUnitAction(fromQ: number, fromR: number, toQ: number, toR: number, playerId: number): GameMove {
        const moveAction = MoveUnitAction.from({
            fromQ: fromQ,
            fromR: fromR,
            toQ: toQ,
            toR: toR
        });

        return GameMove.from({ player: playerId, moveUnit: moveAction, });
    }

    /**
     * Helper function to create GameMove for unit attack
     */
    public static createAttackUnitAction(attackerQ: number, attackerR: number, defenderQ: number, defenderR: number, playerId: number): GameMove {
        const attackAction = AttackUnitAction.from({
            attackerQ: attackerQ,
            attackerR: attackerR,
            defenderQ: defenderQ,
            defenderR: defenderR
        });

        return GameMove.from({ player: playerId, attackUnit: attackAction });
    }

    /**
     * Helper function to create GameMove for end turn
     */
    public static createEndTurnAction(playerId: number): GameMove {
        const endTurnAction = EndTurnAction.from({});
        return GameMove.from({ player: playerId, endTurn: endTurnAction });
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
        
        // Debug: Log the actual content to understand what we're getting
        this.log('Raw game data from page:', gameElement.textContent?.substring(0, 100) + '...');
        this.log('Raw game state from page:', (gameStateElement?.textContent || 'null').substring(0, 100) + '...');
        this.log('Raw history from page:', (historyElement?.textContent || 'null').substring(0, 100) + '...');
        
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
        
        // Call WASM loadGameData function - check if it exists first
        const weewar = (window as any).weewar;
        if (!weewar || !weewar.loadGameData) {
            throw new Error('WASM loadGameData function not available. WASM module may not be fully loaded.');
        }
        
        this.log('Calling WASM loadGameData with game data bytes');
        const wasmResult = weewar.loadGameData(gameBytes, gameStateBytes, historyBytes);
        
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
        const req = GetGameRequest.from({ id: 'test' })
        const gameResponse = await client.gamesService.getGame(req);
        
        if (!gameResponse.game || !gameResponse.state) {
            throw new Error('No game data returned from WASM');
        }
        
        // Update cached Game and GameState from WASM response
        this.cachedGame = gameResponse.game;
        this.cachedGameState = gameResponse.state;
        
        // Update World object from game data for UI rendering
        if (gameResponse.state.worldData) {
            this.world.setName(gameResponse.game.name || 'Untitled Game');
            console.log('DEBUG gameResponse.state.worldData.units:', gameResponse.state.worldData.units);
            gameResponse.state.worldData.units?.forEach((unit: Unit, i: number) => {
                console.log(`DEBUG unit ${i}:`, unit);
                console.log(`DEBUG unit ${i} distanceLeft: ${unit.distanceLeft}, availableHealth: ${unit.availableHealth}`);
            });
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
     * Get the World object for UI rendering
     * GameState owns the World, other components should access it via this getter
     */
    public getWorld(): World {
        return this.world;
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
     * Legacy method for compatibility with GameViewerPage
     * Returns unit info at the specified position if there is one
     */
    public async getTileInfo(q: number, r: number): Promise<any> {
        try {
            // Get unit info from the world data
            const unit = this.world.getUnitAt(q, r);
            if (unit) {
                this.log(`getTileInfo(${q}, ${r}): Unit player=${unit.player}, type=${unit.unitType}`);
                return {
                    hasUnit: true,
                    player: unit.player,
                    unitType: unit.unitType,
                    // Add other unit properties as needed
                };
            } else {
                this.log(`getTileInfo(${q}, ${r}): No unit found`);
                return {
                    hasUnit: false
                };
            }
        } catch (error) {
            this.log(`Error in getTileInfo: ${error}`);
            return null;
        }
    }


    /**
     * New unified method to get all options at a position
     * Replaces canSelectUnit, getMovementOptions, getAttackOptions
     */
    public async getOptionsAt(q: number, r: number): Promise<any> {
        console.log(`DEBUG getOptionsAt called with q=${q}, r=${r}`);
        const client = await this.ensureWASMLoaded();
        
        try {
            const gameId = this.cachedGame?.id;
            if (!gameId) {
                this.log('No game ID available for getOptionsAt');
                return { options: [], currentPlayer: 0, gameInitialized: false };
            }

            const request = GetOptionsAtRequest.from({
                gameId: gameId,
                q: q,
                r: r
            });
            console.log('DEBUG getOptionsAt request:', request);

            const response = await client.gamesService.getOptionsAt(request);
            console.log('DEBUG getOptionsAt response:', response);
            
            this.log(`getOptionsAt(${q}, ${r}): ${response.options?.length || 0} options, currentPlayer: ${response.currentPlayer}`);
            return response;
        } catch (error) {
            console.log(`DEBUG Error in getOptionsAt: ${error}`);
            this.log(`Error in getOptionsAt: ${error}`);
            return { options: [], currentPlayer: 0, gameInitialized: false };
        }
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
