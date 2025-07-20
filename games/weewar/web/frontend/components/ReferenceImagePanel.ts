import { ComponentLifecycle } from './ComponentLifecycle';
import { BaseComponent } from './Component';
import { EventBus, EditorEventTypes, ReferenceLoadFromFilePayload, ReferenceSetModePayload, ReferenceSetAlphaPayload, ReferenceSetPositionPayload, ReferenceSetScalePayload, ReferenceScaleChangedPayload, ReferenceStateChangedPayload } from './EventBus';

/**
 * ReferenceImagePanel - Demonstrates new lifecycle architecture
 * 
 * This component showcases the breadth-first lifecycle pattern:
 * 1. bindToDOM() - Set up UI controls without dependencies
 * 2. injectDependencies() - Receive PhaserEditorComponent when available
 * 3. activate() - Enable functionality once all dependencies ready
 * 
 * Benefits:
 * - No initialization order dependencies
 * - Graceful handling of missing dependencies
 * - Clear separation of concerns across lifecycle phases
 */
export class ReferenceImagePanel extends BaseComponent {
    // Dependencies (injected in phase 2)
    private toastCallback?: (title: string, message: string, type: 'success' | 'error' | 'info') => void;
    
    // Internal state
    private isUIBound = false;
    private isActivated = false;
    private pendingOperations: Array<() => void> = [];
    
    // Reference image state cache (updated via EventBus)
    private referenceState = {
        scale: { x: 1.0, y: 1.0 },
        position: { x: 0, y: 0 },
        alpha: 0.5,
        mode: 0,
        isLoaded: false
    };
    
    constructor(rootElement: HTMLElement, eventBus: EventBus, debugMode: boolean = false) {
        super('reference-image-panel', rootElement, eventBus, debugMode);
    }
    
    // Dependencies are now set directly using explicit setters instead of ComponentDependencyDeclaration
    
    // ComponentLifecycle Phase 1: Initialize DOM and discover children (no dependencies needed)
    public initializeDOM(): ComponentLifecycle[] {
        if (this.isUIBound) {
            this.log('Already bound to DOM, skipping');
            return [];
        }
        
        try {
            this.log('Binding ReferenceImagePanel to DOM');
            
            // Set up UI elements and event handlers
            this.bindLoadingControls();
            this.bindDisplayModeControls();
            this.bindAlphaControls();
            this.bindPositionControls();
            this.bindScaleControls();
            this.bindClearControls();
            
            this.isUIBound = true;
            this.log('ReferenceImagePanel bound to DOM successfully');
            
            // This is a leaf component - no children
            return [];
            
        } catch (error) {
            this.handleError('Failed to bind ReferenceImagePanel to DOM', error);
            throw error;
        }
    }
    
    // Phase 2: Inject dependencies - simplified to use explicit setters
    public injectDependencies(deps: Record<string, any>): void {
        this.log('ReferenceImagePanel: Dependencies injection phase - using explicit setters');
        
        // Dependencies should be set directly by parent using setters
        // This phase just validates that required dependencies are available
        if (!this.toastCallback) {
            throw new Error('ReferenceImagePanel requires toast callback - use setToastCallback()');
        }
        
        this.log('Dependencies validation complete');
    }
    
    // Explicit dependency setters
    public setToastCallback(callback: (title: string, message: string, type: 'success' | 'error' | 'info') => void): void {
        this.toastCallback = callback;
        this.log('Toast callback set via explicit setter');
    }
    
    // Explicit dependency getters
    public getToastCallback(): ((title: string, message: string, type: 'success' | 'error' | 'info') => void) | undefined {
        return this.toastCallback;
    }
    
