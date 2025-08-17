// Notification sounds utility
export type NotificationSoundType = 'success' | 'error' | 'warning' | 'info' | 'default';

export class NotificationSounds {
  private static audioContext: AudioContext | null = null;
  private static isEnabled = true;

  private static getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  static setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    // Save preference
    localStorage.setItem('notification-sounds-enabled', enabled.toString());
  }

  static isAudioEnabled(): boolean {
    return this.isEnabled;
  }

  // Generate different notification sounds based on type
  private static async generateTone(frequency: number, duration: number, volume: number = 0.3): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const audioContext = this.getAudioContext();
      
      // Resume audio context if suspended (required for Chrome)
      if (audioContext.state === 'suspended') {
        console.log('Resuming audio context...');
        await audioContext.resume();
      }

      console.log('Audio context state:', audioContext.state);

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';

      // Smooth volume envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
      
      console.log('Sound generated successfully');
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  // Play sound based on notification type
  static async play(type: NotificationSoundType = 'default'): Promise<void> {
    console.log('🔊 NotificationSounds.play called with type:', type, 'enabled:', this.isEnabled);
    
    if (!this.isEnabled) {
      console.log('🔇 Notification sounds are disabled');
      return;
    }

    try {
      // Check if we need user interaction first
      const audioContext = this.getAudioContext();
      if (audioContext.state === 'suspended') {
        console.log('🎵 Audio context suspended, attempting to resume...');
        await audioContext.resume();
        console.log('🎵 Audio context state after resume:', audioContext.state);
      }

      console.log('🎵 Playing notification sound:', type);

      switch (type) {
        case 'success':
          // Pleasant ascending tones
          await this.generateTone(523.25, 0.15, 0.2); // C5
          setTimeout(() => this.generateTone(659.25, 0.15, 0.2), 100); // E5
          break;

        case 'error':
          // Lower, more serious tone
          await this.generateTone(220, 0.3, 0.25); // A3
          break;

        case 'warning':
          // Double beep
          await this.generateTone(440, 0.15, 0.2); // A4
          setTimeout(() => this.generateTone(440, 0.15, 0.2), 200);
          break;

        case 'info':
          // Single soft tone
          await this.generateTone(523.25, 0.2, 0.15); // C5
          break;

        case 'default':
        default:
          // Standard notification tone
          await this.generateTone(800, 0.2, 0.2);
          break;
      }
    } catch (error) {
      console.error('🔊 Error playing notification sound:', error);
    }
  }

  // Method to test sound system (requires user interaction)
  static async testSound(): Promise<boolean> {
    try {
      console.log('🧪 Testing notification sound system...');
      const audioContext = this.getAudioContext();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      console.log('🧪 Audio context state:', audioContext.state);
      
      if (audioContext.state === 'running') {
        await this.generateTone(440, 0.2, 0.2);
        console.log('🧪 Test sound completed successfully');
        return true;
      } else {
        console.log('🧪 Audio context not running:', audioContext.state);
        return false;
      }
    } catch (error) {
      console.error('🧪 Test sound failed:', error);
      return false;
    }
  }

  // Quick convenience methods
  static success() { return this.play('success'); }
  static error() { return this.play('error'); }
  static warning() { return this.play('warning'); }
  static info() { return this.play('info'); }
  static default() { return this.play('default'); }
}

// Initialize with user preference (could be stored in localStorage)
const savedPreference = localStorage.getItem('notification-sounds-enabled');
if (savedPreference !== null) {
  NotificationSounds.setEnabled(savedPreference === 'true');
}

export default NotificationSounds;