import { PetEngine } from '@shared/pet/pet-engine';
import { storageManager } from '@shared/storage';
import { PetState, Position } from '@shared/types';

class PetOverlay {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private petEngine: PetEngine | null = null;
  private petState: PetState | null = null;
  private animationFrame: number | null = null;
  private sprites: Map<string, HTMLImageElement> = new Map();
  private speechBubble: { message: string; show: boolean; timer: number } = {
    message: '',
    show: false,
    timer: 0
  };

  constructor() {
    this.canvas = this.createCanvas();
    this.ctx = this.canvas.getContext('2d')!;
    this.initialize();
  }

  private createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.id = 'focuspet-overlay';
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2147483647;
      background: transparent;
    `;
    // Make pet area clickable (DISABLED to allow page interaction)
    // canvas.style.pointerEvents = 'auto';
    document.body.appendChild(canvas);
    
    // Set initial canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    return canvas;
  }

  private async initialize(): Promise<void> {
    await this.loadPetState();
    await this.loadSprites();
    this.setupEventListeners();
    
    // Ensure canvas is properly sized
    this.resizeCanvas();
    
    this.startRenderLoop();
  }

  private async loadPetState(): Promise<void> {
    this.petState = await storageManager.getPetState();
    if (this.petState) {
      this.petEngine = new PetEngine(this.petState);
    }
  }

  private async loadSprites(): Promise<void> {
    const petTypes = ['cat', 'dog', 'dragon', 'penguin', 'bunny'];
    const animations = ['idle', 'walk', 'sit', 'nap', 'play', 'excited', 'worried', 'sad'];

    for (const petType of petTypes) {
      for (const animation of animations) {
        const spriteKey = `${petType}_${animation}`;
        const img = new Image();
        img.src = chrome.runtime.getURL(`assets/pets/${petType}/${animation}.png`);
        
        // Add error handling and logging
        img.onload = () => {
          console.log(`focusPet: Loaded sprite ${spriteKey}, dimensions: ${img.naturalWidth}x${img.naturalHeight}`);
        };
        img.onerror = () => {
          console.error(`focusPet: Failed to load sprite ${spriteKey}`);
        };
        
        this.sprites.set(spriteKey, img);
      }
    }
  }

  private setupEventListeners(): void {
    // Mouse movement (track mouse anywhere on the page)
    window.addEventListener('mousemove', (e) => {
      if (this.petEngine) {
        this.petEngine.onMouseMove(e.clientX, e.clientY);
      }
    });

    // Mouse clicks (optional: respond to clicks anywhere)
    window.addEventListener('click', (e) => {
      if (this.petEngine) {
        this.petEngine.onMouseClick(e.clientX, e.clientY);
      }
    });

    // Listen for reminder messages from background script
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === 'REMINDER_TRIGGERED') {
        this.handleReminder(message.reminder);
        sendResponse({ success: true });
      } else if (message.type === 'SYNC_PET_STATE') {
        // Reload pet state when popup makes changes
        this.reloadPetState().then(() => {
          sendResponse({ success: true });
        }).catch((error) => {
          console.error('Error reloading pet state:', error);
          sendResponse({ success: false, error: error.message });
        });
        return true; // Keep message channel open for async response
      }
    });

    // Listen for speech bubble events
    window.addEventListener('pet:speechBubble', ((e: CustomEvent) => {
      this.showSpeechBubble(e.detail.message);
    }) as EventListener);

    // Handle window resize
    window.addEventListener('resize', () => {
      this.resizeCanvas();
    });
  }

  private resizeCanvas(): void {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    
    console.log('focusPet: Resizing canvas to', newWidth, 'x', newHeight);
    
    this.canvas.width = newWidth;
    this.canvas.height = newHeight;
  }

  private startRenderLoop(): void {
    const render = () => {
      this.render();
      this.animationFrame = requestAnimationFrame(render);
    };
    render();
  }

  private render(): void {
    if (!this.petState || !this.petEngine) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update pet state
    this.petState = this.petEngine.getPetState();

    // Render pet
    this.renderPet();

    // Render speech bubble
    if (this.speechBubble.show) {
      this.renderSpeechBubble();
    }

    // Render mood indicator
    this.renderMoodIndicator();
  }

  private renderPet(): void {
    if (!this.petState) return;

    const spriteKey = `${this.petState.type}_${this.petState.currentAnimation}`;
    const sprite = this.sprites.get(spriteKey);

    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      // Calculate dimensions based on original aspect ratio
      const baseSize = 64; // Base size for width
      const aspectRatio = sprite.naturalHeight / sprite.naturalWidth;
      const width = baseSize;
      const height = baseSize * aspectRatio;
      
      const x = this.petState.position.x - width / 2;
      const y = this.petState.position.y - height / 2;

      // Apply mood-based color adjustments
      this.ctx.save();
      this.applyMoodEffects();

      // Draw the image with transparency support
      this.ctx.drawImage(sprite, x, y, width, height);
      this.ctx.restore();
    } else {
      // Fallback: draw a simple colored circle
      this.renderFallbackPet();
    }
  }

  private renderFallbackPet(): void {
    if (!this.petState) return;

    const size = 40;
    const x = this.petState.position.x;
    const y = this.petState.position.y;

    // Draw pet body (circle)
    this.ctx.save();
    this.ctx.fillStyle = this.getPetColor();
    this.ctx.beginPath();
    this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw pet eyes
    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(x - 8, y - 5, 3, 0, Math.PI * 2);
    this.ctx.arc(x + 8, y - 5, 3, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw pet mouth based on mood
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    if (this.petState.mood === 'happy') {
      // Happy smile
      this.ctx.arc(x, y + 5, 8, 0, Math.PI);
    } else if (this.petState.mood === 'neglected') {
      // Sad frown
      this.ctx.arc(x, y + 15, 8, Math.PI, Math.PI * 2);
    } else {
      // Neutral line
      this.ctx.moveTo(x - 5, y + 8);
      this.ctx.lineTo(x + 5, y + 8);
    }
    this.ctx.stroke();
    this.ctx.restore();
  }

  private applyMoodEffects(): void {
    if (!this.petState) return;

    switch (this.petState.mood) {
      case 'happy':
        this.ctx.filter = 'brightness(1.2) saturate(1.3)';
        break;
      case 'content':
        this.ctx.filter = 'brightness(1.0) saturate(1.0)';
        break;
      case 'bored':
        this.ctx.filter = 'brightness(0.8) saturate(0.7)';
        break;
      case 'neglected':
        this.ctx.filter = 'brightness(0.6) saturate(0.5) grayscale(0.3)';
        break;
    }
  }

  private renderSpeechBubble(): void {
    if (!this.speechBubble.show || !this.petState) return;

    const bubbleX = this.petState.position.x;
    const bubbleY = this.petState.position.y - 80;
    const maxWidth = 200;
    const padding = 10;

    // Measure text
    this.ctx.font = '14px Arial';
    const textMetrics = this.ctx.measureText(this.speechBubble.message);
    const textWidth = Math.min(textMetrics.width, maxWidth - padding * 2);
    const textHeight = 20;

    // Draw bubble background
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;

    const bubbleWidth = textWidth + padding * 2;
    const bubbleHeight = textHeight + padding * 2;

    // Rounded rectangle
    this.roundRect(
      bubbleX - bubbleWidth / 2,
      bubbleY - bubbleHeight,
      bubbleWidth,
      bubbleHeight,
      8
    );

    // Draw text
    this.ctx.fillStyle = '#333';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      this.speechBubble.message,
      bubbleX,
      bubbleY - padding - 5
    );

    // Auto-hide speech bubble (longer for reminders)
    this.speechBubble.timer++;
    const maxTimer = this.speechBubble.message.includes('⏰') ? 300 : 120; // 5 seconds for reminders, 2 for others
    if (this.speechBubble.timer > maxTimer) {
      this.speechBubble.show = false;
      this.speechBubble.timer = 0;
    }
  }

  private roundRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }

  private renderMoodIndicator(): void {
    if (!this.petState) return;

    const indicatorX = this.petState.position.x;
    const indicatorY = this.petState.position.y + 40;
    const size = 20;

    // Draw mood indicator
    this.ctx.save();
    this.ctx.fillStyle = this.getMoodColor();
    this.ctx.beginPath();
    this.ctx.arc(indicatorX, indicatorY, size / 2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  private getMoodColor(): string {
    if (!this.petState) return '#ccc';

    switch (this.petState.mood) {
      case 'happy':
        return '#4CAF50';
      case 'content':
        return '#2196F3';
      case 'bored':
        return '#FF9800';
      case 'neglected':
        return '#F44336';
      default:
        return '#ccc';
    }
  }

  private getPetColor(): string {
    if (!this.petState) return '#ccc';

    switch (this.petState.type) {
      case 'cat':
        return '#FFA500'; // Orange
      case 'dog':
        return '#8B4513'; // Brown
      case 'dragon':
        return '#4CAF50'; // Green
      case 'penguin':
        return '#000'; // Black
      case 'bunny':
        return '#FFF'; // White
      default:
        return '#ccc';
    }
  }

  private showSpeechBubble(message: string): void {
    this.speechBubble.message = message;
    this.speechBubble.show = true;
    this.speechBubble.timer = 0;
  }

  private async handleReminder(reminder: any): Promise<void> {
    console.log('focusPet: Reminder triggered:', reminder.title, reminder.message);
    
    // Show a prominent speech bubble
    this.showSpeechBubble(`⏰ ${reminder.title}: ${reminder.message}`);
    
    // Make the pet react
    if (this.petEngine) {
      await this.petEngine.reactToReminder(reminder.message);
    }
    
    // Show a more prominent overlay notification
    this.showOverlayNotification(reminder);
  }

  private showOverlayNotification(reminder: any): void {
    // Create a prominent notification overlay
    const notification = document.createElement('div');
    notification.id = 'focuspet-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 2147483648;
      max-width: 300px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: slideIn 0.5s ease-out;
      border: 2px solid rgba(255,255,255,0.2);
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        <span style="font-size: 24px; margin-right: 10px;">⏰</span>
        <h3 style="margin: 0; font-size: 16px; font-weight: 600;">${reminder.title}</h3>
      </div>
      <p style="margin: 0; font-size: 14px; line-height: 1.4; opacity: 0.9;">${reminder.message}</p>
      <div style="
        position: absolute;
        top: 8px;
        right: 8px;
        display: flex;
        gap: 8px;
      ">
        <button id="focuspet-snooze" style="
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 500;
        ">Snooze 5m</button>
        <button id="focuspet-dismiss" style="
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">×</button>
      </div>
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      #focuspet-notification {
        animation: slideIn 0.5s ease-out, pulse 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Auto-dismiss after 30 seconds (longer for important reminders)
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideIn 0.5s ease-out reverse';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 500);
      }
    }, 30000); // 30 seconds instead of 10
    
    // Manual dismiss button
    const dismissBtn = notification.querySelector('#focuspet-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      });
    }

    // Snooze button
    const snoozeBtn = notification.querySelector('#focuspet-snooze');
    if (snoozeBtn) {
      snoozeBtn.addEventListener('click', async () => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
        
        // Send message to background script to snooze the reminder
        try {
          await chrome.runtime.sendMessage({
            type: 'SNOOZE_REMINDER',
            reminderId: reminder.id,
            snoozeMinutes: 5
          });
        } catch (error) {
          console.error('Error snoozing reminder:', error);
        }
      });
    }
  }

  // Public methods for external control
  public setPetPosition(position: Position): void {
    if (this.petEngine) {
      this.petEngine.setPosition(position);
    }
  }

  public feedPet(): void {
    if (this.petEngine) {
      this.petEngine.feedPet();
    }
  }

  public addTreats(count: number): void {
    if (this.petEngine) {
      this.petEngine.addTreats(count);
    }
  }

  // Reload pet state from storage (for sync with popup)
  public async reloadPetState(): Promise<void> {
    await this.loadPetState();
    if (this.petEngine && this.petState) {
      this.petEngine = new PetEngine(this.petState);
    }
  }

  public destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.petEngine) {
      this.petEngine.destroy();
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

// Initialize the overlay when the content script loads
console.log('focusPet: Content script loading...');

const overlay = new PetOverlay();
(window as any).focusPetOverlay = overlay;

// MutationObserver to re-inject overlay if removed
const observer = new MutationObserver(() => {
  if (!document.getElementById('focuspet-overlay')) {
    console.log('focusPet: Overlay missing, re-injecting...');
    (window as any).focusPetOverlay = new PetOverlay();
  }
});
observer.observe(document.body, { childList: true, subtree: true });

console.log('focusPet: Content script loaded successfully');

// Export onExecute function for @crxjs/vite-plugin
export function onExecute(context: any) {
  console.log('focusPet: Content script executed with context:', context);
} 