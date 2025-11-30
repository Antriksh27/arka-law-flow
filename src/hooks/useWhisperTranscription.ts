import { useState, useRef, useCallback } from 'react';
import { pipeline } from '@huggingface/transformers';

export interface TranscriptionResult {
  text: string;
  error?: string;
}

export const useWhisperTranscription = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const pipelineRef = useRef<any>(null);

  const initializeModel = useCallback(async () => {
    if (pipelineRef.current) return;

    setIsLoading(true);
    setLoadProgress(0);

    try {
      // Use tiny model for faster loading, or small for better quality
      pipelineRef.current = await pipeline(
        'automatic-speech-recognition',
        'onnx-community/whisper-tiny.en',
        {
          device: 'webgpu', // Will fallback to WASM if WebGPU not available
          progress_callback: (progress: any) => {
            if (progress.status === 'progress') {
              const percent = Math.round((progress.loaded / progress.total) * 100);
              setLoadProgress(percent);
            }
          },
        }
      );

      setModelLoaded(true);
    } catch (error) {
      console.error('Failed to load Whisper model:', error);
      throw new Error('Failed to initialize speech recognition model');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const transcribe = useCallback(async (audioBlob: Blob): Promise<TranscriptionResult> => {
    if (!pipelineRef.current) {
      await initializeModel();
    }

    setIsProcessing(true);

    try {
      // Convert blob to array buffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Transcribe the audio
      const result = await pipelineRef.current(arrayBuffer);

      return {
        text: result.text.trim(),
      };
    } catch (error) {
      console.error('Transcription error:', error);
      return {
        text: '',
        error: 'Failed to transcribe audio. Please try again.',
      };
    } finally {
      setIsProcessing(false);
    }
  }, [initializeModel]);

  return {
    transcribe,
    isLoading,
    isProcessing,
    modelLoaded,
    loadProgress,
    initializeModel,
  };
};
