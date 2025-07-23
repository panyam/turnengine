import * as Phaser from 'phaser';
import { PhaserWorldScene } from './PhaserWorldScene';
import { hexToPixel } from './hexUtils';
import { World } from '../World';

/**
 * Callback interfaces for game-specific interactions
 */
export interface GameSceneCallbacks {
    onTileClicked?: (q: number, r: number) => void;
    onUnitClicked?: (q: number, r: number) => void;
}

/**
 * PhaserGameScene extends PhaserWorldScene with game-specific interactive features.
 * 
 * This scene adds:
 * - Unit selection and visual highlighting
 * - Movement range display with pathfinding
 * - Attack range visualization
 * - Click-to-move and click-to-attack interactions
 * - Visual feedback for player actions
 * - Turn-based interaction states
 * 
 * Inherits from PhaserWorldScene:
 * - World as single source of truth for game data
 * - Tile and unit rendering using World data
 * - Camera controls and theme management
 * - Asset loading and coordinate conversion
 * - Self-contained Phaser.Game instance
 * - Callback system for external communication
 */
export class PhaserGameScene extends PhaserWorldScene {
    private callbacks: GameSceneCallbacks = {};
    
    // Game-specific state
    private selectedUnit: { q: number; r: number; unitData: any } | null = null;
    private gameMode: 'select' | 'move' | 'attack' = 'select';
    private currentPlayer: number = 1;
    private isPlayerTurn: boolean = true;
    
    // Visual highlight groups
    private selectionHighlight: Phaser.GameObjects.Graphics | null = null;
    private movementHighlights: Phaser.GameObjects.Graphics[] = [];
    private attackHighlights: Phaser.GameObjects.Graphics[] = [];
    private pathPreview: Phaser.GameObjects.Graphics | null = null;
    
    // Interaction data from game engine
    private movableCoords: Array<{ q: number; r: number }> = [];
    private attackableCoords: Array<{ q: number; r: number }> = [];
    
    constructor(config?: string | Phaser.Types.Scenes.SettingsConfig) {
        super(config || { key: 'PhaserGameScene' });
        console.log('[PhaserGameScene] Constructor called with config:', config);
    }

    /**
     * Override create to add game-specific initialization
     */
    create() {
        console.log('[PhaserGameScene] create() method called - initializing game scene');
        
        // Call parent create first
        super.create();
        
        console.log('[PhaserGameScene] Game scene created successfully');
    }

    /**
     * Set callback functions for game interactions
     */
    public setCallbacks(callbacks: GameSceneCallbacks): void {
        this.callbacks = callbacks;
        console.log('[PhaserGameScene] Callbacks set:', Object.keys(callbacks));
    }

    /**
     * Override the base tile click handler to add game-specific logic
     */
    protected onTileClick(q: number, r: number): void {
        console.log(`[PhaserGameScene] Tile clicked: Q=${q}, R=${r}, Mode=${this.gameMode}`);
        
        if (!this.world) {
            console.warn('[PhaserGameScene] No World available for tile click');
            return;
        }

        // Handle different interaction modes
        switch (this.gameMode) {
            case 'select':
                this.handleSelectClick(q, r);
                break;
            case 'move':
                this.handleMoveClick(q, r);
                break;
            case 'attack':
                this.handleAttackClick(q, r);
                break;
        }

        // Also call parent callbacks for external handling (terrain stats, etc.)
        // Check if there's a unit at this position first
        const unit = this.world.getUnitAt(q, r);
        if (unit) {
            // Call unit clicked callback
            if (this.callbacks.onUnitClicked) {
                this.callbacks.onUnitClicked(q, r);
            }
        } else {
            // Call tile clicked callback
            if (this.callbacks.onTileClicked) {
                this.callbacks.onTileClicked(q, r);
            }
        }

        // Also emit the base event for any other listeners
        this.events.emit('tileClicked', { q, r });
    }

    /**
     * Get tile data at specific coordinates (for callback functions)
     */
    public getTileAt(q: number, r: number): any {
        if (!this.world) {
            return null;
        }
        return this.world.getTileAt(q, r);
    }

    /**
     * Get unit data at specific coordinates (for callback functions) 
     */
    public getUnitAt(q: number, r: number): any {
        if (!this.world) {
            return null;
        }
        return this.world.getUnitAt(q, r);
    }

