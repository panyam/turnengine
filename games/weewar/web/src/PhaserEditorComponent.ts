import { BaseComponent } from '../lib/Component';
import { LCMComponent } from '../lib/LCMComponent';
import { EventBus } from '../lib/EventBus';
import { EditorEventTypes, TileClickedPayload, PhaserReadyPayload, TilePaintedPayload, UnitPlacedPayload, TileClearedPayload, UnitRemovedPayload, ReferenceImageLoadedPayload, GridSetVisibilityPayload, CoordinatesSetVisibilityPayload, ReferenceSetModePayload, ReferenceSetAlphaPayload, ReferenceSetPositionPayload, ReferenceSetScalePayload } from './events';
import { PhaserEditorScene } from './phaser/PhaserEditorScene';
import { WorldEditorPageState, PageStateEventType } from './WorldEditorPageState';
import { Unit, Tile, World, WorldEventType, TilesChangedEventData, UnitsChangedEventData, WorldLoadedEventData } from './World';

/**
 * PhaserEditorComponent - Manages the Phaser.js-based world editor interface using BaseComponent architecture
 * 
 * Responsibilities:
 * - Initialize and manage Phaser.js world editor lifecycle
 * - Handle editor-specific DOM container setup
 * - Emit tile click events to EventBus
 * - Listen for tool changes (terrain, unit, brush size) from EditorToolsPanel
 * - Manage world rendering, camera controls, and visual settings
 * - Handle world data loading and saving operations
 * - Manage reference image features for overlay/background
 * 
 * Does NOT handle:
 * - Tool selection UI (handled by EditorToolsPanel)
 * - Layout management (handled by parent dockview)
 * - Save/load UI (will be handled by SaveLoadComponent)
 * - Direct DOM manipulation outside of phaser-container
 */
export class PhaserEditorComponent extends BaseComponent implements LCMComponent {
    public editorScene: PhaserEditorScene;
    private isInitialized: boolean = false;
    
    // Dependencies (injected in phase 2)
    private pageState: WorldEditorPageState;
    private world: World;
    
    // =============================================================================
    // LCMComponent Interface Implementation
    // =============================================================================

    /**
     * Phase 1: Initialize DOM and discover child components
     */
    public performLocalInit(): LCMComponent[] {
        this.log('PhaserEditorComponent: performLocalInit() - Phase 1');
        
        // Subscribe to EventBus events now that dependencies are available
        this.subscribeToEvents();
        
        // Set up Phaser container within our root element
        this.setupPhaserContainer();
        
        // Bind toolbar event handlers
        this.bindToolbarEvents();
        
        this.log('PhaserEditorComponent: DOM setup complete');
        
        // This is a leaf component - no children
        return [];
    }

    /**
     * Phase 2: Inject dependencies
     */
    public setupDependencies(): void {
        this.log('PhaserEditorComponent: setupDependencies() - Phase 2');
        
        // Dependencies should be set by parent using setters
        // This phase validates that required dependencies are available
        if (!this.pageState) {
            throw new Error('PhaserEditorComponent requires pageState - use setPageState()');
        }
        
        this.log('PhaserEditorComponent: Dependencies validation complete');
    }

    /**
     * Phase 3: Activate component when all dependencies are ready
     */
    public async activate(): Promise<void> {
        this.log('PhaserEditorComponent: activate() - Phase 3');
        
        // Initialize Phaser editor now that dependencies are ready
        await this.initializePhaserEditor();
        
        this.log('PhaserEditorComponent: activation complete');
    }

    /**
     * Cleanup phase
     */
    public deactivate(): void {
        this.log('PhaserEditorComponent: deactivate() - cleanup');
        this.destroy();
    }

    // Explicit dependency setters
    public setPageState(pageState: WorldEditorPageState): void {
        this.pageState = pageState;
        this.log('PageState dependency set via explicit setter');
    }

    public setWorld(world: World): void {
        this.world = world;
        this.log('World dependency set via explicit setter');
    }

    // Explicit dependency getters
    public getPageState(): WorldEditorPageState | null {
        return this.pageState;
    }

    public getWorld(): World | null {
        return this.world;
    }

