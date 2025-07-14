// Pet Types and Behaviors
export type PetType = 'cat' | 'dog' | 'dragon' | 'penguin' | 'bunny';

export type PetMood = 'happy' | 'content' | 'bored' | 'neglected';

export type PetAnimation = 'idle' | 'walk' | 'sit' | 'nap' | 'play' | 'excited' | 'worried' | 'sad';

export interface PetState {
  type: PetType;
  name: string;
  mood: PetMood;
  happiness: number; // 0-100
  energy: number; // 0-100
  satiety: number; // 0-100 (100 = full/satisfied)
  treats: number;
  unlockedAnimations: PetAnimation[];
  accessories: string[];
  position: Position;
  currentAnimation: PetAnimation;
  lastInteraction: number;
  lastSatietyDecrease?: number; // timestamp of last satiety decrease
}

export interface Position {
  x: number;
  y: number;
}

// Reminder System
export type ReminderType = 'pomodoro' | 'posture' | 'water' | 'eye-rest' | 'custom' | 'test';

export type ReminderFrequency = 'once' | 'daily' | 'weekly' | 'hourly' | 'custom';

export interface Reminder {
  id: string;
  title: string;
  message: string;
  type: ReminderType;
  frequency: ReminderFrequency;
  interval?: number; // minutes
  nextTrigger: number;
  isActive: boolean;
  soundEnabled: boolean;
  visualEnabled: boolean;
  createdAt: number;
}

// Settings and Configuration
export interface UserSettings {
  petType: PetType;
  petName: string;
  soundEnabled: boolean;
  visualEffectsEnabled: boolean;
  petPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  reminderDefaults: {
    soundEnabled: boolean;
    visualEnabled: boolean;
    systemNotifications: boolean; // Show notifications even when Chrome is not focused
  };
  focusTracking: {
    enabled: boolean;
    trackingInterval: number; // minutes
    treatRewardInterval: number; // minutes
  };
  analytics: {
    enabled: boolean;
    trackDomains: boolean;
    trackFocusTime: boolean;
    trackPetInteractions: boolean;
    storyGeneration: boolean;
    dataRetentionDays: number;
  };
  theme: 'light' | 'dark' | 'auto';
}

// Focus Tracking
export interface FocusSession {
  id: string;
  startTime: number;
  endTime?: number;
  duration: number; // minutes
  website: string;
  isActive: boolean;
}

export interface FocusStats {
  totalFocusTime: number; // minutes
  currentStreak: number; // days
  longestStreak: number; // days
  treatsEarned: number;
  achievements: Achievement[];
  lastTreatTime?: number; // timestamp (ms) of last treat reward
}

// Analytics Types
export type ActivityType = 'work' | 'research' | 'social' | 'entertainment' | 'shopping' | 'general';
export type FocusLevel = 'high' | 'medium' | 'low';

export interface BrowsingActivity {
  domain: string;
  pageTitle: string;
  timeSpent: number; // minutes
  focusLevel: FocusLevel;
  activityType: ActivityType;
  timestamp: number;
  tabId?: number;
}

export interface BedtimeStory {
  date: string;
  title: string;
  content: string;
  mood: string;
  stats: {
    focusTime: number;
    treatsEarned: number;
    breaksTaken: number;
    petInteractions: number;
  };
  highlights: string[];
  recommendations: string[];
}

export interface AnalyticsSettings {
  enabled: boolean;
  trackDomains: boolean;
  trackFocusTime: boolean;
  trackPetInteractions: boolean;
  storyGeneration: boolean;
  dataRetentionDays: number;
}

// Analytics Data
export interface AnalyticsData {
  activityLog: BrowsingActivity[];
  lastUpdated: number;
  dailyStories: BedtimeStory[];
  settings: AnalyticsSettings;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

// Animation and Visual
export interface AnimationFrame {
  x: number;
  y: number;
  width: number;
  height: number;
  duration: number; // ms
}

export interface PetSprite {
  type: PetType;
  animations: Record<PetAnimation, AnimationFrame[]>;
  spritesheet: string;
}

// Storage Keys
export const STORAGE_KEYS = {
  PET_STATE: 'focusPet_petState',
  USER_SETTINGS: 'focusPet_userSettings',
  REMINDERS: 'focusPet_reminders',
  FOCUS_STATS: 'focusPet_focusStats',
  FOCUS_SESSIONS: 'focusPet_focusSessions',
  ANALYTICS_DATA: 'focusPet_analyticsData',
  STORIES: 'focusPet_stories',
} as const;

// Events
export type ExtensionEvent = 
  | 'pet:stateChanged'
  | 'pet:animationChanged'
  | 'reminder:triggered'
  | 'reminder:created'
  | 'reminder:updated'
  | 'reminder:deleted'
  | 'focus:sessionStarted'
  | 'focus:sessionEnded'
  | 'focus:treatEarned'
  | 'achievement:unlocked'
  | 'settings:updated';

export interface ExtensionEventData {
  'pet:stateChanged': { petState: PetState };
  'pet:animationChanged': { animation: PetAnimation; petType: PetType };
  'reminder:triggered': { reminder: Reminder };
  'reminder:created': { reminder: Reminder };
  'reminder:updated': { reminder: Reminder };
  'reminder:deleted': { reminderId: string };
  'focus:sessionStarted': { session: FocusSession };
  'focus:sessionEnded': { session: FocusSession };
  'focus:treatEarned': { treats: number; reason: string };
  'achievement:unlocked': { achievement: Achievement };
  'settings:updated': { settings: UserSettings };
} 