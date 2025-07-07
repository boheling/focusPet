import { PetState, PetAnimation, Position } from '../types';
import { storageManager } from '../storage';

// Conversation responses for different pet types and situations
const PET_RESPONSES = {
  cat: {
    happy: [
      "Purrrr... I'm so happy! 😸",
      "Meow! Life is good! 🐱",
      "I love spending time with you! 💕"
    ],
    content: [
      "Meow... I'm doing okay 😺",
      "Purr... I could use some attention",
      "I'm here if you need me"
    ],
    bored: [
      "Meow... I'm bored 😿",
      "I wish you'd play with me more",
      "Yawn... nothing to do"
    ],
    neglected: [
      "Meow... I miss you 😢",
      "I'm feeling lonely",
      "Please come back soon"
    ],
    interactions: {
      pet: [
        "Purrrr! That feels so good! 😸",
        "Meow! I love your attention! 🐱",
        "More pets please! 💕"
      ],
      feed: [
        "Meow! Thank you for the treat! 😸",
        "Purr... this is delicious! 🐱",
        "I love treats! Can I have more?"
      ],
      wake: [
        "Meow! I was having such a nice nap! 😺",
        "Purr... I'm awake now! 🐱",
        "Good morning! I'm ready to play!"
      ],
      nap: [
        "Zzz... so sleepy... 😴",
        "Meow... time for a nap...",
        "Purr... I'm going to rest now"
      ]
    }
  },
  dog: {
    happy: [
      "Woof! I'm so excited! 🐕",
      "Wag wag! I love you! 🐶",
      "I'm the happiest dog ever! 💕"
    ],
    content: [
      "Woof! I'm doing good! 🐕",
      "Wag wag! I'm here for you! 🐶",
      "I'm ready for anything!"
    ],
    bored: [
      "Woof... I'm bored 🐕",
      "I want to play! Please?",
      "Can we go for a walk?"
    ],
    neglected: [
      "Woof... I miss you 🐕",
      "I'm lonely without you",
      "Please come back soon"
    ],
    interactions: {
      pet: [
        "Woof! I love pets! 🐕",
        "Wag wag! More please! 🐶",
        "You're the best! I love you!"
      ],
      feed: [
        "Woof! Thank you for the treat! 🐕",
        "Wag wag! This is so good! 🐶",
        "I love treats! You're the best!"
      ],
      wake: [
        "Woof! I'm awake and ready! 🐕",
        "Wag wag! Let's play! 🐶",
        "Good morning! I'm so excited!"
      ],
      nap: [
        "Zzz... so tired... 🐕",
        "Woof... time to rest...",
        "I'm going to sleep now"
      ]
    }
  },
  dragon: {
    happy: [
      "Rawr! I'm feeling powerful! 🐉",
      "I'm the mightiest dragon! 🔥",
      "My scales are gleaming with joy! ✨"
    ],
    content: [
      "Rawr... I'm content 🐉",
      "My fire burns steady 🔥",
      "I'm ready for adventure"
    ],
    bored: [
      "Rawr... I'm bored 🐉",
      "I need some excitement!",
      "Let's go on an adventure!"
    ],
    neglected: [
      "Rawr... I miss you 🐉",
      "My fire is dimming",
      "Please return to me"
    ],
    interactions: {
      pet: [
        "Rawr! Your touch is warm! 🐉",
        "I love your attention! 🔥",
        "You make my scales shine!"
      ],
      feed: [
        "Rawr! Delicious treat! 🐉",
        "My fire burns brighter! 🔥",
        "I feel stronger now!"
      ],
      wake: [
        "Rawr! I'm awake and fierce! 🐉",
        "My fire is ready! 🔥",
        "Let's conquer the day!"
      ],
      nap: [
        "Rawr... time to rest... 🐉",
        "My fire dims for sleep...",
        "I'll dream of treasure"
      ]
    }
  },
  penguin: {
    happy: [
      "Waddle waddle! I'm so happy! 🐧",
      "I love the cold and you! ❄️",
      "I'm the happiest penguin! 🐧"
    ],
    content: [
      "Waddle... I'm doing okay 🐧",
      "The weather is nice today ❄️",
      "I'm ready for fish!"
    ],
    bored: [
      "Waddle... I'm bored 🐧",
      "I want to slide on ice!",
      "Can we go swimming?"
    ],
    neglected: [
      "Waddle... I miss you 🐧",
      "I'm lonely without you",
      "Please come back soon"
    ],
    interactions: {
      pet: [
        "Waddle! I love pets! 🐧",
        "You're so warm! ❄️",
        "More pets please!"
      ],
      feed: [
        "Waddle! Thank you for the fish! 🐧",
        "This is delicious! ❄️",
        "I love treats! More fish!"
      ],
      wake: [
        "Waddle! I'm awake! 🐧",
        "Ready for a new day! ❄️",
        "Let's go swimming!"
      ],
      nap: [
        "Waddle... time to rest... 🐧",
        "I'm going to sleep now",
        "Dreaming of fish..."
      ]
    }
  },
  bunny: {
    happy: [
      "Hop hop! I'm so happy! 🐰",
      "I love carrots and you! 🥕",
      "I'm the bounciest bunny! 🐰"
    ],
    content: [
      "Hop... I'm doing okay 🐰",
      "I could use a carrot 🥕",
      "I'm ready to hop around!"
    ],
    bored: [
      "Hop... I'm bored 🐰",
      "I want to hop and play!",
      "Can I have a carrot?"
    ],
    neglected: [
      "Hop... I miss you 🐰",
      "I'm lonely without you",
      "Please come back soon"
    ],
    interactions: {
      pet: [
        "Hop! I love pets! 🐰",
        "You're so gentle! 🥕",
        "More pets please!"
      ],
      feed: [
        "Hop! Thank you for the treat! 🐰",
        "This is delicious! 🥕",
        "I love treats! More carrots!"
      ],
      wake: [
        "Hop! I'm awake! 🐰",
        "Ready to hop around! 🥕",
        "Let's go exploring!"
      ],
      nap: [
        "Hop... time to rest... 🐰",
        "I'm going to sleep now",
        "Dreaming of carrots..."
      ]
    }
  }
};

