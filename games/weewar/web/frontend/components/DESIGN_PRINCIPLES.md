
# Component Design Principles

This document outlines the core principles for building components in this application, developed through practical experience to prevent DOM corruption, ensure separation of concerns, and maintain clean architecture.

## Evolution Summary

This architecture evolved from solving a critical DOM corruption bug where broad CSS selectors (`document.querySelectorAll('.text-gray-900, .text-white')`) accidentally matched the body element, replacing the entire page content with "34". This led us to develop strict component isolation principles and a simplified constructor pattern that eliminates initialization complexity while ensuring robust separation of concerns.

## Core Principles

### 1. Strict Separation of Concerns

**Components must have clear, non-overlapping responsibilities:**

- **Parent Components**: Data loading, orchestration, component coordination
- **Child Components**: Specific functionality within their assigned domain
- **Layout/Styling**: Handled by CSS classes and parent containers
- **Communication**: Through EventBus only, never direct method calls

### 2. DOM Scoping and Isolation

**Components must only access DOM within their root element:**

- Use `this.findElement()` and `this.findElements()` for DOM queries
- Never use `document.querySelector()` or global DOM access
- Each component owns and manages only its root element and children
- Root elements must be clearly defined and scoped

**Example:**
```typescript
// ✅ CORRECT - Scoped to component
const element = this.findElement('.my-button');

// ❌ WRONG - Global DOM access
const element = document.querySelector('.my-button');
```

### 3. Layout and Styling Separation

**Components should not control their own layout or external styling:**

- **Parent/CSS Controls**: Container size, positioning, layout, external spacing
- **Component Controls**: Internal behavior, content management, internal styling only
- Use CSS libraries (Tailwind) for styling, not JavaScript
- Components may style their internal elements but not their container

**Example:**
```typescript
// ❌ WRONG - Component controlling its own layout
this.rootElement.style.width = '100%';
this.rootElement.style.height = '500px';

// ✅ CORRECT - Let parent CSS handle layout
// Use CSS classes: w-full h-96 min-h-[500px]
```

### 4. Component Lifecycle Management

**All components must follow the standard lifecycle:**

1. **Initialize**: Set up component state and dependencies
2. **Hydrate**: Bind to existing DOM (for HTMX scenarios)
3. **Ready**: Component is functional and can respond to events
4. **Destroy**: Clean up resources, unsubscribe from events

### 5. Event-Driven Communication

**Components communicate only through EventBus:**

- No direct method calls between components
- Use type-safe event definitions
- Events include source identification for debugging
- Error isolation - one component failure doesn't cascade
- Events are synchronous and allow multiple entities to react
- Events should not be sent back to the source component

**Example:**
```typescript
// ✅ CORRECT - EventBus communication
this.emit(EventTypes.MAP_DATA_LOADED, mapData);

// ❌ WRONG - Direct method calls
otherComponent.updateData(mapData);
```

### 6. Error Isolation and Handling

**Component errors must not affect other components:**

- Each component handles its own errors
- Use `this.handleError()` for consistent error handling
- Emit error events for parent components to handle
- Continue operation even if one component fails

### 7. Resource Management

**Components must clean up after themselves:**

- Unsubscribe from all events in `destroy()`
- Release DOM references
- Clean up third-party library instances (Phaser, etc.)
- Reset component state

### 8. Hydration Pattern Support

**Components must support both initialization modes:**

- **Initialize**: Create new DOM elements and functionality
- **Hydrate**: Bind to existing server-rendered DOM
- Validate DOM structure before hydration
- Create missing elements when validation fails

## Implementation Guidelines

### Simplified Component Pattern

Our architecture uses a clean constructor pattern that eliminates initialization complexity:

```typescript
export class MyComponent extends BaseComponent {
    // 1. Simple constructor - parent ensures root element exists
    constructor(rootElement: HTMLElement, eventBus: EventBus, debugMode: boolean = false) {
        super('my-component', rootElement, eventBus, debugMode);
        // Component automatically calls initializeComponent() and bindToDOM()
    }
    
    // 2. Component-specific initialization (called once during construction)
    protected initializeComponent(): void {
        // Set up event subscriptions, component state
        this.subscribe(EventTypes.DATA_LOADED, (payload) => {
            this.handleDataLoaded(payload.data);
        });
    }
    
    // 3. Bind to DOM elements (called during construction and after content updates)
    protected bindToDOM(): void {
        // Find or create DOM elements, set up event handlers
        this.myButton = this.findElement('.my-button') || this.createButton();
        this.myButton.addEventListener('click', () => this.handleClick());
    }
    
    // 4. Handle dynamic content updates (for HTMX scenarios)
    public contentUpdated(newHTML: string): void {
        // Base class handles innerHTML update and calls bindToDOM()
    }
    
    // 5. Component-specific cleanup
    protected destroyComponent(): void {
        // Component-specific cleanup
        this.mySpecificCleanup();
    }
    
    // 6. Helper methods for DOM element creation
    private createButton(): HTMLElement {
        const button = document.createElement('button');
        button.className = 'my-button';
        button.textContent = 'Click me';
        this.rootElement.appendChild(button);
        return button;
    }
}
```