    /**
     * Subscribe to all EventBus events (called in activate phase)
     */
    private subscribeToEvents(): void {
        this.log('Subscribing to EventBus events');
        
        // Subscribe to reference image events from ReferenceImagePanel
        this.addSubscription(EditorEventTypes.REFERENCE_IMAGE_LOADED, this);
        
        // Subscribe to grid visibility events from WorldEditorPage
        this.addSubscription(EditorEventTypes.GRID_SET_VISIBILITY, this);
        
        // Subscribe to coordinates visibility events from WorldEditorPage
        this.addSubscription(EditorEventTypes.COORDINATES_SET_VISIBILITY, this);
        
        // Subscribe to reference image control events from ReferenceImagePanel
        this.addSubscription(EditorEventTypes.REFERENCE_SET_MODE, this);
        this.addSubscription(EditorEventTypes.REFERENCE_SET_ALPHA, this);
        this.addSubscription(EditorEventTypes.REFERENCE_SET_POSITION, this);
        this.addSubscription(EditorEventTypes.REFERENCE_SET_SCALE, this);
        this.addSubscription(EditorEventTypes.REFERENCE_CLEAR, this);
        
        // Subscribe to tool state changes via EventBus
        this.addSubscription(PageStateEventType.TOOL_STATE_CHANGED, this);
        
        // Subscribe to World events via EventBus
        this.addSubscription(WorldEventType.WORLD_LOADED, this);
        this.addSubscription(WorldEventType.TILES_CHANGED, this);
        this.addSubscription(WorldEventType.UNITS_CHANGED, this);
        this.addSubscription(WorldEventType.WORLD_CLEARED, this);
        
        this.log('EventBus subscriptions complete');
    }

    /**
     * Handle events from the EventBus
     */
    public handleBusEvent(eventType: string, data: any, target: any, emitter: any): void {
        switch(eventType) {
            case EditorEventTypes.REFERENCE_IMAGE_LOADED:
                this.handleReferenceImageLoaded(data);
                break;
            
            case EditorEventTypes.GRID_SET_VISIBILITY:
                this.handleGridSetVisibility(data);
                break;
            
            case EditorEventTypes.COORDINATES_SET_VISIBILITY:
                this.handleCoordinatesSetVisibility(data);
                break;
            
            case EditorEventTypes.REFERENCE_SET_MODE:
                this.handleReferenceSetMode(data);
                break;
            
            case EditorEventTypes.REFERENCE_SET_ALPHA:
                this.handleReferenceSetAlpha(data);
                break;
            
            case EditorEventTypes.REFERENCE_SET_POSITION:
                this.handleReferenceSetPosition(data);
                break;
            
            case EditorEventTypes.REFERENCE_SET_SCALE:
                this.handleReferenceSetScale(data);
                break;
            
            case EditorEventTypes.REFERENCE_CLEAR:
                this.handleReferenceClear();
                break;
            
            case PageStateEventType.TOOL_STATE_CHANGED:
                this.handleToolStateChanged(data);
                break;
            
            case WorldEventType.WORLD_LOADED:
                this.handleWorldLoaded(data);
                break;
            
            case WorldEventType.TILES_CHANGED:
                this.handleTilesChanged(data);
                break;
            
            case WorldEventType.UNITS_CHANGED:
                this.handleUnitsChanged(data);
                break;
            
            case WorldEventType.WORLD_CLEARED:
                this.handleWorldCleared();
                break;
            
            default:
                // Call parent implementation for unhandled events
                super.handleBusEvent(eventType, data, target, emitter);
        }
    }
    
    protected destroyComponent(): void {
        this.log('Destroying PhaserEditorComponent');
        
        // Destroy Phaser editor
        if (this.editorScene) {
            this.editorScene.destroy();
            this.editorScene = null as any;
        }
        
        // Remove Phaser container
        const phaserContainer = document.getElementById('phaser-container');
        if (phaserContainer) {
            phaserContainer.remove();
        }
        
        this.isInitialized = false;
        this.log('PhaserEditorComponent destroyed');
    }
    
    /**
     * Bind toolbar event handlers
     */
    private bindToolbarEvents(): void {
        // Bind clear tile button
        const clearTileBtn = this.findElement('#clear-tile-btn');
        if (clearTileBtn) {
            clearTileBtn.addEventListener('click', () => {
                this.activateClearMode();
            });
            this.log('Clear tile button bound');
        }
    }
    
    /**
     * Activate clear mode
     */
    private activateClearMode(): void {
        if (this.pageState) {
            this.pageState.setPlacementMode('clear');
            this.log('Clear mode activated via toolbar button');
        }
    }
    
