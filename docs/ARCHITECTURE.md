# focusPet Architecture Documentation

## Overview

focusPet is a Chrome browser extension that provides a delightful virtual pet overlay to help users stay focused and productive. The extension combines gamification elements with practical productivity features like reminders and focus tracking, with robust error handling and graceful degradation.

## System Architecture

### Core Components

```
focusPet/
├── src/
│   ├── content/          # Content scripts for webpage overlay
│   │   ├── overlay.ts    # Main pet overlay and canvas rendering
│   │   └── overlay.css   # Overlay styling
│   ├── background/       # Service worker for background tasks
│   │   └── service-worker.ts
│   ├── popup/           # Extension popup UI
│   │   ├── popup.tsx    # React popup component
│   │   └── popup.html   # Popup HTML template
│   ├── options/         # Settings page
│   │   ├── options.tsx  # React options component
│   │   └── options.html # Options HTML template
│   ├── shared/          # Shared utilities and types
│   │   ├── types/       # TypeScript type definitions
│   │   ├── storage/     # Storage management with error handling
│   │   ├── pet/         # Pet behavior engine
│   │   ├── reminders/   # Reminder system
│   │   └── analytics/   # Focus tracking and analytics
│   └── assets/          # Source images and icons
├── public/              # Static assets, manifest, HTML
├── dist/                # Built extension files
└── docs/                # Documentation
```

## Component Details

### 1. Content Script (`src/content/overlay.ts`)

**Purpose**: Renders the pet overlay on web pages and handles user interactions.

**Key Features**:
- Canvas-based pet rendering with proper sizing
- Mouse interaction handling across the entire window
- Speech bubble display for reminders
- Mood indicator rendering
- Responsive design with automatic canvas resizing
- Persistence across page navigations
- Real-time sync with background service worker
- Graceful error handling for storage failures

**Responsibilities**:
- Initialize pet overlay on page load
- Handle mouse movements and clicks
- Render pet animations and states
- Display reminder notifications
- Manage pet positioning
- Handle canvas resizing on window resize
- Listen for sync messages from background
- Handle storage errors gracefully

**Technical Implementation**:
```typescript
class PetOverlay {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private petEngine: PetEngine;
  
  // Canvas sizing with proper initialization
  private createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // ... styling and setup
  }
  
  // Automatic resizing on window resize
  private resizeCanvas(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  // Message listener for real-time sync
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SYNC_PET_STATE') {
      this.reloadPetState();
    }
  });
  
  // Rendering loop at 60fps
  // Mouse interaction handling
  // Speech bubble management
  // Mood-based visual effects
}
```

**Content Script Injection**: Uses manifest-based injection via `content_scripts` field for reliable overlay persistence across page navigations.

### 2. Background Service Worker (`src/background/service-worker.ts`)

**Purpose**: Manages background tasks, alarms, focus tracking, and cross-tab communication with robust error handling.

**Key Features**:
- Reminder scheduling and triggering
- Focus time tracking with treat rewards
- Cross-tab state synchronization
- Browser notification management
- Storage initialization with error handling
- Message passing between components
- Real-time treat reward system
- Context validity monitoring

**Responsibilities**:
- Handle Chrome alarms API
- Process reminder triggers
- Track user focus time and award treats
- Manage extension state
- Handle message passing
- Initialize default storage values
- Send sync messages to all tabs
- Monitor extension context validity
- Handle storage failures gracefully

