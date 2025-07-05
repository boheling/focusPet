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

**Responsibilities**:
- Initialize pet overlay on page load
- Handle mouse movements and clicks
- Render pet animations and states
- Display reminder notifications
- Manage pet positioning
- Handle canvas resizing on window resize

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
  
  // Rendering loop at 60fps
  // Mouse interaction handling
  // Speech bubble management
  // Mood-based visual effects
}
```

**Content Script Injection**: Uses manifest-based injection via `content_scripts` field for reliable overlay persistence across page navigations.

### 2. Background Service Worker (`src/background/service-worker.ts`)

**Purpose**: Manages background tasks, alarms, and cross-tab communication.

**Key Features**:
- Reminder scheduling and triggering
- Focus time tracking
- Cross-tab state synchronization
- Browser notification management
- Storage initialization
- Message passing between components

**Responsibilities**:
- Handle Chrome alarms API
- Process reminder triggers
- Track user focus time
- Manage extension state
- Handle message passing
- Initialize default storage values

**Technical Implementation**:
```typescript
// Storage initialization
chrome.runtime.onInstalled.addListener(async () => {
  await storageManager.initializeDefaults();
});

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

### 3. Pet Engine (`src/shared/pet/pet-engine.ts`)

**Purpose**: Manages pet behavior, animations, and state transitions.

**Key Features**:
- Pet state management with persistence
- Behavior simulation
- Animation control
- Interaction responses
- Mood calculation based on stats
- Treat system and rewards

**Responsibilities**:
- Update pet stats over time
- Handle user interactions
- Manage pet animations
- Calculate mood based on stats
- Trigger random behaviors
- Handle treat feeding and rewards

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
}
```

### 4. Reminder Manager (`src/shared/reminders/reminder-manager.ts`)

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

### 5. Storage Manager (`src/shared/storage/index.ts`)

**Purpose**: Manages persistent data storage and cross-tab synchronization.

**Key Features**:
- Chrome storage API integration
- Type-safe storage operations
- Cross-tab synchronization
- Default data initialization
- Error handling and fallbacks

**Responsibilities**:
- Store and retrieve pet state
- Manage user settings
- Handle reminder data
- Track focus statistics
- Sync across tabs
- Initialize default values

**Technical Implementation**:
```typescript
class StorageManager {
  // Singleton pattern
  // Chrome storage API wrapper
  // Type-safe operations
  // Cross-tab sync
  // Default initialization
  // Error handling
}
```

## Data Flow

### 1. Extension Initialization
```
1. Service worker starts
2. Initialize storage with defaults
3. Load existing reminders
4. Schedule active reminders
5. Start focus tracking
```

### 2. Content Script Injection
```
1. Manifest content_scripts field triggers injection
2. PetOverlay class initializes
3. Canvas created with proper sizing
4. Pet state loaded from storage
5. Sprites loaded from assets
6. Event listeners attached
7. Render loop started
```

### 3. User Interaction Flow
```
1. User moves mouse → PetEngine.onMouseMove()
2. Pet position updated
3. Animation state changes
4. Canvas re-renders
5. Pet follows cursor
```

### 4. Reminder Trigger Flow
```
1. Chrome alarm fires
2. Service worker handles alarm
3. ReminderManager processes trigger
4. Notification sent to content script
5. Pet reacts with animation
6. Speech bubble displayed
```

## Communication Patterns

### 1. Content Script ↔ Service Worker
- **Purpose**: Handle reminder triggers and state updates
- **Method**: `chrome.runtime.sendMessage()`
- **Messages**: 
  - `REMINDER_TRIGGERED`
  - `UPDATE_PET_STATE`
  - `GET_PET_STATE`

### 2. Popup ↔ Service Worker
- **Purpose**: UI interactions and data retrieval
- **Method**: `chrome.runtime.sendMessage()`
- **Messages**:
  - `GET_PET_STATE`
  - `CREATE_REMINDER`
  - `FEED_PET`
  - `GET_REMINDERS`

### 3. Cross-Tab Synchronization
- **Purpose**: Keep pet state consistent across tabs
- **Method**: `chrome.tabs.sendMessage()`
- **Messages**:
  - `SYNC_PET_STATE`
  - `SYNC_STORAGE`

## Performance Considerations

### 1. Rendering Optimization
- Canvas rendering at 60fps
- Efficient sprite loading
- Minimal DOM manipulation
- Hardware acceleration support
- Proper canvas sizing and resizing

### 2. Memory Management
- Proper cleanup of timers
- Efficient storage operations
- Minimal object creation
- Weak references where appropriate
- Canvas context state management

### 3. Battery Optimization
- Support reduced motion
- Efficient animation loops
- Minimal background processing
- Smart focus tracking intervals
- Conditional rendering based on visibility

## Security Considerations

### 1. Content Scripts
- Minimal DOM access
- Secure message passing
- No direct script injection
- Sandboxed execution
- Proper canvas isolation

### 2. Storage
- Local storage only
- No sensitive data collection
- Secure data validation
- Type-safe operations
- Cross-tab sync security

### 3. Permissions
- Minimal required permissions
- Clear permission usage
- Secure API access
- Proper error handling

## Build System

### Vite + CRXJS Configuration
- **Vite**: Fast build tool with hot reload
- **CRXJS**: Chrome extension plugin for Vite
- **TypeScript**: Type safety and better DX
- **React**: UI components for popup and options

### Build Process
```
1. TypeScript compilation
2. Vite bundling with CRXJS
3. Asset processing and copying
4. Manifest generation
5. Output to dist/ directory
```

### Development Workflow
- Hot reload for popup development
- Automatic rebuild on file changes
- Source maps for debugging
- Type checking during build
- Linting and code quality checks

## Deployment

### Development
- `npm run dev` - Development server with hot reload
- Load `dist/` as unpacked extension
- Automatic rebuilds on changes

### Production
- `npm run build` - Production build
- Optimized and minified output
- Load `dist/` as unpacked extension
- Manual reload for updates

## Monitoring and Debugging

### Console Logging
- Content script: "focusPet:" prefixed messages
- Service worker: Chrome extension console
- Popup: DevTools console
- Canvas sizing: "focusPet: Resizing canvas to" messages

### Chrome DevTools
- Extension popup inspection
- Service worker debugging
- Content script debugging
- Storage inspection
- Network monitoring

### Common Debug Points
- Canvas sizing on page navigation
- Content script injection
- Service worker activation
- Message passing between components
- Storage synchronization 