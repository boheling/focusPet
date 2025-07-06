import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { PetState, UserSettings, Reminder, ReminderType } from '@shared/types';
import { PetType } from '@shared/types';

interface PopupProps {}

const isExtension = typeof chrome !== 'undefined' && !!chrome.storage;

const mockPetState: PetState = {
  type: 'cat',
  name: 'Whiskers',
  mood: 'happy',
  happiness: 90,
  energy: 80,
  hunger: 20,
  treats: 5,
  unlockedAnimations: ['idle', 'walk', 'sit'],
  accessories: [],
  position: { x: 100, y: 100 },
  currentAnimation: 'idle',
  lastInteraction: Date.now(),
};

const mockSettings: UserSettings = {
  petType: 'cat',
  petName: 'Whiskers',
  soundEnabled: true,
  visualEffectsEnabled: true,
  petPosition: 'bottom-right',
  reminderDefaults: { soundEnabled: true, visualEnabled: true, systemNotifications: true },
  focusTracking: { enabled: true, trackingInterval: 30, treatRewardInterval: 30 },
  theme: 'auto',
};

const mockReminders: Reminder[] = [
  {
    id: '1',
    title: 'Pomodoro Timer',
    message: 'Time for a break! Take 5 minutes to stretch.',
    type: 'pomodoro',
    frequency: 'custom',
    interval: 25,
    nextTrigger: Date.now() + 25 * 60 * 1000,
    isActive: true,
    soundEnabled: true,
    visualEnabled: true,
    createdAt: Date.now(),
  },
  {
    id: '2',
    title: 'Posture Check',
    message: 'Time to check your posture! Sit up straight.',
    type: 'posture',
    frequency: 'hourly',
    nextTrigger: Date.now() + 60 * 60 * 1000,
    isActive: true,
    soundEnabled: true,
    visualEnabled: true,
    createdAt: Date.now(),
  },
];

const petTypes: PetType[] = ['cat', 'dog', 'dragon', 'penguin', 'bunny'];