export class PetEngine {
  private petState: PetState;
  private animationTimer: number | null = null;
  private behaviorTimer: number | null = null;
  private mousePosition: Position = { x: 0, y: 0 };
  private lastSpeechTime: number = 0;
  private speechCooldown: number = 10000; // 10 seconds between speeches

  constructor(initialPetState: PetState) {
    this.petState = initialPetState;
    this.startBehaviorLoop();
  }

  // Get current pet state
  getPetState(): PetState {
    return { ...this.petState };
  }

  // Update pet state
  async updatePetState(updates: Partial<PetState>): Promise<void> {
    this.petState = { ...this.petState, ...updates };
    try {
      await storageManager.setPetState(this.petState);
    } catch (error) {
      // Continue with local state update even if storage fails
    }
    this.updateMood();
  }

  // Animation management
  setAnimation(animation: PetAnimation): void {
    if (this.petState.unlockedAnimations.includes(animation)) {
      this.petState.currentAnimation = animation;
      this.updatePetState({ currentAnimation: animation });
    } else {
      console.log(`focusPet: Animation '${animation}' not unlocked. Available: ${this.petState.unlockedAnimations.join(', ')}`);
    }
  }

  // Position management
  setPosition(position: Position): void {
    this.petState.position = position;
    this.updatePetState({ position });
  }

  // Mouse interaction
  onMouseMove(x: number, y: number): void {
    this.mousePosition = { x, y };
    // Do not move if napping
    if (this.petState.currentAnimation === 'nap') return;
    // Pet follows cursor if close enough, but not when napping
    const distance = Math.sqrt(
      Math.pow(x - this.petState.position.x, 2) + 
      Math.pow(y - this.petState.position.y, 2)
    );

    if (distance < 200 && this.petState.mood !== 'neglected') {
      this.moveTowardsMouse();
    }
  }

