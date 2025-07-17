import { STORAGE_KEYS, PetState, UserSettings, Reminder, FocusStats, FocusSession, AnalyticsData } from '../types';
import { StoryData } from '../analytics/story-generator';

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
    const petState = await this.get<PetState>(STORAGE_KEYS.PET_STATE);
    
    // Validate pet state and recover if corrupted
    if (petState) {
      const recoveredPetState = this.validateAndRecoverPetState(petState);
      if (recoveredPetState !== petState) {
        console.log('focusPet: Pet state was corrupted, recovered:', recoveredPetState);
        await this.setPetState(recoveredPetState);
        return recoveredPetState;
      }
    }
    
    return petState;
  }

  async setPetState(petState: PetState): Promise<void> {
    // Validate pet state before saving
    const validatedPetState = this.validateAndRecoverPetState(petState);
    await this.set(STORAGE_KEYS.PET_STATE, validatedPetState);
  }

  // Validate and recover pet state if corrupted
  private validateAndRecoverPetState(petState: PetState): PetState {
    const now = Date.now();
    let needsRecovery = false;
    
    // Check for corrupted values (zero values that shouldn't be zero)
    if (petState.happiness === 0 && petState.satiety === 0 && petState.energy === 0) {
      console.warn('focusPet: Detected corrupted pet state with all zero values, recovering...');
      needsRecovery = true;
    }
    
    // Ensure minimum values for pet stats (set to reasonable defaults, not zero)
    if (petState.happiness < 0) {
      console.warn('focusPet: Invalid happiness value, setting to minimum');
      petState.happiness = 50; // Set to reasonable minimum, not 0
      needsRecovery = true;
    }
    
    if (petState.satiety < 0) {
      console.warn('focusPet: Invalid satiety value, setting to minimum');
      petState.satiety = 50; // Set to reasonable minimum, not 0
      needsRecovery = true;
    }
    
    if (petState.energy < 0) {
      console.warn('focusPet: Invalid energy value, setting to minimum');
      petState.energy = 75; // Set to reasonable minimum, not 0
      needsRecovery = true;
    }
    
    if (petState.treats < 0) {
      console.warn('focusPet: Invalid treats value, setting to minimum');
      petState.treats = 3; // Set to reasonable minimum, not 0
      needsRecovery = true;
    }
    
    // If recovery is needed, set reasonable default values
    if (needsRecovery) {
      petState.happiness = Math.max(petState.happiness, 50);
      petState.satiety = Math.max(petState.satiety, 50);
      petState.energy = Math.max(petState.energy, 75);
      petState.treats = Math.max(petState.treats, 3);
      petState.lastInteraction = now;
      petState.lastSatietyDecrease = now;
      petState.mood = 'content';
    }
    
    // Ensure required fields exist
    if (!petState.unlockedAnimations) {
      petState.unlockedAnimations = ['idle', 'walk', 'sit', 'nap'];
    }
    
    if (!petState.accessories) {
      petState.accessories = [];
    }
    
    if (!petState.position) {
      petState.position = { x: 100, y: 100 };
    }
    
    if (!petState.currentAnimation) {
      petState.currentAnimation = 'idle';
    }
    
    if (!petState.lastInteraction) {
      petState.lastInteraction = now;
    }
    
    if (!petState.lastSatietyDecrease) {
      petState.lastSatietyDecrease = now;
    }
    
    return petState;
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

  // Analytics data management
  async getAnalyticsData(): Promise<AnalyticsData | null> {
    return this.get<AnalyticsData>(STORAGE_KEYS.ANALYTICS_DATA);
  }

  async setAnalyticsData(data: AnalyticsData): Promise<void> {
    await this.set(STORAGE_KEYS.ANALYTICS_DATA, data);
  }

  // Story management
  async getStories(): Promise<StoryData[]> {
    const stories = await this.get<StoryData[]>(STORAGE_KEYS.STORIES);
    return stories || [];
  }

  async setStories(stories: StoryData[]): Promise<void> {
    await this.set(STORAGE_KEYS.STORIES, stories);
  }

  async addStory(story: StoryData): Promise<void> {
    const stories = await this.getStories();
    stories.unshift(story); // Add to beginning
    // Keep only last 30 stories
    if (stories.length > 30) {
      stories.splice(30);
    }
    await this.setStories(stories);
  }

  async getLatestStory(): Promise<StoryData | null> {
    const stories = await this.getStories();
    return stories.length > 0 ? stories[0] : null;
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
        satiety: 100,
        treats: 5,
        unlockedAnimations: ['idle', 'walk', 'sit', 'nap'],
        accessories: [],
        position: { x: 100, y: 100 },
        currentAnimation: 'idle',
        lastInteraction: Date.now(),
        lastSatietyDecrease: Date.now(),
      };
      await this.setPetState(defaultPetState);
    } else {
      // Ensure existing pets have nap animation unlocked
      if (!petState.unlockedAnimations.includes('nap')) {
        console.log('focusPet: Adding nap animation to existing pet');
        petState.unlockedAnimations.push('nap');
        await this.setPetState(petState);
      }
      
      // Migrate hunger to satiety for existing pets
      if ('hunger' in petState && !('satiety' in petState)) {
        console.log('focusPet: Migrating hunger to satiety for existing pet');
        (petState as any).satiety = 100 - (petState as any).hunger;
        delete (petState as any).hunger;
        await this.setPetState(petState);
      }
      
      // Initialize lastSatietyDecrease for existing pets
      if (!('lastSatietyDecrease' in petState)) {
        console.log('focusPet: Adding lastSatietyDecrease to existing pet');
        petState.lastSatietyDecrease = Date.now();
        await this.setPetState(petState);
      }
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
        analytics: {
          enabled: true,
          trackDomains: true,
          trackFocusTime: true,
          trackPetInteractions: true,
          storyGeneration: true,
          dataRetentionDays: 7,
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