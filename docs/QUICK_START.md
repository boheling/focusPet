# focusPet Quick Start Guide

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Chrome browser
- Git

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/focusPet.git
   cd focusPet
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

## Loading the Extension

1. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)

2. **Load the extension**
   - Click "Load unpacked"
   - Select the `dist` folder from your project

3. **Verify installation**
   - You should see the focusPet extension in your extensions list
   - The extension icon should appear in your toolbar

## Development Mode

For development with hot reload:

```bash
npm run dev
```

This will:
- Start the Vite development server
- Watch for file changes and rebuild automatically
- Provide hot reload for popup development
- Open the popup at `http://localhost:5173/popup/popup.html`

**Note**: The pet overlay only appears when the extension is loaded in Chrome, not when viewing the popup directly in the browser.

## Testing the Extension

### 1. Basic Functionality
- Open any website (like `https://google.com`)
- Look for the pet overlay (cat, dog, dragon, penguin, or bunny)
- Try moving your mouse - the pet should follow your cursor
- Click on the pet to interact with it

### 2. Popup Interface
- Click the extension icon in the toolbar
- Navigate between Pet, Reminders, and Settings tabs
- Try feeding your pet with treats
- Create some preset reminders

### 3. Reminder System
- Create a Pomodoro timer (25 minutes)
- Wait for the reminder to trigger
- Watch your pet react with animations
- Check the speech bubble notification

### 4. Focus Tracking
- Stay on a website for 30 minutes
- Check if you earned treats
- Monitor your pet's mood changes
- View focus statistics in the popup

## Project Structure

```
focusPet/
├── src/
│   ├── content/          # Pet overlay on web pages
│   ├── background/       # Service worker
│   ├── popup/           # Extension popup UI
│   ├── options/         # Settings page
│   ├── shared/          # Shared utilities
│   │   ├── pet/         # Pet behavior engine
│   │   ├── reminders/   # Reminder system
│   │   ├── storage/     # Storage management
│   │   ├── analytics/   # Focus tracking and analytics
│   │   └── types/       # TypeScript definitions
│   └── assets/          # Source images and icons
├── public/              # Static assets, manifest, HTML
├── dist/                # Built extension
├── docs/                # Documentation
└── package.json         # Dependencies and scripts
```

## Key Files

### Core Files
- `src/content/overlay.ts` - Pet overlay and canvas rendering
- `src/background/service-worker.ts` - Background tasks and alarms
- `src/popup/popup.tsx` - Extension popup interface
- `src/shared/pet/pet-engine.ts` - Pet behavior logic
- `src/shared/reminders/reminder-manager.ts` - Reminder system
- `src/shared/storage/index.ts` - Data persistence with error handling

### Configuration Files
- `public/manifest.json` - Extension configuration
- `vite.config.ts` - Build configuration
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies and scripts

## Recent Improvements

### Enhanced Error Handling
The extension now includes robust error handling for common issues:

- **Extension Context Invalidation**: Automatically handles when the extension context is invalidated (e.g., during updates)
- **Storage Failures**: Graceful degradation when storage operations fail
- **Context Restoration**: Automatic recovery when the extension context is restored
- **Local State Persistence**: Pet continues to function even when storage is unavailable

### Improved Storage System
- **Context Validity Tracking**: Monitors extension context state
- **Automatic Recovery**: Periodically checks if context can be restored
- **Graceful Degradation**: Local state updates continue even when storage fails
- **Better Error Messages**: Clear logging for debugging storage issues

### Pet Behavior Enhancements
- **Mood System**: Pets have different moods based on interaction and care
- **Speech System**: Pets can communicate through speech bubbles
- **Animation States**: Multiple animation states (idle, walk, sit, nap, play, excited, worried, sad)
- **Energy System**: Pets have energy that affects their behavior
- **Satiety System**: Pets get hungry and need feeding

## Development Workflow

### 1. Making Changes
1. Edit source files in `src/`
2. Run `npm run dev` for development mode
3. Reload the extension in Chrome (`chrome://extensions/` → refresh button)
4. Test your changes

### 2. Building for Production
```bash
npm run build
```
This creates optimized files in the `dist/` folder.

### 3. Testing
```bash
npm run test
```
Run the test suite (when implemented).

### 4. Linting
```bash
npm run lint
```
Check code quality and style.

### 5. Type Checking
```bash
npm run type-check
```
Validate TypeScript types.

## Common Issues

### Extension Not Loading
- Check that all files are built in `dist/`
- Verify `manifest.json` is valid
- Check Chrome console for errors
- Ensure all permissions are correct

### Pet Not Appearing
- **Important**: The pet overlay only appears when the extension is loaded in Chrome, not when viewing the popup in the browser
- Check Chrome DevTools console for "focusPet:" messages
- Verify pet assets are present in `dist/assets/pets/`
- Ensure the extension is loaded in `chrome://extensions/`

### Pet Size Issues
- Canvas sizing is handled automatically on page load and window resize
- Check console for "focusPet: Resizing canvas to" messages
- Reload the extension if sizing issues persist
- The pet should maintain consistent size across page navigations

