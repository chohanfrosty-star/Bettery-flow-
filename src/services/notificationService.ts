import { Sound } from './soundService';
import { StorageService } from './storageService';

export interface ToastAlert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
  timestamp: number;
}

export class NotificationService {
  private static instance: NotificationService;
  private toastListeners: Set<(toasts: ToastAlert[]) => void> = new Set();
  private activeToasts: ToastAlert[] = [];
  private lastAlertTimestamp: Record<string, number> = {};

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const res = await Notification.requestPermission();
      return res === 'granted';
    } catch {
      return false;
    }
  }

  public hasPermission(): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    return Notification.permission === 'granted';
  }

  public triggerAlert(
    alertKey: string,
    title: string,
    message: string,
    severity: ToastAlert['severity'] = 'info',
    cooldownMs = 60000
  ) {
    const now = Date.now();
    const lastSent = this.lastAlertTimestamp[alertKey] || 0;
    if (now - lastSent < cooldownMs) {
      return; // prevent spam
    }
    this.lastAlertTimestamp[alertKey] = now;

    // Send native system notification if granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico',
        });
      } catch {
        // Fallback silently if blocked
      }
    }

    // Add to in-app toast alerts
    const toast: ToastAlert = {
      id: `toast-${now}-${Math.random().toString(36).substr(2, 4)}`,
      title,
      message,
      severity,
      timestamp: now,
    };

    this.activeToasts = [toast, ...this.activeToasts].slice(0, 3);
    this.notifyToasts();

    // Play alert sound according to user selected profile
    try {
      const settings = StorageService.getAppSettings();
      const profile = settings?.alerts?.soundProfile || settings?.soundProfile || 'Minimal';
      Sound.playSound(profile);
    } catch {
      // Ignore audio failure
    }

    // Auto dismiss after 5s
    setTimeout(() => {
      this.dismissToast(toast.id);
    }, 5000);
  }

  public dismissToast(id: string) {
    this.activeToasts = this.activeToasts.filter((t) => t.id !== id);
    this.notifyToasts();
  }

  public subscribeToasts(cb: (toasts: ToastAlert[]) => void): () => void {
    this.toastListeners.add(cb);
    cb(this.activeToasts);
    return () => this.toastListeners.delete(cb);
  }

  private notifyToasts() {
    this.toastListeners.forEach((cb) => cb(this.activeToasts));
  }
}
