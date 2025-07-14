import { reminderManager } from '@shared/reminders/reminder-manager';
import { storageManager } from '@shared/storage';
import { contentAnalyzer } from '@shared/analytics/content-analyzer';
import { StoryGenerator } from '@shared/analytics/story-generator';
import { FocusLevel, ActivityType } from '@shared/analytics/types';

// Initialize content analyzer (browsing activity tracking)
// This will start tracking as soon as the service worker loads
// No need to call any methods, the constructor handles setup

// Initialize storage and reminders when service worker starts
chrome.runtime.onStartup.addListener(async () => {
  await storageManager.initializeDefaults();
});

chrome.runtime.onInstalled.addListener(async () => {
  await storageManager.initializeDefaults();
  
  // Request notification permission for system-level notifications
  try {
    // This will prompt the user for notification permission if not already granted
    const permission = await chrome.permissions.request({
      permissions: ['notifications']
    });
    if (permission) {
      // Notification permission granted
    } else {
      // Notification permission denied - reminders will only show in browser
    }
  } catch (error) {
    // Notification permission already granted or not available
  }
});

// Handle alarm triggers
chrome.alarms.onAlarm.addListener(async (alarm) => {
  // Alarm triggered
  if (alarm.name.startsWith('reminder_')) {
    // Processing reminder alarm
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
        // Retrieved settings
        sendResponse({ success: true, data: settings });
        break;

      case 'UPDATE_USER_SETTINGS':
        await storageManager.setUserSettings(message.data);
        
        // If pet type changed, update the pet state
        const existingPetState = await storageManager.getPetState();
        if (existingPetState && existingPetState.type !== message.data.petType) {
          console.log('focusPet: Pet type changed from', existingPetState.type, 'to', message.data.petType);
          existingPetState.type = message.data.petType;
          existingPetState.name = message.data.petName;
          await storageManager.setPetState(existingPetState);
          
          // Sync pet state to all tabs
          const tabs = await chrome.tabs.query({});
          tabs.forEach(tab => {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, { type: 'SYNC_PET_STATE' }).catch(() => {
                // Ignore errors for tabs that don't have content script
              });
            }
          });
        }
        
        // Verify the save by reading back
        await storageManager.getUserSettings();
        // Verified saved settings
        
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
        // Creating preset reminder
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
          
          // Sync pet state to all tabs
          const tabs = await chrome.tabs.query({});
          tabs.forEach(tab => {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, { type: 'SYNC_PET_STATE' }).catch(() => {
                // Ignore errors for tabs that don't have content script
              });
            }
          });
        }
        sendResponse({ success: true });
        break;

      case 'FEED_PET':
        console.log('focusPet: Service worker FEED_PET handler called');
        const feedingPetState = await storageManager.getPetState();
        console.log('focusPet: Current pet state in service worker:', {
          treats: feedingPetState?.treats,
          happiness: feedingPetState?.happiness,
          satiety: feedingPetState?.satiety,
          energy: feedingPetState?.energy
        });
        
        if (feedingPetState && feedingPetState.treats > 0) {
          feedingPetState.treats--;
          const oldHappiness = feedingPetState.happiness;
          const oldSatiety = feedingPetState.satiety;
          
          feedingPetState.happiness = Math.min(100, feedingPetState.happiness + 15);
          feedingPetState.satiety = Math.min(100, feedingPetState.satiety + 20);
          
          console.log('focusPet: Service worker feeding updates:', {
            treats: `${feedingPetState.treats + 1} -> ${feedingPetState.treats}`,
            happiness: `${oldHappiness} -> ${feedingPetState.happiness}`,
            satiety: `${oldSatiety} -> ${feedingPetState.satiety}`
          });
          
          await storageManager.setPetState(feedingPetState);
          console.log('focusPet: Service worker storage update completed');
          
          // Sync pet state to all tabs
          const tabs = await chrome.tabs.query({});
          tabs.forEach(tab => {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, { type: 'SYNC_PET_STATE' }).catch(() => {
                // Ignore errors for tabs that don't have content script
              });
            }
          });
          console.log('focusPet: Service worker sent SYNC_PET_STATE to all tabs');
        } else {
          console.log('focusPet: Service worker - no treats available or no pet state');
        }
        sendResponse({ success: true });
        break;



      case 'SYNC_STORAGE':
        await storageManager.syncAcrossTabs();
        sendResponse({ success: true });
        break;

      case 'SNOOZE_REMINDER':
        const reminder = reminderManager.getReminders().find(r => r.id === message.reminderId);
        if (reminder) {
          const snoozedReminder = {
            ...reminder,
            id: reminder.id + '_snoozed_' + Date.now(),
            nextTrigger: Date.now() + (message.snoozeMinutes * 60 * 1000),
            isActive: true
          };
          await reminderManager.createReminder(snoozedReminder);
          // Reminder snoozed
        }
        sendResponse({ success: true });
        break;