    /**
     * Set up the Phaser container element
     */
    private setupPhaserContainer(): void {
        // First try to find the existing editor-canvas-container from the template
        let phaserContainer = this.findElement('#editor-canvas-container');
        
        if (phaserContainer) {
            // Rename the existing container to phaser-container for PhaserEditorScene
            phaserContainer.id = 'phaser-container';
            this.log('Using existing editor-canvas-container as phaser-container');
        } else {
            // Fallback: create new container if template container not found
            phaserContainer = document.createElement('div');
            phaserContainer.id = 'phaser-container';
            phaserContainer.style.width = '100%';
            phaserContainer.style.height = '100%';
            phaserContainer.style.minWidth = '800px';
            phaserContainer.style.minHeight = '600px';
            this.rootElement.appendChild(phaserContainer);
            this.log('Created new phaser-container');
        }
        
        this.log('Phaser container setup complete');
    }

    /**
     * Wait for container to become visible before initializing Phaser
     */
    private async waitForContainerVisible(containerElement: HTMLElement): Promise<void> {
        return new Promise<void>((resolve) => {
            const checkVisibility = () => {
                const rect = containerElement.getBoundingClientRect();
                
                if (true || (rect.width > 0 && rect.height > 0)) {
                    this.log('Container is visible, ready for Phaser initialization');
                    resolve();
                } else {
                    // Check again after a short delay
                    setTimeout(checkVisibility, 50);
                }
            };
            
            // Start checking
            setTimeout(checkVisibility, 50);
        });
    }
    
    /**
     * Initialize the Phaser editor (called in activate phase)
     */
    private async initializePhaserEditor(): Promise<void> {
        this.log('Initializing Phaser editor...');
        
        // Find the container element that we just set up
        const containerElement = this.findElement('#phaser-container');
        if (!containerElement) {
            throw new Error('Phaser container element not found after setup');
        }
        
        // Wait for container to have dimensions before initializing Phaser
        await this.waitForContainerVisible(containerElement);
        
        // Create Phaser editor scene instance directly with the element
        this.editorScene = new PhaserEditorScene(containerElement, this.eventBus, this.debugMode);
        
        // Initialize the scene using LCMComponent lifecycle
        await this.editorScene.performLocalInit();
        this.editorScene.setupDependencies();
        await this.editorScene.activate();
        
        // Set up event handlers
        await this.setupPhaserEventHandlers();
        
        // Apply current theme
        const isDarkMode = document.documentElement.classList.contains('dark');
        this.editorScene.setTheme(isDarkMode);
        
        this.isInitialized = true;
        this.log('Phaser editor initialized successfully');
        
        // Emit ready event for other components
        this.emit(EditorEventTypes.PHASER_READY, {}, this, this);
    }
    
    /**
     * Set up event handlers for Phaser editor
     */
    private async setupPhaserEventHandlers(): Promise<void> {
        if (!this.editorScene) return;
        
        // Scene should be ready after activate() call
        // Set up unified scene click callback for editor functionality
        this.editorScene.sceneClickedCallback = (context: any, layer: string, extra?: any) => {
            const { hexQ: q, hexR: r, tile, unit } = context;
            this.log(`Scene clicked at Q=${q}, R=${r} on layer '${layer}'`, { tile, unit });
            
            // Handle painting based on current mode (works for both tile and unit clicks)
            this.handleTileClick(q, r);
        };
        
        // Handle world changes
        this.editorScene.onWorldChange(() => {
            this.log('World changed in Phaser');
            this.emit(EditorEventTypes.WORLD_CHANGED, {}, this, this);
        });
        
        // Handle reference scale changes
        this.editorScene.onReferenceScaleChange((x: number, y: number) => {
            this.emit(EditorEventTypes.REFERENCE_SCALE_CHANGED, { scaleX: x, scaleY: y }, this, this);
        });
        
        this.log('Phaser event handlers setup complete');
    }
    