### Parent Orchestration Pattern

```typescript
export class ParentPage extends BasePage {
    private myComponent: MyComponent | null = null;
    
    private initializeComponents(): void {
        // Parent ensures root element exists
        const componentRoot = this.ensureElement('[data-component="my-component"]', 'fallback-id');
        
        // Simple component creation
        this.myComponent = new MyComponent(componentRoot, this.eventBus, true);
        
        // Component handles everything else automatically
    }
    
    private ensureElement(selector: string, fallbackId: string): HTMLElement {
        let element = document.querySelector(selector) as HTMLElement;
        if (!element) {
            element = document.createElement('div');
            element.id = fallbackId;
            element.className = 'w-full h-full';
            this.findContainer().appendChild(element);
        }
        return element;
    }
}
```

### Event Communication

```typescript
// Define event types
export const EventTypes = {
    DATA_LOADED: 'data-loaded',
    ERROR_OCCURRED: 'error-occurred'
} as const;

// Subscribe to events
this.subscribe<DataPayload>(EventTypes.DATA_LOADED, (payload) => {
    this.handleDataLoaded(payload.data);
});

// Emit events
this.emit(EventTypes.DATA_LOADED, { data: myData });
```

### DOM Scoping

```typescript
// ✅ CORRECT - Scoped DOM access
const button = this.findElement<HTMLButtonElement>('.action-button');
const inputs = this.findElements<HTMLInputElement>('input[type="text"]');

// ✅ CORRECT - Event handling within scope
button?.addEventListener('click', () => {
    this.handleButtonClick();
});
```

## Anti-Patterns to Avoid

### 1. Cross-Component DOM Access
```typescript
// ❌ WRONG - Accessing other component's DOM
const otherElement = document.querySelector('#other-component-element');
```

### 2. Global Event Listeners
```typescript
// ❌ WRONG - Global event listener
document.addEventListener('click', this.handleClick);

// ✅ CORRECT - Scoped event listener
this.findElement('.my-button')?.addEventListener('click', this.handleClick);
```

### 3. Layout Control in Components
```typescript
// ❌ WRONG - Component controlling its layout
this.rootElement.style.position = 'absolute';
this.rootElement.style.top = '50px';
```

### 4. Direct Component Communication
```typescript
// ❌ WRONG - Direct method calls
this.otherComponent.updateDisplay(data);

// ✅ CORRECT - Event-based communication
this.emit(EventTypes.DATA_UPDATED, data);
```

### 5. Unsafe DOM Queries
```typescript
// ❌ WRONG - Broad selectors that can match unintended elements
const elements = document.querySelectorAll('.text-gray-900, .text-white');

// ✅ CORRECT - Specific, scoped selectors
const elements = this.findElements('.stat-value');
```

## Benefits of This Approach

1. **Prevents DOM Corruption**: Scoped access prevents accidental modification of other components
2. **Improves Maintainability**: Clear responsibilities make code easier to understand and modify
3. **Enables Reusability**: Components can be used in different contexts without modification
4. **Supports Testing**: Isolated components can be tested independently
5. **Facilitates HTMX Integration**: Hydration pattern works with server-sent HTML fragments
6. **Error Resilience**: Component failures don't cascade to other parts of the application

## Migration Strategy

When converting existing code to this component architecture:

1. **Identify Component Boundaries**: Determine logical component divisions
2. **Extract DOM Logic**: Move DOM manipulation into scoped component methods
3. **Replace Global Queries**: Convert `document.querySelector` to `this.findElement`
4. **Add Event Communication**: Replace direct method calls with EventBus events
5. **Implement Lifecycle**: Add proper initialization and cleanup
6. **Test Isolation**: Verify components don't affect each other