    /**
     * Check if there's a unit at the specified coordinates
     */
    public hasUnitAt(q: number, r: number): boolean {
        if (!this.world) {
            return false;
        }
        return this.world.getUnitAt(q, r) !== null;
    }

    /**
     * Check if there's a tile at the specified coordinates
     */
    public hasTileAt(q: number, r: number): boolean {
        if (!this.world) {
            return false;
        }
        return this.world.getTileAt(q, r) !== null;
    }

    /**
     * Handle selection mode clicks
     */
    private handleSelectClick(q: number, r: number): void {
        // Check if there's a unit at this position
        const unitAtPosition = this.getUnitAt(q, r);
        
        if (unitAtPosition) {
            // Unit click - try to select it
            console.log(`[PhaserGameScene] Unit found at Q=${q}, R=${r}:`, unitAtPosition);
            
            // Clear previous selection
            this.clearSelection();
            
            // Set new selection (visual will be updated by external callback)
            this.selectedUnit = {
                q: q,
                r: r,
                unitData: unitAtPosition
            };
            
            // Highlight selected unit
            this.highlightSelectedUnit(q, r);
            
            console.log(`[PhaserGameScene] Unit selected at Q=${q}, R=${r}`);
        } else {
            // Empty tile click in select mode - clear selection
            this.clearSelection();
            console.log(`[PhaserGameScene] Selection cleared by empty tile click`);
        }
    }

    /**
     * Handle movement mode clicks
     */
    private handleMoveClick(q: number, r: number): void {
        if (!this.selectedUnit) {
            console.warn('[PhaserGameScene] Move click but no unit selected');
            return;
        }

        // Check if this is a valid movement target
        const isValidMove = this.movableCoords.some(coord => coord.q === q && coord.r === r);
        
        if (isValidMove) {
            console.log(`[PhaserGameScene] Valid move target: Q=${q}, R=${r}`);
            
            // External callback will handle the actual move through game engine
            // We just provide visual feedback here
            this.showMovePreview(this.selectedUnit.q, this.selectedUnit.r, q, r);
            
            // Return to select mode after move attempt
            this.setGameMode('select');
        } else {
            console.log(`[PhaserGameScene] Invalid move target: Q=${q}, R=${r}`);
            // Could show visual feedback for invalid move
        }
    }

    /**
     * Handle attack mode clicks
     */
    private handleAttackClick(q: number, r: number): void {
        if (!this.selectedUnit) {
            console.warn('[PhaserGameScene] Attack click but no unit selected');
            return;
        }

        // Check if this is a valid attack target
        const isValidAttack = this.attackableCoords.some(coord => coord.q === q && coord.r === r);
        
        if (isValidAttack) {
            console.log(`[PhaserGameScene] Valid attack target: Q=${q}, R=${r}`);
            
            // External callback will handle the actual attack through game engine
            // We just provide visual feedback here
            this.showAttackPreview(this.selectedUnit.q, this.selectedUnit.r, q, r);
            
            // Return to select mode after attack attempt
            this.setGameMode('select');
        } else {
            console.log(`[PhaserGameScene] Invalid attack target: Q=${q}, R=${r}`);
            // Could show visual feedback for invalid attack
        }
    }

    /**
     * Set the current game mode
     */
    public setGameMode(mode: 'select' | 'move' | 'attack'): void {
        console.log(`[PhaserGameScene] Game mode changed: ${this.gameMode} → ${mode}`);
        this.gameMode = mode;
        
        // Update visual indicators based on mode
        this.updateModeVisuals();
    }

    /**
     * Set the selected unit and show movement/attack options
     */
    public selectUnit(q: number, r: number, movableCoords: Array<{ q: number; r: number }>, attackableCoords: Array<{ q: number; r: number }>): void {
        const unitData = this.getUnitAt(q, r);
        if (!unitData) {
            console.warn(`[PhaserGameScene] No unit found at Q=${q}, R=${r} for selection`);
            return;
        }

        console.log(`[PhaserGameScene] Selecting unit at Q=${q}, R=${r} with ${movableCoords.length} move options and ${attackableCoords.length} attack options`);

        // Store selection state
        this.selectedUnit = { q, r, unitData };
        this.movableCoords = movableCoords;
        this.attackableCoords = attackableCoords;

        // Update visuals
        this.highlightSelectedUnit(q, r);
        this.showMovementOptions(movableCoords);
        this.showAttackOptions(attackableCoords);
    }

