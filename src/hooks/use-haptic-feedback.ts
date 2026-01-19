import { useCallback } from 'react';

type HapticStyle = 'light' | 'medium' | 'heavy';

const vibrationDurations: Record<HapticStyle, number> = {
  light: 10,
  medium: 20,
  heavy: 30,
};

export function useHapticFeedback() {
  const trigger = useCallback((style: HapticStyle = 'light') => {
    // Check if vibration API is available (mobile devices)
    if ('vibrate' in navigator) {
      navigator.vibrate(vibrationDurations[style]);
    }
  }, []);

  return { trigger };
}
