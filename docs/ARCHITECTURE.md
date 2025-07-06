# focusPet Architecture Documentation

## Overview

focusPet is a Chrome browser extension that provides a delightful virtual pet overlay to help users stay focused and productive. The extension combines gamification elements with practical productivity features like reminders and focus tracking.

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
│   │   ├── storage/     # Storage management
│   │   ├── pet/         # Pet behavior engine
│   │   └── reminders/   # Reminder system
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

**Responsibilities**:
- Initialize pet overlay on page load
- Handle mouse movements and clicks
- Render pet animations and states
- Display reminder notifications
- Manage pet positioning
- Handle canvas resizing on window resize
- Listen for sync messages from background

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

**Purpose**: Manages background tasks, alarms, focus tracking, and cross-tab communication.

**Key Features**:
- Reminder scheduling and triggering
- Focus time tracking with treat rewards
- Cross-tab state synchronization
- Browser notification management
- Storage initialization
- Message passing between components
- Real-time treat reward system

**Responsibilities**:
- Handle Chrome alarms API
- Process reminder triggers
- Track user focus time and award treats
- Manage extension state
- Handle message passing
- Initialize default storage values
- Send sync messages to all tabs

**Technical Implementation**:
```typescript
// Storage initialization
chrome.runtime.onInstalled.addListener(async () => {
  await storageManager.initializeDefaults();
});

// Focus tracking with treat rewards
async function trackFocusTime(): Promise<void> {
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
              chrome.tabs.sendMessage(tab.id, { type: 'SYNC_PET_STATE' });
            }
          });
          
          // Show notification
          await chrome.notifications.create(`treat_${Date.now()}`, {
            type: 'basic',
            iconUrl: 'assets/icons/icon48.png',
            title: 'focusPet Treat Earned!',
            message: 'Great job staying focused! Your pet earned a treat.',
            priority: 1
          });
          
          focusStats.lastTreatTime = now;
        }
      }
    }
    await storageManager.setFocusStats(focusStats);
  }
}

// Periodic focus tracking
setInterval(async () => {
  const settings = await storageManager.getUserSettings();
  if (settings?.focusTracking?.enabled) {
    await trackFocusTime();
  }
}, 60000); // Check every minute

// Alarm handling
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('reminder_')) {
    await reminderManager.handleAlarmTrigger(alarm.name);
  }
});

// Message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle various message types: GET_PET_STATE, CREATE_REMINDER, etc.
});
```

### 3. Popup UI (`src/popup/popup.tsx`)

**Purpose**: Provides the main user interface for interacting with the extension.

**Key Features**:
- React-based UI with real-time updates
- Settings management with persistence
- Pet state display and interaction
- Reminder creation and management
- Real-time sync with background service worker
- Message listener for immediate updates

**Responsibilities**:
- Display pet state and stats
- Allow pet feeding and interaction
- Manage reminder creation and settings
- Handle settings configuration
- Sync with background service worker
- Provide immediate feedback for user actions

**Technical Implementation**:
```typescript
const Popup: React.FC<PopupProps> = () => {
  const [petState, setPetState] = useState<PetState | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  
  // Real-time message listener
  useEffect(() => {
    if (isExtension) {
      const handleMessage = (message: any) => {
        if (message.type === 'SYNC_PET_STATE') {
          loadData(); // Refresh data immediately
        }
      };
      
      chrome.runtime.onMessage.addListener(handleMessage);
      return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }
  }, [isExtension, loadData]);
  
  // Settings management with real-time sync
  const saveSettings = async () => {
    await sendMessage('UPDATE_USER_SETTINGS', { data: updatedSettings });
    setSettings(updatedSettings);
  };
  
  // Pet interaction
  const feedPet = async () => {
    await sendMessage('FEED_PET');
    await loadData(); // Refresh data
  };
}
```

### 4. Pet Engine (`src/shared/pet/pet-engine.ts`)

**Purpose**: Manages pet behavior, animations, and state transitions.

**Key Features**:
- Pet state management with persistence
- Behavior simulation
- Animation control
- Interaction responses
- Mood calculation based on stats
- Treat system and rewards
- Natural energy restoration system

**Responsibilities**:
- Update pet stats over time
- Handle user interactions
- Manage pet animations
- Calculate mood based on stats
- Trigger random behaviors
- Handle treat feeding and rewards
- Manage natural energy restoration during idle time

**Technical Implementation**:
```typescript
class PetEngine {
  private petState: PetState;
  private behaviorTimer: number;
  
  // Behavior loop every 30 seconds
  // Mood calculation based on happiness, energy, hunger
  // Random behavior generation
  // Interaction response handling
  // Treat system management
  // Natural energy restoration based on idle time
  // Nap animation when resting and gaining energy
}
```

### Pet Idle and Nap Logic
- The pet engine tracks the time since last user interaction.
- After 2 minutes of inactivity, the pet switches to the 'nap' animation.
- The 'sit' animation is now only triggered as a random behavior, not by inactivity.
- Any user interaction (mouse move/click) wakes the pet up and returns it to idle.
- For best results, sit and nap images should be transparent PNGs.
- This logic is implemented in the `updatePetBehavior` method of the pet engine.

### 5. Reminder Manager (`src/shared/reminders/reminder-manager.ts`)

**Purpose**: Handles reminder creation, scheduling, and triggering.