  onMouseClick(x: number, y: number): void {
    const distance = Math.sqrt(
      Math.pow(x - this.petState.position.x, 2) + 
      Math.pow(y - this.petState.position.y, 2)
    );

    if (distance < 50) {
      this.interactWithPet();
    }
  }

  // Pet interactions
  async interactWithPet(): Promise<void> {
    this.petState.happiness = Math.min(100, this.petState.happiness + 10);
    this.petState.lastInteraction = Date.now();
    
    // Wake up the pet if it was napping
    if (this.petState.currentAnimation === 'nap') {
      this.setAnimation('excited'); // Wake up excited
      this.speak('wake');
    } else {
      // Random animation on interaction
      const animations: PetAnimation[] = ['excited', 'play'];
      const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
      this.setAnimation(randomAnimation);
      this.speak('pet');
    }
    
    try {
      await this.updatePetState({
        happiness: this.petState.happiness,
        lastInteraction: this.petState.lastInteraction
      });
    } catch (error) {
      // Silent error handling
    }

    // Reset to idle after interaction
    setTimeout(() => {
      this.setAnimation('idle');
    }, 2000);
  }

  async feedPet(): Promise<void> {
    if (this.petState.treats > 0) {
      this.petState.treats--;
      this.petState.happiness = Math.min(100, this.petState.happiness + 15);
      this.petState.hunger = Math.max(0, this.petState.hunger - 20);
      
      this.setAnimation('excited');
      this.speak('feed');
      
      try {
        await this.updatePetState({
          treats: this.petState.treats,
          happiness: this.petState.happiness,
          hunger: this.petState.hunger
        });
      } catch (error) {
        // Silent error handling
      }

      setTimeout(() => {
        this.setAnimation('idle');
      }, 3000);
    }
  }

  async addTreats(count: number): Promise<void> {
    this.petState.treats += count;
    try {
      await this.updatePetState({ treats: this.petState.treats });
    } catch (error) {
      // Silent error handling
    }
  }

