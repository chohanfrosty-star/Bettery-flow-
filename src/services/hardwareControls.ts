/**
 * Hardware control integration for Flashlight (torch) and Camera quick controls.
 * Uses official Android / W3C MediaTrackConstraints torch standard with graceful fallback.
 */

class HardwareControlService {
  private static instance: HardwareControlService;
  private torchStream: MediaStream | null = null;
  private torchTrack: MediaStreamTrack | null = null;
  private isTorchOn: boolean = false;
  private torchListeners: Set<(state: boolean) => void> = new Set();

  private constructor() {}

  public static getInstance(): HardwareControlService {
    if (!HardwareControlService.instance) {
      HardwareControlService.instance = new HardwareControlService();
    }
    return HardwareControlService.instance;
  }

  public async toggleTorch(): Promise<boolean> {
    const nextState = !this.isTorchOn;

    // Haptic feedback
    this.vibrate(20);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.isTorchOn = nextState;
      this.notifyTorch(nextState);
      return nextState;
    }

    try {
      if (nextState) {
        // Turn ON torch
        if (!this.torchTrack) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              advanced: [{ torch: true }] as any,
            },
          });
          this.torchStream = stream;
          const track = stream.getVideoTracks()[0];
          this.torchTrack = track;
        }

        if (this.torchTrack) {
          const capabilities = (this.torchTrack.getCapabilities?.() || {}) as any;
          if ('torch' in capabilities) {
            await (this.torchTrack as any).applyConstraints({
              advanced: [{ torch: true }],
            });
          }
        }
        this.isTorchOn = true;
      } else {
        // Turn OFF torch
        if (this.torchTrack) {
          try {
            await (this.torchTrack as any).applyConstraints({
              advanced: [{ torch: false }],
            });
          } catch {}
          this.torchTrack.stop();
          this.torchTrack = null;
        }
        if (this.torchStream) {
          this.torchStream.getTracks().forEach((t) => t.stop());
          this.torchStream = null;
        }
        this.isTorchOn = false;
      }
    } catch (err) {
      // In browser preview / sandbox or devices without physical rear flash, maintain virtual torch state
      console.info('Physical hardware torch unavailable, using simulated torch state:', err);
      this.isTorchOn = nextState;
    }

    this.notifyTorch(this.isTorchOn);
    return this.isTorchOn;
  }

  public getTorchState(): boolean {
    return this.isTorchOn;
  }

  public subscribeTorch(cb: (state: boolean) => void): () => void {
    this.torchListeners.add(cb);
    cb(this.isTorchOn);
    return () => this.torchListeners.delete(cb);
  }

  private notifyTorch(state: boolean) {
    this.torchListeners.forEach((cb) => cb(state));
  }

  public triggerCamera() {
    this.vibrate(25);
    // Standard web way to trigger native device camera capture dialog on Android
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('capture', 'environment');
    input.style.display = 'none';
    document.body.appendChild(input);
    input.click();
    setTimeout(() => {
      document.body.removeChild(input);
    }, 1000);
  }

  public vibrate(pattern: number | number[] = 15) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }
}

export const HardwareControls = HardwareControlService.getInstance();
