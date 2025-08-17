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
    if (!this.isEnabled) {
      console.log('🔇 Sounds disabled, skipping tone generation');
      return;
    }

    try {
      const audioContext = this.getAudioContext();
      
      // Resume audio context if suspended (required for Chrome)
      if (audioContext.state === 'suspended') {
        console.log('🎵 Resuming suspended audio context...');
        await audioContext.resume();
      }

      console.log('🎵 Generating tone - frequency:', frequency, 'duration:', duration, 'volume:', volume);
      console.log('🎵 Audio context state:', audioContext.state);

      if (audioContext.state !== 'running') {
        console.error('🔇 Audio context not running:', audioContext.state);
        return;
      }

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
      
      console.log('🔊 Sound generated successfully');
      
      // Return a promise that resolves when the sound finishes
      return new Promise(resolve => {
        setTimeout(resolve, duration * 1000);
      });
    } catch (error) {
      console.error('🔇 Failed to play notification sound:', error);
    }
  }

  // Play sound based on notification type
  static async playProminentSound(type: NotificationSoundType, volume: number = 0.6): Promise<void> {
    console.log('🔊 NotificationSounds.playProminentSound called with type:', type, 'enabled:', this.isEnabled);
    
    if (!this.isEnabled) {
      console.log('🔇 Notification sounds are disabled');
      return;
    }

    try {
      const audioContext = this.getAudioContext();
      if (audioContext.state === 'suspended') {
        console.log('🎵 Audio context suspended, attempting to resume...');
        await audioContext.resume();
        console.log('🎵 Audio context state after resume:', audioContext.state);
      }

      console.log('🎵 Playing prominent notification sound:', type);

      switch (type) {
        case 'success':
          // Pleasant ascending chord progression
          await this.playChord([523.25, 659.25, 783.99], 0.4, volume); // C5, E5, G5
          setTimeout(() => this.playChord([659.25, 783.99, 987.77], 0.4, volume), 200); // E5, G5, B5
          break;

        case 'error':
          // Urgent descending tones
          await this.playTone(659.25, 0.2, volume, 'sawtooth'); // E5
          setTimeout(() => this.playTone(554.37, 0.2, volume, 'sawtooth'), 150); // C#5
          setTimeout(() => this.playTone(440, 0.3, volume, 'sawtooth'), 300); // A4
          break;

        case 'warning':
          // Attention-grabbing double tone with vibrato
          await this.playToneWithVibrato(880, 0.25, volume, 5); // A5 with vibrato
          setTimeout(() => this.playToneWithVibrato(880, 0.25, volume, 5), 300);
          break;

        case 'info':
        case 'default':
        default:
          // Professional notification sound - like system notifications
          await this.playNotificationMelody(volume);
          break;
      }
    } catch (error) {
      console.error('🔊 Error playing notification sound:', error);
    }
  }

  // Enhanced tone generation with different waveforms
  private static async playTone(frequency: number, duration: number, volume: number, waveform: OscillatorType = 'sine'): Promise<void> {
    const audioContext = this.getAudioContext();
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = waveform;

    // Enhanced envelope for more professional sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);

    return new Promise(resolve => {
      setTimeout(resolve, duration * 1000);
    });
  }

  // Play multiple frequencies simultaneously (chord)
  private static async playChord(frequencies: number[], duration: number, volume: number): Promise<void> {
    const audioContext = this.getAudioContext();
    const promises = frequencies.map(frequency => {
      return new Promise<void>(resolve => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sine';

        // Distribute volume across multiple oscillators
        const chordVolume = volume / frequencies.length;
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(chordVolume, audioContext.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);

        setTimeout(resolve, duration * 1000);
      });
    });

    await Promise.all(promises);
  }

  // Add vibrato effect for attention-grabbing sounds
  private static async playToneWithVibrato(frequency: number, duration: number, volume: number, vibratoRate: number): Promise<void> {
    const audioContext = this.getAudioContext();
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const vibratoOsc = audioContext.createOscillator();
    const vibratoGain = audioContext.createGain();

    // Set up vibrato
    vibratoOsc.frequency.setValueAtTime(vibratoRate, audioContext.currentTime);
    vibratoGain.gain.setValueAtTime(10, audioContext.currentTime); // Vibrato depth

    vibratoOsc.connect(vibratoGain);
    vibratoGain.connect(oscillator.frequency);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

    vibratoOsc.start(audioContext.currentTime);
    oscillator.start(audioContext.currentTime);
    
    vibratoOsc.stop(audioContext.currentTime + duration);
    oscillator.stop(audioContext.currentTime + duration);

    return new Promise(resolve => {
      setTimeout(resolve, duration * 1000);
    });
  }

  // Professional notification melody similar to system sounds
  private static async playNotificationMelody(volume: number): Promise<void> {
    // Play a pleasant ascending melody
    const notes = [
      { freq: 659.25, duration: 0.15 }, // E5
      { freq: 783.99, duration: 0.15 }, // G5
      { freq: 1046.5, duration: 0.25 }  // C6
    ];

    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      await this.playTone(note.freq, note.duration, volume * 0.8, 'sine');
      if (i < notes.length - 1) {
        // Small gap between notes
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  // Main play function - now uses prominent sounds
  static async play(type: NotificationSoundType = 'default'): Promise<void> {
    return this.playProminentSound(type, 0.7); // Higher default volume
  }

  // Method to test sound system (requires user interaction) - now uses prominent sounds
  static async testSound(): Promise<boolean> {
    try {
      console.log('🧪 Testing NEW prominent notification sound system...');
      const audioContext = this.getAudioContext();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      console.log('🧪 Audio context state:', audioContext.state);
      
      if (audioContext.state === 'running') {
        // Test the new prominent notification sound
        console.log('🧪 Playing new prominent test sound...');
        await this.playProminentSound('info', 0.8);
        console.log('🧪 New prominent test sound completed successfully');
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