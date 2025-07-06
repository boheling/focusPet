import { STORAGE_KEYS, PetState, UserSettings, Reminder, FocusStats, FocusSession } from '../types';

export class StorageManager {
  private static instance: StorageManager;

  private constructor() {}

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  // Generic storage methods
  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await chrome.storage.local.get(key);
      return result[key] || null;
    } catch (error) {
      console.error(`Error getting storage key ${key}:`, error);
      // If extension context is invalidated, return null gracefully
      if (error instanceof Error && error.message?.includes('Extension context invalidated')) {
        console.log('Extension context invalidated during get operation');
        return null;
      }
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await chrome.storage.local.set({ [key]: value });
    } catch (error) {
      console.error(`Error setting storage key ${key}:`, error);
      // If extension context is invalidated, try to reinitialize
      if (error instanceof Error && error.message?.includes('Extension context invalidated')) {
        console.log('Extension context invalidated, attempting to reinitialize...');
        // Don't throw the error, just log it
        return;
      }
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await chrome.storage.local.remove(key);
    } catch (error) {
      console.error(`Error removing storage key ${key}:`, error);
    }
  }

  // Pet state management
  async getPetState(): Promise<PetState | null> {
    return this.get<PetState>(STORAGE_KEYS.PET_STATE);
  }

  async setPetState(petState: PetState): Promise<void> {
    await this.set(STORAGE_KEYS.PET_STATE, petState);
  }

  // User settings management
  async getUserSettings(): Promise<UserSettings | null> {
    return this.get<UserSettings>(STORAGE_KEYS.USER_SETTINGS);
  }

  async setUserSettings(settings: UserSettings): Promise<void> {
    await this.set(STORAGE_KEYS.USER_SETTINGS, settings);
  }

  // Reminders management
  async getReminders(): Promise<Reminder[]> {
    const reminders = await this.get<Reminder[]>(STORAGE_KEYS.REMINDERS);
    return reminders || [];
  }

  async setReminders(reminders: Reminder[]): Promise<void> {
    await this.set(STORAGE_KEYS.REMINDERS, reminders);
  }

  async addReminder(reminder: Reminder): Promise<void> {
    const reminders = await this.getReminders();
    reminders.push(reminder);
    await this.setReminders(reminders);
  }

  async updateReminder(updatedReminder: Reminder): Promise<void> {
    const reminders = await this.getReminders();
    const index = reminders.findIndex(r => r.id === updatedReminder.id);
    if (index !== -1) {
      reminders[index] = updatedReminder;
      await this.setReminders(reminders);
    }
  }

  async deleteReminder(reminderId: string): Promise<void> {
    const reminders = await this.getReminders();
    const filteredReminders = reminders.filter(r => r.id !== reminderId);
    await this.setReminders(filteredReminders);
  }

  // Focus tracking management
  async getFocusStats(): Promise<FocusStats | null> {
    return this.get<FocusStats>(STORAGE_KEYS.FOCUS_STATS);
  }

  async setFocusStats(stats: FocusStats): Promise<void> {
    await this.set(STORAGE_KEYS.FOCUS_STATS, stats);
  }

  async getFocusSessions(): Promise<FocusSession[]> {
    const sessions = await this.get<FocusSession[]>(STORAGE_KEYS.FOCUS_SESSIONS);
    return sessions || [];
  }

  async setFocusSessions(sessions: FocusSession[]): Promise<void> {
    await this.set(STORAGE_KEYS.FOCUS_SESSIONS, sessions);
  }

  async addFocusSession(session: FocusSession): Promise<void> {
    const sessions = await this.getFocusSessions();
    sessions.push(session);
    await this.setFocusSessions(sessions);
  }

  async updateFocusSession(updatedSession: FocusSession): Promise<void> {
    const sessions = await this.getFocusSessions();
    const index = sessions.findIndex(s => s.id === updatedSession.id);
    if (index !== -1) {
      sessions[index] = updatedSession;
      await this.setFocusSessions(sessions);
    }
  }

  // Cross-tab synchronization
  async syncAcrossTabs(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({});
      const currentTab = await chrome.tabs.getCurrent();
      
      if (currentTab) {
        tabs.forEach(tab => {
          if (tab.id && tab.id !== currentTab.id) {
            chrome.tabs.sendMessage(tab.id, { type: 'SYNC_STORAGE' });
          }
        });
      }
    } catch (error) {
      console.error('Error syncing across tabs:', error);
    }
  }

  // Initialize default data
  async initializeDefaults(): Promise<void> {
    const petState = await this.getPetState();
    if (!petState) {
      const defaultPetState: PetState = {
        type: 'cat',
        name: 'Whiskers',
        mood: 'content',
        happiness: 75,
        energy: 100,
        hunger: 50,
        treats: 5,
        unlockedAnimations: ['idle', 'walk', 'sit'],
        accessories: [],
        position: { x: 100, y: 100 },
        currentAnimation: 'idle',
        lastInteraction: Date.now(),
      };
      await this.setPetState(defaultPetState);
    }

    const userSettings = await this.getUserSettings();
    if (!userSettings) {
      const defaultSettings: UserSettings = {
        petType: 'cat',
        petName: 'Whiskers',
        soundEnabled: true,
        visualEffectsEnabled: true,
        petPosition: 'bottom-right',
        reminderDefaults: {
          soundEnabled: true,
          visualEnabled: true,
          systemNotifications: true, // Enable system notifications by default
        },
        focusTracking: {
          enabled: true,
          trackingInterval: 30,
          treatRewardInterval: 30,
        },
        theme: 'auto',
      };
      await this.setUserSettings(defaultSettings);
      console.log('Initialized default user settings');
    } else {
      console.log('User settings already exist:', userSettings);
    }

    const focusStats = await this.getFocusStats();
    if (!focusStats) {
      const defaultStats: FocusStats = {
        totalFocusTime: 0,
        currentStreak: 0,
        longestStreak: 0,
        treatsEarned: 0,
        achievements: [],
        lastTreatTime: 0,
      };
      await this.setFocusStats(defaultStats);
    }
  }
}

// Export singleton instance
export const storageManager = StorageManager.getInstance(); 