**Key Features**:
- Reminder CRUD operations
- Alarm scheduling with Chrome alarms API
- Preset reminder types (Pomodoro, posture, water, eye rest)
- Recurring reminder support
- Notification management
- Cross-tab reminder triggering

**Responsibilities**:
- Create and manage reminders
- Schedule Chrome alarms
- Handle reminder triggers
- Update recurring reminders
- Send notifications
- Manage preset reminder types

**Technical Implementation**:
```typescript
class ReminderManager {
  private reminders: Reminder[];
  private alarmIds: Set<string>;
  
  // Chrome alarms integration
  // Reminder persistence
  // Trigger handling
  // Preset reminder creation
  // Cross-tab notification
}
```

### 6. Storage Manager (`src/shared/storage/index.ts`)

**Purpose**: Manages persistent data storage and cross-tab synchronization.

**Key Features**:
- Chrome storage API integration
- Type-safe storage operations
- Default data initialization
- Cross-tab synchronization
- Error handling for extension context invalidation
- Focus stats with treat tracking

**Responsibilities**:
- Initialize default pet state and settings
- Handle storage operations with error recovery
- Manage focus statistics and treat tracking
- Provide type-safe storage access
- Handle extension context invalidation gracefully

**Technical Implementation**:
```typescript
class StorageManager {
  private static instance: StorageManager;
  
  // Singleton pattern for consistent access
  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }
  
  // Initialize default data with treat tracking
  async initializeDefaults(): Promise<void> {
    const focusStats = await this.getFocusStats();
    if (!focusStats) {
      const defaultStats: FocusStats = {
        totalFocusTime: 0,
        currentStreak: 0,
        longestStreak: 0,
        treatsEarned: 0,
        achievements: [],
        lastTreatTime: 0, // Track last treat reward time
      };
      await this.setFocusStats(defaultStats);
    }
  }
  
  // Error handling for extension context invalidation
  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await chrome.storage.local.get(key);
      return result[key] || null;
    } catch (error) {
      if (error instanceof Error && error.message?.includes('Extension context invalidated')) {
        console.log('Extension context invalidated during get operation');
        return null;
      }
      return null;
    }
  }
}
```

## Data Flow

### 1. Focus Tracking Flow
```
Background Service Worker (every minute)
    ↓
Check if focus tracking is enabled
    ↓
Increment total focus time
    ↓
Check if treat reward interval has passed
    ↓
Award treat and update pet state
    ↓
Send SYNC_PET_STATE message to all tabs
    ↓
Popup and overlay update immediately
```

### 2. Settings Update Flow
```
Popup UI (user changes settings)
    ↓
Send UPDATE_USER_SETTINGS message to background
    ↓
Background saves settings to storage
    ↓
Send response back to popup
    ↓
Popup updates local state
    ↓
Settings persist across browser sessions
```

### 3. Treat Reward Flow
```
Background Service Worker (treat earned)
    ↓
Update pet state with new treat
    ↓
Update focus stats with lastTreatTime
    ↓
Send SYNC_PET_STATE message to all tabs
    ↓
Show desktop notification
    ↓
Popup and overlay refresh data
    ↓
User sees updated treat count immediately
```

## Key Technical Decisions

### 1. Timestamp-based Treat Tracking
- **Problem**: Previous modulo-based tracking could award multiple treats per interval
- **Solution**: Use `lastTreatTime` timestamp to ensure exactly one treat per interval
- **Implementation**: `now - focusStats.lastTreatTime >= intervalMs`

### 2. Real-time Cross-tab Sync
- **Problem**: Popup and overlay could show stale data
- **Solution**: Chrome extension messaging system for immediate updates
- **Implementation**: `SYNC_PET_STATE` messages sent to all tabs

### 3. React State Management
- **Problem**: Popup could miss updates from background
- **Solution**: Message listener with `useCallback` for proper cleanup
- **Implementation**: `chrome.runtime.onMessage.addListener` in useEffect

### 4. Error Handling for Extension Context
- **Problem**: Extension context invalidation during development
- **Solution**: Graceful error handling with fallback behavior
- **Implementation**: Try-catch blocks with context invalidation detection

## Performance Considerations

### 1. Canvas Rendering
- 60fps rendering loop with requestAnimationFrame
- Automatic canvas resizing on window resize
- Efficient sprite-based animation system

### 2. Background Processing
- Focus tracking runs every minute (not continuously)
- Treat rewards use efficient timestamp comparison
- Storage operations are async and non-blocking

### 3. Memory Management
- Proper cleanup of event listeners
- Singleton pattern for storage manager
- React useEffect cleanup for message listeners

## Security Considerations

### 1. Content Script Isolation
- Pet overlay runs in isolated context
- No access to page content or scripts
- Safe mouse event handling

### 2. Storage Security
- Chrome storage API provides secure data persistence
- No sensitive data stored (only pet state and settings)
- Extension context validation

### 3. Message Passing
- Type-safe message handling
- Error handling for invalid messages
- Secure cross-tab communication

## Future Enhancements

### 1. Advanced Focus Tracking
- Website-based focus detection
- Productivity scoring algorithms
- Detailed focus analytics

### 2. Enhanced Pet System
- More pet types and animations
- Pet evolution and growth
- Social features between pets

### 3. Gamification Features
- Achievement system implementation
- Streak tracking and rewards
- Community challenges

### 4. Performance Optimizations
- Web Workers for heavy computations
- Service Worker caching strategies
- Lazy loading of pet assets 