// TEMPORARY: Test analytics summary
      case 'TEST_ANALYTICS_SUMMARY':
        try {
          const summary = await contentAnalyzer.getActivitySummary(1); // last 1 day
          console.log('focusPet: Analytics summary (last 1 day):', summary);
          sendResponse({ success: true, data: summary });
        } catch (error) {
          console.error('focusPet: Error getting analytics summary:', error);
          sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
        }
        break;

      case 'GENERATE_DAILY_STORY':
        try {
          const summary = await contentAnalyzer.getActivitySummary(1); // last 1 day
          if (summary && summary.totalTime > 0) {
            const story = StoryGenerator.generateStory(summary, 'daily');
            await storageManager.addStory(story);
            console.log('focusPet: Generated daily story:', story.title);
            sendResponse({ success: true, data: story });
          } else {
            sendResponse({ success: false, error: 'No activity data available for story generation' });
          }
        } catch (error) {
          console.error('focusPet: Error generating daily story:', error);
          sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
        }
        break;

      case 'GENERATE_WEEKLY_STORY':
        try {
          const summary = await contentAnalyzer.getActivitySummary(7); // last 7 days
          if (summary && summary.totalTime > 0) {
            const story = StoryGenerator.generateStory(summary, 'weekly');
            await storageManager.addStory(story);
            console.log('focusPet: Generated weekly story:', story.title);
            sendResponse({ success: true, data: story });
          } else {
            sendResponse({ success: false, error: 'No activity data available for story generation' });
          }
        } catch (error) {
          console.error('focusPet: Error generating weekly story:', error);
          sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
        }
        break;

      case 'GET_STORIES':
        try {
          const stories = await storageManager.getStories();
          sendResponse({ success: true, data: stories });
        } catch (error) {
          console.error('focusPet: Error getting stories:', error);
          sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
        }
        break;

      case 'GET_ANALYTICS_STATUS':
        try {
          const status = contentAnalyzer.getStatus();
          const summary = await contentAnalyzer.getActivitySummary(1); // last 1 day
          sendResponse({ 
            success: true, 
            data: { 
              status, 
              summary,
              activityLogLength: contentAnalyzer['activityLog']?.length || 0
            } 
          });
        } catch (error) {
          console.error('focusPet: Error getting analytics status:', error);
          sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
        }
        break;

      case 'CLEAR_ANALYTICS_DATA':
        try {
          await contentAnalyzer.clearActivityLog();
          sendResponse({ success: true });
        } catch (error) {
          console.error('focusPet: Error clearing analytics data:', error);
          sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
        }
        break;

      case 'TEST_ANALYTICS_TRACKING':
        try {
          // Manually log some test activity
          const testActivity = {
            domain: 'test.com',
            pageTitle: '',
            timeSpent: 5,
            focusLevel: 'medium' as FocusLevel,
            activityType: 'work' as ActivityType,
            timestamp: Date.now()
          };
          
          // Add to activity log directly
          contentAnalyzer['activityLog'].push(testActivity);
          await contentAnalyzer['saveActivityLog']();
          
          console.log('focusPet: Added test activity to analytics');
          sendResponse({ success: true, message: 'Test activity logged' });
        } catch (error) {
          console.error('focusPet: Error testing analytics tracking:', error);
          sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
        }
        break;

      case 'GET_LATEST_STORY':
        try {
          const story = await storageManager.getLatestStory();
          sendResponse({ success: true, data: story });
        } catch (error) {
          console.error('focusPet: Error getting latest story:', error);
          sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
        }
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

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
      // Notification button clicked
  
  if (notificationId.startsWith('notification_') || notificationId.startsWith('system_notification_')) {
    const reminderId = notificationId.replace('notification_', '').replace('system_notification_', '');
    
    if (buttonIndex === 0) {
      // Dismiss button
      // Dismissing reminder
      await chrome.notifications.clear(notificationId);
    } else if (buttonIndex === 1) {
      // Snooze 5 minutes
      // Snoozing reminder
      await chrome.notifications.clear(notificationId);
      
      // Create a new reminder for 5 minutes from now
      const reminder = reminderManager.getReminders().find(r => r.id === reminderId);
      if (reminder) {
        const snoozedReminder = {
          ...reminder,
          id: reminderId + '_snoozed',
          nextTrigger: Date.now() + (5 * 60 * 1000), // 5 minutes
          isActive: true
        };
        await reminderManager.createReminder(snoozedReminder);
        // Reminder snoozed for 5 minutes
      }
    }
  }
});