**Technical Implementation**:
```typescript
// Storage initialization with error handling
chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    console.log('focusPet: Service worker installed:', details.reason);
    await storageManager.initializeDefaults();
    
    // Request notification permission for system-level notifications
    try {
      const permission = await chrome.permissions.request({
        permissions: ['notifications']
      });
      if (permission) {
        console.log('focusPet: Notification permission granted');
      } else {
        console.log('focusPet: Notification permission denied - reminders will only show in browser');
      }
    } catch (error) {
      console.log('focusPet: Notification permission already granted or not available');
    }
    console.log('focusPet: Installation initialization complete');
  } catch (error) {
    console.error('focusPet: Error during installation initialization:', error);
  }
});

// Focus tracking with treat rewards and error handling
async function trackFocusTime(): Promise<void> {
  try {
    const focusStats = await storageManager.getFocusStats();
    if (focusStats) {
      focusStats.totalFocusTime += 1; // 1 minute
      
      // Check for treat rewards using timestamp-based tracking
      const settings = await storageManager.getUserSettings();
      if (settings?.focusTracking?.treatRewardInterval) {
        const now = Date.now();
        const intervalMs = settings.focusTracking.treatRewardInterval * 60 * 1000;
        if (now - focusStats.lastTreatTime >= intervalMs) {
          // Award treat and sync to all tabs
          const petState = await storageManager.getPetState();
          if (petState) {
            petState.treats += 1;
            await storageManager.setPetState(petState);
            
            // Send sync message to all tabs
            const tabs = await chrome.tabs.query({});
            tabs.forEach(tab => {
              if (tab.id) {
                chrome.tabs.sendMessage(tab.id, { type: 'SYNC_PET_STATE' }).catch(() => {
                  // Ignore errors for tabs that don't have content script
                });
              }
            });
            
            // Show notification
            try {
              await chrome.notifications.create(`treat_${Date.now()}`, {
                type: 'basic',
                iconUrl: 'assets/icons/icon48.png',
                title: 'focusPet Treat Earned!',
                message: 'Great job staying focused! Your pet earned a treat.',
                priority: 1
              });
            } catch (notificationError) {
              console.log('focusPet: Could not create notification:', notificationError);
            }
            
            focusStats.lastTreatTime = now;
          }
        }
      }
      await storageManager.setFocusStats(focusStats);
    }
  } catch (error) {
    console.error('focusPet: Error tracking focus time:', error);
  }
}

// Periodic focus tracking with error handling
setInterval(async () => {
  try {
    const settings = await storageManager.getUserSettings();
    if (settings?.focusTracking?.enabled) {
      await trackFocusTime();
    }
  } catch (error) {
    console.error('focusPet: Error in focus tracking:', error);
  }
}, 60000); // Check every minute

// Alarm handling with error handling
chrome.alarms.onAlarm.addListener(async (alarm) => {
  try {
    console.log('focusPet: Alarm triggered:', alarm.name);
    if (alarm.name.startsWith('reminder_')) {
      await reminderManager.handleAlarmTrigger(alarm.name);
    }
  } catch (error) {
    console.error('focusPet: Error handling alarm:', error);
  }
});

// Message handling with error handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    handleMessage(message, sender, sendResponse);
  } catch (error) {
    console.error('focusPet: Error handling message:', error);
    sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
  return true; // Keep message channel open for async response
});
```

### 3. Storage Management (`src/shared/storage/index.ts`)

**Purpose**: Provides robust data persistence with comprehensive error handling and context validity monitoring.

**Key Features**:
- Context validity tracking
- Automatic context restoration
- Graceful degradation on storage failures
- Comprehensive error logging
- Local state persistence
- Cross-tab synchronization
- Type-safe operations

