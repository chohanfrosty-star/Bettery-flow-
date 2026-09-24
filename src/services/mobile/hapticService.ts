/**
 * Native Haptic Feedback Service for Mobile Devices
 * Supports Android navigator.vibrate with graceful fallback
 */

export const HapticService = {
  /**
   * Subtle tick for tab switches, segmented buttons, and chips
   */
  light(): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch {
        // Ignored if user has disabled vibrations or browser restricts it
      }
    }
  },

  /**
   * Distinct click for buttons, toggles, and modal interactions
   */
  medium(): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(16);
      } catch {
        // Ignored
      }
    }
  },

  /**
   * Prominent feedback for destructive actions or important triggers
   */
  heavy(): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(30);
      } catch {
        // Ignored
      }
    }
  },

  /**
   * Dual-pulse success confirmation
   */
  success(): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([10, 40, 15]);
      } catch {
        // Ignored
      }
    }
  },

  /**
   * Alert or warning vibration sequence
   */
  warning(): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([25, 40, 25]);
      } catch {
        // Ignored
      }
    }
  },
};