// Handle tab updates to sync pet state and initialize tracking
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Sync pet state to new tab
    chrome.tabs.sendMessage(tabId, { type: 'SYNC_PET_STATE' }).catch(() => {
      // Ignore errors for tabs that don't have content script
    });
    
    // Initialize content analyzer tracking for this tab
    try {
      await contentAnalyzer.handleTabUpdate(tabId, tab);
    } catch (error) {
      console.error('focusPet: Error initializing tab tracking:', error);
    }
  }
});

// Handle tab activation for content analyzer
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    await contentAnalyzer.handleTabActivation(activeInfo.tabId);
  } catch (error) {
    console.error('focusPet: Error handling tab activation:', error);
  }
});

// Handle tab removal for content analyzer
chrome.tabs.onRemoved.addListener(async (tabId) => {
  try {
    await contentAnalyzer.handleTabRemoval(tabId);
  } catch (error) {
    console.error('focusPet: Error handling tab removal:', error);
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
    const focusStats = await storageManager.getFocusStats();
    if (focusStats) {
      // Add focus time regardless of browser state
      focusStats.totalFocusTime += 1; // 1 minute

      // Ensure lastTreatTime exists
      if (!focusStats.lastTreatTime) {
        focusStats.lastTreatTime = 0;
      }

      // Check for treat rewards
      const settings = await storageManager.getUserSettings();
      if (settings?.focusTracking?.treatRewardInterval) {
        const now = Date.now();
        const intervalMs = settings.focusTracking.treatRewardInterval * 60 * 1000;
        if (now - focusStats.lastTreatTime >= intervalMs) {
          const timeSinceLastTreat = now - focusStats.lastTreatTime;
          const timeSinceLastTreatSeconds = Math.floor(timeSinceLastTreat / 1000);
          console.log('focusPet: Time since last treat:', timeSinceLastTreatSeconds, 'seconds');
          console.log('focusPet: Treat reward interval met, awarding treat');
          const petState = await storageManager.getPetState();
          if (petState) {
            console.log('focusPet: Current treats before award:', petState.treats);
            petState.treats += 1;
            console.log('focusPet: Treats after award:', petState.treats);
            await storageManager.setPetState(petState);

            // Sync pet state to all tabs (including popup)
            const tabs = await chrome.tabs.query({});
            // Sending SYNC_PET_STATE to tabs
            tabs.forEach(tab => {
              if (tab.id) {
                chrome.tabs.sendMessage(tab.id, { type: 'SYNC_PET_STATE' }).catch(() => {
                  // Ignore errors for tabs that don't have content script
                });
              }
            });

            // Notify user of treat earned
            try {
              await chrome.notifications.create(`treat_${Date.now()}`, {
                type: 'basic',
                iconUrl: 'assets/icons/icon48.png',
                title: 'focusPet Treat Earned!',
                message: 'Great job staying focused! Your pet earned a treat.',
                priority: 1
              });
            } catch (notificationError) {
              console.log('focusPet: Could not create notification with icon:', notificationError);
              // Don't try fallback since iconUrl is required for basic notifications
            }

            // Treat earned
            focusStats.lastTreatTime = now;
          }
        }
      }

      await storageManager.setFocusStats(focusStats);
    }
  } catch (error) {
    console.error('Error tracking focus time:', error);
  }
}

// Content scripts are now handled by manifest.json content_scripts field
// No need for programmatic injection 