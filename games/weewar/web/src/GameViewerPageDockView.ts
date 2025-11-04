import { GameViewerPage } from './GameViewerPageBase';
import { DockviewApi, DockviewComponent } from 'dockview-core';
import { TerrainStatsPanel } from './TerrainStatsPanel';
import { UnitStatsPanel } from './UnitStatsPanel';
import { DamageDistributionPanel } from './DamageDistributionPanel';
import { GameLogPanel } from './GameLogPanel';
import { TurnOptionsPanel } from './TurnOptionsPanel';
import { PhaserGameScene } from './phaser/PhaserGameScene';
import { Unit, Tile, World } from './World';

/**
 * GameViewerPageDockView - Enhanced version with customizable DockView layout
 *
 * Extends the base GameViewerPage and replaces the fixed grid layout with
 * a fully customizable DockView interface. Users can resize, rearrange, and
 * tab panels as they prefer. Layout is persisted to localStorage.
 */
export class GameViewerPageDockView extends GameViewerPage {
    private dockview: DockviewApi;
    private themeObserver: MutationObserver | null = null;
    // protected createGameScene = false;

    // protected getGameSceneContainer(): HTMLElement { return this.ensureElement('#game-scene-container', 'game-scene-container'); }

    /**
     * Override: Initialize DockView instead of fixed grid
     */
    override initializeLayout(): void {
        const container = document.getElementById('dockview-container');
        if (!container) {
            throw new Error('GameViewerPageDockView: dockview-container not found');
        }

        // Apply theme class based on current theme
        const isDarkMode = document.documentElement.classList.contains('dark');
        container.className = isDarkMode ? 'dockview-theme-dark flex-1' : 'dockview-theme-light flex-1';

        // Listen for theme changes
        this.themeObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const isDarkMode = document.documentElement.classList.contains('dark');
                    container.className = isDarkMode ? 'dockview-theme-dark flex-1' : 'dockview-theme-light flex-1';
                }
            });
        });

        this.themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        const dockviewComponent = new DockviewComponent(container, {
            createComponent: (options: any) => {
                switch (options.name) {
                    case 'main-game':
                        return this.createMainGameComponent();
                    case 'terrain-stats':
                        return this.createTerrainStatsComponent();
                    case 'unit-stats':
                        return this.createUnitStatsComponent();
                    case 'damage-distribution':
                        return this.createDamageDistributionComponent();
                    case 'turn-options':
                        return this.createTurnOptionsComponent();
                    case 'game-log':
                        return this.createGameLogComponent();
                    default:
                        return {
                            element: document.createElement('div'),
                            init: () => {},
                            dispose: () => {}
                        };
                }
            }
        });

        this.dockview = dockviewComponent.api;

        // Load saved layout or create default
        const savedLayout = this.loadDockviewLayout();
        if (savedLayout) {
            try {
                this.dockview.fromJSON(savedLayout);
            } catch (e) {
                console.warn('Failed to restore game viewer dockview layout, using default', e);
                this.configureDefaultGameLayout();
            }
        } else {
            this.configureDefaultGameLayout();
        }

        // Save layout on changes
        this.dockview.onDidLayoutChange(() => {
            this.saveDockviewLayout();
        });
    }

    /**
     * Override: Clean up DockView resources
     */
    protected cleanupLayout(): void {
        if (this.themeObserver) {
            this.themeObserver.disconnect();
            this.themeObserver = null;
        }
        if (this.dockview) {
            this.dockview.dispose();
        }
    }

    /**
     * Override: DockView handles resize through onDidResize callback
     */
    protected resizeGameCanvas(): void {
        // DockView panels handle their own resize via onDidResize
        // Just trigger a manual resize here as fallback
        if (this.gameScene) {
            const phaserContainer = this.getGameSceneContainer(); //document.querySelector('#main-game-panel-instance #phaser-viewer-container') as HTMLElement;
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

    /**
     * Override: Hide loading overlay in DockView panel
     */
    protected hideLoadingOverlay(): void {
        const gameLoadingOverlay = document.querySelector('#game-loading') as HTMLElement;
        if (gameLoadingOverlay) {
            gameLoadingOverlay.style.display = 'none';
        }

        super.dismissSplashScreen();
    }

    // =============================================================================
    // DockView-specific methods
    // =============================================================================

    /**
     * Configure the default DockView layout for optimal game viewing
     */
    private configureDefaultGameLayout(): void {
        // Add main game panel (center)
        this.dockview.addPanel({
            id: 'main-game-panel',
            component: 'main-game',
            title: 'Game',
            position: { direction: 'right' }
        });

        // Add terrain stats panel (right side)
        this.dockview.addPanel({
            id: 'terrain-stats-panel',
            component: 'terrain-stats',
            title: 'Terrain Info',
            position: {
                direction: 'right',
                referencePanel: 'main-game-panel'
            }
        });

        // Add unit stats panel (below terrain stats panel)
        this.dockview.addPanel({
            id: 'unit-stats-panel',
            component: 'unit-stats',
            title: 'Unit Info',
            position: {
                direction: 'below',
                referencePanel: 'terrain-stats-panel'
            }
        });

        // Add damage distribution panel (below unit stats panel)
        this.dockview.addPanel({
            id: 'damage-distribution-panel',
            component: 'damage-distribution',
            title: 'Damage Distribution',
            position: {
                direction: 'below',
                referencePanel: 'unit-stats-panel'
            }
        });

        // Add turn options panel (below damage distribution panel)
        this.dockview.addPanel({
            id: 'turn-options-panel',
            component: 'turn-options',
            title: 'Turn Options',
            position: {
                direction: 'below',
                referencePanel: 'damage-distribution-panel'
            }
        });

        // Add game log panel (left side)
        this.dockview.addPanel({
            id: 'game-log-panel',
            component: 'game-log',
            title: 'Game Log',
            position: {
                direction: 'left',
                referencePanel: 'main-game-panel'
            }
        });

        // Set panel sizes for optimal viewing
        setTimeout(() => {
            this.dockview.getPanel('terrain-stats-panel')?.api.setSize({ width: 320 });
            this.dockview.getPanel('game-log-panel')?.api.setSize({ width: 280 });
        }, 100);
    }

    /**
     * Save the current DockView layout to localStorage
     */
    private saveDockviewLayout(): void {
        if (!this.dockview) return;

        const layout = this.dockview.toJSON();
        localStorage.setItem('game-viewer-dockview-layout', JSON.stringify(layout));
    }

    /**
     * Load saved DockView layout from localStorage
     */
    private loadDockviewLayout(): any {
        const saved = localStorage.getItem('game-viewer-dockview-layout');
        return saved ? JSON.parse(saved) : null;
    }

    /**
     * Create main game (Phaser) component for DockView
     */
    private createMainGameComponent() {
        let element: HTMLElement
        if (this.createGameScene) {
            element = this.gameScene.getContainerElement(); // getGameSceneContainer();
            element.style.display = 'block';
        } else {
            const template = document.getElementById('main-game-panel-template');
            if (!template) {
                throw new Error('main-game-panel-template not found');
            }

            element = template// .cloneNode(true) as HTMLElement;
            element.style.display = 'block';
            element.id = 'main-game-panel-instance';
        }

        return {
            element,
            init: async () => {
              if (!this.createGameScene) {
                const phaserContainer = element.querySelector('#phaser-viewer-container') as HTMLElement;
                // Create PhaserGameScene with the container
                // DockView calls init() after panel is mounted and sized
                this.gameScene = new PhaserGameScene(phaserContainer, this.eventBus, true);
                await this.gameScene.performLocalInit()
                await this.initializePresenter();
              }
            },
            dispose: () => {
            },
            onDidResize: () => {
                // Handle panel resize events - resize the Phaser scene
                if (this.gameScene) {
                    // Get the current container size
                    const phaserContainer = this.getGameSceneContainer()
                    if (phaserContainer) {
                        const width = phaserContainer.clientWidth;
                        const height = phaserContainer.clientHeight;

                        // Use the public resize method
                        this.gameScene.resize(width, height);
                    }
                }
            }
        };
    }

    /**
     * Create terrain stats component for DockView
     */
    private createTerrainStatsComponent() {
        const element = this.terrainStatsPanel.rootElement;
        element.style.display = 'block';

        return {
            element,
            init: () => {
            },
            dispose: () => {
            }
        };
    }

    /**
     * Create unit stats component for DockView
     */
    private createUnitStatsComponent() {
        const element = this.unitStatsPanel.rootElement;
        element.style.display = 'block';

        return {
            element,
            init: () => {
            },
            dispose: () => {
            }
        };
    }

    /**
     * Create turn options component for DockView
     */
    private createTurnOptionsComponent() {
        const element = this.turnOptionsPanel.rootElement;
        element.style.display = 'block';

        return {
            element,
            init: () => {
            },
            dispose: () => {
            }
        };
    }

    /**
     * Create damage distribution component for DockView
     */
    private createDamageDistributionComponent() {
        const element = this.damageDistributionPanel.rootElement;
        element.style.display = 'block';

        return {
            element,
            init: () => {},
            dispose: () => {}
        };
    }

    /**
     * Create game log component for DockView
     */
    private createGameLogComponent() {
        const element = this.gameLogPanel.element;
        element.style.display = 'block';

        return {
            element,
            init: () => {},
            dispose: () => {}
        };
    }
}

GameViewerPageDockView.loadAfterPageLoaded("gameViewerpage", GameViewerPageDockView, "GameViewerPageDockView")
