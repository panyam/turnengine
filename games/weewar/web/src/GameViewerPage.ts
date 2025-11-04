import { BasePage } from '../lib/BasePage';
import WeewarBundle from '../gen/wasmjs';
import { GamesServiceClient } from '../gen/wasmjs/weewar/v1/gamesServiceClient';
import { GameViewerPageMethods, GameViewerPageClient as GameViewerPageClient } from '../gen/wasmjs/weewar/v1/gameViewerPageClient';
import { GameViewPresenterClient as  GameViewPresenterClient } from '../gen/wasmjs/weewar/v1/gameViewPresenterClient';
import { SingletonInitializerServiceClient as SingletonInitializerClient } from '../gen/wasmjs/weewar/v1/singletonInitializerServiceClient';
import { EventBus } from '../lib/EventBus';
import { PhaserGameScene } from './phaser/PhaserGameScene';
import { Unit, Tile, World } from './World';
import {
    GameState as ProtoGameState,
    SetGameStateRequest, SetGameStateResponse,
    SetContentRequest, SetContentResponse,
	  LogMessageRequest, LogMessageResponse,
    ShowHighlightsRequest, ShowHighlightsResponse,
    ClearHighlightsRequest, ClearHighlightsResponse,
    ShowPathRequest, ShowPathResponse,
    ClearPathsRequest, ClearPathsResponse,
    ShowBuildOptionsRequest, ShowBuildOptionsResponse,
    HighlightSpec,
    MoveUnitRequest, MoveUnitResponse,
    ShowAttackEffectRequest, ShowAttackEffectResponse,
    ShowHealEffectRequest, ShowHealEffectResponse,
    ShowCaptureEffectRequest, ShowCaptureEffectResponse,
    SetUnitAtRequest, SetUnitAtResponse,
    RemoveUnitAtRequest, RemoveUnitAtResponse,
} from '../gen/wasmjs/weewar/v1/interfaces';
import * as models from '../gen/wasmjs/weewar/v1/models';
import { create } from '@bufbuild/protobuf';
import { LCMComponent } from '../lib/LCMComponent';
import { LifecycleController } from '../lib/LifecycleController';
import { PLAYER_BG_COLORS } from './ColorsAndNames';
import { TerrainStatsPanel } from './TerrainStatsPanel';
import { UnitStatsPanel } from './UnitStatsPanel';
import { DamageDistributionPanel } from './DamageDistributionPanel';
import { GameLogPanel } from './GameLogPanel';
import { TurnOptionsPanel } from './TurnOptionsPanel';
import { BuildOptionsModal } from './BuildOptionsModal';
import { GameEventTypes, WorldEventTypes } from './events';
import { RulesTable, TerrainStats } from './RulesTable';
/**
 * GameViewerPage - Base implementation with fixed CSS Grid layout
 *
 * This is a concrete, fully-functional game viewer with a simple 2-column layout.
 * Child classes (GameViewerPageDockView, GameViewerPageMobile) can override layout
 * methods to provide enhanced UIs, but this base class works standalone.
 *
 * Responsible for:
 * - Loading world as a game instance
 * - Coordinating WASM game engine
 * - Managing game state and turn flow
 * - Handling player interactions (unit selection, movement, attacks)
 * - Providing game controls and UI feedback
 */
export class GameViewerPage extends BasePage implements LCMComponent, GameViewerPageMethods {
    // ===== Shared State (used by all layout variants) =====
    protected wasmBundle: WeewarBundle;
    protected gamesClient: GamesServiceClient;
    protected gameViewPresenterClient: GameViewPresenterClient;
    protected singletonInitializerClient: SingletonInitializerClient;
    protected currentGameId: string | null;

    // ===== Shared Components (used by all layout variants) =====
    protected gameScene: PhaserGameScene;
    protected world: World;  // ✅ Shared World component
    protected terrainStatsPanel: TerrainStatsPanel;
    protected unitStatsPanel: UnitStatsPanel;
    protected damageDistributionPanel: DamageDistributionPanel;
    protected gameLogPanel: GameLogPanel;
    protected turnOptionsPanel: TurnOptionsPanel;
    protected buildOptionsModal: BuildOptionsModal;
    protected rulesTable: RulesTable = new RulesTable();

    // =============================================================================
    // Layout Methods (can be overridden by child classes)
    // =============================================================================

