import { PhaserMapScene } from './phaser/PhaserMapScene';

/**
 * PhaserViewer handles readonly display of maps using Phaser.js
 * This component is similar to PhaserPanel but without editing capabilities
 */
export class PhaserViewer {
    private scene: PhaserMapScene | null = null;
    private game: Phaser.Game | null = null;
    private containerElement: HTMLElement | null = null;
    private isInitialized: boolean = false;
    private sceneReadyPromise: Promise<PhaserMapScene> | null = null;
    private sceneReadyResolver: ((scene: PhaserMapScene) => void) | null = null;
    
    // Event callbacks
    private onLogCallback: ((message: string) => void) | null = null;
    
    constructor() {
        // Constructor kept minimal - initialize() must be called separately
    }
    
    /**
     * Initialize the Phaser viewer with a container element
     */
    public initialize(containerId: string): boolean {
        try {
            this.containerElement = document.getElementById(containerId);
            if (!this.containerElement) {
                throw new Error(`Container element with ID '${containerId}' not found`);
            }
            
            // Create the scene ready promise immediately
            this.sceneReadyPromise = new Promise<PhaserMapScene>((resolve) => {
                this.sceneReadyResolver = resolve;
            });
            
            // Ensure container has proper styling for Phaser
            this.containerElement.style.width = '100%';
            this.containerElement.style.height = '100%';
            this.containerElement.style.minWidth = '600px';
            this.containerElement.style.minHeight = '400px';
            
            // Initialize Phaser with readonly scene
            this.createPhaserGame();
            
            this.isInitialized = true;
            this.log('Phaser viewer initialized successfully');
            
            return true;
            
        } catch (error) {
            this.log(`Failed to initialize Phaser viewer: ${error}`);
            return false;
        }
    }
    
    private createPhaserGame(): void {
        // Get actual container dimensions or use defaults
        const containerWidth = this.containerElement?.clientWidth || 800;
        const containerHeight = this.containerElement?.clientHeight || 600;
        
        // Ensure minimum dimensions to avoid WebGL framebuffer issues
        const width = Math.max(containerWidth, 400);
        const height = Math.max(containerHeight, 300);
        
        
        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: this.containerElement!,
            width: width,
            height: height,
            backgroundColor: '#2c3e50',
            scene: PhaserMapScene, // Use the class directly
            scale: {
                mode: Phaser.Scale.RESIZE,
                width: width,
                height: height
            },
            physics: {
                default: 'arcade',
                arcade: {
                    debug: false
                }
            },
            input: {
                keyboard: true,
                mouse: true
            },
            render: {
                pixelArt: true,
                antialias: false
            }
        };
        
