import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const haptics = {
  light: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      // Haptics not available (browser)
    }
  },
  medium: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      // Haptics not available (browser)
    }
  },
  heavy: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) {
      // Haptics not available (browser)
    }
  },
};
