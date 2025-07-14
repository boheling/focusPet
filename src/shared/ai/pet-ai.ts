import { PetType, PetMood } from '../types';

// AI Personality Types
export type AIPersonality = 'playful' | 'wise' | 'curious' | 'loyal' | 'energetic' | 'calm';

// Context for AI responses
export interface AIContext {
  currentTime: number;
  userActivity: 'working' | 'browsing' | 'social' | 'entertainment' | 'idle';
  petStats: {
    happiness: number;
    energy: number;
    satiety: number;
    mood: PetMood;
  };
  recentInteractions: string[];
  focusTime: number;
  treatsEarned: number;
  weather?: string;
  dayOfWeek?: string;
}

// AI Response Types
export type AIResponseType = 
  | 'greeting' 
  | 'encouragement' 
  | 'reminder' 
  | 'celebration' 
  | 'concern' 
  | 'observation' 
  | 'suggestion' 
  | 'joke' 
  | 'weather' 
  | 'time';

export interface AIResponse {
  message: string;
  emotion: 'happy' | 'excited' | 'concerned' | 'proud' | 'curious' | 'playful' | 'calm';
  priority: 'low' | 'medium' | 'high';
  context: AIResponseType;
  shouldAnimate: boolean;
}

export class PetAI {
  private personality: AIPersonality;
  private petType: PetType;
  private memory: {
    userPreferences: string[];
    favoriteActivities: string[];
    commonPhrases: string[];
    lastResponses: AIResponse[];
  };
  private contextHistory: AIContext[];

  constructor(petType: PetType, personality?: AIPersonality) {
    this.petType = petType;
    this.personality = personality || this.generatePersonality(petType);
    this.memory = {
      userPreferences: [],
      favoriteActivities: [],
      commonPhrases: [],
      lastResponses: []
    };
    this.contextHistory = [];
  }

  private generatePersonality(petType: PetType): AIPersonality {
    const personalities: Record<PetType, AIPersonality[]> = {
      cat: ['curious', 'calm', 'playful'],
      dog: ['loyal', 'energetic', 'playful'],
      dragon: ['wise', 'energetic', 'curious'],
      penguin: ['calm', 'loyal', 'curious'],
      bunny: ['playful', 'curious', 'energetic']
    };
    
    const options = personalities[petType] || ['playful'];
    return options[Math.floor(Math.random() * options.length)];
  }

  public generateResponse(context: AIContext): AIResponse {
    // Add context to history
    this.contextHistory.push(context);
    if (this.contextHistory.length > 10) {
      this.contextHistory.shift();
    }

    // Analyze context and generate appropriate response
    const responseType = this.analyzeContext(context);
    const response = this.createResponse(responseType, context);
    
    // Store response in memory
    this.memory.lastResponses.push(response);
    if (this.memory.lastResponses.length > 5) {
      this.memory.lastResponses.shift();
    }

    return response;
  }

  private analyzeContext(context: AIContext): AIResponseType {
    const { petStats, userActivity, focusTime, treatsEarned } = context;
    
    // High priority responses
    if (petStats.happiness < 30) return 'concern';
    if (petStats.satiety < 20) return 'reminder';
    if (treatsEarned > 0) return 'celebration';
    if (focusTime > 120) return 'encouragement';
    
    // Medium priority responses
    if (userActivity === 'idle' && petStats.energy > 70) return 'suggestion';
    if (userActivity === 'working' && petStats.happiness > 80) return 'encouragement';
    if (userActivity === 'entertainment' && petStats.happiness < 60) return 'observation';
    
    // Low priority responses
    if (Math.random() < 0.3) return 'joke';
    if (context.weather) return 'weather';
    if (Math.random() < 0.2) return 'greeting';
    
    return 'observation';
  }