    /**
     * Clear unit selection and all highlights
     */
    public clearSelection(): void {
        console.log('[PhaserGameScene] Clearing selection and highlights');
        
        this.selectedUnit = null;
        this.movableCoords = [];
        this.attackableCoords = [];
        
        // Clear all visual highlights
        this.clearAllHighlights();
        
        // Return to select mode
        this.setGameMode('select');
    }

    /**
     * Update visuals based on current mode
     */
    private updateModeVisuals(): void {
        // Clear previous mode-specific highlights
        this.clearPathPreview();
        
        switch (this.gameMode) {
            case 'move':
                // Emphasize movement options
                this.emphasizeMovementHighlights();
                break;
            case 'attack':
                // Emphasize attack options
                this.emphasizeAttackHighlights();
                break;
            case 'select':
                // Show both movement and attack options equally
                this.normalizeHighlights();
                break;
        }
    }

    /**
     * Highlight the selected unit
     */
    private highlightSelectedUnit(q: number, r: number): void {
        // Clear previous selection highlight
        if (this.selectionHighlight) {
            this.selectionHighlight.destroy();
        }

        // Create new selection highlight
        this.selectionHighlight = this.add.graphics();
        this.selectionHighlight.lineStyle(4, 0xFFFF00, 1.0); // Yellow border
        this.selectionHighlight.fillStyle(0xFFFF00, 0.2); // Yellow fill with transparency

        // Draw hex outline at unit position
        const position = hexToPixel(q, r);
        this.drawHexagonShape(this.selectionHighlight, position.x, position.y, this.tileWidth * 0.9);
        
        this.selectionHighlight.setDepth(10); // Above tiles, below UI
        console.log(`[PhaserGameScene] Unit highlighted at Q=${q}, R=${r}`);
    }

    /**
     * Show movement options as green highlights
     */
    private showMovementOptions(movableCoords: Array<{ q: number; r: number }>): void {
        // Clear previous movement highlights
        this.clearMovementHighlights();

        movableCoords.forEach(coord => {
            const highlight = this.add.graphics();
            highlight.lineStyle(2, 0x00FF00, 0.8); // Green border
            highlight.fillStyle(0x00FF00, 0.15); // Green fill

            const position = hexToPixel(coord.q, coord.r);
            this.drawHexagonShape(highlight, position.x, position.y, this.tileWidth * 0.85);
            
            highlight.setDepth(5); // Above tiles, below selection
            this.movementHighlights.push(highlight);
        });

        console.log(`[PhaserGameScene] Showing ${movableCoords.length} movement options`);
    }

    /**
     * Show attack options as red highlights
     */
    private showAttackOptions(attackableCoords: Array<{ q: number; r: number }>): void {
        // Clear previous attack highlights
        this.clearAttackHighlights();

        attackableCoords.forEach(coord => {
            const highlight = this.add.graphics();
            highlight.lineStyle(2, 0xFF0000, 0.8); // Red border
            highlight.fillStyle(0xFF0000, 0.15); // Red fill

            const position = hexToPixel(coord.q, coord.r);
            this.drawHexagonShape(highlight, position.x, position.y, this.tileWidth * 0.85);
            
            highlight.setDepth(5); // Above tiles, below selection
            this.attackHighlights.push(highlight);
        });

        console.log(`[PhaserGameScene] Showing ${attackableCoords.length} attack options`);
    }

    /**
     * Show move preview line
     */
    private showMovePreview(fromQ: number, fromR: number, toQ: number, toR: number): void {
        this.clearPathPreview();

        this.pathPreview = this.add.graphics();
        this.pathPreview.lineStyle(3, 0x00FF00, 0.8); // Green line

        const fromPos = hexToPixel(fromQ, fromR);
        const toPos = hexToPixel(toQ, toR);

        this.pathPreview.beginPath();
        this.pathPreview.moveTo(fromPos.x, fromPos.y);
        this.pathPreview.lineTo(toPos.x, toPos.y);
        this.pathPreview.strokePath();
        
        this.pathPreview.setDepth(15); // Above everything

        console.log(`[PhaserGameScene] Move preview: (${fromQ},${fromR}) → (${toQ},${toR})`);
    }