    /**
     * Initialize the layout structure
     * Base: Simple CSS Grid layout (already in DOM from template)
     * Override: DockView, Mobile drawer, etc.
     */
    protected initializeLayout(): void {
        // Base implementation: Fixed grid layout (already in DOM from template)
        // No-op - layout is server-rendered via CSS Grid
        console.log('Using base fixed grid layout');
    }

    /**
     * Get the container where PhaserGameScene should be mounted
     * Base: Returns #phaser-viewer-container from fixed grid
     * Override: Return DockView panel container, mobile container, etc.
     */
    protected getGameSceneContainer(): HTMLElement {
        return this.ensureElement('#phaser-viewer-container', 'phaser-viewer-container');
    }

    /**
     * Create and attach panel components to the layout
     * Base: Panels are already in their grid positions from template
     * Override: Mount panels into DockView or drawer slots
     */
    protected createAndAttachPanels(): void {
        // Create panel components using templates
        this.terrainStatsPanel = this.createPanelFromTemplate('terrain-stats-panel-template', 'terrain-stats-container', TerrainStatsPanel);
        this.unitStatsPanel = this.createPanelFromTemplate('unit-stats-panel-template', 'unit-stats-container', UnitStatsPanel);
        this.damageDistributionPanel = this.createPanelFromTemplate('damage-distribution-panel-template', 'damage-distribution-container', DamageDistributionPanel);
        this.gameLogPanel = this.createPanelFromTemplate('game-log-panel-template', 'game-log-container', GameLogPanel);
        this.turnOptionsPanel = this.createPanelFromTemplate('turn-options-panel-template', 'turn-options-container', TurnOptionsPanel);
    }

    /**
     * Helper to create a panel from a template and insert it into a container
     * Base implementation for fixed grid layout
     */
    protected createPanelFromTemplate<T>(templateId: string, containerId: string, PanelClass: any): T {
        const template = document.getElementById(templateId);
        if (!template) {
            throw new Error(`${templateId} not found`);
        }

        const element = template.cloneNode(true) as HTMLElement;
        element.style.display = 'block';
        element.id = `${templateId}-instance`;

        // Insert into layout container
        const container = document.getElementById(containerId);
        if (container) {
            container.appendChild(element);
        }

        return new PanelClass(element, this.eventBus, true) as T;
    }

    /**
     * Cleanup layout-specific resources
     * Base: No special cleanup needed
     * Override: Dispose DockView, remove event listeners, etc.
     */
    protected cleanupLayout(): void {
        // Base implementation: no special cleanup needed
        // Child classes override to dispose DockView, etc.
    }

    /**
     * Handle game scene resize (called when container resizes)
     * Base: Find phaser container and resize
     * Override: DockView has its own resize handling
     */
    protected resizeGameCanvas(): void {
        if (this.gameScene) {
            const phaserContainer = document.querySelector('#phaser-viewer-container') as HTMLElement;
            if (phaserContainer) {
                const width = phaserContainer.clientWidth;
                const height = phaserContainer.clientHeight;

                setTimeout(() => {
                    if (this.gameScene) {
                        this.gameScene.resize(width, height);
                        this.gameScene.centerCameraOnWorld();
                    }
                }, 100);
            }
        }
    }

    /**
     * Hide loading overlay
     * Base: Hide #game-loading element
     * Override: Find loading overlay in DockView panel, etc.
     */
    protected hideLoadingOverlay(): void {
        const gameLoadingOverlay = document.querySelector('#game-loading') as HTMLElement;
        if (gameLoadingOverlay) {
            gameLoadingOverlay.style.display = 'none';
        }

        super.dismissSplashScreen();
    }

    // =============================================================================
    // LCMComponent Interface Implementation
    // =============================================================================

    /**
     * Phase 1: Initialize DOM and discover child components
     */
    async performLocalInit(): Promise<LCMComponent[]> {
        // Load game config first
        this.currentGameId = (document.getElementById("gameIdInput") as HTMLInputElement).value.trim()
        if (!this.currentGameId) {
          throw new Error("Game Id Not Found")
        }
        
        // Subscribe to events BEFORE creating components
        this.subscribeToGameStateEvents();
        
        // Create child components
        this.createComponents();

        this.updateGameStatusBanner('Game Loading...');

        await this.loadWASM() // kick off loading

        // Return child components for lifecycle management
        // Note: World and GameState don't extend BaseComponent, so not included in lifecycle
        return [
            this.gameScene,
            this.terrainStatsPanel,
            this.unitStatsPanel,
            this.damageDistributionPanel,
            this.gameLogPanel,
            this.buildOptionsModal,
        ]
    }

