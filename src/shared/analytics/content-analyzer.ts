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
  private isInitialized: boolean = false;
  private periodicTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log('focusPet: Initializing content analyzer...');
      
      // Load settings
      const settings = await storageManager.getUserSettings();
      this.isEnabled = settings?.analytics?.enabled ?? true;
      
      console.log('focusPet: Analytics enabled:', this.isEnabled);
      
      // Load existing activity log
      await this.loadActivityLog();
      
      // Start tracking if enabled
      if (this.isEnabled) {
        this.startTracking();
      }
      
      this.isInitialized = true;
      console.log('focusPet: Content analyzer initialized successfully');
    } catch (error) {
      console.error('focusPet: Error initializing content analyzer:', error);
      // Continue with basic functionality even if initialization fails
      this.isEnabled = false;
    }
  }

  private async loadActivityLog(): Promise<void> {
    try {
      const stored = await storageManager.getAnalyticsData();
      this.activityLog = stored?.activityLog || [];
      console.log('focusPet: Loaded', this.activityLog.length, 'activity records');
    } catch (error) {
      console.log('focusPet: No existing analytics data found, starting fresh');
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
    try {
      console.log('focusPet: Starting tab tracking...');
      
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

      // Initialize tracking for existing tabs
      this.initializeExistingTabs();

      // Periodic activity logging - use setInterval directly, not window.setInterval
      console.log('focusPet: Setting up periodic timer...');
      this.periodicTimer = setInterval(() => {
        console.log('focusPet: Periodic timer fired, calling logCurrentActivity...');
        this.logCurrentActivity();
      }, 60000); // Log every minute
      
      console.log('focusPet: Tab tracking started successfully, periodic timer ID:', this.periodicTimer);
    } catch (error) {
      console.error('focusPet: Error starting tab tracking:', error);
    }
  }

  private async initializeExistingTabs(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id && tab.url && this.isValidUrl(tab.url)) {
          await this.handleTabUpdate(tab.id, tab);
        }
      }
      console.log('focusPet: Initialized tracking for existing tabs');
    } catch (error) {
      console.error('focusPet: Error initializing existing tabs:', error);
    }
  }

  public async handleTabUpdate(tabId: number, tab: chrome.tabs.Tab): Promise<void> {
    if (!tab.url || !this.isValidUrl(tab.url)) {
      console.log(`focusPet: Tab ${tabId} has invalid URL: ${tab.url}`);
      return;
    }

    const domain = this.extractDomain(tab.url);
    const activityType = this.categorizeDomain(domain);

    // Check if we already have a timer for this tab
    const existingTimer = this.tabTimers.get(tabId);
    console.log(`focusPet: Tab ${tabId} update - domain: ${domain}, existing timer:`, existingTimer);
    
    // Only start a new timer if:
    // 1. No existing timer for this tab, OR
    // 2. Domain has changed (user navigated to a different website)
    if (!existingTimer || existingTimer.domain !== domain) {
      // If domain changed, log the previous activity first
      if (existingTimer && existingTimer.domain !== domain) {
        const timeSpent = Math.floor((Date.now() - existingTimer.startTime) / 1000); // seconds
        const timeInMinutes = Math.ceil(timeSpent / 60);
        if (timeSpent > 30) {
          console.log(`focusPet: Domain changed from ${existingTimer.domain} to ${domain}, logging ${timeInMinutes} minutes`);
          await this.logActivity(existingTimer.domain, timeInMinutes);
        }
      }
      
      // Start new timer for this tab/domain
      const startTime = Date.now();
      this.tabTimers.set(tabId, {
        startTime,
        domain
      });

      console.log(`focusPet: Started tracking tab ${tabId} on ${domain} (${activityType}) at ${new Date(startTime).toISOString()}`);
      console.log(`focusPet: Total timers now: ${this.tabTimers.size}`);
    } else {
      console.log(`focusPet: Tab ${tabId} same domain (${domain}), continuing existing timer`);
    }
    // If same domain, don't restart the timer - just continue tracking
  }

  public async handleTabActivation(tabId: number): Promise<void> {
    try {
      // Do NOT reset timer here. Only reset after logging activity.
      // const timer = this.tabTimers.get(tabId);
      // if (timer) {
      //   timer.startTime = Date.now();
      //   console.log(`focusPet: Tab ${tabId} activated, reset timer`);
      // }
      // Optionally, log which tab is now active for debugging
      console.log(`focusPet: Tab ${tabId} activated`);
    } catch (error) {
      console.error('focusPet: Error handling tab activation:', error);
    }
  }

  public async handleTabRemoval(tabId: number): Promise<void> {
    try {
      // Log final activity for this tab
      const timer = this.tabTimers.get(tabId);
      if (timer) {
        const timeSpent = Math.floor((Date.now() - timer.startTime) / 1000); // seconds
        const timeInMinutes = Math.ceil(timeSpent / 60);
        if (timeSpent > 30) {
          await this.logActivity(timer.domain, timeInMinutes);
          console.log(`focusPet: Tab ${tabId} to be removed, logged ${timeInMinutes} minutes`);
        }
        this.tabTimers.delete(tabId);
        console.log(`focusPet: Tab ${tabId} removed`);
      }
    } catch (error) {
      console.error('focusPet: Error handling tab removal:', error);
    }
  }

  private async logCurrentActivity(): Promise<void> {
    try {
      const now = Date.now();
      console.log(`focusPet: logCurrentActivity called at ${new Date(now).toISOString()}, checking active tabs...`);
      
      const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('focusPet: Active tabs found:', activeTabs.length);
      
      if (!activeTabs || activeTabs.length === 0) {
        console.log('focusPet: No active window/tab, logging final activity for all timers and clearing them');
        // Log final activity for all active timers since user is away
        for (const [, timer] of this.tabTimers.entries()) {
          const timeSpent = Math.ceil((now - timer.startTime) / 1000); // seconds
          const timeInMinutes = Math.ceil(timeSpent / 60);
          if (timeSpent > 30) { // At least 30 seconds
            console.log(`focusPet: User away - logging final activity for ${timer.domain}: ${timeInMinutes} minutes`);
            await this.logActivity(timer.domain, timeInMinutes);
          }
        }
        // Clear all timers since user is away
        this.tabTimers.clear();
        console.log('focusPet: All timers cleared due to user inactivity');
        return;
      }
      
      for (const tab of activeTabs) {
        console.log(`focusPet: Checking tab ${tab.id}, URL: ${tab.url}`);
        
        if (tab.id && tab.url && this.isValidUrl(tab.url)) {
          const timer = this.tabTimers.get(tab.id);
          console.log(`focusPet: Timer for tab ${tab.id}:`, timer);
          
          if (timer) {
            const timeSpent = Math.ceil((now - timer.startTime) / 1000); // 1-s intervals
          
            const actualTimeSpentMs = now - timer.startTime;
            console.log(`focusPet: Current time: ${new Date(now).toISOString()}`);
            console.log(`focusPet: Timer start time: ${new Date(timer.startTime).toISOString()}`);
            console.log(`focusPet: Actual time spent (ms): ${actualTimeSpentMs}`);
            console.log(`focusPet: Time spent on ${timer.domain}: ${timeSpent} seconds`);
            const timeInMinutes = Math.ceil(timeSpent / 60);
                         if (timeSpent >= 30) { // Log if at least 30 seconds spent
               console.log(`focusPet: Logging activity for ${timer.domain} (${timeInMinutes} minutes)`);
               await this.logActivity(timer.domain, timeInMinutes); // Pass time in minutes
              timer.startTime = now; // Reset timer to current time
              console.log(`focusPet: Timer reset for tab ${tab.id} to ${new Date(timer.startTime).toISOString()}`);
            } else {
              console.log(`focusPet: Not enough time spent (${timeSpent} seconds), skipping log`);
            }
          } else {
            console.log(`focusPet: No timer found for tab ${tab.id}`);
          }
        } else {
          console.log(`focusPet: Tab ${tab.id} has invalid URL or no ID`);
        }
      }
      
      console.log(`focusPet: Total timers active: ${this.tabTimers.size}`);
      console.log('focusPet: Timer keys:', Array.from(this.tabTimers.keys()));
    } catch (error) {
      console.warn('focusPet: Could not log activity (no active window/tab).', error);
    }
  }

  private async logActivity(domain: string, timeSpent: number): Promise<void> {
    try {
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
    } catch (error) {
      console.error('focusPet: Error logging activity:', error);
    }
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
    if (domain.includes('atlassian.net') || domain.includes('sironagenomics.com')) return 'work';
    
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

      // Convert seconds to minutes for summary
      const totalTime = recentActivities.reduce((sum, activity) => sum + Math.ceil(activity.timeSpent / 60), 0);
      
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
        // Convert seconds to minutes for breakdown
        const timeInMinutes = Math.ceil(activity.timeSpent / 60);
        activityBreakdown[activity.activityType] += timeInMinutes;
        domainCounts[activity.domain] = (domainCounts[activity.domain] || 0) + timeInMinutes;
      });

      const topDomains = Object.entries(domainCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([domain]) => domain);

      console.log('focusPet: Activity summary generated:', {
        totalTime,
        activityBreakdown,
        topDomains,
        recentActivitiesCount: recentActivities.length
      });

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
    console.log('focusPet: Activity log cleared');
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (enabled && !this.isInitialized) {
      this.initialize();
    }
  }

  public getStatus(): { enabled: boolean; initialized: boolean; trackingTabs: number } {
    return {
      enabled: this.isEnabled,
      initialized: this.isInitialized,
      trackingTabs: this.tabTimers.size
    };
  }

  public destroy(): void {
    // Clear timers
    this.tabTimers.clear();
    
    // Clear periodic timer
    if (this.periodicTimer) {
      clearInterval(this.periodicTimer);
      this.periodicTimer = null;
    }
    
    console.log('focusPet: Content analyzer destroyed');
  }
}

// Export singleton instance
export const contentAnalyzer = new ContentAnalyzer(); 