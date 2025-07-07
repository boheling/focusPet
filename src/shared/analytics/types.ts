// Analytics and Story Generation Types

export type ActivityType = 'work' | 'research' | 'social' | 'entertainment' | 'shopping' | 'general';

export type FocusLevel = 'high' | 'medium' | 'low';

export interface AnalyticsData {
  totalTime: number;
  activityBreakdown: Record<ActivityType, number>;
  topDomains: string[];
}

export interface BrowsingActivity {
  domain: string;
  pageTitle: string;
  timeSpent: number; // minutes
  focusLevel: FocusLevel;
  activityType: ActivityType;
  timestamp: number;
  tabId?: number;
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  petType: string;
  totalFocusTime: number; // minutes
  treatsEarned: number;
  breaksTaken: number;
  remindersTriggered: number;
  petInteractions: number;
  petMood: string;
  topDomains: string[];
  activityBreakdown: {
    work: number;
    social: number;
    entertainment: number;
    general: number;
  };
  focusSessions: FocusSession[];
}

export interface FocusSession {
  startTime: number;
  endTime: number;
  duration: number; // minutes
  domain: string;
  activityType: ActivityType;
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

export interface StoryTemplate {
  focusStory: string;
  breakStory: string;
  moodStory: string;
  achievementStory: string;
  recommendationStory: string;
}

export interface AnalyticsSettings {
  enabled: boolean;
  trackDomains: boolean;
  trackFocusTime: boolean;
  trackPetInteractions: boolean;
  storyGeneration: boolean;
  dataRetentionDays: number;
}

// Domain categorization mappings
export const DOMAIN_CATEGORIES: Record<string, ActivityType> = {
  // Work/Productivity
  'github.com': 'work',
  'stackoverflow.com': 'work',
  'docs.google.com': 'work',
  'drive.google.com': 'work',
  'calendar.google.com': 'work',
  'mail.google.com': 'work',
  'gmail.com': 'work',
  'outlook.com': 'work',
  'office.com': 'work',
  'microsoft.com': 'work',
  'notion.so': 'work',
  'figma.com': 'work',
  'slack.com': 'work',
  'discord.com': 'work',
  'zoom.us': 'work',
  'teams.microsoft.com': 'work',
  'meet.google.com': 'work',
  
  // Social Media
  'twitter.com': 'social',
  'x.com': 'social',
  'linkedin.com': 'social',
  'facebook.com': 'social',
  'instagram.com': 'social',
  'reddit.com': 'social',
  'tiktok.com': 'social',
  'snapchat.com': 'social',
  
  // Entertainment
  'youtube.com': 'entertainment',
  'netflix.com': 'entertainment',
  'spotify.com': 'entertainment',
  'twitch.tv': 'entertainment',
  'disneyplus.com': 'entertainment',
  'hulu.com': 'entertainment',
  'steam.com': 'entertainment',
  'roblox.com': 'entertainment',
  
  // Shopping
  'amazon.com': 'shopping',
  'ebay.com': 'shopping',
  'etsy.com': 'shopping',
  'walmart.com': 'shopping',
  'target.com': 'shopping',
  'bestbuy.com': 'shopping',
  
  // Research/Education
  'wikipedia.org': 'research',
  'medium.com': 'research',
  'dev.to': 'research',
  'css-tricks.com': 'research',
  'mdn.io': 'research',
  'developer.mozilla.org': 'research',
  'coursera.org': 'research',
  'udemy.com': 'research',
  'khanacademy.org': 'research',
  'edx.org': 'research',
};

// Focus level estimation based on domains
export const FOCUS_LEVELS: Record<ActivityType, FocusLevel> = {
  work: 'high',
  research: 'high',
  social: 'medium',
  entertainment: 'low',
  shopping: 'medium',
  general: 'medium',
}; 