**Technical Implementation**:
```typescript
export class StorageManager {
  private static instance: StorageManager;
  private contextValid: boolean = true;
  private contextCheckTimer: number | null = null;

  private constructor() {
    this.startContextCheck();
  }

  // Check if extension context is valid
  isContextValid(): boolean {
    return this.contextValid;
  }

  // Reset context validity (useful for testing or recovery)
  resetContext(): void {
    this.contextValid = true;
  }

  // Generic storage methods with error handling
  async get<T>(key: string): Promise<T | null> {
    if (!this.contextValid) {
      console.log('Storage get operation skipped - context invalid');
      return null;
    }
    
    try {
      const result = await chrome.storage.local.get(key);
      return result[key] || null;
    } catch (error) {
      console.error(`Error getting storage key ${key}:`, error);
      // If extension context is invalidated, mark context as invalid and return null
      if (error instanceof Error && error.message?.includes('Extension context invalidated')) {
        console.log('Extension context invalidated during get operation');
        this.contextValid = false;
        return null;
      }
      // For other errors, return null to prevent crashes
      console.log('Storage get operation failed, returning null');
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (!this.contextValid) {
      console.log('Storage operation skipped - context invalid');
      return;
    }
    
    try {
      await chrome.storage.local.set({ [key]: value });
    } catch (error) {
      console.error(`Error setting storage key ${key}:`, error);
      // If extension context is invalidated, mark context as invalid
      if (error instanceof Error && error.message?.includes('Extension context invalidated')) {
        console.log('Extension context invalidated, marking as invalid');
        this.contextValid = false;
        return;
      }
      // For other errors, don't throw to prevent crashes
      console.log('Storage operation failed, continuing without persistence');
    }
  }

  // Start periodic context validity check
  private startContextCheck(): void {
    this.contextCheckTimer = window.setInterval(() => {
      if (!this.contextValid) {
        this.checkContextValidity();
      }
    }, 60000); // Check every minute
  }

  // Check if context can be restored
  private async checkContextValidity(): Promise<void> {
    try {
      // Try a simple storage operation
      await chrome.storage.local.get('test');
      this.contextValid = true;
      console.log('focusPet: Extension context restored');
    } catch (error) {
      // Context is still invalid
      console.log('focusPet: Extension context still invalid');
    }
  }

  // Cleanup method
  destroy(): void {
    if (this.contextCheckTimer) {
      clearInterval(this.contextCheckTimer);
      this.contextCheckTimer = null;
    }
  }
}
```

### 4. Pet Engine (`src/shared/pet/pet-engine.ts`)

**Purpose**: Manages pet behavior, animations, and state with robust error handling.

**Key Features**:
- Mood-based behavior system
- Animation state management
- Energy and satiety systems
- Speech bubble communication
- Context-aware error handling
- Local state persistence
- Real-time behavior updates

**Technical Implementation**:
```typescript
export class PetEngine {
  private petState: PetState;
  private animationTimer: number | null = null;
  private behaviorTimer: number | null = null;
  private mousePosition: Position = { x: 0, y: 0 };
  private lastSpeechTime: number = 0;
  private speechCooldown: number = 10000; // 10 seconds between speeches

  constructor(initialPetState: PetState) {
    this.petState = initialPetState;
    this.startBehaviorLoop();
  }

  // Update pet state with error handling
  async updatePetState(updates: Partial<PetState>): Promise<void> {
    this.petState = { ...this.petState, ...updates };
    
    // Only attempt storage if context is valid
    if (storageManager.isContextValid()) {
      try {
        await storageManager.setPetState(this.petState);
      } catch (error) {
        // Continue with local state update even if storage fails
        console.log('focusPet: Storage update failed, continuing with local state');
      }
    } else {
      console.log('focusPet: Storage context invalid, skipping persistence');
    }
    
    this.updateMood();
  }

  // Pet interactions with error handling
  async interactWithPet(): Promise<void> {
    this.petState.happiness = Math.min(100, this.petState.happiness + 10);
    this.petState.lastInteraction = Date.now();
    
    // Wake up the pet if it was napping
    if (this.petState.currentAnimation === 'nap') {
      this.setAnimation('excited'); // Wake up excited
      this.speak('wake');
    } else {
      // Random animation on interaction
      const animations: PetAnimation[] = ['excited', 'play'];
      const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
      this.setAnimation(randomAnimation);
      this.speak('pet');
    }
    
    try {
      await this.updatePetState({
        happiness: this.petState.happiness,
        lastInteraction: this.petState.lastInteraction
      });
    } catch (error) {
      // Silent error handling - local state is already updated
      console.log('focusPet: Interaction storage update failed, continuing with local state');
    }

    // Reset to idle after interaction
    setTimeout(() => {
      this.setAnimation('idle');
    }, 2000);
  }

  // Behavior loop with error handling
  private async updatePetBehavior(): Promise<void> {
    const now = Date.now();
    const timeSinceInteraction = now - this.petState.lastInteraction;

    // Decrease happiness over time if not interacted with
    if (timeSinceInteraction > 300000) { // 5 minutes
      this.petState.happiness = Math.max(0, this.petState.happiness - 2);
    }

    // Nap after 2 minutes of inactivity
    if (timeSinceInteraction > 120000) { // 2 minutes
      if (this.petState.currentAnimation !== 'nap') {
        console.log(`focusPet: Pet inactive for ${Math.floor(timeSinceInteraction / 1000)}s, setting to nap`);
        this.setAnimation('nap');
        this.speak('nap');
      }
      // Energy restoration while napping
      const idleMinutes = Math.floor(timeSinceInteraction / 60000);
      const energyGain = Math.min(3, idleMinutes); // Max 3 energy per 30-second cycle
      this.petState.energy = Math.min(100, this.petState.energy + energyGain);
    } else {
      // Decrease energy if recently interacted with (pet is active)
      this.petState.energy = Math.max(0, this.petState.energy - 1);
      // Return to idle if was napping but now active
      if (this.petState.currentAnimation === 'nap') {
        this.setAnimation('idle');
      }
      // Random behaviors (sit/play) if not napping
      if (Math.random() < 0.3 && this.petState.currentAnimation !== 'nap') {
        this.performRandomBehavior();
      }
    }

    // Decrease satiety over time (pet gets hungry)
    this.petState.satiety = Math.max(0, this.petState.satiety - 1);

    // Update mood based on stats
    this.updateMood();

    try {
      await this.updatePetState({
        happiness: this.petState.happiness,
        energy: this.petState.energy,
        satiety: this.petState.satiety,
        mood: this.petState.mood
      });
    } catch (error) {
      // Silent error handling - local state is already updated
      console.log('focusPet: Behavior update storage failed, continuing with local state');
    }
  }

  // Cleanup with storage manager cleanup
  destroy(): void {
    if (this.animationTimer) {
      clearInterval(this.animationTimer);
    }
    if (this.behaviorTimer) {
      clearInterval(this.behaviorTimer);
    }
    // Cleanup storage manager
    storageManager.destroy();
  }
}
```