        try {
            this.game = new Phaser.Game(config);
            
            // Get reference to the scene once it's created
            this.game.events.once('ready', () => {
                this.scene = this.game!.scene.getScene('PhaserMapScene') as PhaserMapScene;
                
                if (this.scene && this.sceneReadyResolver) {
                    this.log('Phaser viewer scene is ready');
                    this.sceneReadyResolver(this.scene);
                }
            });
            
            // Add error handling for WebGL issues
            this.game.events.on('error', (error: any) => {
                this.log(`Phaser game error: ${error}`);
            });
            
        } catch (error) {
            this.log(`Failed to create Phaser game: ${error}`);
            throw error;
        }
    }
    
    /**
     * Wait for scene to be ready
     */
    public async waitForSceneReady(): Promise<PhaserMapScene> {
        if (this.scene) {
            return this.scene;
        }
        
        if (!this.sceneReadyPromise) {
            throw new Error('[PhaserViewer] Scene ready promise not initialized');
        }
        
        this.log('Waiting for scene to be ready...');
        return this.sceneReadyPromise;
    }
    
    /**
     * Load map data into the viewer
     */
    public async loadMapData(tiles: Array<{ q: number; r: number; terrain: number; color: number }>, 
                            units?: Array<{ q: number; r: number; unitType: number; playerId: number }>): Promise<void> {
        try {
            const scene = await this.waitForSceneReady();
            
            // Wait for assets to be ready before placing tiles
            await scene.waitForAssetsReady();
            this.log('Assets ready, loading map data');
            
            // Clear existing content
            scene.clearAllTiles();
            scene.clearAllUnits();
            
            // Load tiles
            if (tiles && tiles.length > 0) {
                tiles.forEach(tile => {
                    scene.setTile(tile.q, tile.r, tile.terrain, tile.color);
                });
                this.log(`Loaded ${tiles.length} tiles`);
            }
            
            // Load units if provided
            if (units && units.length > 0) {
                units.forEach(unit => {
                    scene.setUnit(unit.q, unit.r, unit.unitType, unit.playerId);
                });
                this.log(`Loaded ${units.length} units`);
            }
            
            // Center camera on the map
            this.centerOnMap(tiles);
            
        } catch (error) {
            this.log(`Failed to load map data: ${error}`);
            throw error;
        }
    }
    
    /**
     * Center camera on the loaded map
     */
    private centerOnMap(tiles: Array<{ q: number; r: number; terrain: number; color: number }>): void {
        if (!this.scene || !tiles || tiles.length === 0) return;
        
        // Find bounds of the map
        const qs = tiles.map(t => t.q);
        const rs = tiles.map(t => t.r);
        
        const minQ = Math.min(...qs);
        const maxQ = Math.max(...qs);
        const minR = Math.min(...rs);
        const maxR = Math.max(...rs);
        
        // Center on middle of map
        const centerQ = (minQ + maxQ) / 2;
        const centerR = (minR + maxR) / 2;
        
        this.scene.cameras.main.centerOn(centerQ * 64, centerR * 48); // Using tile dimensions
        
        // Set appropriate zoom level
        const mapWidth = (maxQ - minQ + 1) * 64;
        const mapHeight = (maxR - minR + 1) * 48;
        const containerWidth = this.containerElement?.clientWidth || 600;
        const containerHeight = this.containerElement?.clientHeight || 400;
        
        const zoomX = containerWidth / mapWidth;
        const zoomY = containerHeight / mapHeight;
        const zoom = Math.min(zoomX, zoomY, 2); // Max zoom of 2x
        
        this.scene.cameras.main.setZoom(Math.max(zoom, 0.5)); // Min zoom of 0.5x
    }
    
    /**
     * Enable or disable grid display
     */
    public setShowGrid(show: boolean): void {
        if (this.scene) {
            this.scene.setShowGrid(show);
        }
    }
    
    /**
     * Enable or disable coordinate display
     */
    public setShowCoordinates(show: boolean): void {
        if (this.scene) {
            this.scene.setShowCoordinates(show);
        }
    }
    
    /**
     * Set theme (light/dark)
     */
    public setTheme(isDark: boolean): void {
        if (this.scene) {
            this.scene.setTheme(isDark);
        }
    }
    
    /**
     * Get current zoom level
     */
    public getZoom(): number {
        return this.scene?.cameras.main.zoom || 1;
    }
    
    /**
     * Set zoom level
     */
    public setZoom(zoom: number): void {
        if (this.scene) {
            this.scene.cameras.main.setZoom(Phaser.Math.Clamp(zoom, 0.1, 3));
        }
    }
    
    /**
     * Event callback setters
     */
    public onLog(callback: (message: string) => void): void {
        this.onLogCallback = callback;
    }
    
    /**
     * Check if viewer is initialized
     */
    public getIsInitialized(): boolean {
        return this.isInitialized;
    }
    
    /**
     * Resize the viewer
     */
    public resize(width: number, height: number): void {
        if (this.game) {
            this.game.scale.resize(width, height);
        }
    }
    
    /**
     * Destroy the viewer and clean up resources
     */
    public destroy(): void {
        if (this.game) {
            this.game.destroy(true);
            this.game = null;
        }
        
        this.scene = null;
        this.containerElement = null;
        this.onLogCallback = null;
        this.isInitialized = false;
        
        this.log('Phaser viewer destroyed');
    }
    
    /**
     * Internal logging method
     */
    private log(message: string): void {
        if (this.onLogCallback) {
            this.onLogCallback(`[PhaserViewer] ${message}`);
        } else {
            console.log(`[PhaserViewer] ${message}`);
        }
    }
}