    /**
     * Show attack preview line
     */
    private showAttackPreview(fromQ: number, fromR: number, toQ: number, toR: number): void {
        this.clearPathPreview();

        this.pathPreview = this.add.graphics();
        this.pathPreview.lineStyle(3, 0xFF0000, 0.8); // Red line

        const fromPos = hexToPixel(fromQ, fromR);
        const toPos = hexToPixel(toQ, toR);

        this.pathPreview.beginPath();
        this.pathPreview.moveTo(fromPos.x, fromPos.y);
        this.pathPreview.lineTo(toPos.x, toPos.y);
        this.pathPreview.strokePath();
        
        this.pathPreview.setDepth(15); // Above everything

        console.log(`[PhaserGameScene] Attack preview: (${fromQ},${fromR}) → (${toQ},${toR})`);
    }

    /**
     * Emphasize movement highlights for move mode
     */
    private emphasizeMovementHighlights(): void {
        this.movementHighlights.forEach(highlight => {
            highlight.setAlpha(1.0); // Full opacity
        });
        this.attackHighlights.forEach(highlight => {
            highlight.setAlpha(0.3); // Reduced opacity
        });
    }

    /**
     * Emphasize attack highlights for attack mode
     */
    private emphasizeAttackHighlights(): void {
        this.attackHighlights.forEach(highlight => {
            highlight.setAlpha(1.0); // Full opacity
        });
        this.movementHighlights.forEach(highlight => {
            highlight.setAlpha(0.3); // Reduced opacity
        });
    }

    /**
     * Normalize highlights for select mode
     */
    private normalizeHighlights(): void {
        this.movementHighlights.forEach(highlight => {
            highlight.setAlpha(0.7); // Normal opacity
        });
        this.attackHighlights.forEach(highlight => {
            highlight.setAlpha(0.7); // Normal opacity
        });
    }

    /**
     * Clear all visual highlights
     */
    private clearAllHighlights(): void {
        this.clearSelectionHighlight();
        this.clearMovementHighlights();
        this.clearAttackHighlights();
        this.clearPathPreview();
    }

    /**
     * Clear selection highlight
     */
    private clearSelectionHighlight(): void {
        if (this.selectionHighlight) {
            this.selectionHighlight.destroy();
            this.selectionHighlight = null;
        }
    }

    /**
     * Clear movement highlights
     */
    private clearMovementHighlights(): void {
        this.movementHighlights.forEach(highlight => highlight.destroy());
        this.movementHighlights = [];
    }

    /**
     * Clear attack highlights
     */
    private clearAttackHighlights(): void {
        this.attackHighlights.forEach(highlight => highlight.destroy());
        this.attackHighlights = [];
    }

    /**
     * Clear path preview
     */
    private clearPathPreview(): void {
        if (this.pathPreview) {
            this.pathPreview.destroy();
            this.pathPreview = null;
        }
    }

    /**
     * Set current player (affects interaction permissions)
     */
    public setCurrentPlayer(playerId: number): void {
        console.log(`[PhaserGameScene] Current player changed: ${this.currentPlayer} → ${playerId}`);
        this.currentPlayer = playerId;
    }

    /**
     * Set whether it's the player's turn (affects interaction availability)
     */
    public setPlayerTurn(isPlayerTurn: boolean): void {
        console.log(`[PhaserGameScene] Player turn changed: ${this.isPlayerTurn} → ${isPlayerTurn}`);
        this.isPlayerTurn = isPlayerTurn;
        
        if (!isPlayerTurn) {
            // Clear selection when it's not player's turn
            this.clearSelection();
        }
    }

    /**
     * Get current selection state for external queries
     */
    public getSelectedUnit(): { q: number; r: number; unitData: any } | null {
        return this.selectedUnit;
    }

    /**
     * Get current game mode
     */
    public getGameMode(): 'select' | 'move' | 'attack' {
        return this.gameMode;
    }

    /**
     * Manual cleanup when scene is destroyed
     */
    public destroy(): void {
        this.clearAllHighlights();
        super.destroy();
    }
}