    // Phase 3: Activate component
    public activate(): void {
        if (this.isActivated) {
            this.log('Already activated, skipping');
            return;
        }
        
        this.log('Activating ReferenceImagePanel');
        
        // Subscribe to EventBus events from PhaserEditorComponent
        this.subscribeToReferenceEvents();
        
        // Process any operations that were queued during UI binding
        this.processPendingOperations();
        
        // Update UI state - no longer dependent on PhaserEditorComponent availability
        this.updateUIState();
        
        this.isActivated = true;
        this.log('ReferenceImagePanel activated successfully');
    }
    
    /**
     * Subscribe to reference image events from PhaserEditorComponent
     */
    private subscribeToReferenceEvents(): void {
        // Subscribe to scale changes from direct Phaser interaction
        this.eventBus.subscribe<ReferenceScaleChangedPayload>(
            EditorEventTypes.REFERENCE_SCALE_CHANGED,
            (payload) => {
                // Only handle events NOT originating from this component to prevent loops
                if (payload.source !== this.componentId) {
                    this.handleReferenceScaleChanged(payload.data);
                }
            },
            this.componentId
        );
        
        // Subscribe to state changes from direct Phaser interaction
        this.eventBus.subscribe<ReferenceStateChangedPayload>(
            EditorEventTypes.REFERENCE_STATE_CHANGED,
            (payload) => {
                // Only handle events NOT originating from this component to prevent loops
                if (payload.source !== this.componentId) {
                    this.handleReferenceStateChanged(payload.data);
                }
            },
            this.componentId
        );
        
        this.log('Subscribed to reference image EventBus events (excluding self-originated events)');
    }
    
    /**
     * Handle reference scale changed event from PhaserEditorComponent
     */
    private handleReferenceScaleChanged(data: ReferenceScaleChangedPayload): void {
        this.log(`Received reference scale changed: ${data.scaleX}, ${data.scaleY}`);
        
        // Update local state cache
        this.referenceState.scale.x = data.scaleX;
        this.referenceState.scale.y = data.scaleY;
        
        // Update UI display
        this.updateReferenceScaleDisplay();
    }
    
    /**
     * Handle reference state changed event from PhaserEditorComponent
     */
    private handleReferenceStateChanged(data: ReferenceStateChangedPayload): void {
        this.log(`Received reference state changed:`, data);
        
        // Update local state cache
        this.referenceState = { ...data };
        
        // Update UI based on new state
        this.updateReferenceScaleDisplay();
        this.updateReferenceStatus(data.isLoaded ? 
            (data.mode === 0 ? 'Hidden' : ['Hidden', 'Background', 'Overlay'][data.mode] + ' mode') : 
            'No reference image loaded'
        );
    }
    
    // Phase 4: Deactivate component
    public deactivate(): void {
        this.log('Deactivating ReferenceImagePanel');
        
        // Clear any pending operations
        this.pendingOperations = [];
        
        // Reset state
        this.isActivated = false;
        this.toastCallback = undefined;
        
        this.log('ReferenceImagePanel deactivated');
    }
    
    // UI Binding Methods (Phase 1)
    
    private bindLoadingControls(): void {
        // Load from clipboard button
        const loadReferenceBtn = this.rootElement.querySelector('#load-reference-btn') as HTMLButtonElement;
        if (loadReferenceBtn) {
            loadReferenceBtn.addEventListener('click', () => {
                this.executeWhenReady(() => this.loadReferenceFromClipboard());
            });
            this.log('Load from clipboard button bound');
        }
        
        // File input and load from file button
        const fileInput = this.rootElement.querySelector('#reference-file-input') as HTMLInputElement;
        const loadFileBtn = this.rootElement.querySelector('#load-reference-file-btn') as HTMLButtonElement;
        
        if (loadFileBtn && fileInput) {
            loadFileBtn.addEventListener('click', () => {
                fileInput.click();
            });
            
            fileInput.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement;
                if (target.files && target.files.length > 0) {
                    this.executeWhenReady(() => this.loadReferenceFromFile(target.files![0]));
                }
            });
            