    /**
     * Phase 2: Inject dependencies
     */
    setupDependencies(): void {
        // Pass the theme to the stats panels
        const assetProvider = this.gameScene.getAssetProvider();
        if (assetProvider) {
            const theme = assetProvider.getTheme();
            if (this.terrainStatsPanel) {
                this.terrainStatsPanel.setTheme(theme);
            }
            if (this.unitStatsPanel) {
                this.unitStatsPanel.setTheme(theme);
            }
            if (this.damageDistributionPanel) {
                this.damageDistributionPanel.setTheme(theme);
            }
            if (this.turnOptionsPanel) {
                this.turnOptionsPanel.setTheme(theme);
            }
            if (this.buildOptionsModal) {
                this.buildOptionsModal.setTheme(theme);
            }
        }

        // Set presenter client on components so they can call presenter directly
        this.gameScene.gameViewPresenterClient = this.gameViewPresenterClient;
        this.turnOptionsPanel.gameViewPresenterClient = this.gameViewPresenterClient;
        this.buildOptionsModal.gameViewPresenterClient = this.gameViewPresenterClient;
    }

    /**
     * Phase 3: Activate component when all dependencies are ready
     */
    async activate(): Promise<void> {
        // Bind events now that all components are ready
        this.bindGameSpecificEvents();
        
        // Subscribe to path visualization events
        this.eventBus.addSubscription('show-path-visualization', null, this);
        this.eventBus.addSubscription('clear-path-visualization', null, this);
        
        // TODO _ this will be done by initialize WASM
        this.wasmBundle.registerBrowserService('GameViewerPage', this)

        // Initialize the presenter by setting it game data now that all UI components are ready
        await this.initializePresenter();

        // Expose gameScene to console for testing animations
        (window as any).gameScene = this.gameScene;
        console.log("🎮 gameScene exposed to window for animation testing");
        console.log("Try: gameScene.moveUnit(unit, path) or gameScene.showAttackEffect({q:0,r:0}, {q:1,r:0}, 10)");
    }
    
    
    /**
     * Show path visualization on the game scene
     */
    protected showPathVisualization(coords: number[], color: number, thickness: number): void {
        if (!this.gameScene) return;
        
        // Get the movement highlight layer (or selection layer) to draw paths
        const movementLayer = this.gameScene.movementHighlightLayer;
        if (movementLayer) {
            // Clear any existing paths first
            movementLayer.clearAllPaths();
            // Add the new path
            movementLayer.addPath(coords, color, thickness);
        }
    }
    
    /**
     * Clear path visualization from the game scene
     */
    protected clearPathVisualization(): void {
        if (!this.gameScene) return;
        
        // Clear paths from movement layer
        const movementLayer = this.gameScene.movementHighlightLayer;
        if (movementLayer) {
            movementLayer.clearAllPaths();
        }
    }

    /**
     * Subscribe to GameState events
     */
    protected subscribeToGameStateEvents(): void {
        // GameViewer ready event - set up interaction callbacks and load world
        this.addSubscription(WorldEventTypes.WORLD_VIEWER_READY, this);
        
        // Game data ready event - WASM and game data loaded
        this.addSubscription(GameEventTypes.GAME_DATA_LOADED, this);
        
        // GameState notification events (for system coordination, not user interaction responses)
        this.addSubscription('unit-moved', this);
        this.addSubscription('unit-attacked', this);
        this.addSubscription('turn-ended', this);
    }

    /**
     * Handle events from the EventBus
     */
    public handleBusEvent(eventType: string, data: any, target: any, emitter: any): void {
        switch(eventType) {
            case 'show-path-visualization':
                this.showPathVisualization(data.coords, data.color, data.thickness);
                break;
                
            case 'clear-path-visualization':
                this.clearPathVisualization();
                break;
            
            case 'unit-moved':
                // Could trigger animations, sound effects, etc.
                break;
            
            case 'unit-attacked':
                // Could trigger combat animations, sound effects, etc.
                break;
            
            case 'turn-ended':
                // Could trigger end-of-turn animations, notifications, etc.
                break;
            
            default:
                // Call parent implementation for unhandled events
                super.handleBusEvent(eventType, data, target, emitter);
        }
    }