### Reminders Not Working
- Check if service worker is active in `chrome://extensions/`
- Verify alarms are being created
- Check Chrome alarms in `chrome://extensions/` → extension details → "service worker"
- Look for errors in service worker console

### Popup Not Working
- Ensure React is building correctly
- Verify popup HTML is loading
- Check for JavaScript errors in popup console
- Ensure message passing is working

### Storage Issues
- Check for "Extension context invalidated" errors in console
- The extension will continue to work with local state even if storage fails
- Look for "focusPet: Storage context invalid, skipping persistence" messages
- Context will automatically restore when possible

## Debugging Tips

### 1. Chrome DevTools
- **Extension Popup**: Right-click extension icon → "Inspect popup"
- **Service Worker**: Go to `chrome://extensions/` → find your extension → click "service worker"
- **Content Script**: Open DevTools on any webpage and look for "focusPet:" messages
- **Storage**: Use `chrome.storage.local.get(null, console.log)` in console

### 2. Console Logging
- Content script messages are prefixed with "focusPet:"
- Service worker logs appear in the extension's service worker console
- Popup logs appear in the popup's DevTools console
- Canvas sizing logs: "focusPet: Resizing canvas to [width] x [height]"
- Storage logs: "focusPet: Storage context invalid, skipping persistence"

### 3. Extension Reloading
- Click the refresh icon in `chrome://extensions/`
- Or use the "Reload" button in extension details
- After making changes, always reload the extension

### 4. Storage Inspection
```javascript
// In Chrome DevTools console
chrome.storage.local.get(null, console.log);
```

### 5. Content Script Debugging
- Open DevTools on any webpage
- Look for "focusPet: Content script loading..." message
- Check for any error messages
- Verify canvas element exists in DOM

### 6. Error Handling Debugging
- Look for "focusPet: Extension context invalidated" messages
- Check for "focusPet: Storage update failed, continuing with local state"
- Monitor for "focusPet: Extension context restored" messages
- The pet should continue functioning even with storage errors

## Adding Features

### 1. New Pet Type
1. Add pet type to `PetType` in `src/shared/types/index.ts`
2. Create sprite images in `public/assets/pets/{petType}/`
3. Update pet engine behavior in `src/shared/pet/pet-engine.ts`
4. Add to popup selection in `src/popup/popup.tsx`

### 2. New Reminder Type
1. Add reminder type to `ReminderType` in types
2. Add preset in `src/shared/reminders/reminder-manager.ts`
3. Update popup UI to include new preset
4. Test reminder creation and triggering

### 3. New Animation
1. Add animation to `PetAnimation` in types
2. Create sprite images for the animation
3. Update pet engine to handle new animation
4. Add animation triggers in appropriate places

## Performance Optimization

### 1. Rendering
- Keep canvas rendering at 60fps
- Use efficient sprite loading
- Minimize DOM manipulation
- Use hardware acceleration

### 2. Memory
- Clean up timers properly
- Efficient storage operations
- Minimize object creation
- Use weak references where appropriate

### 3. Battery
- Support reduced motion
- Efficient animation loops
- Minimal background processing
- Smart focus tracking intervals

### 4. Error Recovery
- Graceful handling of storage failures
- Automatic context restoration
- Local state persistence
- Minimal impact on user experience

## Security Considerations

### 1. Content Scripts
- Minimal DOM access
- Secure message passing
- No direct script injection
- Sandboxed execution

### 2. Storage
- Local storage only
- No sensitive data collection
- Secure data validation
- Type-safe operations
- Robust error handling

### 3. Permissions
- Minimal required permissions
- Clear permission usage
- Secure API access
- Proper error handling

## Troubleshooting Checklist

### Extension Won't Load
- [ ] All dependencies installed (`npm install`)
- [ ] Build successful (`npm run build`)
- [ ] `dist/` folder contains all files
- [ ] Manifest is valid JSON
- [ ] Permissions are correct
- [ ] Chrome DevTools shows no errors

### Pet Not Appearing
- [ ] Extension is loaded in Chrome (not just popup in browser)
- [ ] Check console for "focusPet:" messages
- [ ] Pet assets exist in `dist/assets/pets/`
- [ ] Content script is injected (check manifest)
- [ ] Canvas element is created in DOM

### Reminders Not Working
- [ ] Service worker is active
- [ ] Alarms are being created
- [ ] Permissions include "alarms"
- [ ] Check service worker console for errors
- [ ] Verify reminder data in storage

### Popup Issues
- [ ] React is building correctly
- [ ] Popup HTML is loading
- [ ] No JavaScript errors in popup console
- [ ] Message passing is working
- [ ] Storage operations are successful

### Storage Issues
- [ ] Check for "Extension context invalidated" errors
- [ ] Look for storage error messages in console
- [ ] Verify local state is working
- [ ] Check if context restoration is happening
- [ ] Monitor for automatic recovery messages

## Next Steps

1. **Customize Your Pet**: Replace pet images in `public/assets/pets/`
2. **Add New Features**: Follow the development guidelines
3. **Test Thoroughly**: Use the debugging tips provided
4. **Deploy**: Build and load the extension in Chrome
5. **Share**: Contribute to the project or create your own fork 