            this.log('File loading controls bound');
        }
    }
    
    private bindDisplayModeControls(): void {
        const modeSelect = this.rootElement.querySelector('#reference-mode') as HTMLSelectElement;
        if (modeSelect) {
            modeSelect.addEventListener('change', (e) => {
                const mode = parseInt((e.target as HTMLSelectElement).value);
                this.executeWhenReady(() => this.setReferenceMode(mode));
            });
            this.log('Display mode selector bound');
        }
    }
    
    private bindAlphaControls(): void {
        const alphaSlider = this.rootElement.querySelector('#reference-alpha') as HTMLInputElement;
        const alphaValue = this.rootElement.querySelector('#reference-alpha-value') as HTMLElement;
        
        if (alphaSlider && alphaValue) {
            alphaSlider.addEventListener('input', (e) => {
                const alpha = parseInt((e.target as HTMLInputElement).value) / 100;
                alphaValue.textContent = `${Math.round(alpha * 100)}%`;
                this.executeWhenReady(() => this.setReferenceAlpha(alpha));
            });
            this.log('Alpha transparency slider bound');
        }
    }
    
    private bindPositionControls(): void {
        const resetPositionBtn = this.rootElement.querySelector('#reference-reset-position') as HTMLButtonElement;
        if (resetPositionBtn) {
            resetPositionBtn.addEventListener('click', () => {
                this.executeWhenReady(() => this.resetReferencePosition());
            });
        }
        
        const resetScaleBtn = this.rootElement.querySelector('#reference-reset-scale') as HTMLButtonElement;
        if (resetScaleBtn) {
            resetScaleBtn.addEventListener('click', () => {
                this.executeWhenReady(() => this.resetReferenceScale());
            });
        }
        
        this.log('Position controls bound');
    }
    
    private bindScaleControls(): void {
        // X Scale controls
        const scaleXMinusBtn = this.rootElement.querySelector('#reference-scale-x-minus') as HTMLButtonElement;
        const scaleXPlusBtn = this.rootElement.querySelector('#reference-scale-x-plus') as HTMLButtonElement;
        const scaleXInput = this.rootElement.querySelector('#reference-scale-x-value') as HTMLInputElement;
        
        if (scaleXMinusBtn) {
            scaleXMinusBtn.addEventListener('click', () => {
                this.executeWhenReady(() => this.adjustReferenceScaleX(-0.01));
            });
        }
        
        if (scaleXPlusBtn) {
            scaleXPlusBtn.addEventListener('click', () => {
                this.executeWhenReady(() => this.adjustReferenceScaleX(0.01));
            });
        }
        
        if (scaleXInput) {
            scaleXInput.addEventListener('change', () => {
                const value = parseFloat(scaleXInput.value);
                if (!isNaN(value)) {
                    this.executeWhenReady(() => this.setReferenceScaleX(value));
                }
            });
        }
        
        // Y Scale controls
        const scaleYMinusBtn = this.rootElement.querySelector('#reference-scale-y-minus') as HTMLButtonElement;
        const scaleYPlusBtn = this.rootElement.querySelector('#reference-scale-y-plus') as HTMLButtonElement;
        const scaleYInput = this.rootElement.querySelector('#reference-scale-y-value') as HTMLInputElement;
        
        if (scaleYMinusBtn) {
            scaleYMinusBtn.addEventListener('click', () => {
                this.executeWhenReady(() => this.adjustReferenceScaleY(-0.01));
            });
        }
        
        if (scaleYPlusBtn) {
            scaleYPlusBtn.addEventListener('click', () => {
                this.executeWhenReady(() => this.adjustReferenceScaleY(0.01));
            });
        }
        
        if (scaleYInput) {
            scaleYInput.addEventListener('change', () => {
                const value = parseFloat(scaleYInput.value);
                if (!isNaN(value)) {
                    this.executeWhenReady(() => this.setReferenceScaleY(value));
                }
            });
        }
        
        this.log('Scale controls bound');
    }
    
    private bindClearControls(): void {
        const clearReferenceBtn = this.rootElement.querySelector('#clear-reference-btn') as HTMLButtonElement;
        if (clearReferenceBtn) {
            clearReferenceBtn.addEventListener('click', () => {
                this.executeWhenReady(() => this.clearReferenceImage());
            });
            this.log('Clear reference button bound');
        }
    }
    
    // Deferred Execution System
    
    /**
     * Execute operation when component is ready, or queue it for later
     */
    private executeWhenReady(operation: () => void): void {
        if (this.isActivated) {
            // Component is ready - execute immediately
            try {
                operation();
            } catch (error) {
                this.handleError('Operation failed', error);
                this.showToast('Error', 'Operation failed', 'error');
            }
        } else {
            // Component not ready - queue for later
            this.pendingOperations.push(operation);
            this.showToast('Info', 'Component not ready - operation queued', 'info');
        }
    }
    
    /**
     * Process all pending operations when component becomes ready
     */
    private processPendingOperations(): void {
        if (this.pendingOperations.length > 0) {
            this.log(`Processing ${this.pendingOperations.length} pending operations`);
            
            const operations = [...this.pendingOperations];
            this.pendingOperations = [];
            
            operations.forEach(operation => {
                try {
                    operation();
                } catch (error) {
                    this.handleError('Pending operation failed', error);
                    this.showToast('Error', 'Pending operation failed', 'error');
                }
            });
        }
    }
    
    /**
     * Update UI state - no longer dependent on PhaserEditor availability
     */
    private updateUIState(): void {
        // Enable all controls - communication via EventBus means no direct dependency needed
        const controls = this.rootElement.querySelectorAll('button, input, select');
        
        controls.forEach(control => {
            const element = control as HTMLElement;
            element.removeAttribute('disabled');
            element.classList.remove('opacity-50', 'cursor-not-allowed');
        });
        
        // Update status message
        this.updateReferenceStatus('No reference image loaded');
    }
    
    // Reference Image Operations (Phase 3 - when dependencies are available)
    
    private async loadReferenceFromClipboard(): Promise<void> {
        try {
            this.log('Requesting reference image load from clipboard via EventBus');
            
            // Emit event to PhaserEditorComponent via EventBus
            this.eventBus.emit(EditorEventTypes.REFERENCE_LOAD_FROM_CLIPBOARD, {}, this.componentId);
            
            // UI feedback - actual success/failure will come via EventBus response events
            this.showToast('Loading', 'Loading reference image from clipboard...', 'info');
            this.updateReferenceStatus('Loading from clipboard...');
            
        } catch (error) {
            this.handleError(`Failed to request reference image load`, error);
            this.showToast('Error', 'Failed to request reference image load', 'error');
        }
    }
    
    private async loadReferenceFromFile(file: File): Promise<void> {
        try {
            this.log(`Requesting reference image load from file: ${file.name} (${file.size} bytes)`);
            
            // Emit event to PhaserEditorComponent via EventBus
            this.eventBus.emit<ReferenceLoadFromFilePayload>(
                EditorEventTypes.REFERENCE_LOAD_FROM_FILE, 
                { file }, 
                this.componentId
            );
            
            // UI feedback - actual success/failure will come via EventBus response events
            this.showToast('Loading', `Loading reference image: ${file.name}`, 'info');
            this.updateReferenceStatus(`Loading file: ${file.name}`);
            
        } catch (error) {
            this.handleError(`Failed to request reference image load from file`, error);
            this.showToast('Error', 'Failed to request reference image load', 'error');
        }
    }
    
    private setDefaultMode(): void {
        // Enable mode selector and default to background mode
        const modeSelect = this.rootElement.querySelector('#reference-mode') as HTMLSelectElement;
        if (modeSelect && modeSelect.value === '0') {
            modeSelect.value = '1'; // Default to background mode
            this.setReferenceMode(1);
        }
    }
    
    private setReferenceMode(mode: number): void {
        // Emit event to PhaserEditorComponent via EventBus
        this.eventBus.emit<ReferenceSetModePayload>(
            EditorEventTypes.REFERENCE_SET_MODE, 
            { mode }, 
            this.componentId
        );
        
        // Update UI dropdown to reflect current mode
        const modeSelect = this.rootElement.querySelector('#reference-mode') as HTMLSelectElement;
        if (modeSelect && modeSelect.value !== mode.toString()) {
            modeSelect.value = mode.toString();
        }
        
        // Show/hide position controls based on mode
        const positionControls = this.rootElement.querySelector('#reference-position-controls') as HTMLElement;
        if (positionControls) {
            positionControls.style.display = mode === 2 ? 'block' : 'none';
        }
        
        // Note: Scale display will be updated when PhaserEditorComponent responds via EventBus
        
        const modeNames = ['Hidden', 'Background', 'Overlay'];
        this.log(`Reference mode set to: ${modeNames[mode]}`);
        this.updateReferenceStatus(mode === 0 ? 'Hidden' : `${modeNames[mode]} mode`);
    }
    
    private setReferenceAlpha(alpha: number): void {
        // Emit event to PhaserEditorComponent via EventBus
        this.eventBus.emit<ReferenceSetAlphaPayload>(
            EditorEventTypes.REFERENCE_SET_ALPHA, 
            { alpha }, 
            this.componentId
        );
        this.log(`Reference alpha set to: ${Math.round(alpha * 100)}%`);
    }
    
    private resetReferencePosition(): void {
        // Emit event to PhaserEditorComponent via EventBus
        this.eventBus.emit<ReferenceSetPositionPayload>(
            EditorEventTypes.REFERENCE_SET_POSITION, 
            { x: 0, y: 0 }, 
            this.componentId
        );
        this.log('Reference position reset to center');
        this.showToast('Position Reset', 'Reference image centered', 'success');
    }
    
    private resetReferenceScale(): void {
        // Emit event to PhaserEditorComponent via EventBus
        this.eventBus.emit<ReferenceSetScalePayload>(
            EditorEventTypes.REFERENCE_SET_SCALE, 
            { scaleX: 1, scaleY: 1 }, 
            this.componentId
        );
        this.log('Reference scale reset to 100%');
        this.showToast('Scale Reset', 'Reference image scale reset', 'success');
        // Scale display will be updated when PhaserEditorComponent responds via EventBus
    }
    
    private adjustReferenceScaleX(delta: number): void {
        const newScaleX = Math.max(0.1, Math.min(5.0, this.referenceState.scale.x + delta));
        
        // Emit event to PhaserEditorComponent via EventBus
        this.eventBus.emit<ReferenceSetScalePayload>(
            EditorEventTypes.REFERENCE_SET_SCALE, 
            { scaleX: newScaleX, scaleY: this.referenceState.scale.y }, 
            this.componentId
        );
        
        // Update local state cache
        this.referenceState.scale.x = newScaleX;
        this.updateReferenceScaleDisplay();
        this.log(`Reference X scale: ${newScaleX.toFixed(2)}`);
    }
    
    private adjustReferenceScaleY(delta: number): void {
        const newScaleY = Math.max(0.1, Math.min(5.0, this.referenceState.scale.y + delta));
        
        // Emit event to PhaserEditorComponent via EventBus
        this.eventBus.emit<ReferenceSetScalePayload>(
            EditorEventTypes.REFERENCE_SET_SCALE, 
            { scaleX: this.referenceState.scale.x, scaleY: newScaleY }, 
            this.componentId
        );
        
        // Update local state cache
        this.referenceState.scale.y = newScaleY;
        this.updateReferenceScaleDisplay();
        this.log(`Reference Y scale: ${newScaleY.toFixed(2)}`);
    }
    
    private setReferenceScaleX(scaleX: number): void {
        const clampedScale = Math.max(0.1, Math.min(5.0, scaleX));
        
        // Emit event to PhaserEditorComponent via EventBus
        this.eventBus.emit<ReferenceSetScalePayload>(
            EditorEventTypes.REFERENCE_SET_SCALE, 
            { scaleX: clampedScale, scaleY: this.referenceState.scale.y }, 
            this.componentId
        );
        
        // Update local state cache
        this.referenceState.scale.x = clampedScale;
        this.updateReferenceScaleDisplay();
        this.log(`Reference X scale: ${clampedScale.toFixed(2)}`);
    }
    
    private setReferenceScaleY(scaleY: number): void {
        const clampedScale = Math.max(0.1, Math.min(5.0, scaleY));
        
        // Emit event to PhaserEditorComponent via EventBus
        this.eventBus.emit<ReferenceSetScalePayload>(
            EditorEventTypes.REFERENCE_SET_SCALE, 
            { scaleX: this.referenceState.scale.x, scaleY: clampedScale }, 
            this.componentId
        );
        
        // Update local state cache
        this.referenceState.scale.y = clampedScale;
        this.updateReferenceScaleDisplay();
        this.log(`Reference Y scale: ${clampedScale.toFixed(2)}`);
    }
    
    private updateReferenceScaleDisplay(): void {
        const scaleXInput = this.rootElement.querySelector('#reference-scale-x-value') as HTMLInputElement;
        const scaleYInput = this.rootElement.querySelector('#reference-scale-y-value') as HTMLInputElement;
        
        if (scaleXInput) {
            scaleXInput.value = this.referenceState.scale.x.toFixed(2);
        }
        
        if (scaleYInput) {
            scaleYInput.value = this.referenceState.scale.y.toFixed(2);
        }
    }
    
    private clearReferenceImage(): void {
        // Emit event to PhaserEditorComponent via EventBus
        this.eventBus.emit(EditorEventTypes.REFERENCE_CLEAR, {}, this.componentId);
        
        // Reset local state cache
        this.referenceState = {
            scale: { x: 1.0, y: 1.0 },
            position: { x: 0, y: 0 },
            alpha: 0.5,
            mode: 0,
            isLoaded: false
        };
        
        // Reset UI controls
        const modeSelect = this.rootElement.querySelector('#reference-mode') as HTMLSelectElement;
        if (modeSelect) {
            modeSelect.value = '0';
        }
        
        const alphaSlider = this.rootElement.querySelector('#reference-alpha') as HTMLInputElement;
        const alphaValue = this.rootElement.querySelector('#reference-alpha-value') as HTMLElement;
        if (alphaSlider && alphaValue) {
            alphaSlider.value = '50';
            alphaValue.textContent = '50%';
        }
        
        // Hide position controls
        const positionControls = this.rootElement.querySelector('#reference-position-controls') as HTMLElement;
        if (positionControls) {
            positionControls.style.display = 'none';
        }
        
        this.updateReferenceStatus('No reference image loaded');
        this.log('Reference image cleared');
        this.showToast('Cleared', 'Reference image removed', 'success');
    }
    
    private updateReferenceStatus(status: string): void {
        const statusElement = this.rootElement.querySelector('#reference-status') as HTMLElement;
        if (statusElement) {
            statusElement.textContent = status;
        }
    }
    
    // Helper method to show toast notifications
    private showToast(title: string, message: string, type: 'success' | 'error' | 'info' = 'info'): void {
        if (this.toastCallback) {
            this.toastCallback(title, message, type);
        } else {
            this.log(`Toast: ${title} - ${message} (${type})`);
        }
    }
    
    // BaseComponent lifecycle compatibility
    protected initializeComponent(): void {
        // This is handled by the new lifecycle system
        // Keep empty for backward compatibility
    }
    
    protected bindToDOM(): void {
        // This is handled by the new lifecycle system
        // Keep empty for backward compatibility
    }
    
    protected destroyComponent(): void {
        this.deactivate();
    }
}