const Popup: React.FC<PopupProps> = () => {
  const [petState, setPetState] = useState<PetState | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeTab, setActiveTab] = useState<'pet' | 'reminders' | 'settings'>('pet');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (isExtension) {
      try {
        const [petData, settingsData, remindersData] = await Promise.all([
          sendMessage('GET_PET_STATE'),
          sendMessage('GET_USER_SETTINGS'),
          sendMessage('GET_REMINDERS')
        ]);
        console.log('Popup: Loaded pet data:', petData);
        console.log('Popup: Loaded settings from storage:', settingsData);
        console.log('Popup: Settings focusTracking:', settingsData?.focusTracking);
        setPetState(petData);
        setSettings(settingsData);
        setReminders(remindersData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Use mock data in dev mode
      setPetState(mockPetState);
      setSettings(mockSettings);
      setReminders(mockReminders);
      setLoading(false);
    }
  }, [isExtension]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for sync messages from background script
  useEffect(() => {
    if (isExtension) {
      const handleMessage = (message: any) => {
        console.log('Popup: Received message:', message);
        if (message.type === 'SYNC_PET_STATE') {
          console.log('Popup: Received SYNC_PET_STATE message, refreshing data');
          loadData();
        }
      };

      chrome.runtime.onMessage.addListener(handleMessage);
      
      return () => {
        chrome.runtime.onMessage.removeListener(handleMessage);
      };
    }
  }, [isExtension, loadData]);

  const sendMessage = (type: string, data?: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type, ...data }, (response) => {
        if (response?.success) {
          resolve(response.data);
        } else {
          reject(new Error(response?.error || 'Unknown error'));
        }
      });
    });
  };

  const feedPet = async () => {
    if (!isExtension) return; // No-op in dev mode
    try {
      await sendMessage('FEED_PET');
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error feeding pet:', error);
    }
  };

  const createPresetReminder = async (type: ReminderType) => {
    if (!isExtension) return; // No-op in dev mode
    try {
      await sendMessage('CREATE_PRESET_REMINDER', { reminderType: type });
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error creating preset reminder:', error);
    }
  };

  const toggleReminder = async (reminderId: string, isActive: boolean) => {
    if (!isExtension) return; // No-op in dev mode
    try {
      await sendMessage('UPDATE_REMINDER', { reminderId, data: { isActive } });
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error toggling reminder:', error);
    }
  };

  const deleteReminder = async (reminderId: string) => {
    if (!isExtension) return; // No-op in dev mode
    try {
      await sendMessage('DELETE_REMINDER', { reminderId });
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  if (loading) {
    return (
      <div className="popup-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <div className="header">
        <h1>focusPet 🐾</h1>
        <div className="tab-buttons">
          <button
            className={activeTab === 'pet' ? 'active' : ''}
            onClick={() => setActiveTab('pet')}
          >
            Pet
          </button>
          <button
            className={activeTab === 'reminders' ? 'active' : ''}
            onClick={() => setActiveTab('reminders')}
          >
            Reminders
          </button>
          <button
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>
      </div>

      <div className="content">
        {activeTab === 'pet' && petState && (
          <PetTab 
            petState={petState} 
            onFeedPet={feedPet} 
            sendMessage={sendMessage}
            loadData={loadData}
            isExtension={isExtension}
          />
        )}

        {activeTab === 'reminders' && (
          <RemindersTab
            reminders={reminders}
            onCreatePreset={createPresetReminder}
            onToggle={toggleReminder}
            onDelete={deleteReminder}
          />
        )}

        {activeTab === 'settings' && settings && (
          <SettingsTab 
            settings={settings} 
            sendMessage={sendMessage}
            setSettings={setSettings}
          />
        )}
      </div>
    </div>
  );
};

interface PetTabProps {
  petState: PetState;
  onFeedPet: () => void;
  sendMessage: (type: string, data?: any) => Promise<any>;
  loadData: () => Promise<void>;
  isExtension: boolean;
}

const PetTab: React.FC<PetTabProps> = ({ petState, onFeedPet, sendMessage, loadData, isExtension }) => {
  return (
    <div className="pet-tab">
      <div className="pet-info">
        <h2>{petState.name}</h2>
        <p>Type: {petState.type}</p>
        <p>Mood: {petState.mood}</p>
      </div>

      <div className="pet-stats">
        <div className="stat">
          <label>Happiness</label>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${petState.happiness}%` }}
            />
          </div>
          <span>{petState.happiness}%</span>
        </div>

        <div className="stat">
          <label>Energy</label>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${petState.energy}%` }}
            />
          </div>
          <span>{petState.energy}%</span>
        </div>

        <div className="stat">
          <label>Hunger</label>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${100 - petState.hunger}%` }}
            />
          </div>
          <span>{100 - petState.hunger}%</span>
        </div>
      </div>

      <div className="pet-actions">
        <button 
          onClick={onFeedPet}
          disabled={petState.treats === 0}
          className="feed-button"
        >
          Feed Treat ({petState.treats} left)
        </button>
        
        {isExtension && (
          <>
            <button 
              onClick={async () => {
                try {
                  await sendMessage('ADD_TREATS', { count: 1 });
                  await loadData(); // Reload data
                } catch (error) {
                  console.error('Error adding treat:', error);
                }
              }}
              className="add-treat-button"
              style={{ marginTop: '8px' }}
            >
              Add Test Treat
            </button>
            
            <button 
              onClick={async () => {
                try {
                  await sendMessage('TEST_NAP');
                  await loadData(); // Reload data
                } catch (error) {
                  console.error('Error testing nap:', error);
                }
              }}
              className="test-nap-button"
              style={{ marginTop: '8px', backgroundColor: '#4a90e2' }}
            >
              Test Nap Animation
            </button>
            
            <button 
              onClick={async () => {
                try {
                  await sendMessage('TEST_SIT');
                  await loadData(); // Reload data
                } catch (error) {
                  console.error('Error testing sit:', error);
                }
              }}
              className="test-sit-button"
              style={{ marginTop: '8px', backgroundColor: '#8e44ad' }}
            >
              Test Sit Animation
            </button>
          </>
        )}
      </div>

      <div className="pet-animations">
        <h3>Unlocked Animations</h3>
        <div className="animation-list">
          {petState.unlockedAnimations.map(animation => (
            <span key={animation} className="animation-tag">
              {animation}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

interface RemindersTabProps {
  reminders: Reminder[];
  onCreatePreset: (type: ReminderType) => void;
  onToggle: (reminderId: string, isActive: boolean) => void;
  onDelete: (reminderId: string) => void;
}

const RemindersTab: React.FC<RemindersTabProps> = ({ 
  reminders, 
  onCreatePreset, 
  onToggle, 
  onDelete 
}) => {
  const validPresetTypes: ReminderType[] = ['pomodoro', 'posture', 'water', 'eye-rest', 'test'];
  const presetTypes: { type: ReminderType; label: string; description: string }[] = [
    { type: 'pomodoro', label: 'Pomodoro', description: '25min work / 5min break' },
    { type: 'posture', label: 'Posture Check', description: 'Hourly posture reminder' },
    { type: 'water', label: 'Water Break', description: 'Every 2 hours' },
    { type: 'eye-rest', label: 'Eye Rest', description: '20-20-20 rule' },
    { type: 'test', label: 'Test (10s)', description: 'Test reminder - triggers in 10 seconds' }
  ];

  function handleCreatePreset(type: ReminderType) {
    if (!validPresetTypes.includes(type)) {
      console.warn('Invalid preset reminder type:', type);
      return;
    }
    onCreatePreset(type);
  }

  return (
    <div className="reminders-tab">
      <div className="preset-reminders">
        <h3>Quick Reminders</h3>
        <div className="preset-grid">
          {presetTypes.map(preset => (
            <button
              key={preset.type}
              onClick={() => handleCreatePreset(preset.type)}
              className="preset-button"
            >
              <strong>{preset.label}</strong>
              <span>{preset.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="active-reminders">
        <h3>Active Reminders</h3>
        {reminders.length === 0 ? (
          <p>No reminders set. Create one above!</p>
        ) : (
          <div className="reminder-list">
            {reminders.map(reminder => (
              <div key={reminder.id} className="reminder-item">
                <div className="reminder-info">
                  <h4>{reminder.title || 'Untitled Reminder'}</h4>
                  <p>{reminder.message && reminder.message.trim() ? reminder.message : <em>No message set</em>}</p>
                  <small>
                    {reminder.frequency} • {reminder.type}
                  </small>
                </div>
                <div className="reminder-actions">
                  {reminder.id && (
                    <>
                      <button
                        onClick={() => onToggle(reminder.id, !reminder.isActive)}
                        className={reminder.isActive ? 'active' : 'inactive'}
                      >
                        {reminder.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await onDelete(reminder.id);
                          } catch (err) {
                            console.error('Failed to delete reminder:', err);
                          }
                        }}
                        className="delete-button"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface SettingsTabProps {
  settings: UserSettings;
  sendMessage: (type: string, data?: any) => Promise<any>;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings | null>>;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ settings, sendMessage, setSettings }) => {
  const [selectedPet, setSelectedPet] = useState(settings.petType);
  const [petName, setPetName] = useState(settings.petName);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [visualEffectsEnabled, setVisualEffectsEnabled] = useState(settings.visualEffectsEnabled);
  const [trackingEnabled, setTrackingEnabled] = useState(settings.focusTracking.enabled);
  const [treatRewardInterval, setTreatRewardInterval] = useState(settings.focusTracking.treatRewardInterval);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Update local state when settings prop changes
  useEffect(() => {
    setSelectedPet(settings.petType);
    setPetName(settings.petName);
    setSoundEnabled(settings.soundEnabled);
    setVisualEffectsEnabled(settings.visualEffectsEnabled);
    setTrackingEnabled(settings.focusTracking.enabled);
    setTreatRewardInterval(settings.focusTracking.treatRewardInterval);
  }, [settings]);

  const handlePetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPet(e.target.value as PetType);
  };
  const handlePetNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPetName(e.target.value);
  };
  const handleSoundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSoundEnabled(e.target.checked);
  };
  const handleVisualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVisualEffectsEnabled(e.target.checked);
  };
  const handleTrackingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTrackingEnabled(e.target.checked);
  };
  const handleTreatIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTreatRewardInterval(Number(e.target.value));
  };

  const saveSettings = async () => {
    if (!isExtension) return;
    
    setSaving(true);
    setSaveStatus('idle');
    
    try {
      const updatedSettings: UserSettings = {
        ...settings,
        petType: selectedPet,
        petName: petName,
        soundEnabled: soundEnabled,
        visualEffectsEnabled: visualEffectsEnabled,
        focusTracking: {
          ...settings.focusTracking,
          enabled: trackingEnabled,
          treatRewardInterval: Number(treatRewardInterval), // Ensure this is a number
        }
      };
      
      console.log('Saving settings:', updatedSettings);
      await sendMessage('UPDATE_USER_SETTINGS', { data: updatedSettings });
      
      // Verify the settings were saved by reading them back
      const savedSettings = await sendMessage('GET_USER_SETTINGS');
      console.log('Settings after save:', savedSettings);
      
      // Update the parent component's settings state
      setSettings(updatedSettings);
      
      setSaveStatus('success');
      
      // Reset success message after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
      
      // Reset error message after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-tab">
      <h3>Pet Settings</h3>
      <div className="setting-item">
        <label>Pet Type</label>
        <select value={selectedPet} onChange={handlePetChange}>
          {petTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
      <div className="setting-item">
        <label>Pet Name</label>
        <input type="text" value={petName} onChange={handlePetNameChange} />
      </div>

      <h3>Notifications</h3>
      <div className="setting-item">
        <label>Sound Enabled</label>
        <input type="checkbox" checked={soundEnabled} onChange={handleSoundChange} />
      </div>
      <div className="setting-item">
        <label>Visual Effects</label>
        <input type="checkbox" checked={visualEffectsEnabled} onChange={handleVisualChange} />
      </div>

      <h3>Focus Tracking</h3>
      <div className="setting-item">
        <label>Tracking Enabled</label>
        <input type="checkbox" checked={trackingEnabled} onChange={handleTrackingChange} />
      </div>
      <div className="setting-item">
        <label>Treat Reward Interval</label>
        <input type="number" min={1} value={treatRewardInterval} onChange={handleTreatIntervalChange} style={{ width: 60 }} /> minutes
      </div>

      <div className="settings-actions">
        <button 
          onClick={saveSettings}
          disabled={saving}
          className="save-button"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        
        {saveStatus === 'success' && (
          <span className="save-status success">✓ Settings saved!</span>
        )}
        {saveStatus === 'error' && (
          <span className="save-status error">✗ Failed to save settings</span>
        )}
      </div>

      <p className="settings-note">
        Settings are now saved permanently and will persist across browser sessions.
      </p>
    </div>
  );
};

// Render the popup
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
} 