### 5. Popup UI (`src/popup/popup.tsx`)

**Purpose**: Provides the main user interface for interacting with the extension.

**Key Features**:
- React-based UI with real-time updates
- Settings management with persistence
- Pet state display and interaction
- Reminder creation and management
- Real-time sync with background service worker
- Message listener for immediate updates
- Error handling for storage operations

**Technical Implementation**:
```typescript
// Message listener for real-time updates
useEffect(() => {
  const handleMessage = (message: any) => {
    if (message.type === 'SYNC_PET_STATE') {
      // Reload pet state from storage
      loadPetState();
    }
  };

  chrome.runtime.onMessage.addListener(handleMessage);
  return () => chrome.runtime.onMessage.removeListener(handleMessage);
}, []);

// Error handling for storage operations
const loadPetState = async () => {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_PET_STATE' });
    if (response.success) {
      setPetState(response.data);
    } else {
      console.error('Failed to load pet state:', response.error);
    }
  } catch (error) {
    console.error('Error loading pet state:', error);
  }
};

// Settings management with error handling
const saveSettings = async (newSettings: UserSettings) => {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'UPDATE_USER_SETTINGS',
      data: newSettings
    });
    if (response.success) {
      setSettings(newSettings);
    } else {
      console.error('Failed to save settings:', response.error);
    }
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};
```

## Error Handling Architecture

### 1. Extension Context Invalidation

**Problem**: Chrome extensions can have their context invalidated during updates, reloads, or other system events, causing storage operations to fail.

**Solution**: 
- Monitor context validity state
- Skip storage operations when context is invalid
- Continue with local state updates
- Automatically restore context when possible

**Implementation**:
```typescript
// In StorageManager
private contextValid: boolean = true;

async set<T>(key: string, value: T): Promise<void> {
  if (!this.contextValid) {
    console.log('Storage operation skipped - context invalid');
    return;
  }
  
  try {
    await chrome.storage.local.set({ [key]: value });
  } catch (error) {
    if (error instanceof Error && error.message?.includes('Extension context invalidated')) {
      this.contextValid = false;
      return;
    }
  }
}
```

### 2. Graceful Degradation

**Problem**: When storage fails, the extension should continue to function with local state.

**Solution**:
- Always update local state first
- Attempt storage operations second
- Continue functionality even if storage fails
- Provide clear error messages for debugging