  // Movement
  private moveTowardsMouse(): void {
    // Do not move if napping
    if (this.petState.currentAnimation === 'nap') return;
    const dx = this.mousePosition.x - this.petState.position.x;
    const dy = this.mousePosition.y - this.petState.position.y;
    
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      this.petState.position.x += dx * 0.02;
      this.petState.position.y += dy * 0.02;
      
      if (this.petState.currentAnimation !== 'walk') {
        this.setAnimation('walk');
      }
    } else if (this.petState.currentAnimation === 'walk') {
      this.setAnimation('idle');
    }
  }

  // Behavior loop
  private startBehaviorLoop(): void {
    this.behaviorTimer = window.setInterval(() => {
      this.updatePetBehavior();
    }, 30000); // Update every 30 seconds
    
    // Start mood-based speech loop
    this.startMoodSpeechLoop();
  }

  private startMoodSpeechLoop(): void {
    // Speak based on mood every 2-5 minutes
    setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance to speak
        this.speak('mood');
      }
    }, 120000 + Math.random() * 180000); // 2-5 minutes
  }

  private async updatePetBehavior(): Promise<void> {
    const now = Date.now();
    const timeSinceInteraction = now - this.petState.lastInteraction;

    // Decrease happiness over time if not interacted with
    if (timeSinceInteraction > 300000) { // 5 minutes
      this.petState.happiness = Math.max(0, this.petState.happiness - 2);
    }

    // Nap after 2 minutes of inactivity
    if (timeSinceInteraction > 120000) { // 2 minutes
      if (this.petState.currentAnimation !== 'nap') {
        console.log(`focusPet: Pet inactive for ${Math.floor(timeSinceInteraction / 1000)}s, setting to nap`);
        this.setAnimation('nap');
        this.speak('nap');
      }
      // Energy restoration while napping
      const idleMinutes = Math.floor(timeSinceInteraction / 60000);
      const energyGain = Math.min(3, idleMinutes); // Max 3 energy per 30-second cycle
      this.petState.energy = Math.min(100, this.petState.energy + energyGain);
      // Do NOT perform random behaviors while napping
    } else {
      // Decrease energy if recently interacted with (pet is active)
      this.petState.energy = Math.max(0, this.petState.energy - 1);
      // Return to idle if was napping but now active
      if (this.petState.currentAnimation === 'nap') {
        this.setAnimation('idle');
      }
      // Random behaviors (sit/play) if not napping
      if (Math.random() < 0.3 && this.petState.currentAnimation !== 'nap') {
        this.performRandomBehavior();
      }
    }

    // Increase hunger over time
    this.petState.hunger = Math.min(100, this.petState.hunger + 1);

    // Update mood based on stats
    this.updateMood();

    try {
      await this.updatePetState({
        happiness: this.petState.happiness,
        energy: this.petState.energy,
        hunger: this.petState.hunger,
        mood: this.petState.mood
      });
    } catch (error) {
      // Silent error handling
    }
  }

  private updateMood(): void {
    const avgStats = (this.petState.happiness + this.petState.energy + (100 - this.petState.hunger)) / 3;
    
    if (avgStats >= 80) {
      this.petState.mood = 'happy';
    } else if (avgStats >= 60) {
      this.petState.mood = 'content';
    } else if (avgStats >= 40) {
      this.petState.mood = 'bored';
    } else {
      this.petState.mood = 'neglected';
    }
  }

  private performRandomBehavior(): void {
    const behaviors: PetAnimation[] = ['sit', 'play']; // Removed 'nap' from random behaviors
    const randomBehavior = behaviors[Math.floor(Math.random() * behaviors.length)];
    
    this.setAnimation(randomBehavior);
    
    // Reset to idle after random behavior
    setTimeout(() => {
      this.setAnimation('idle');
    }, 5000 + Math.random() * 10000);
  }

  // Conversation system
  private speak(context: 'pet' | 'feed' | 'wake' | 'nap' | 'mood'): void {
    const now = Date.now();
    if (now - this.lastSpeechTime < this.speechCooldown) {
      return; // Don't speak too frequently
    }

    const petResponses = PET_RESPONSES[this.petState.type];
    if (!petResponses) return;

    let message = '';
    
    if (context === 'mood') {
      const moodResponses = petResponses[this.petState.mood];
      if (moodResponses && moodResponses.length > 0) {
        message = moodResponses[Math.floor(Math.random() * moodResponses.length)];
      }
    } else {
      const interactionResponses = petResponses.interactions[context];
      if (interactionResponses && interactionResponses.length > 0) {
        message = interactionResponses[Math.floor(Math.random() * interactionResponses.length)];
      }
    }

    if (message) {
      this.lastSpeechTime = now;
      this.showSpeechBubble(message);
    }
  }

  // Reminder reactions
  async reactToReminder(message: string): Promise<void> {
    this.setAnimation('excited');
    
    // Show speech bubble (handled by overlay)
    this.showSpeechBubble(message);
    
    setTimeout(() => {
      this.setAnimation('idle');
    }, 4000);
  }

  async reactToAlarm(): Promise<void> {
    this.setAnimation('worried');
    
    setTimeout(() => {
      this.setAnimation('idle');
    }, 3000);
  }

  private showSpeechBubble(message: string): void {
    // This will be handled by the overlay system
    // For now, we'll dispatch a custom event
    const event = new CustomEvent('pet:speechBubble', {
      detail: { message, petType: this.petState.type }
    });
    window.dispatchEvent(event);
  }

  // Cleanup
  destroy(): void {
    if (this.animationTimer) {
      clearInterval(this.animationTimer);
    }
    if (this.behaviorTimer) {
      clearInterval(this.behaviorTimer);
    }
  }
} 