    /**
     * Create WorldViewer, World, and component instances
     */
    protected createComponents(): void {
        // ✅ Create shared World component first (subscribes first to server-changes)
        this.world = new World(this.eventBus, 'Game World');

        // Create BuildOptionsModal (separate from layout system)
        const modalElement = document.getElementById('build-options-modal');
        if (!modalElement) {
            throw new Error('GameViewerPage: build-options-modal element not found');
        }
        this.buildOptionsModal = new BuildOptionsModal(modalElement, this.eventBus, true);

        // Initialize layout structure (can be overridden by child classes)
        this.initializeLayout();

        // Create PhaserGameScene
        const phaserContainer = this.getGameSceneContainer();
        this.gameScene = new PhaserGameScene(phaserContainer, this.eventBus, true);

        // Create and attach panel components (can be overridden by child classes)
        this.createAndAttachPanels();
    }


    protected async loadWASM(): Promise<void> {
        // Create base bundle with module configuration
        this.wasmBundle  = new WeewarBundle();
        this.gamesClient = new GamesServiceClient(this.wasmBundle);
        this.gameViewPresenterClient = new GameViewPresenterClient(this.wasmBundle);
        this.singletonInitializerClient = new SingletonInitializerClient(this.wasmBundle);
        await this.wasmBundle.loadWasm((document.getElementById("wasmBundlePathField") as HTMLInputElement).value)
        await this.wasmBundle.waitUntilReady()
    }

    /**
     * Initialize game using WASM game engine
     * This now handles both WASM loading and World creation in GameState
     */
    protected async initializePresenter(): Promise<void> {
        // Get raw JSON data from page elements
        const gameElement = document.getElementById('game.data-json')!;
        const gameStateElement = document.getElementById('game-state-data-json')!;
        const historyElement = document.getElementById('game-history-data-json')!;
        
        if (!gameElement?.textContent || gameElement.textContent.trim() === 'null') {
            throw new Error('No game data found in page elements');
        }

        if (false) {
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

            const wasmResult = weewar.loadGameData(gameBytes, gameStateBytes, historyBytes);

            if (!wasmResult.success) {
                throw new Error(`WASM load failed: ${wasmResult.error}`);
            }

            // 3. Call presenter to initialize (ONE proto RPC call does everything!)
            const response = await this.gameViewPresenterClient.initializeGame({ gameId: this.currentGameId || "", });
            
            if (!response.success) {
                throw new Error(`WASM load failed: ${response.error}`);
            }
        } else {
            // 3. Call presenter to initialize (ONE proto RPC call does everything!)
            const response = await this.singletonInitializerClient.initializeSingleton({
                gameId: this.currentGameId || "",
                gameData: gameElement!.textContent,
                gameState: gameStateElement?.textContent || '{}',
                moveHistory: historyElement?.textContent || '{"gameId":"","groups":[]}',
            });
            
            if (!response.response!.success) {
                throw new Error(`WASM load failed: ${response.response!.error}`);
            }
        }
    }

    /**
     * Internal method to bind game-specific events (called from activate() phase)
     */
    protected bindGameSpecificEvents(): void {
        // End Turn button
        const endTurnBtn = document.getElementById('end-turn-btn')!;
        endTurnBtn.addEventListener('click', () => {
          this.gameViewPresenterClient.endTurnButtonClicked({
              gameId: this.currentGameId || ""
          });
        });

        // Screenshot button
        const screenshotBtn = document.getElementById('capture-screenshot-btn');
        if (screenshotBtn) {
            screenshotBtn.addEventListener('click', () => this.handleScreenshotClick());
        }
    }

    /**
     * Handle Screenshot button click
     */
    protected async handleScreenshotClick(): Promise<void> {
        if (!this.currentGameId) {
            console.error('No game ID available');
            this.showToast('Error', 'No game ID available', 'error');
            return;
        }

        try {
            // Capture screenshot from Phaser scene
            const blob = await this.gameScene.captureScreenshotAsync('image/png', 0.92);

            if (!blob) {
                this.showToast('Error', 'Failed to capture screenshot', 'error');
                return;
            }

            // Upload to server
            const formData = new FormData();
            formData.append('screenshot', blob, 'screenshot.png');

            const response = await fetch(`/games/${this.currentGameId}/screenshot`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                this.showToast('Success', 'Screenshot saved successfully', 'success');
            } else {
                this.showToast('Error', 'Failed to save screenshot', 'error');
            }
        } catch (error) {
            console.error('Screenshot error:', error);
            this.showToast('Error', 'Failed to capture or save screenshot', 'error');
        }
    }

