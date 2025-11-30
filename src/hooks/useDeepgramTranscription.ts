import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TranscriptionResult {
  text: string;
  error?: string;
}

export const useDeepgramTranscription = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const transcribe = useCallback(async (audioBlob: Blob): Promise<TranscriptionResult> => {
    setIsProcessing(true);

    try {
      // Create form data with audio
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      // Call edge function
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: formData,
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Transcription failed');
      }

      return { text: data.text };
    } catch (error) {
      console.error('Transcription error:', error);
      return {
        text: '',
        error: error.message || 'Failed to transcribe audio',
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    transcribe,
    isProcessing,
    // These are kept for API compatibility but not used with Deepgram
    isLoading: false,
    modelLoaded: true,
    loadProgress: 100,
  };
};
