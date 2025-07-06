# focusPet 🐾

**Accompany Pet Help You Get Focused**

A delightful browser extension that keeps you company and productive with a virtual pet overlay that reminds you about breaks, tasks, and deadlines.

## 🎯 Key Features

- **Virtual Pet Overlay**: Choose from cat, dog, dragon, penguin, and bunny. The pet is animated, interactive, and follows your cursor.
- **Reminders & Alarms**: Pomodoro, posture, water, and custom reminders, with notifications and pet reactions.
- **Rewards & Mood**: Earn treats for focus, unlock animations, and see your pet's mood change with your productivity.
- **Customization**: Change pet type, name, and appearance. Enable/disable sounds and visual effects.
- **Persistence**: Pet overlay and state persist across page navigations and reloads.
- **Real-time Sync**: Settings and pet state sync across all tabs and popup in real-time.
- **Focus Tracking**: Automatic treat rewards based on configurable intervals.

## 🏗️ Architecture Overview

```
focusPet/
├── src/
│   ├── content/          # Overlay script and styles
│   ├── background/       # Service worker (background logic)
│   ├── popup/            # Extension popup UI (React)
│   ├── options/          # Settings page (React)
│   ├── shared/           # Pet engine, reminders, storage, types
│   └── assets/           # Source images and icons
├── public/               # Static assets, manifest, HTML
├── dist/                 # Built extension (output)
├── docs/                 # Documentation
└── package.json, vite.config.ts, tsconfig.json
```

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Development Mode**
   ```bash
   npm run dev
   ```
   - Opens the popup at `http://localhost:5173/popup/popup.html` for live development.

3. **Build for Production**
   ```bash
   npm run build
   ```
   - Outputs the extension to the `dist/` folder.

4. **Load Extension in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

## 🛠️ Tech Stack

- **TypeScript** – Type safety and better development experience
- **Vite** – Fast build tool and dev server
- **React** – Popup and options UI
- **Canvas API** – Pet overlay rendering and animation
- **Chrome Extension APIs** – Background, storage, notifications
- **CRXJS** – Modern Vite plugin for Chrome Extensions
- **Vitest** – (Planned) Unit testing

## 📁 Project Structure

### Core Modules

- **Pet System** (`src/shared/pet/pet-engine.ts`)
  - Pet types, behaviors, animation, and state
- **Reminder System** (`src/shared/reminders/reminder-manager.ts`)
  - Timer management, notification, and custom reminders
- **Overlay Engine** (`src/content/overlay.ts`)
  - Canvas rendering, mouse interaction, overlay persistence
- **Settings & Storage** (`src/shared/storage/index.ts`)
  - User preferences, pet state, cross-tab sync
- **Background Service Worker** (`src/background/service-worker.ts`)
  - Handles alarms, reminders, storage sync, focus tracking

## 🐾 Pet Overlay & Persistence

- The overlay is injected via the manifest's `content_scripts` field, ensuring it appears on all websites.
- The overlay script (`src/content/overlay.ts`) creates a full-page, non-blocking canvas and listens for mouse events on the window for interactivity.
- A MutationObserver ensures the overlay is re-injected if removed from the DOM.
- Pet state and settings are persisted using `chrome.storage.local` and synchronized across tabs.
- Canvas sizing is properly handled during page navigation and window resizing.

## 📝 Customization & Assets

- Pet images and animations are in `public/assets/pets/` and are copied to the build output.
- To use your own pet images, replace the PNGs in `public/assets/pets/{petType}/`.
- All static assets (images, icons, manifest) are managed in `public/` for Vite compatibility.

## ⏰ Reminders & Rewards

- Built-in reminders: Pomodoro, posture, water, eye rest
- Custom reminders: One-time, recurring, or conditional
- Focus rewards: Earn treats, unlock animations, and accessories

## 🎮 Reward System

### Focus Rewards
- **Treats**: Earned every 30 minutes of focused work (configurable)
- **New Animations**: Unlock special moves and tricks
- **Pet Accessories**: Collars, hats, and accessories
- **Background Themes**: Unlock new environments

### Achievement System
- **Focus Streaks**: Consecutive days of productivity
- **Task Completion**: Rewards for finishing to-dos
- **Break Compliance**: Rewards for taking scheduled breaks

### Treat Reward System
- **Configurable Intervals**: Set treat reward intervals from 1 minute to several hours
- **Accurate Tracking**: Uses timestamp-based tracking to prevent duplicate rewards
- **Real-time Updates**: Popup and overlay update immediately when treats are earned
- **Notifications**: Desktop notifications when treats are awarded
- **Cross-tab Sync**: Treats sync across all browser tabs in real-time

### Pet Energy System
- **Natural Restoration**: Pet energy restores naturally during idle time
- **Rest-Based Recovery**: The longer the pet rests, the more energy it regains
- **Visual Feedback**: Pet shows "nap" animation when resting and gaining energy
- **Active Energy Loss**: Energy decreases when pet is active (recently interacted with)
- **Realistic Behavior**: Treats provide happiness and reduce hunger, but energy comes from rest

## 💤 Idle, Sit, and Nap Behavior

- **Idle**: Pet is active or waiting for interaction.
- **Sit**: After 1 minute of no interaction, the pet automatically sits (shows the sit animation).
- **Nap**: After 2 minutes of no interaction, the pet automatically naps (shows the nap animation).
- **Return to Idle**: Any interaction (mouse move/click) wakes the pet up and returns it to idle.
- **Image Requirements**: For best results, use transparent PNGs for sit and nap animations.