    /**
     * Handle End Turn button click
     */
    protected async handleEndTurnClick(): Promise<void> {
        if (!this.currentGameId) {
            console.error('No game ID available');
            return;
        }

        // Call presenter
        await this.gameViewPresenterClient.endTurnButtonClicked({
            gameId: this.currentGameId
        });
    }



    /**
     * UI update functions
     */
    protected updateGameStatusBanner(status: string, currentPlayer?: number): void {
        const statusElement = document.getElementById('game-status');
        if (statusElement) {
            statusElement.textContent = status;

            // Use player-specific background color, fallback to green for general messages
            const playerColorClass = currentPlayer ? PLAYER_BG_COLORS[currentPlayer] : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            statusElement.className = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${playerColorClass}`;
        }
    }

    protected updateGameUIFromState(gameState: ProtoGameState): void {
        // Update game status with player-specific color - use player ID directly
        this.updateGameStatusBanner(`Ready - Player ${gameState.currentPlayer}'s Turn`, gameState.currentPlayer);
        
        // Update turn counter
        this.updateTurnCounter(gameState.turnCounter);
    }
    
    protected updateTurnCounter(turnCounter: number): void {
        const turnElement = document.getElementById('turn-counter');
        if (turnElement) {
            turnElement.textContent = `Turn ${turnCounter}`;
        }
    }

    // Presenter interface methods
  async setTurnOptionsContent(request: SetContentRequest) {
    console.log("setTurnOptionsContent called on the browser: ", request)
    this.turnOptionsPanel.innerHTML = request.innerHtml
    // Hydrate theme images and setup click handlers after Go template renders HTML
    await this.turnOptionsPanel.hydrateThemeImages()
    return {}
  }

  async showBuildOptions(request: ShowBuildOptionsRequest): Promise<ShowBuildOptionsResponse> {
    console.log("showBuildOptions called on the browser:", request);

    if (request.hide) {
      // Hide the modal
      this.buildOptionsModal.hide();
    } else {
      // Show the modal with the rendered content and tile coordinates
      await this.buildOptionsModal.show(request.innerHtml, request.q, request.r);
    }

    return {}
  }

	async setUnitStatsContent(request: SetContentRequest) {
    console.log("setUnitStatsContent called on the browser")
    this.unitStatsPanel.innerHTML = request.innerHtml
    // Hydrate theme images after Go template renders HTML
    await this.unitStatsPanel.hydrateThemeImages()
    return {}
  }

	async setDamageDistributionContent(request: SetContentRequest) {
    console.log("setDamageDistributionContent called on the browser")
    this.damageDistributionPanel.innerHTML = request.innerHtml
    await this.damageDistributionPanel.hydrateThemeImages()
    return {}
  }
	async setTerrainStatsContent(request: SetContentRequest) {
    console.log("setTerrainStatsContent called on the browser")
    this.terrainStatsPanel.innerHTML = request.innerHtml
    await this.terrainStatsPanel.hydrateThemeImages()
    return {}
  }
	// Visualization command methods - delegate to PhaserGameScene
  async showHighlights(request: ShowHighlightsRequest) {
    console.log("showHighlights called:", request);
    if (request.highlights) {
      this.gameScene.showHighlights(request.highlights);
    }
    return {}
  }

  async clearHighlights(request: ClearHighlightsRequest) {
    console.log("clearHighlights called:", request);
    this.gameScene.clearHighlights(request.types || []);
    return {}
  }

  async showPath(request: ShowPathRequest) {
    console.log("showPath called:", request);
    if (request.coords) {
      this.gameScene.showPath(request.coords, request.color, request.thickness);
    }
    return {}
  }

  async clearPaths(request: ClearPathsRequest) {
    console.log("clearPaths called:", request);
    this.gameScene.clearPaths();
    return {}
  }

  async logMessage(request: LogMessageRequest) {
    console.log("logMessage called on the browser")
    return {}
  }
	async setGameState(req: SetGameStateRequest) {
    console.log("setGameState called on the browser")
    const worldData = req.state!.worldData!
    const game = req.game!
    // Load data into shared World component
    this.world.loadTilesAndUnits(worldData.tiles || [], worldData.units || []);
    this.world.setName(game.name || 'Untitled Game');

    // Load world into viewer using shared World
    await this.gameScene.loadWorld(this.world);
    this.showToast('Success', `Game loaded: ${game.name || this.world.getName() || 'Untitled'}`, 'success');

    // Hide the loading overlay now that the game is loaded
    this.hideLoadingOverlay();

    // Ensure the game canvas is properly sized after loading
    this.resizeGameCanvas();

    // Update UI with loaded game state
    this.updateGameUIFromState(req.state!);
    this.gameLogPanel.logGameEvent(`Game loaded: ${req.state!.gameId}`, 'system');
    return {}
  }

  // Incremental update methods
  async setTileAt(request: { q: number, r: number, tile: Tile }) {
    console.log("setTileAt called on the browser:", request);
    this.world.setTileDirect(request.tile);
    return {}
  }

  async setUnitAt(request: SetUnitAtRequest): Promise<SetUnitAtResponse> {
    console.log("setUnitAt called on the browser:", request);
    if (request.unit) {
      await this.gameScene.setUnit(request.unit, { flash: request.flash, appear: request.appear });
      // Update world after animation completes
      this.world.setUnitDirect(request.unit);
    }
    return {}
  }

  async removeTileAt(request: { q: number, r: number }) {
    console.log("removeTileAt called on the browser:", request);
    this.world.removeTileAt(request.q, request.r);
    return {}
  }

  async removeUnitAt(request: RemoveUnitAtRequest): Promise<RemoveUnitAtResponse> {
    console.log("removeUnitAt called on the browser:", request);
    await this.gameScene.removeUnit(request.q, request.r, { animate: request.animate });
    // Update world after animation completes
    this.world.removeUnitAt(request.q, request.r);
    return {}
  }

  async moveUnit(request: MoveUnitRequest): Promise<MoveUnitResponse> {
    console.log("moveUnit called on the browser:", request);
    if (request.unit && request.path) {
      await this.gameScene.moveUnit(request.unit, request.path);
      // Update world after animation completes
      this.world.setUnitDirect(request.unit);
    }
    return {}
  }

  async showAttackEffect(request: ShowAttackEffectRequest): Promise<ShowAttackEffectResponse> {
    console.log("showAttackEffect called on the browser:", request);
    await this.gameScene.showAttackEffect(
      { q: request.fromQ, r: request.fromR },
      { q: request.toQ, r: request.toR },
      request.damage,
      request.splashTargets
    );
    return {}
  }

  async showHealEffect(request: ShowHealEffectRequest): Promise<ShowHealEffectResponse> {
    console.log("showHealEffect called on the browser:", request);
    await this.gameScene.showHealEffect(request.q, request.r, request.amount);
    return {}
  }

  async showCaptureEffect(request: ShowCaptureEffectRequest): Promise<ShowCaptureEffectResponse> {
    console.log("showCaptureEffect called on the browser:", request);
    await this.gameScene.showCaptureEffect(request.q, request.r);
    return {}
  }

  async updateGameStatus(request: { currentPlayer: number, turnCounter: number }) {
    console.log("updateGameStatus called on the browser:", request);
    // Update the game status banner
    this.updateGameStatusBanner(`Ready - Player ${request.currentPlayer}'s Turn`, request.currentPlayer);
    // Update turn counter
    this.updateTurnCounter(request.turnCounter);
    // Update End Turn button state (only enabled for Player 1 for now - TODO: make configurable)
    this.updateEndTurnButtonState(request.currentPlayer);
    return {}
  }

  /**
   * Update End Turn button enabled/disabled state based on current player
   */
  protected updateEndTurnButtonState(currentPlayer: number): void {
    const endTurnBtn = document.getElementById('end-turn-btn') as HTMLButtonElement;
    if (endTurnBtn) {
      // TODO: Get the actual player ID from the game/user context
      // For now, assume we're playing as Player 1
      const isOurTurn = currentPlayer === 1;

      endTurnBtn.disabled = !isOurTurn;

      // Update visual state
      if (isOurTurn) {
        endTurnBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        endTurnBtn.classList.add('hover:bg-green-700');
      } else {
        endTurnBtn.classList.add('opacity-50', 'cursor-not-allowed');
        endTurnBtn.classList.remove('hover:bg-green-700');
      }
    }
  }
}

// Initialize page when DOM is ready using LifecycleController
document.addEventListener('DOMContentLoaded', async () => {
    // Create page instance (just basic setup)
    const gameViewerPage = new GameViewerPage("GameViewerPage");
    
    // Make GameViewerPage available for e2e testing via command interface
    (window as any).gameViewerPage = gameViewerPage;
    
    // Create lifecycle controller with debug logging
    const lifecycleController = new LifecycleController(gameViewerPage.eventBus, LifecycleController.DefaultConfig);
    
    // Start breadth-first initialization
    await lifecycleController.initializeFromRoot(gameViewerPage);
});
