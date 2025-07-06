import { Reminder, ReminderType, ReminderFrequency } from '../types';
import { storageManager } from '../storage';

export class ReminderManager {
  private static instance: ReminderManager;
  private reminders: Reminder[] = [];
  private alarmIds: Set<string> = new Set();

  private constructor() {
    this.initialize();
  }

  static getInstance(): ReminderManager {
    if (!ReminderManager.instance) {
      ReminderManager.instance = new ReminderManager();
    }
    return ReminderManager.instance;
  }

  private async initialize(): Promise<void> {
    await this.loadReminders();
    await this.scheduleAllReminders();
  }

  // Load reminders from storage
  private async loadReminders(): Promise<void> {
    this.reminders = await storageManager.getReminders();
  }

  // Save reminders to storage
  private async saveReminders(): Promise<void> {
    await storageManager.setReminders(this.reminders);
  }

  // Create a new reminder
  async createReminder(reminderData: Omit<Reminder, 'id' | 'createdAt'>): Promise<Reminder> {
    // Validation: prevent empty title or message
    if (!reminderData.title || !reminderData.title.trim()) {
      throw new Error('Reminder title cannot be empty.');
    }
    if (!reminderData.message || !reminderData.message.trim()) {
      throw new Error('Reminder message cannot be empty.');
    }
    const reminder: Reminder = {
      ...reminderData,
      id: this.generateId(),
      createdAt: Date.now(),
    };

    this.reminders.push(reminder);
    await this.saveReminders();
    await this.scheduleReminder(reminder);

    return reminder;
  }

  // Update an existing reminder
  async updateReminder(reminderId: string, updates: Partial<Reminder>): Promise<Reminder | null> {
    const index = this.reminders.findIndex(r => r.id === reminderId);
    if (index === -1) return null;

    // Cancel existing alarm
    await this.cancelReminder(reminderId);

    // Update reminder
    this.reminders[index] = { ...this.reminders[index], ...updates };
    await this.saveReminders();
    await this.scheduleReminder(this.reminders[index]);

    return this.reminders[index];
  }

  // Delete a reminder
  async deleteReminder(reminderId: string): Promise<boolean> {
    const index = this.reminders.findIndex(r => r.id === reminderId);
    if (index === -1) return false;

    await this.cancelReminder(reminderId);
    this.reminders.splice(index, 1);
    await this.saveReminders();

    return true;
  }

  // Get all reminders
  getReminders(): Reminder[] {
    return [...this.reminders];
  }

  // Get active reminders
  getActiveReminders(): Reminder[] {
    return this.reminders.filter(r => r.isActive);
  }

  // Schedule a reminder
  private async scheduleReminder(reminder: Reminder): Promise<void> {
    if (!reminder.isActive) return;

    const alarmId = `reminder_${reminder.id}`;
    const delayInMinutes = this.calculateDelayInMinutes(reminder);

    console.log(`Scheduling reminder ${reminder.id}:`, {
      alarmId,
      delayInMinutes,
      reminder: reminder.title,
      nextTrigger: new Date(reminder.nextTrigger).toLocaleString()
    });

    if (delayInMinutes > 0) {
      await chrome.alarms.create(alarmId, {
        delayInMinutes,
        periodInMinutes: this.getPeriodInMinutes(reminder.frequency, reminder.interval)
      });
      this.alarmIds.add(alarmId);
      console.log(`Alarm created: ${alarmId} in ${delayInMinutes} minutes`);
    } else {
      console.log(`Reminder ${reminder.id} has no delay, not scheduling alarm`);
    }
  }

  // Schedule all reminders
  private async scheduleAllReminders(): Promise<void> {
    for (const reminder of this.reminders) {
      if (reminder.isActive) {
        await this.scheduleReminder(reminder);
      }
    }
  }

  // Cancel a reminder's alarm
  private async cancelReminder(reminderId: string): Promise<void> {
    const alarmId = `reminder_${reminderId}`;
    try {
      await chrome.alarms.clear(alarmId);
      this.alarmIds.delete(alarmId);
    } catch (error) {
      console.error(`Error canceling alarm ${alarmId}:`, error);
    }
  }

  // Calculate delay in minutes for a reminder
  private calculateDelayInMinutes(reminder: Reminder): number {
    const now = Date.now();
    const timeUntilTrigger = reminder.nextTrigger - now;
    return Math.max(0, timeUntilTrigger / (1000 * 60));
  }

  // Get period in minutes for recurring reminders
  private getPeriodInMinutes(frequency: ReminderFrequency, interval?: number): number | undefined {
    switch (frequency) {
      case 'once':
        return undefined;
      case 'hourly':
        return 60;
      case 'daily':
        return 24 * 60;
      case 'weekly':
        return 7 * 24 * 60;
      case 'custom':
        return interval;
      default:
        return undefined;
    }
  }