  private createResponse(type: AIResponseType, context: AIContext): AIResponse {
    const responses = this.getResponsesByType(type, context);
    const response = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      message: response,
      emotion: this.getEmotionForType(type, context),
      priority: this.getPriorityForType(type),
      context: type,
      shouldAnimate: this.shouldAnimateForType(type)
    };
  }

  private getResponsesByType(type: AIResponseType, context: AIContext): string[] {
    const { petStats, userActivity, focusTime, treatsEarned } = context;
    
    switch (type) {
      case 'greeting':
        return this.getGreetingResponses();
      
      case 'encouragement':
        return this.getEncouragementResponses(focusTime, userActivity);
      
      case 'reminder':
        return this.getReminderResponses(petStats);
      
      case 'celebration':
        return this.getCelebrationResponses(treatsEarned);
      
      case 'concern':
        return this.getConcernResponses(petStats);
      
      case 'observation':
        return this.getObservationResponses(userActivity, context);
      
      case 'suggestion':
        return this.getSuggestionResponses(userActivity, petStats);
      
      case 'joke':
        return this.getJokeResponses();
      
      case 'weather':
        return this.getWeatherResponses(context.weather!);
      
      case 'time':
        return this.getTimeResponses(context.currentTime);
      
      default:
        return ['I love spending time with you!'];
    }
  }

  private getGreetingResponses(): string[] {
    const responses = {
      cat: [
        "Meow! Good to see you! 😸",
        "Purr... you're back! 🐱",
        "Hello there, human! 💕"
      ],
      dog: [
        "Woof! You're here! 🐕",
        "Wag wag! I missed you! 🐶",
        "Hello! I'm so happy to see you!"
      ],
      dragon: [
        "Rawr! Welcome back! 🐉",
        "My fire burns brighter with you here! 🔥",
        "Greetings, my friend!"
      ],
      penguin: [
        "Waddle! You're back! 🐧",
        "Hello! The weather is nice today! ❄️",
        "Good to see you again!"
      ],
      bunny: [
        "Hop hop! You're here! 🐰",
        "Hello! I was waiting for you! 🥕",
        "Yay! You're back!"
      ]
    };
    
    return responses[this.petType] || responses.cat;
  }

  private getEncouragementResponses(_focusTime: number, _activity: string): string[] {
    const responses = {
      cat: [
        `Purr... good job stayingfocused! 😸`,
        "Meow! You're doing great! 🐱",
        "I'm so proud of your focus! 💕"
      ],
      dog: [
        `Woof! I see you're focused! 🐕`,
        "Wag wag! You're working so hard! 🐶",
        "I believe in you! Keep it up!"
      ],
      dragon: [
        `Rawr! Your focus burns bright! 🔥`,
        "My scales gleam with pride! 🐉",
        "You're unstoppable! Keep going!"
      ],
      penguin: [
        `Waddle! Keep on with your great work! 🐧`,
        "You're making excellent progress! ❄️",
        "I'm impressed by your dedication!"
      ],
      bunny: [
        `Hop hop! You're hopping along! 🐰`,
        "You're doing so well! 🥕",
        "Keep hopping forward! You've got this!"
      ]
    };
    
    return responses[this.petType] || responses.cat;
  }

  private getReminderResponses(_stats: any): string[] {
    const responses = {
      cat: [
        "Meow... I'm getting hungry. Maybe a treat? 😿",
        "Purr... I could use some attention",
        "I'm feeling a bit low. Can we play?"
      ],
      dog: [
        "Woof... I'm hungry! Can I have a treat? 🐕",
        "Wag wag... I need some love!",
        "I'm feeling down. Let's play!"
      ],
      dragon: [
        "Rawr... my fire is dimming. I need fuel! 🐉",
        "My scales are dull. I need attention!",
        "I'm getting weak. Can you help?"
      ],
      penguin: [
        "Waddle... I'm hungry for fish! 🐧",
        "I need some warmth and attention! ❄️",
        "I'm feeling lonely. Can we spend time together?"
      ],
      bunny: [
        "Hop... I'm hungry for carrots! 🐰",
        "I need some love and attention! 🥕",
        "I'm feeling down. Can we play?"
      ]
    };
    
    return responses[this.petType] || responses.cat;
  }

  private getCelebrationResponses(treatsEarned: number): string[] {
    const responses = {
      cat: [
        `Meow! ${treatsEarned} treat${treatsEarned > 1 ? 's' : ''} earned! I'm so happy! 😸`,
        "Purr... treats make everything better! 🐱",
        "I love treats! Thank you for working hard!"
      ],
      dog: [
        `Woof! ${treatsEarned} treat${treatsEarned > 1 ? 's' : ''}! I'm so excited! 🐕`,
        "Wag wag! Treats are the best! 🐶",
        "You earned treats! You're the best!"
      ],
      dragon: [
        `Rawr! ${treatsEarned} treat${treatsEarned > 1 ? 's' : ''}! My fire burns brighter! 🔥`,
        "My scales shine with joy! 🐉",
        "Treats make me stronger! Thank you!"
      ],
      penguin: [
        `Waddle! ${treatsEarned} treat${treatsEarned > 1 ? 's' : ''}! I'm so happy! 🐧`,
        "Fish treats are the best! ❄️",
        "Thank you for the treats! You're amazing!"
      ],
      bunny: [
        `Hop hop! ${treatsEarned} treat${treatsEarned > 1 ? 's' : ''}! I love carrots! 🐰`,
        "Carrots make me so happy! 🥕",
        "Thank you for the treats! You're the best!"
      ]
    };
    
    return responses[this.petType] || responses.cat;
  }

  private getConcernResponses(_stats: any): string[] {
    const responses = {
      cat: [
        "Meow... I'm worried about you. Are you okay? 😿",
        "Purr... I sense you're stressed. Can I help?",
        "I'm here for you. Everything will be okay."
      ],
      dog: [
        "Woof... I'm concerned. Are you alright? 🐕",
        "Wag wag... I want to help you feel better!",
        "I'm here to support you. You're not alone!"
      ],
      dragon: [
        "Rawr... my fire senses your distress. Let me help! 🐉",
        "My scales feel your worry. I'm here for you!",
        "You're strong. I believe in you!"
      ],
      penguin: [
        "Waddle... I'm worried about you. Are you okay? 🐧",
        "I want to help you feel better! ❄️",
        "You're not alone. I'm here for you!"
      ],
      bunny: [
        "Hop... I'm concerned. Are you alright? 🐰",
        "I want to help you feel better! 🥕",
        "You're not alone. I'm here for you!"
      ]
    };
    
    return responses[this.petType] || responses.cat;
  }

  private getObservationResponses(_activity: string, _context: AIContext): string[] {
    const responses = {
      cat: [
        "Meow... I see you're browsing. Interesting! 😺",
        "Purr... I notice you're taking a break. Good idea!",
        "I'm watching you work. You're doing great!"
      ],
      dog: [
        "Woof! I see you're busy! 🐕",
        "Wag wag! I'm watching you work!",
        "You're so focused! I'm proud!"
      ],
      dragon: [
        "Rawr! I observe your activities! 🐉",
        "My scales reflect your energy!",
        "I'm watching your progress!"
      ],
      penguin: [
        "Waddle! I see what you're doing! 🐧",
        "I'm observing your work! ❄️",
        "You're doing great things!"
      ],
      bunny: [
        "Hop! I see you're working! 🐰",
        "I'm watching you hop through tasks! 🥕",
        "You're making great progress!"
      ]
    };
    
    return responses[this.petType] || responses.cat;
  }

  private getSuggestionResponses(_activity: string, _stats: any): string[] {
    const responses = {
      cat: [
        "Meow... maybe we should take a break? 😺",
        "Purr... how about some stretching?",
        "I think you deserve a treat!"
      ],
      dog: [
        "Woof! Let's take a walk! 🐕",
        "Wag wag! How about a break?",
        "I think you need some fun!"
      ],
      dragon: [
        "Rawr! Time for a power break! 🐉",
        "My fire suggests some rest!",
        "How about a quick stretch?"
      ],
      penguin: [
        "Waddle! Let's take a break! 🐧",
        "I suggest some movement! ❄️",
        "How about a quick walk?"
      ],
      bunny: [
        "Hop! Let's take a break! 🐰",
        "I suggest some hopping around! 🥕",
        "How about some exercise?"
      ]
    };
    
    return responses[this.petType] || responses.cat;
  }

  private getJokeResponses(): string[] {
    const responses = {
      cat: [
        "Meow... why did the cat sit on the computer? To keep an eye on the mouse! 😸",
        "Purr... what do cats like to eat on a hot day? Mice cream! 🐱",
        "I'm not kitten around when I say you're great!"
      ],
      dog: [
        "Woof! Why did the dog go to the vet? Because he was feeling ruff! 🐕",
        "Wag wag! What do you call a dog that's a magician? A labracadabrador! 🐶",
        "I'm not barking up the wrong tree when I say you're awesome!"
      ],
      dragon: [
        "Rawr! Why did the dragon go to the doctor? Because he had a burning sensation! 🔥",
        "My scales are so hot, I'm on fire! 🐉",
        "I'm not blowing smoke when I say you're amazing!"
      ],
      penguin: [
        "Waddle! Why did the penguin cross the road? To get to the other slide! 🐧",
        "I'm so cool, I'm ice! ❄️",
        "I'm not sliding around when I say you're great!"
      ],
      bunny: [
        "Hop! Why did the bunny go to the doctor? Because he was feeling hoppy! 🐰",
        "I'm so fast, I'm hopping mad! 🥕",
        "I'm not hopping around when I say you're awesome!"
      ]
    };
    
    return responses[this.petType] || responses.cat;
  }

  private getWeatherResponses(weather: string): string[] {
    const responses = {
      cat: [
        `Meow... it's ${weather} today! Perfect for napping! 😸`,
        `Purr... ${weather} weather is my favorite! 🐱`,
        `I love ${weather} days!`
      ],
      dog: [
        `Woof! ${weather} weather! Let's go outside! 🐕`,
        `Wag wag! I love ${weather} days! 🐶`,
        `${weather} is perfect for playing!`
      ],
      dragon: [
        `Rawr! ${weather} weather! My fire adapts! 🔥`,
        `My scales love ${weather} days! 🐉`,
        `${weather} makes me feel powerful!`
      ],
      penguin: [
        `Waddle! ${weather} weather! My favorite! 🐧`,
        `I love ${weather} days! ❄️`,
        `${weather} is perfect for me!`
      ],
      bunny: [
        `Hop! ${weather} weather! Let's hop around! 🐰`,
        `I love ${weather} days! 🥕`,
        `${weather} is perfect for hopping!`
      ]
    };
    
    return responses[this.petType] || responses.cat;
  }

  private getTimeResponses(currentTime: number): string[] {
    const hour = new Date(currentTime).getHours();
    const responses = {
      cat: [
        `Meow... it's ${hour}:00. Time for a ${hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'} nap! 😸`,
        `Purr... ${hour}:00. Perfect timing! 🐱`,
        `It's ${hour}:00. I'm here for you!`
      ],
      dog: [
        `Woof! It's ${hour}:00! Time for ${hour < 12 ? 'breakfast' : hour < 17 ? 'lunch' : 'dinner'}! 🐕`,
        `Wag wag! ${hour}:00! Let's play! 🐶`,
        `It's ${hour}:00. I'm ready for anything!`
      ],
      dragon: [
        `Rawr! ${hour}:00! My fire burns bright! 🔥`,
        `My scales gleam at ${hour}:00! 🐉`,
        `It's ${hour}:00. I'm ready for adventure!`
      ],
      penguin: [
        `Waddle! It's ${hour}:00! Perfect time! 🐧`,
        `I love ${hour}:00! ❄️`,
        `It's ${hour}:00. I'm here for you!`
      ],
      bunny: [
        `Hop! It's ${hour}:00! Time to hop! 🐰`,
        `I love ${hour}:00! 🥕`,
        `It's ${hour}:00. Let's have fun!`
      ]
    };
    
    return responses[this.petType] || responses.cat;
  }

  private getEmotionForType(type: AIResponseType, context: AIContext): AIResponse['emotion'] {
    switch (type) {
      case 'celebration':
      case 'encouragement':
        return 'excited';
      case 'concern':
        return 'concerned';
      case 'joke':
        return 'playful';
      case 'greeting':
        return 'happy';
      case 'reminder':
        return context.petStats.happiness < 50 ? 'concerned' : 'calm';
      default:
        return 'happy';
    }
  }

  private getPriorityForType(type: AIResponseType): AIResponse['priority'] {
    switch (type) {
      case 'concern':
      case 'reminder':
        return 'high';
      case 'celebration':
      case 'encouragement':
        return 'medium';
      default:
        return 'low';
    }
  }

  private shouldAnimateForType(type: AIResponseType): boolean {
    return ['celebration', 'encouragement', 'joke'].includes(type);
  }

  // Learn from user interactions
  public learnFromInteraction(interaction: string, wasPositive: boolean): void {
    if (wasPositive) {
      this.memory.favoriteActivities.push(interaction);
      if (this.memory.favoriteActivities.length > 10) {
        this.memory.favoriteActivities.shift();
      }
    }
  }

  // Get personality insights
  public getPersonalityInsights(): string {
    return `I'm a ${this.personality} ${this.petType} who loves ${this.memory.favoriteActivities.slice(0, 3).join(', ')}`;
  }

  // Update personality based on interactions
  public updatePersonality(): void {
    const recentResponses = this.memory.lastResponses;
    const happyCount = recentResponses.filter(r => r.emotion === 'happy' || r.emotion === 'excited').length;
    const concernedCount = recentResponses.filter(r => r.emotion === 'concerned').length;
    
    if (concernedCount > happyCount && this.personality !== 'calm') {
      this.personality = 'calm';
    } else if (happyCount > concernedCount * 2 && this.personality !== 'energetic') {
      this.personality = 'energetic';
    }
  }
} 