export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async startRecording(): Promise<void> {
    try {
      // Clean up any previous recording
      this.cleanup();
      
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      
      // Check for supported mimeTypes
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        console.log('Audio data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
      };
      
      // Start recording with timeslice to get data in chunks
      this.mediaRecorder.start(1000);
      console.log('Recording started with mimeType:', mimeType);
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw new Error('Could not access microphone');
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        console.error('No mediaRecorder found');
        reject(new Error('No recording in progress'));
        return;
      }

      if (this.mediaRecorder.state === 'inactive') {
        console.error('MediaRecorder is inactive');
        reject(new Error('Recording already stopped'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        console.log('Recording stopped, chunks:', this.audioChunks.length);
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        console.log('Created audio blob:', audioBlob.size, 'bytes');
        this.cleanup();
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  isRecording(): boolean {
    return this.mediaRecorder !== null && this.mediaRecorder.state === 'recording';
  }
}