  // Handle alarm trigger
  async handleAlarmTrigger(alarmId: string): Promise<void> {
    const reminderId = alarmId.replace('reminder_', '');
    const reminder = this.reminders.find(r => r.id === reminderId);
    
    if (!reminder || !reminder.isActive) return;

    // Trigger the reminder
    await this.triggerReminder(reminder);

    // Update next trigger time for recurring reminders
    if (reminder.frequency !== 'once') {
      await this.updateNextTriggerTime(reminder);
      await this.scheduleReminder(reminder);
    } else {
      // Deactivate one-time reminders
      reminder.isActive = false;
      await this.saveReminders();
    }
  }

  // Trigger a reminder
  private async triggerReminder(reminder: Reminder): Promise<void> {
    console.log(`Triggering reminder: ${reminder.title} - ${reminder.message}`);
    
    // Send message to content script to show notification
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log(`Found ${tabs.length} active tabs`);
    
    for (const tab of tabs) {
      if (tab.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'REMINDER_TRIGGERED',
            reminder
          });
          console.log(`Sent reminder to tab ${tab.id}`);
        } catch (error) {
          console.error(`Error sending reminder to tab ${tab.id}:`, error);
        }
      }
    }

    // Show browser notification if enabled
    if (reminder.soundEnabled || reminder.visualEnabled) {
      console.log('Showing browser notification');
      await this.showBrowserNotification(reminder);
    }
  }

  // Update next trigger time for recurring reminders
  private async updateNextTriggerTime(reminder: Reminder): Promise<void> {
    const now = Date.now();
    let nextTrigger: number;

    switch (reminder.frequency) {
      case 'hourly':
        nextTrigger = now + (60 * 60 * 1000);
        break;
      case 'daily':
        nextTrigger = now + (24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        nextTrigger = now + (7 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        if (reminder.interval) {
          nextTrigger = now + (reminder.interval * 60 * 1000);
        } else {
          nextTrigger = now;
        }
        break;
      default:
        nextTrigger = now;
    }

    reminder.nextTrigger = nextTrigger;
  }

  // Show browser notification
  private async showBrowserNotification(reminder: Reminder): Promise<void> {
    try {
      await chrome.notifications.create(`notification_${reminder.id}`, {
        type: 'basic',
        iconUrl: 'assets/icons/icon48.png',
        title: 'focusPet Reminder',
        message: reminder.message,
        priority: 2, // High priority
        requireInteraction: true, // Don't auto-dismiss
        silent: false // Play sound
      });
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }

  // Create preset reminders
  async createPresetReminder(type: ReminderType): Promise<Reminder> {
    const presets: Record<ReminderType, any> = {
      pomodoro: {
        title: 'Pomodoro Timer',
        message: 'Time for a break! Take 5 minutes to stretch.',
        type: 'pomodoro' as ReminderType,
        frequency: 'custom' as ReminderFrequency,
        interval: 25,
        nextTrigger: Date.now() + (25 * 60 * 1000),
        isActive: true,
        soundEnabled: true,
        visualEnabled: true
      },
      posture: {
        title: 'Posture Check',
        message: 'Time to check your posture! Sit up straight.',
        type: 'posture' as ReminderType,
        frequency: 'hourly' as ReminderFrequency,
        nextTrigger: Date.now() + (60 * 60 * 1000),
        isActive: true,
        soundEnabled: true,
        visualEnabled: true
      },
      water: {
        title: 'Water Break',
        message: 'Stay hydrated! Time for a water break.',
        type: 'water' as ReminderType,
        frequency: 'custom' as ReminderFrequency,
        interval: 120,
        nextTrigger: Date.now() + (120 * 60 * 1000),
        isActive: true,
        soundEnabled: true,
        visualEnabled: true
      },
      'eye-rest': {
        title: 'Eye Rest',
        message: 'Look at something 20 feet away for 20 seconds.',
        type: 'eye-rest' as ReminderType,
        frequency: 'custom' as ReminderFrequency,
        interval: 20,
        nextTrigger: Date.now() + (20 * 60 * 1000),
        isActive: true,
        soundEnabled: true,
        visualEnabled: true
      },

      custom: {
        title: 'Custom Reminder',
        message: 'Custom reminder message',
        type: 'custom' as ReminderType,
        frequency: 'once' as ReminderFrequency,
        nextTrigger: Date.now() + (60 * 60 * 1000),
        isActive: true,
        soundEnabled: true,
        visualEnabled: true
      },
      test: {
        title: 'Test Reminder',
        message: 'This is a test reminder that triggers in 10 seconds!',
        type: 'test' as ReminderType,
        frequency: 'once' as ReminderFrequency,
        nextTrigger: Date.now() + 10 * 1000, // 10 seconds
        isActive: true,
        soundEnabled: true,
        visualEnabled: true
      }
    };
    const preset = presets[type];
    if (!preset) {
      throw new Error(`Unknown preset reminder type: ${type}`);
    }
    return this.createReminder(preset);
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Cleanup
  destroy(): void {
    // Clear all alarms
    this.alarmIds.forEach(alarmId => {
      chrome.alarms.clear(alarmId).catch(console.error);
    });
    this.alarmIds.clear();
  }
}

// Export singleton instance
export const reminderManager = ReminderManager.getInstance(); 