    /**
     * Handle tool state changes from PageState
     */
    private handleToolStateChanged(eventData: any): void {
        if (!this.editorScene || !this.isInitialized) {
            return;
        }
        
        // Extract the new tool state from the event data
        const toolState = eventData.newState;
        
        // Update Phaser editor settings based on tool state
        if (toolState.selectedTerrain !== undefined) {
            this.editorScene.setTerrain(toolState.selectedTerrain).catch(error => {
                console.error('[PhaserEditorComponent] Failed to set terrain:', error);
            });
            this.log(`Updated Phaser terrain to: ${toolState.selectedTerrain}`);
        }
        
        if (toolState.selectedPlayer !== undefined) {
            this.editorScene.setColor(toolState.selectedPlayer).catch(error => {
                console.error('[PhaserEditorComponent] Failed to set player:', error);
            });
            this.log(`Updated Phaser player to: ${toolState.selectedPlayer}`);
        }
        
        if (toolState.brushSize !== undefined) {
            this.editorScene.setBrushSize(toolState.brushSize);
            this.log(`Updated Phaser brush size to: ${toolState.brushSize}`);
        }
    }
    
    /**
     * Handle World event handlers
     */
    private handleWorldLoaded(data: WorldLoadedEventData): void {
        if (!this.editorScene || !this.isInitialized) {
            return;
        }
        
        this.log('World loaded, updating Phaser display');
        
        // Load tile data from World into Phaser
        if (this.world) {
            this.editorScene?.setTilesData(this.world.getAllTiles());
            
            const unitsData = this.world.getAllUnits();
            // Load units into Phaser (if we add this method later)
            // this.editorScene?.setUnitsData(unitsData);
        }
    }
    
    private handleTilesChanged(data: TilesChangedEventData): void {
        if (!this.editorScene || !this.isInitialized) {
            return;
        }
        
        this.log(`Updating ${data.changes.length} tile changes in Phaser`);
        
        // Update individual tiles in Phaser based on World changes
        for (const change of data.changes) {
            if (change.tile) {
                this.editorScene?.setTile(change.tile); // No brush size for individual updates
            } else {
                // Tile was removed
                this.editorScene?.removeTile(change.q, change.r);
            }
        }
    }
    
    private handleUnitsChanged(data: UnitsChangedEventData): void {
        if (!this.editorScene || !this.isInitialized) {
            return;
        }
        
        this.log(`Updating ${data.changes.length} unit changes in Phaser`);
        
        // Update individual units in Phaser based on World changes
        for (const change of data.changes) {
            if (change.unit) {
                this.editorScene?.setUnit(change.unit)
            } else {
                // Unit was removed
                this.editorScene?.removeUnit(change.q, change.r);
            }
        }
    }
    
    private handleWorldCleared(): void {
        if (!this.editorScene || !this.isInitialized) {
            return;
        }
        
        this.log('World cleared, clearing Phaser display');
        this.editorScene.clearAllTiles();
        this.editorScene.clearAllUnits();
    }
    
    /**
     * Handle grid visibility set event from WorldEditorPage
     */
    private handleGridSetVisibility(data: GridSetVisibilityPayload): void {
        if (!this.editorScene || !this.isInitialized) {
            this.log('Phaser not ready, cannot set grid visibility');
            return;
        }
        
        this.editorScene.setShowGrid(data.show);
        this.log(`Grid visibility set to: ${data.show}`);
    }
    
    /**
     * Handle coordinates visibility set event from WorldEditorPage
     */
    private handleCoordinatesSetVisibility(data: CoordinatesSetVisibilityPayload): void {
        if (!this.editorScene || !this.isInitialized) {
            this.log('Phaser not ready, cannot set coordinates visibility');
            return;
        }
        
        this.editorScene.setShowCoordinates(data.show);
        this.log(`Coordinates visibility set to: ${data.show}`);
    }
    
    /**
     * Handle reference image mode set event from ReferenceImagePanel
     */
    private handleReferenceSetMode(data: ReferenceSetModePayload): void {
        if (!this.editorScene || !this.isInitialized) {
            this.log('Phaser not ready, cannot set reference mode');
            return;
        }
        
        this.editorScene.setReferenceMode(data.mode);
        this.log(`Reference mode set to: ${data.mode}`);
    }
    
    /**
     * Handle reference image alpha set event from ReferenceImagePanel
     */
    private handleReferenceSetAlpha(data: ReferenceSetAlphaPayload): void {
        if (!this.editorScene || !this.isInitialized) {
            this.log('Phaser not ready, cannot set reference alpha');
            return;
        }
        
        this.editorScene.setReferenceAlpha(data.alpha);
        this.log(`Reference alpha set to: ${data.alpha}`);
    }
    
    /**
     * Handle reference image position set event from ReferenceImagePanel
     */
    private handleReferenceSetPosition(data: ReferenceSetPositionPayload): void {
        if (!this.editorScene || !this.isInitialized) {
            this.log('Phaser not ready, cannot set reference position');
            return;
        }
        
        this.editorScene.setReferencePosition(data.x, data.y);
        this.log(`Reference position set to: (${data.x}, ${data.y})`);
    }
    