These transitions are handled automatically by the pet engine and require no user intervention.

## ⚙️ Settings & Configuration

### Focus Tracking Settings
- **Enable/Disable**: Toggle focus tracking on/off
- **Tracking Interval**: How often to check for focus (default: 30 minutes)
- **Treat Reward Interval**: How often to award treats (default: 30 minutes)
- **Real-time Sync**: Settings persist and sync across all tabs

### Pet Settings
- **Pet Type**: Choose from cat, dog, dragon, penguin, bunny
- **Pet Name**: Customize your pet's name
- **Sound Effects**: Enable/disable pet sounds
- **Visual Effects**: Enable/disable animations and effects
- **Position**: Set pet overlay position (bottom-right, bottom-left, etc.)

### Reminder Settings
- **System Notifications**: Show notifications even when Chrome is not focused
- **Sound Alerts**: Enable/disable reminder sounds
- **Visual Alerts**: Enable/disable reminder animations

## 🧑‍💻 Development

### Scripts

- `npm run dev` – Start dev server (popup UI, hot reload)
- `npm run build` – Build production extension to `dist/`
- `npm run test` – Run test suite (when implemented)
- `npm run lint` – Lint code with ESLint
- `npm run type-check` – TypeScript validation
- `npm run clean` – Remove `dist/` output

### Key Files

- `public/manifest.json` – Extension manifest (always reference source files for CRXJS)
- `src/content/overlay.ts` – Overlay logic
- `src/background/service-worker.ts` – Background logic, focus tracking, treat rewards
- `src/popup/popup.tsx` – Popup UI with real-time sync
- `src/options/options.tsx` – Options/settings UI
- `src/shared/storage/index.ts` – Storage management and cross-tab sync

## 🐞 Debugging & Common Issues

### Extension Not Loading
- Check `dist/` output, manifest validity, and Chrome console for errors
- Ensure all permissions are correct in the manifest

### Pet Not Appearing
- Verify the extension is loaded in Chrome (not just viewing popup in browser)
- Check Chrome DevTools console for "focusPet:" messages
- Ensure pet assets are present in `dist/assets/pets/`

### Pet Size Issues
- Canvas sizing is handled automatically on page load and window resize
- Check console for "focusPet: Resizing canvas to" messages
- Reload the extension if sizing issues persist

### Reminders Not Working
- Check service worker status in `chrome://extensions/`
- Verify alarms are being created
- Look for errors in service worker console

### Popup Not Working
- Ensure React is building correctly
- Verify popup HTML is loading
- Check for JavaScript errors in popup console

### Treat Rewards Not Working
- Check that focus tracking is enabled in settings
- Verify treat reward interval is set correctly
- Look for "Treat earned!" messages in service worker console
- Check that popup receives "SYNC_PET_STATE" messages

### Settings Not Persisting
- Ensure settings are saved using the "Save Settings" button
- Check that popup refreshes after saving
- Look for "Background: Retrieved settings" messages in console

## 🎨 Pet Types & Behaviors

### Available Pets
- **Cat**: Independent, naps frequently, purrs when happy
- **Dog**: Energetic, follows cursor closely, wagging tail
- **Dragon**: Majestic, flies around, breathes small fire when excited
- **Penguin**: Waddles, slides on ice, fish-loving
- **Bunny**: Gentle hops, carrot-loving, shy personality

### Mood States
- **Happy**: Bright colors, active animations, positive sounds
- **Content**: Normal behavior, relaxed animations
- **Bored**: Slower movements, yawns occasionally
- **Neglected**: Sad expressions, drooping animations

## ⏰ Reminder Types

### Built-in Reminders
- **Pomodoro Timer**: 25min work / 5min break cycles
- **Posture Check**: Hourly reminders to stretch
- **Water Break**: Hydration reminders every 2 hours
- **Eye Rest**: 20-20-20 rule (20 seconds every 20 minutes)

### Custom Reminders
- **One-time**: Set specific date/time
- **Recurring**: Daily, weekly, or custom intervals
- **Conditional**: Trigger based on website or activity

## 🔄 Real-time Sync System

### Cross-tab Synchronization
- **Pet State**: Changes sync across all tabs immediately
- **Settings**: Configuration updates propagate to all tabs
- **Treat Rewards**: Earned treats appear in all tabs instantly
- **Message System**: Uses Chrome extension messaging for reliable sync

### Background Service Worker
- **Focus Tracking**: Runs every minute to track productivity
- **Treat Rewards**: Awards treats based on configurable intervals
- **Notifications**: Sends desktop notifications for rewards
- **Storage Sync**: Manages all data persistence and cross-tab sync

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License – see [LICENSE](LICENSE) for details.

---

**Made with ❤️ to help you stay focused and happy while working!**

---

**Notes for Developers:**
- The extension uses manifest-based content script injection for robust overlay persistence
- All static assets should be placed in `public/` for correct build output
- For debugging overlay injection, check the service worker logs in the Chrome Extensions page
- Canvas sizing is automatically handled on page load and window resize
- The treat reward system uses timestamp-based tracking to prevent duplicate rewards
- Real-time sync is implemented using Chrome extension messaging between background, popup, and content scripts