**Implementation**:
```typescript
// In PetEngine
async updatePetState(updates: Partial<PetState>): Promise<void> {
  this.petState = { ...this.petState, ...updates };
  
  if (storageManager.isContextValid()) {
    try {
      await storageManager.setPetState(this.petState);
    } catch (error) {
      console.log('focusPet: Storage update failed, continuing with local state');
    }
  } else {
    console.log('focusPet: Storage context invalid, skipping persistence');
  }
  
  this.updateMood();
}
```

### 3. Automatic Recovery

**Problem**: When the extension context is restored, storage operations should resume automatically.

**Solution**:
- Periodically check context validity
- Restore context state when possible
- Resume normal operations automatically
- Provide user feedback about recovery

**Implementation**:
```typescript
// In StorageManager
private startContextCheck(): void {
  this.contextCheckTimer = window.setInterval(() => {
    if (!this.contextValid) {
      this.checkContextValidity();
    }
  }, 60000); // Check every minute
}

private async checkContextValidity(): Promise<void> {
  try {
    await chrome.storage.local.get('test');
    this.contextValid = true;
    console.log('focusPet: Extension context restored');
  } catch (error) {
    console.log('focusPet: Extension context still invalid');
  }
}
```

## Data Flow

### 1. User Interaction Flow

```
User clicks pet → PetEngine.interactWithPet() → 
Update local state → Attempt storage → 
Send sync message → All tabs update
```

### 2. Reminder Flow

```
Reminder trigger → Service worker → 
Send message to active tab → 
Pet animation + speech bubble → 
User interaction
```

### 3. Focus Tracking Flow

```
Background timer → Check focus time → 
Award treats if interval met → 
Update pet state → Sync to all tabs
```

### 4. Error Recovery Flow

```
Storage error → Mark context invalid → 
Continue with local state → 
Periodic context check → 
Restore when possible
```

## Performance Considerations

### 1. Rendering Performance
- Canvas rendering at 60fps
- Efficient sprite loading and caching
- Minimal DOM manipulation
- Hardware acceleration usage

### 2. Memory Management
- Proper cleanup of timers and intervals
- Efficient storage operations
- Minimal object creation
- Weak references where appropriate

### 3. Battery Optimization
- Support for reduced motion preferences
- Efficient animation loops
- Minimal background processing
- Smart focus tracking intervals

### 4. Error Recovery Performance
- Minimal impact on user experience during errors
- Efficient context checking
- Graceful degradation without performance loss
- Automatic recovery with minimal overhead

## Security Considerations

### 1. Content Script Security
- Minimal DOM access
- Secure message passing
- No direct script injection
- Sandboxed execution

### 2. Storage Security
- Local storage only
- No sensitive data collection
- Secure data validation
- Type-safe operations
- Robust error handling

### 3. Permission Security
- Minimal required permissions
- Clear permission usage
- Secure API access
- Proper error handling

## Testing Strategy

### 1. Unit Testing
- Pet engine behavior
- Storage operations
- Reminder system
- Error handling

### 2. Integration Testing
- Message passing between components
- Cross-tab synchronization
- Storage persistence
- Error recovery

### 3. End-to-End Testing
- Complete user workflows
- Extension loading and unloading
- Context invalidation scenarios
- Performance under load

## Deployment Considerations

### 1. Build Process
- TypeScript compilation
- Asset optimization
- Manifest generation
- Error handling inclusion

### 2. Distribution
- Chrome Web Store packaging
- Unpacked extension loading
- Development vs production builds
- Version management

### 3. Monitoring
- Error logging and reporting
- Performance monitoring
- User feedback collection
- Usage analytics

## Future Enhancements

### 1. Advanced Pet Features
- More pet types and animations
- Pet customization options
- Advanced behavior patterns
- Social features

### 2. Enhanced Focus Tracking
- More detailed analytics
- Custom focus goals
- Progress visualization
- Achievement system

### 3. Improved Error Handling
- More sophisticated recovery mechanisms
- Better user feedback
- Advanced logging
- Performance optimization

### 4. Platform Expansion
- Firefox extension support
- Safari extension support
- Mobile companion app
- Web dashboard 