    /**
     * Handle reference image scale set event from ReferenceImagePanel
     */
    private handleReferenceSetScale(data: ReferenceSetScalePayload): void {
        if (!this.editorScene || !this.isInitialized) {
            this.log('Phaser not ready, cannot set reference scale');
            return;
        }
        
        this.editorScene.setReferenceScale(data.scaleX, data.scaleY);
        this.log(`Reference scale set to: (${data.scaleX}, ${data.scaleY})`);
    }
    
    /**
     * Handle reference image clear event from ReferenceImagePanel
     */
    private handleReferenceClear(): void {
        if (!this.editorScene || !this.isInitialized) {
            this.log('Phaser not ready, cannot clear reference image');
            return;
        }
        
        this.editorScene.clearReferenceImage();
        this.log('Reference image cleared');
    }
    
    /**
     * Handle reference image loaded event from ReferenceImagePanel
     */
    private async handleReferenceImageLoaded(data: ReferenceImageLoadedPayload): Promise<void> {
        this.log(`Reference image loaded: ${data.width}x${data.height} from ${data.source}`);
        
        if (!this.editorScene || !this.isInitialized) {
            this.log('Phaser not ready, cannot load reference image');
            return;
        }
        
        // Convert the URL back to a blob and create a File object
        const response = await fetch(data.url);
        const blob = await response.blob();
        const file = new File([blob], `reference-${data.source}`, { type: blob.type });
        
        // Load the reference image into Phaser using the existing file method
        const result = await this.editorScene.loadReferenceFromFile(file);
        if (result) {
            this.log(`Reference image loaded into Phaser from ${data.source}`);
        } else {
            this.log(`Failed to load reference image into Phaser from ${data.source}`);
        }
    }
    
    /**
     * Get brush radius from brush size
     */
    private getBrushRadius(brushSize: number): number {
        switch (brushSize) {
            case 1: return 1;   // Small (3 hexes)
            case 3: return 2;   // Medium (5 hexes) 
            case 5: return 3;   // Large (9 hexes)
            case 10: return 4;  // X-Large (15 hexes)
            case 15: return 5;  // XX-Large (21 hexes)
            default: return 0;  // Single hex
        }
    }
    
    /**
     * Handle tile clicks for painting
     */
    private handleTileClick(q: number, r: number): void {
        if (!this.editorScene || !this.isInitialized) {
            return;
        }
        
        // Get current tool state from pageState
        const toolState = this.pageState?.getToolState();
        if (!toolState) {
            this.log('No tool state available for tile click');
            return;
        }
        
        switch (toolState.placementMode) {
            case 'terrain':
                // Update World data (single source of truth) with brush size support
                let playerId = 0;
                if (this.world) {
                    playerId = this.getPlayerIdForTerrain(toolState.selectedTerrain, toolState);
                    
                    if (toolState.brushSize === 0) {
                        // Single tile
                        this.world.setTileAt(q, r, toolState.selectedTerrain, playerId);
                    } else {
                        // Multiple tiles in radius
                        const radius = this.getBrushRadius(toolState.brushSize);
                        for (let bq = q - radius; bq <= q + radius; bq++) {
                            for (let br = r - radius; br <= r + radius; br++) {
                                // Use cube distance to determine if tile is within brush radius
                                const distance = Math.abs(bq - q) + Math.abs(br - r) + Math.abs(-bq - br - (-q - r));
                                if (distance <= radius * 2) { // Hex distance formula
                                    this.world.setTileAt(bq, br, toolState.selectedTerrain, playerId);
                                }
                            }
                        }
                    }
                }
                
                this.log(`Painted terrain ${toolState.selectedTerrain} (player ${playerId}) at Q=${q}, R=${r} with brush size ${toolState.brushSize}`);
                break;
                
            case 'unit':
                // Update World data (single source of truth)
                if (this.world) {
                    this.world.setUnitAt(q, r, toolState.selectedUnit, toolState.selectedPlayer);
                }
                
                this.log(`Painted unit ${toolState.selectedUnit} (player ${toolState.selectedPlayer}) at Q=${q}, R=${r}`);
                break;
                
            case 'clear':
                // Update World data (single source of truth) with brush size support
                if (this.world) {
                    if (toolState.brushSize === 0) {
                        // Single tile
                        this.world.removeTileAt(q, r);
                        this.world.removeUnitAt(q, r);
                    } else {
                        // Multiple tiles in radius
                        const radius = this.getBrushRadius(toolState.brushSize);
                        for (let bq = q - radius; bq <= q + radius; bq++) {
                            for (let br = r - radius; br <= r + radius; br++) {
                                // Use cube distance to determine if tile is within brush radius
                                const distance = Math.abs(bq - q) + Math.abs(br - r) + Math.abs(-bq - br - (-q - r));
                                if (distance <= radius * 2) { // Hex distance formula
                                    this.world.removeTileAt(bq, br);
                                    this.world.removeUnitAt(bq, br);
                                }
                            }
                        }
                    }
                }
                this.log(`Cleared tile and unit at Q=${q}, R=${r} with brush size ${toolState.brushSize}`);
                break;
        }
    }
    
