import { reminderManager } from '@shared/reminders/reminder-manager';
import { storageManager } from '@shared/storage';

// Initialize storage and reminders when service worker starts
chrome.runtime.onStartup.addListener(async () => {
  await storageManager.initializeDefaults();
});

chrome.runtime.onInstalled.addListener(async () => {
  await storageManager.initializeDefaults();
});

// Handle alarm triggers
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('reminder_')) {
    await reminderManager.handleAlarmTrigger(alarm.name);
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true; // Keep message channel open for async response
});

async function handleMessage(message: any, _sender: any, sendResponse: any) {
  try {
    switch (message.type) {
      case 'GET_PET_STATE':
        const petState = await storageManager.getPetState();
        sendResponse({ success: true, data: petState });
        break;

      case 'UPDATE_PET_STATE':
        await storageManager.setPetState(message.data);
        sendResponse({ success: true });
        break;

      case 'GET_USER_SETTINGS':
        const settings = await storageManager.getUserSettings();
        sendResponse({ success: true, data: settings });
        break;

      case 'UPDATE_USER_SETTINGS':
        await storageManager.setUserSettings(message.data);
        sendResponse({ success: true });
        break;

      case 'GET_REMINDERS':
        const reminders = await reminderManager.getReminders();
        sendResponse({ success: true, data: reminders });
        break;

      case 'CREATE_REMINDER':
        const newReminder = await reminderManager.createReminder(message.data);
        sendResponse({ success: true, data: newReminder });
        break;

      case 'UPDATE_REMINDER':
        const updatedReminder = await reminderManager.updateReminder(message.reminderId, message.data);
        sendResponse({ success: true, data: updatedReminder });
        break;

      case 'DELETE_REMINDER':
        const deleted = await reminderManager.deleteReminder(message.reminderId);
        sendResponse({ success: true, data: deleted });
        break;

      case 'CREATE_PRESET_REMINDER':
        const presetReminder = await reminderManager.createPresetReminder(message.reminderType);
        sendResponse({ success: true, data: presetReminder });
        break;

      case 'GET_FOCUS_STATS':
        const focusStats = await storageManager.getFocusStats();
        sendResponse({ success: true, data: focusStats });
        break;

      case 'UPDATE_FOCUS_STATS':
        await storageManager.setFocusStats(message.data);
        sendResponse({ success: true });
        break;

      case 'ADD_FOCUS_SESSION':
        await storageManager.addFocusSession(message.data);
        sendResponse({ success: true });
        break;

      case 'UPDATE_FOCUS_SESSION':
        await storageManager.updateFocusSession(message.data);
        sendResponse({ success: true });
        break;

      case 'ADD_TREATS':
        const currentPetState = await storageManager.getPetState();
        if (currentPetState) {
          currentPetState.treats += message.count;
          await storageManager.setPetState(currentPetState);
        }
        sendResponse({ success: true });
        break;

      case 'FEED_PET':
        const feedingPetState = await storageManager.getPetState();
        if (feedingPetState && feedingPetState.treats > 0) {
          feedingPetState.treats--;
          feedingPetState.happiness = Math.min(100, feedingPetState.happiness + 15);
          feedingPetState.hunger = Math.max(0, feedingPetState.hunger - 20);
          await storageManager.setPetState(feedingPetState);
        }
        sendResponse({ success: true });
        break;

      case 'SYNC_STORAGE':
        await storageManager.syncAcrossTabs();
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
}

// Handle notification clicks
chrome.notifications.onClicked.addListener((_notificationId) => {
  // Handle notification click - could open popup or specific page
  chrome.action.openPopup();
});

// Handle tab updates to sync pet state
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Sync pet state to new tab
    chrome.tabs.sendMessage(tabId, { type: 'SYNC_PET_STATE' }).catch(() => {
      // Ignore errors for tabs that don't have content script
    });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((_tab) => {
  // Open popup when extension icon is clicked
  chrome.action.openPopup();
});

// Periodic focus tracking
setInterval(async () => {
  try {
    const settings = await storageManager.getUserSettings();
    if (settings?.focusTracking?.enabled) {
      await trackFocusTime();
    }
  } catch (error) {
    console.error('Error in focus tracking:', error);
  }
}, 60000); // Check every minute

async function trackFocusTime(): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    
    if (activeTab && activeTab.url) {
      const focusStats = await storageManager.getFocusStats();
      if (focusStats) {
        // Add focus time
        focusStats.totalFocusTime += 1; // 1 minute
        
        // Check for treat rewards
        const settings = await storageManager.getUserSettings();
        if (settings?.focusTracking?.treatRewardInterval) {
          const minutesSinceLastTreat = focusStats.totalFocusTime % settings.focusTracking.treatRewardInterval;
          if (minutesSinceLastTreat === 0) {
            const petState = await storageManager.getPetState();
            if (petState) {
              petState.treats += 1;
              await storageManager.setPetState(petState);
              
              // Notify user of treat earned
              await chrome.notifications.create(`treat_${Date.now()}`, {
                type: 'basic',
                iconUrl: 'assets/icons/icon48.png',
                title: 'focusPet Treat Earned!',
                message: 'Great job staying focused! Your pet earned a treat.',
                priority: 1
              });
            }
          }
        }
        
        await storageManager.setFocusStats(focusStats);
      }
    }
  } catch (error) {
    console.error('Error tracking focus time:', error);
  }
} 

// Content scripts are now handled by manifest.json content_scripts field
// No need for programmatic injection 