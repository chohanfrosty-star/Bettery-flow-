import { NotificationSoundProfile } from '../types';

class SoundService {
  private static instance: SoundService;
  private audioCtx: AudioContext | null = null;

  private constructor() {}

  public static getInstance(): SoundService {
    if (!SoundService.instance) {
      SoundService.instance = new SoundService();
    }
    return SoundService.instance;
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public playSound(profile: NotificationSoundProfile = 'Minimal'): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (profile === 'Minimal') {
        // Minimal: Elegant, pure dual-tone sine chime
        this.playMinimalChime(ctx, now);
      } else if (profile === 'Technical') {
        // Technical: Precision tri-tone cyber telemetry blip
        this.playTechnicalChirp(ctx, now);
      } else if (profile === 'Analog') {
        // Analog: Warm resonant acoustic vintage bell with overtones
        this.playAnalogBell(ctx, now);
      }
    } catch {
      // Audio playback fails gracefully if browser blocks before user interaction
    }
  }

  private playMinimalChime(ctx: AudioContext, start: number): void {
    // Primary Tone: 880Hz (A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, start);
    gain1.gain.setValueAtTime(0, start);
    gain1.gain.linearRampToValueAtTime(0.18, start + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(start);
    osc1.stop(start + 0.23);

    // Harmonic Ascent: 1318.5Hz (E6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.5, start + 0.07);
    gain2.gain.setValueAtTime(0, start + 0.07);
    gain2.gain.linearRampToValueAtTime(0.14, start + 0.085);
    gain2.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(start + 0.07);
    osc2.stop(start + 0.36);
  }

  private playTechnicalChirp(ctx: AudioContext, start: number): void {
    const notes = [
      { freq: 1760, offset: 0, dur: 0.05 },
      { freq: 2349, offset: 0.045, dur: 0.05 },
      { freq: 3136, offset: 0.09, dur: 0.09 },
    ];

    notes.forEach(({ freq, offset, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq, start + offset);
      filter.Q.setValueAtTime(4.0, start + offset);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start + offset);

      gain.gain.setValueAtTime(0, start + offset);
      gain.gain.linearRampToValueAtTime(0.15, start + offset + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, start + offset + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start + offset);
      osc.stop(start + offset + dur + 0.01);
    });
  }

  private playAnalogBell(ctx: AudioContext, start: number): void {
    // Warm low-pass filter to give authentic vintage analog tube timbre
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, start);
    filter.connect(ctx.destination);

    // Fundamental body: 440Hz (A4)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(440, start);
    gain1.gain.setValueAtTime(0, start);
    gain1.gain.linearRampToValueAtTime(0.25, start + 0.01);
    gain1.gain.exponentialRampToValueAtTime(0.001, start + 0.65);
    osc1.connect(gain1);
    gain1.connect(filter);
    osc1.start(start);
    osc1.stop(start + 0.66);

    // Warm sub-octave: 220Hz (A3)
    const oscSub = ctx.createOscillator();
    const gainSub = ctx.createGain();
    oscSub.type = 'sine';
    oscSub.frequency.setValueAtTime(220, start);
    gainSub.gain.setValueAtTime(0, start);
    gainSub.gain.linearRampToValueAtTime(0.12, start + 0.015);
    gainSub.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
    oscSub.connect(gainSub);
    gainSub.connect(filter);
    oscSub.start(start);
    oscSub.stop(start + 0.46);

    // Acoustic overtone shimmer: 884Hz (slight acoustic detuning)
    const oscOvertone = ctx.createOscillator();
    const gainOvertone = ctx.createGain();
    oscOvertone.type = 'sine';
    oscOvertone.frequency.setValueAtTime(884, start);
    gainOvertone.gain.setValueAtTime(0, start);
    gainOvertone.gain.linearRampToValueAtTime(0.08, start + 0.01);
    gainOvertone.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
    oscOvertone.connect(gainOvertone);
    gainOvertone.connect(filter);
    oscOvertone.start(start);
    oscOvertone.stop(start + 0.51);
  }
}

export const Sound = SoundService.getInstance();