    /**
     * Determine the correct player ID for a terrain type
     * City terrains use the selected player, nature terrains always use 0
     */
    private getPlayerIdForTerrain(terrainType: number, toolState: any): number {
        // Define city terrains that support player ownership
        const cityTerrains = [1, 2, 3, 16, 20]; // Land Base, Naval Base, Airport Base, Missile Silo, Mines
        
        if (cityTerrains.includes(terrainType)) {
            // City terrain - use selected player from city tab
            return toolState.selectedPlayer || 1; // Default to player 1 if not set
        } else {
            // Nature terrain - always use neutral (0)
            return 0;
        }
    }
    
    // Old EventBus handlers removed - tool changes now handled via PageState Observer pattern
    
    // Public API methods (for external access)
    
    /**
     * Check if Phaser editor is initialized
     */
    public getIsInitialized(): boolean {
        return this.isInitialized;
    }
    
    /**
     * Set theme for the editor
     */
    public setTheme(isDark: boolean): void {
        if (this.editorScene && this.isInitialized) {
            this.editorScene.setTheme(isDark);
            this.log(`Theme set to: ${isDark ? 'dark' : 'light'}`);
        }
    }
    
    /**
     * Set grid visibility
     */
    public setShowGrid(show: boolean): void {
        if (this.editorScene && this.isInitialized) {
            this.editorScene.setShowGrid(show);
            this.log(`Grid visibility set to: ${show}`);
        }
    }
    
    /**
     * Set coordinate visibility
     */
    public setShowCoordinates(show: boolean): void {
        if (this.editorScene && this.isInitialized) {
            this.editorScene.setShowCoordinates(show);
            this.log(`Coordinate visibility set to: ${show}`);
        }
    }
    
    /**
     * Load world tiles data
     */
    public async setTilesData(tiles: Array<Tile>): Promise<void> {
        if (this.editorScene && this.isInitialized) {
            await this.editorScene.setTilesData(tiles);
            this.log(`Loaded ${tiles.length} tiles into Phaser`);
        }
    }
    
    /**
     * Paint a unit at specific coordinates
     */
    public setUnit(unit: Unit): boolean {
        if (this.editorScene && this.isInitialized) {
              this.editorScene.setUnit(unit);
              this.log(`Painted unit ${unit.unitType} (player ${unit.player}) at Q=${unit.q}, R=${unit.r}`);
              return true;
        }
        return false;
    }
    
    /**
     * Get viewport center for world generation
     */
    public getViewportCenter(): { q: number; r: number } {
        if (this.editorScene && this.isInitialized) {
            return this.editorScene.getViewportCenter();
        }
        return { q: 0, r: 0 };
    }
    
    /**
     * Center camera on specific coordinates
     */
    public centerCamera(q: number = 0, r: number = 0): void {
        if (this.editorScene && this.isInitialized) {
            this.editorScene.centerCamera(q, r);
            this.log(`Camera centered on Q=${q}, R=${r}`);
        }
    }
    
    /**
     * World generation methods
     */
    public fillAllTerrain(terrain: number, color: number = 0): void {
        if (this.editorScene && this.isInitialized) {
            this.editorScene.fillAllTerrain(terrain, color);
            this.log(`Filled all terrain with type ${terrain}`);
        }
    }
    
    public randomizeTerrain(): void {
        if (this.editorScene && this.isInitialized) {
            this.editorScene.randomizeTerrain();
            this.log('Terrain randomized');
        }
    }
    
