import { BrowsingActivity, ActivityType, FocusLevel } from '../types';
import { storageManager } from '../storage';

// Domain categorization mappings
const DOMAIN_CATEGORIES: Record<string, ActivityType> = {
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
const FOCUS_LEVELS: Record<ActivityType, FocusLevel> = {
  work: 'high',
  research: 'high',
  social: 'medium',
  entertainment: 'low',
  shopping: 'medium',
  general: 'medium',
};

export class ContentAnalyzer {
  private activityLog: BrowsingActivity[] = [];
  private tabTimers: Map<number, { startTime: number; domain: string }> = new Map();
  private isEnabled: boolean = true;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Load settings
    const settings = await storageManager.getUserSettings();
    this.isEnabled = settings?.analytics?.enabled ?? true;
    
    // Load existing activity log
    await this.loadActivityLog();
    
    // Start tracking
    if (this.isEnabled) {
      this.startTracking();
    }
  }

  private async loadActivityLog(): Promise<void> {
    try {
      const stored = await storageManager.getAnalyticsData();
      this.activityLog = stored?.activityLog || [];
    } catch (error) {
      console.log('focusPet: No existing analytics data found');
      this.activityLog = [];
    }
  }

  private async saveActivityLog(): Promise<void> {
    try {
          await storageManager.setAnalyticsData({
      activityLog: this.activityLog,
      lastUpdated: Date.now(),
      dailyStories: [],
      settings: {
        enabled: true,
        trackDomains: true,
        trackFocusTime: true,
        trackPetInteractions: true,
        storyGeneration: true,
        dataRetentionDays: 7,
      }
    });
    } catch (error) {
      console.error('focusPet: Failed to save analytics data:', error);
    }
  }

  private startTracking(): void {
    // Track tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.handleTabUpdate(tabId, tab);
      }
    });

    // Track tab activation
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivation(activeInfo.tabId);
    });

    // Track tab removal
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.handleTabRemoval(tabId);
    });

    // Periodic activity logging
    setInterval(() => {
      this.logCurrentActivity();
    }, 60000); // Log every minute
  }

  private async handleTabUpdate(tabId: number, tab: chrome.tabs.Tab): Promise<void> {
    if (!tab.url || !this.isValidUrl(tab.url)) return;

    const domain = this.extractDomain(tab.url);
    const activityType = this.categorizeDomain(domain);

    // Start timer for this tab
    this.tabTimers.set(tabId, {
      startTime: Date.now(),
      domain
    });

    console.log(`focusPet: Started tracking tab ${tabId} on ${domain} (${activityType})`);
  }

  private async handleTabActivation(tabId: number): Promise<void> {
    // Update active tab timer
    const timer = this.tabTimers.get(tabId);
    if (timer) {
      timer.startTime = Date.now();
    }
  }

  private async handleTabRemoval(tabId: number): Promise<void> {
    // Log final activity for this tab
    const timer = this.tabTimers.get(tabId);
    if (timer) {
      const timeSpent = Math.floor((Date.now() - timer.startTime) / 60000); // minutes
      if (timeSpent > 0) {
        await this.logActivity(timer.domain, timeSpent);
      }
      this.tabTimers.delete(tabId);
    }
  }

  private async logCurrentActivity(): Promise<void> {
    try {
      const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTabs || activeTabs.length === 0) {
        // No active window/tab, skip logging
        return;
      }
      
      for (const tab of activeTabs) {
        if (tab.id && tab.url && this.isValidUrl(tab.url)) {
          const timer = this.tabTimers.get(tab.id);
          if (timer) {
            const timeSpent = Math.floor((Date.now() - timer.startTime) / 60000); // minutes
            if (timeSpent >= 1) { // Log if at least 1 minute spent
              await this.logActivity(timer.domain, timeSpent);
              timer.startTime = Date.now(); // Reset timer
            }
          }
        }
      }
    } catch (error) {
      console.warn('focusPet: Could not log activity (no active window/tab).', error);
    }
  }

  private async logActivity(domain: string, timeSpent: number): Promise<void> {
    const activityType = this.categorizeDomain(domain);
    const focusLevel = this.estimateFocusLevel(activityType);

    const activity: BrowsingActivity = {
      domain,
      pageTitle: '', // We don't store page titles for privacy
      timeSpent,
      focusLevel,
      activityType,
      timestamp: Date.now()
    };

    this.activityLog.push(activity);
    
    // Keep only last 7 days of data
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    this.activityLog = this.activityLog.filter(activity => activity.timestamp > sevenDaysAgo);

    await this.saveActivityLog();
    
    console.log(`focusPet: Logged activity - ${domain} (${activityType}) for ${timeSpent} minutes`);
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return 'unknown';
    }
  }

  private categorizeDomain(domain: string): ActivityType {
    // Check exact domain match first
    if (DOMAIN_CATEGORIES[domain]) {
      return DOMAIN_CATEGORIES[domain];
    }

    // Check partial domain matches
    for (const [knownDomain, category] of Object.entries(DOMAIN_CATEGORIES)) {
      if (domain.includes(knownDomain) || knownDomain.includes(domain)) {
        return category;
      }
    }

    // Default categorization based on domain patterns
    if (domain.includes('github') || domain.includes('gitlab')) return 'work';
    if (domain.includes('stackoverflow') || domain.includes('stackexchange')) return 'work';
    if (domain.includes('google.com') || domain.includes('gmail')) return 'work';
    if (domain.includes('microsoft.com') || domain.includes('office.com')) return 'work';
    if (domain.includes('slack.com') || domain.includes('discord.com')) return 'work';
    if (domain.includes('zoom.us') || domain.includes('teams')) return 'work';
    
    if (domain.includes('twitter') || domain.includes('x.com')) return 'social';
    if (domain.includes('linkedin') || domain.includes('facebook')) return 'social';
    if (domain.includes('instagram') || domain.includes('reddit')) return 'social';
    
    if (domain.includes('youtube') || domain.includes('netflix')) return 'entertainment';
    if (domain.includes('spotify') || domain.includes('twitch')) return 'entertainment';
    
    if (domain.includes('amazon') || domain.includes('ebay')) return 'shopping';
    if (domain.includes('walmart') || domain.includes('target')) return 'shopping';
    
    if (domain.includes('wikipedia') || domain.includes('medium')) return 'research';
    if (domain.includes('coursera') || domain.includes('udemy')) return 'research';

    return 'general';
  }

  private estimateFocusLevel(activityType: ActivityType): FocusLevel {
    return FOCUS_LEVELS[activityType] || 'medium';
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  // Public methods for data access
  public async getDailyActivity(date: string): Promise<BrowsingActivity[]> {
    const startOfDay = new Date(date).getTime();
    const endOfDay = startOfDay + (24 * 60 * 60 * 1000);
    
    return this.activityLog.filter(activity => 
      activity.timestamp >= startOfDay && activity.timestamp < endOfDay
    );
  }

  public async getActivitySummary(days: number = 7): Promise<{
    totalTime: number;
    activityBreakdown: Record<ActivityType, number>;
    topDomains: string[];
  }> {
    try {
      const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
      const recentActivities = this.activityLog.filter(activity => activity.timestamp > cutoffTime);

      const totalTime = recentActivities.reduce((sum, activity) => sum + activity.timeSpent, 0);
      
      const activityBreakdown: Record<ActivityType, number> = {
        work: 0,
        research: 0,
        social: 0,
        entertainment: 0,
        shopping: 0,
        general: 0
      };

      const domainCounts: Record<string, number> = {};

      recentActivities.forEach(activity => {
        activityBreakdown[activity.activityType] += activity.timeSpent;
        domainCounts[activity.domain] = (domainCounts[activity.domain] || 0) + activity.timeSpent;
      });

      const topDomains = Object.entries(domainCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([domain]) => domain);

      return {
        totalTime,
        activityBreakdown,
        topDomains
      };
    } catch (error) {
      console.warn('focusPet: Error getting activity summary:', error);
      return {
        totalTime: 0,
        activityBreakdown: {
          work: 0,
          research: 0,
          social: 0,
          entertainment: 0,
          shopping: 0,
          general: 0
        },
        topDomains: []
      };
    }
  }

  public async clearActivityLog(): Promise<void> {
    this.activityLog = [];
    await this.saveActivityLog();
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (enabled && this.activityLog.length === 0) {
      this.startTracking();
    }
  }

  public destroy(): void {
    // Clear timers
    this.tabTimers.clear();
  }
}

// Export singleton instance
export const contentAnalyzer = new ContentAnalyzer(); 