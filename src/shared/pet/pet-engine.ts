import { PetState, PetAnimation, Position } from '../types';
import { storageManager } from '../storage';

export class PetEngine {
  private petState: PetState;
  private animationTimer: number | null = null;
  private behaviorTimer: number | null = null;
  private mousePosition: Position = { x: 0, y: 0 };

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
    } else {
      // Random animation on interaction
      const animations: PetAnimation[] = ['excited', 'play'];
      const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
      this.setAnimation(randomAnimation);
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
        this.setAnimation('nap');
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