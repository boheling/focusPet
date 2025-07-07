import { AnalyticsData } from './types';

export interface StoryData {
  title: string;
  content: string;
  summary: string;
  date: string;
  type: 'daily' | 'weekly';
  mood: 'positive' | 'neutral' | 'reflective';
}

export class StoryGenerator {
  private static readonly STORY_TEMPLATES = {
    daily: {
      positive: [
        "Today, my human spent {totalTime} minutes being very focused! I watched them work on {domains}, and they earned {treats} treats! 😸 I noticed they took {breaks} breaks today. That's very responsible! I reminded them about {reminders} important things. My human seemed {mood} today. I tried to keep them company with {interactions} interactions.",
        "Woof! My human was so productive today! They worked for {totalTime} minutes and I gave them {treats} treats! 🐕 I made sure my human took {breaks} good breaks today. I'm such a good helper! 🐶 My human's mood was {mood} today. I wagged my tail {interactions} times to cheer them up!",
        "Rawr! My human was fierce today! They spent {totalTime} minutes conquering {domains} and earned {treats} treats! 🔥 I watched them take {breaks} strategic breaks. My human's mood was {mood} today. I breathed fire {interactions} times to keep them motivated! 🐉"
      ],
      neutral: [
        "Today my human spent {totalTime} minutes exploring {domains}. I gave them {treats} treats for their efforts! I noticed they took {breaks} breaks, which is good for them. I reminded them about {reminders} things. My human seemed {mood} today. I kept them company with {interactions} interactions.",
        "Waddle waddle! My human explored for {totalTime} minutes today. I gave them {treats} treats! 🐧 They took {breaks} breaks, which I think is smart. I reminded them about {reminders} important things. My human's mood was {mood} today. I waddled around {interactions} times to keep them company! ❄️",
        "Hop hop! My human spent {totalTime} minutes browsing today. I gave them {treats} treats for being so curious! 🐰 They took {breaks} nice breaks. I reminded them about {reminders} things. My human seemed {mood} today. I hopped around {interactions} times to make them smile! 🥕"
      ],
      reflective: [
        "Today my human was very quiet and thoughtful. They spent {totalTime} minutes exploring {domains} in a gentle way. I gave them {treats} treats for their patience. They took {breaks} quiet breaks. I reminded them about {reminders} things softly. My human seemed {mood} today. I stayed close with {interactions} gentle interactions.",
        "My human was very peaceful today. They spent {totalTime} minutes exploring {domains} thoughtfully. I gave them {treats} treats for their calm energy. They took {breaks} peaceful breaks. I reminded them about {reminders} things gently. My human's mood was {mood} today. I was very gentle with {interactions} interactions.",
        "Today my human was very introspective. They spent {totalTime} minutes exploring {domains} quietly. I gave them {treats} treats for their wisdom. They took {breaks} thoughtful breaks. I reminded them about {reminders} things quietly. My human seemed {mood} today. I was very respectful with {interactions} interactions."
      ]
    },
    weekly: {
      positive: [
        "This week, my human was absolutely amazing! They spent {totalTime} minutes being super focused and productive! I watched them conquer {domains} and gave them {treats} treats! 😸 They took {breaks} responsible breaks this week. I reminded them about {reminders} important things. My human's mood was {mood} this week. I kept them company with {interactions} interactions!",
        "Woof! This week my human was unstoppable! They worked for {totalTime} minutes and I gave them {treats} treats! 🐕 They took {breaks} great breaks this week. I'm the best helper ever! 🐶 My human's mood was {mood} this week. I wagged my tail {interactions} times to keep them happy!",
        "Rawr! This week my human was legendary! They spent {totalTime} minutes dominating {domains} and earned {treats} treats! 🔥 They took {breaks} strategic breaks this week. My human's mood was {mood} this week. I breathed fire {interactions} times to keep them fierce! 🐉"
      ],
      neutral: [
        "This week my human had a good balance. They spent {totalTime} minutes exploring {domains} and I gave them {treats} treats! They took {breaks} nice breaks this week. I reminded them about {reminders} things. My human's mood was {mood} this week. I kept them company with {interactions} interactions.",
        "Waddle waddle! This week my human explored for {totalTime} minutes. I gave them {treats} treats! 🐧 They took {breaks} good breaks this week. I reminded them about {reminders} important things. My human's mood was {mood} this week. I waddled around {interactions} times! ❄️",
        "Hop hop! This week my human spent {totalTime} minutes being curious. I gave them {treats} treats! 🐰 They took {breaks} thoughtful breaks this week. I reminded them about {reminders} things. My human's mood was {mood} this week. I hopped around {interactions} times! 🥕"
      ],
      reflective: [
        "This week my human was very thoughtful and wise. They spent {totalTime} minutes exploring {domains} in a gentle way. I gave them {treats} treats for their patience. They took {breaks} peaceful breaks this week. I reminded them about {reminders} things softly. My human's mood was {mood} this week. I was very gentle with {interactions} interactions.",
        "This week my human was very calm and centered. They spent {totalTime} minutes exploring {domains} thoughtfully. I gave them {treats} treats for their wisdom. They took {breaks} quiet breaks this week. I reminded them about {reminders} things gently. My human's mood was {mood} this week. I was very respectful with {interactions} interactions.",
        "This week my human was very introspective and wise. They spent {totalTime} minutes exploring {domains} quietly. I gave them {treats} treats for their deep thinking. They took {breaks} thoughtful breaks this week. I reminded them about {reminders} things quietly. My human's mood was {mood} this week. I was very mindful with {interactions} interactions."
      ]
    }
  };