This architecture ensures robust, maintainable components that work well together while maintaining clear separation of concerns.

## Key Design Decisions & Learnings

### 1. Why We Simplified the Constructor Pattern

**Problem**: Initial architecture had complex `initialize()` vs `hydrate()` methods with validation logic, creating bloated components and unclear initialization paths.

**Solution**: Single constructor pattern where parent ensures root element exists:
```typescript
// Before: Complex initialization
if (specificElement) {
    component.initialize({...config});
} else {
    component.hydrate(fallbackElement, eventBus);
}

// After: Simple constructor
parentElem = ensureElement(selector);
component = new Component(parentElem, eventBus);
```

**Benefits**: 
- Eliminates initialization complexity and edge cases
- Clear responsibility: parent handles layout, component handles behavior
- Works for both empty and pre-populated DOM scenarios

### 2. The "Find or Create" Pattern in bindToDOM()

**Key Insight**: Components should handle both cases automatically:
- **Case 1**: Empty root element → create missing DOM elements
- **Case 2**: Pre-populated root → bind to existing elements
- **Runtime**: `contentUpdated()` → re-bind after HTMX updates

```typescript
protected bindToDOM(): void {
    // Handles both empty and pre-populated root elements automatically
    this.myButton = this.findElement('.my-button') || this.createButton();
    this.setupEventHandlers();
}
```

### 3. Layout vs Behavior Separation

**Critical Principle**: Components should never control their own layout/positioning.

**Parent/CSS Controls**: Size, position, layout, external spacing
**Component Controls**: Internal behavior, content management, internal styling only

This prevents components from interfering with each other's layout and makes them truly reusable.

### 4. Why We Use Data Attributes for Component Boundaries

**Problem**: Class-based selectors like `.text-gray-900, .text-white` can accidentally match unintended elements.

**Solution**: Specific data attributes create clear boundaries:
```html
<!-- Template with clear component boundaries -->
<div data-component="map-viewer">
    <div id="phaser-viewer-container"></div>
</div>
<div data-component="map-stats-panel">
    <div data-stat-section="basic">
        <span data-stat="total-tiles">64</span>
    </div>
</div>
```

**Benefits**:
- Prevents accidental cross-component DOM access
- Makes component boundaries visible in templates
- Enables safe component-scoped selectors

### 5. EventBus Over Direct Method Calls

**Decision**: All inter-component communication goes through EventBus, never direct method calls.

**Why**: 
- Prevents tight coupling between components
- Enables error isolation (one component failure doesn't cascade)
- Makes component relationships explicit and debuggable
- Supports one-to-many communication patterns naturally

### 6. HTMX Integration Through Content Updates

**Scenario**: Server sends new HTML fragment via HTMX, component needs to rebind.

**Solution**: `contentUpdated(newHTML)` method automatically updates DOM and rebinds:
```typescript
// HTMX sends new content
component.contentUpdated(newHTMLFromServer);
// Component automatically updates innerHTML and calls bindToDOM()
```

This makes components work seamlessly with server-driven UI updates.

### 7. Template Patterns for Component Safety

**Best Practice**: Use data attributes to create safe, specific selectors:

```html
<!-- ✅ GOOD: Specific component boundaries -->
<div data-component="login-form">
    <input data-field="username" />
    <input data-field="password" />
    <button data-action="submit">Login</button>
</div>

<!-- ❌ BAD: Generic classes that might match other elements -->
<div class="form">
    <input class="input" />
    <input class="input" />
    <button class="button">Login</button>
</div>
```

### 8. Component Testing and Validation

**Approach**: Test component isolation with automated validation:
- Components can initialize independently
- DOM scoping prevents cross-component access
- Error isolation prevents cascading failures
- Event communication works without direct coupling

See `ComponentIsolationTest.ts` for our validation suite.

## Architecture Benefits Realized

1. **DOM Corruption Prevention**: ✅ Eliminated the original bug through strict scoping
2. **Simplified Development**: ✅ Constructor pattern is much easier to use and understand
3. **Runtime Flexibility**: ✅ Components handle both static and dynamic content seamlessly
4. **Error Resilience**: ✅ Component failures don't affect other components
5. **HTMX Compatibility**: ✅ Ready for server-driven UI updates
6. **Maintainability**: ✅ Clear separation of concerns makes code easier to modify
7. **Reusability**: ✅ Components work in different contexts without modification

This architecture evolved through practical problem-solving and has proven robust in preventing the types of issues that led to our original DOM corruption bug.