    public createIslandPattern(centerQ: number, centerR: number, radius: number): void {
        if (this.editorScene && this.isInitialized) {
            this.editorScene.createIslandPattern(centerQ, centerR, radius);
            this.log(`Created island pattern at Q=${centerQ}, R=${centerR} with radius ${radius}`);
        }
    }
    
    public clearAllTiles(): void {
        if (this.editorScene && this.isInitialized) {
            this.editorScene.clearAllTiles();
            this.log('All tiles cleared');
        }
    }
    
    public clearAllUnits(): void {
        if (this.editorScene && this.isInitialized) {
            this.editorScene.clearAllUnits();
            this.log('All units cleared');
        }
    }
    
    public setTile(tile: Tile, brushSize: number = 0): void {
        if (this.editorScene && this.isInitialized) {
            this.editorScene.setTile(tile, brushSize);
        }
    }
    
    public removeTile(q: number, r: number): void {
        if (this.editorScene && this.isInitialized) {
            this.editorScene.removeTile(q, r);
        }
    }
    
    public removeUnit(q: number, r: number): void {
        if (this.editorScene && this.isInitialized) {
            this.editorScene.removeUnit(q, r);
        }
    }
    
    /**
     * Reference image methods
     */
    public async loadReferenceFromClipboard(): Promise<boolean> {
        if (this.editorScene && this.isInitialized) {
            const result = await this.editorScene.loadReferenceFromClipboard();
            this.log(result ? 'Reference image loaded from clipboard' : 'No image found in clipboard');
            return result;
        }
        return false;
    }
    
    public async loadReferenceFromFile(file: File): Promise<boolean> {
        if (this.editorScene && this.isInitialized) {
            const result = await this.editorScene.loadReferenceFromFile(file);
            this.log(result ? `Reference image loaded from file: ${file.name}` : 'Failed to load file');
            return result;
        }
        return false;
    }
    
    public setReferenceMode(mode: number): void {
        if (this.editorScene && this.isInitialized) {
            this.editorScene.setReferenceMode(mode);
            const modeNames = ['hidden', 'background', 'overlay'];
            this.log(`Reference mode set to: ${modeNames[mode] || mode}`);
        }
    }
    
    public setReferenceAlpha(alpha: number): void {
        if (this.editorScene && this.isInitialized) {
            this.editorScene.setReferenceAlpha(alpha);
            this.log(`Reference alpha set to: ${alpha}`);
        }
    }
    
    public setReferencePosition(x: number, y: number): void {
        if (this.editorScene && this.isInitialized) {
            this.editorScene.setReferencePosition(x, y);
            this.log(`Reference position set to: (${x}, ${y})`);
        }
    }
    
    public setReferenceScale(x: number, y: number): void {
        if (this.editorScene && this.isInitialized) {
            this.editorScene.setReferenceScale(x, y);
            this.log(`Reference scale set to: (${x}, ${y})`);
        }
    }
    
    public setReferenceScaleFromTopLeft(x: number, y: number): void {
        if (this.editorScene && this.isInitialized) {
            this.editorScene.setReferenceScaleFromTopLeft(x, y);
            this.log(`Reference scale set from top-left to: (${x}, ${y})`);
        }
    }
    
    public getReferenceState(): {
        mode: number;
        alpha: number;
        position: { x: number; y: number };
        scale: { x: number; y: number };
        hasImage: boolean;
    } | null {
        if (this.editorScene && this.isInitialized) {
            return this.editorScene.getReferenceState();
        }
        return null;
    }
    
    public clearReferenceImage(): void {
        if (this.editorScene && this.isInitialized) {
            this.editorScene.clearReferenceImage();
            this.log('Reference image cleared');
        }
    }
    
    /**
     * Set callback for when Phaser scene is ready
     */
    public onSceneReady(callback: () => void): void {
        if (this.editorScene && this.isInitialized) {
            this.editorScene.onSceneReady(callback);
        } else {
            this.log('Cannot set scene ready callback - Phaser not initialized');
        }
    }
    
    /**
     * Register world change callback
     */
    public onWorldChange(callback: () => void): void {
        if (this.editorScene && this.isInitialized) {
            this.editorScene.onWorldChange(callback);
        }
    }
    
    /**
     * Register reference scale change callback
     */
    public onReferenceScaleChange(callback: (x: number, y: number) => void): void {
        if (this.editorScene && this.isInitialized) {
            this.editorScene.onReferenceScaleChange(callback);
        }
    }
}