  static generateStory(analytics: AnalyticsData, type: 'daily' | 'weekly'): StoryData {
    const mood = this.determineMood(analytics);
    const templates = this.STORY_TEMPLATES[type][mood];
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    const domains = this.formatDomains(analytics.topDomains);
    const totalTime = this.formatTime(analytics.totalTime);
    
    // Generate realistic pet data
    const treats = Math.max(1, Math.floor(analytics.totalTime / 60)); // 1 treat per hour
    const breaks = Math.max(1, Math.floor(analytics.totalTime / 45)); // 1 break per 45 minutes
    const reminders = Math.max(1, Math.floor(analytics.totalTime / 120)); // 1 reminder per 2 hours
    const interactions = Math.max(5, Math.floor(analytics.totalTime / 10)); // 1 interaction per 10 minutes, min 5
    
    const content = template
      .replace('{domains}', domains)
      .replace('{totalTime}', totalTime)
      .replace('{treats}', treats.toString())
      .replace('{breaks}', breaks.toString())
      .replace('{reminders}', reminders.toString())
      .replace('{interactions}', interactions.toString())
      .replace('{mood}', mood);

    const title = this.generateTitle(type, mood);
    const summary = this.generateSummary(analytics);

    return {
      title,
      content,
      summary,
      date: new Date().toISOString().split('T')[0],
      type,
      mood
    };
  }

  private static determineMood(analytics: AnalyticsData): 'positive' | 'neutral' | 'reflective' {
    const totalTime = analytics.totalTime;
    const hasWork = analytics.activityBreakdown.work > 0;
    const hasResearch = analytics.activityBreakdown.research > 0;
    
    // Positive: When my human is engaged and growing - I can feel their energy!
    if (totalTime > 60 && (hasWork || hasResearch)) {
      return 'positive';
    } 
    // Reflective: When my human is taking time to be quiet and thoughtful - I love watching them think
    else if (totalTime < 45 || (totalTime < 90 && !hasWork && !hasResearch)) {
      return 'reflective';
    } 
    // Neutral: When my human is just being themselves - perfect as they are
    else {
      return 'neutral';
    }
  }

  private static formatDomains(domains: string[]): string {
    if (domains.length === 0) return 'various websites';
    if (domains.length === 1) return domains[0];
    if (domains.length === 2) return `${domains[0]} and ${domains[1]}`;
    return `${domains.slice(0, -1).join(', ')}, and ${domains[domains.length - 1]}`;
  }

  private static formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? '' : 's'}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours === 1 ? '' : 's'}`;
    }
    return `${hours} hour${hours === 1 ? '' : 's'} and ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}`;
  }

  private static generateTitle(type: 'daily' | 'weekly', mood: string): string {
    const timeFrame = type === 'daily' ? 'Today' : 'This Week';
    
    if (mood === 'positive') {
      return `${timeFrame} My Human Was Amazing!`;
    } else if (mood === 'reflective') {
      return `${timeFrame} My Human Was Very Thoughtful`;
    } else {
      return `${timeFrame} I Had a Nice Day With My Human`;
    }
  }

  private static generateSummary(analytics: AnalyticsData): string {
    const totalTime = analytics.totalTime;
    
    if (totalTime < 30) {
      return "My human was very quiet and thoughtful today. I stayed close to keep them company.";
    } else if (totalTime < 90) {
      return "My human had a balanced day of exploration. I was happy to be their companion.";
    } else {
      return "My human was very productive today! I'm so proud of them and gave them lots of treats.";
    }
  }
} 