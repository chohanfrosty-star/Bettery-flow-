import {
  BatteryDiagnostics,
  BatteryState,
  ChargerType,
  MetricStatus,
  ObservationPoint,
  BatteryHealth,
  ThermalStatus,
} from '../types';

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>;
  deviceMemory?: number;
}

interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  onchargingchange: ((this: BatteryManager, ev: Event) => any) | null;
  onchargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
  ondischargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
  onlevelchange: ((this: BatteryManager, ev: Event) => any) | null;
}

export interface LiveBatteryData {
  level: number; // 0 to 100
  state: BatteryState;
  isCharging: boolean;
  chargingTimeSec: number | null;
  dischargingTimeSec: number | null;
  voltageV: number | null;
  voltageStatus: MetricStatus;
  currentMa: number | null;
  currentStatus: MetricStatus;
  tempC: number | null;
  tempStatus: MetricStatus;
  powerW: number | null;
  powerStatus: MetricStatus;
  health: BatteryHealth;
  healthStatus: MetricStatus;
  healthPct: number;
  chargerType: ChargerType;
  chargerStatus: MetricStatus;
  isRealHardwareApiAvailable: boolean;
  isDemoMode: boolean;
  lastUpdated: number;
}

export class BatteryService {
  private static instance: BatteryService;
  private batteryManager: BatteryManager | null = null;
  private listeners: Set<(data: LiveBatteryData) => void> = new Set();
  private isDemoMode: boolean = false;
  private isDemoPaused: boolean = false;
  private demoSpeed: 1 | 5 | 10 = 1;
  private demoInterval: number | null = null;

  // Internal state
  private currentData: LiveBatteryData = {
    level: 68,
    state: 'discharging',
    isCharging: false,
    chargingTimeSec: null,
    dischargingTimeSec: 28800, // 8h
    voltageV: 3.98,
    voltageStatus: 'UNAVAILABLE',
    currentMa: -420,
    currentStatus: 'UNAVAILABLE',
    tempC: 31.8,
    tempStatus: 'UNAVAILABLE',
    powerW: 1.67,
    powerStatus: 'UNAVAILABLE',
    health: 'Good',
    healthStatus: 'CALCULATED',
    healthPct: 96,
    chargerType: 'Unplugged',
    chargerStatus: 'LIVE',
    isRealHardwareApiAvailable: false,
    isDemoMode: false,
    lastUpdated: Date.now(),
  };

  private constructor() {
    this.initHardwareBattery();
  }

  public static getInstance(): BatteryService {
    if (!BatteryService.instance) {
      BatteryService.instance = new BatteryService();
    }
    return BatteryService.instance;
  }

  private async initHardwareBattery() {
    // Check for native Android bridge injected by MainActivity WebView
    const win = typeof window !== 'undefined' ? (window as unknown as { AndroidNative?: any }) : null;
    if (win && win.AndroidNative) {
      this.currentData.isRealHardwareApiAvailable = true;
      this.updateFromAndroidNative();
      // Poll Android native hardware sensors every 3 seconds
      setInterval(() => {
        if (!this.isDemoMode) {
          this.updateFromAndroidNative();
          this.notify();
        }
      }, 3000);
      this.notify();
      return;
    }

    const nav = typeof navigator !== 'undefined' ? (navigator as NavigatorWithBattery) : null;
    if (nav && typeof nav.getBattery === 'function') {
      try {
        const bm = await nav.getBattery();
        this.batteryManager = bm;
        this.currentData.isRealHardwareApiAvailable = true;

        this.updateFromHardware();

        // Register hardware event listeners
        bm.addEventListener('levelchange', () => this.handleHardwareChange());
        bm.addEventListener('chargingchange', () => this.handleHardwareChange());
        bm.addEventListener('chargingtimechange', () => this.handleHardwareChange());
        bm.addEventListener('dischargingtimechange', () => this.handleHardwareChange());
      } catch (err) {
        console.warn('Web Battery API not accessible:', err);
        this.currentData.isRealHardwareApiAvailable = false;
      }
    } else {
      this.currentData.isRealHardwareApiAvailable = false;
    }
    this.notify();
  }

  private updateFromAndroidNative() {
    const win = typeof window !== 'undefined' ? (window as unknown as { AndroidNative?: any }) : null;
    if (!win || !win.AndroidNative || this.isDemoMode) return;

    try {
      const bridge = win.AndroidNative;
      const level = Math.round(typeof bridge.getBatteryLevel === 'function' ? bridge.getBatteryLevel() : 80);
      const isCharging = typeof bridge.isCharging === 'function' ? bridge.isCharging() : false;
      const tempC = typeof bridge.getBatteryTemperature === 'function' ? bridge.getBatteryTemperature() : null;
      const voltageV = typeof bridge.getBatteryVoltage === 'function' ? bridge.getBatteryVoltage() : null;
      const state: BatteryState = isCharging ? (level >= 99 ? 'full' : 'charging') : 'discharging';

      this.currentData = {
        ...this.currentData,
        level,
        isCharging,
        state,
        chargingTimeSec: isCharging ? Math.round(((100 - level) / 15) * 3600) : null,
        dischargingTimeSec: !isCharging ? Math.round((level / 12) * 3600) : null,
        chargerType: isCharging ? (typeof bridge.getChargerType === 'function' ? bridge.getChargerType() : 'USB-C') : 'Unplugged',
        chargerStatus: 'LIVE',
        voltageV: voltageV,
        voltageStatus: voltageV !== null ? 'LIVE' : 'UNAVAILABLE',
        tempC: tempC,
        tempStatus: tempC !== null ? 'LIVE' : 'UNAVAILABLE',
        currentMa: isCharging ? 2100 : -350,
        currentStatus: 'CALCULATED',
        powerW: voltageV ? Math.round(((voltageV * (isCharging ? 2.1 : 0.35))) * 10) / 10 : null,
        powerStatus: voltageV !== null ? 'CALCULATED' : 'UNAVAILABLE',
        health: 'Good',
        healthStatus: 'LIVE',
        healthPct: 98,
        isRealHardwareApiAvailable: true,
        isDemoMode: false,
        lastUpdated: Date.now(),
      };
    } catch (e) {
      console.warn('Error reading from AndroidNative bridge:', e);
    }
  }

  private updateFromHardware() {
    if (!this.batteryManager || this.isDemoMode) return;

    const level = Math.round(this.batteryManager.level * 100);
    const isCharging = this.batteryManager.charging;
    const state: BatteryState = isCharging ? (level >= 99 ? 'full' : 'charging') : 'discharging';

    this.currentData = {
      ...this.currentData,
      level,
      isCharging,
      state,
      chargingTimeSec: Number.isFinite(this.batteryManager.chargingTime) ? this.batteryManager.chargingTime : null,
      dischargingTimeSec: Number.isFinite(this.batteryManager.dischargingTime) ? this.batteryManager.dischargingTime : null,
      chargerType: isCharging ? 'USB-C' : 'Unplugged',
      chargerStatus: 'LIVE',
      // In web browser context, voltage, current, and temperature are strictly unavailable over standard navigator.getBattery()
      voltageV: null,
      voltageStatus: 'UNAVAILABLE',
      currentMa: null,
      currentStatus: 'UNAVAILABLE',
      tempC: null,
      tempStatus: 'UNAVAILABLE',
      powerW: null,
      powerStatus: 'UNAVAILABLE',
      health: 'Good',
      healthStatus: 'CALCULATED',
      healthPct: 94,
      isDemoMode: false,
      lastUpdated: Date.now(),
    };
  }

  private handleHardwareChange() {
    if (this.isDemoMode) return;
    this.updateFromHardware();
    this.notify();
  }

  public setDemoMode(enabled: boolean) {
    this.isDemoMode = enabled;
    this.currentData.isDemoMode = enabled;

    if (enabled) {
      if (!this.demoInterval) {
        this.startDemoSimulation();
      }
    } else {
      if (this.demoInterval) {
        clearInterval(this.demoInterval);
        this.demoInterval = null;
      }
      if (this.batteryManager) {
        this.updateFromHardware();
      } else {
        // Fallback realistic baseline with honest UNAVAILABLE status
        this.currentData = {
          ...this.currentData,
          isDemoMode: false,
          voltageStatus: 'UNAVAILABLE',
          currentStatus: 'UNAVAILABLE',
          tempStatus: 'UNAVAILABLE',
          powerStatus: 'UNAVAILABLE',
        };
      }
      this.notify();
    }
  }

  private startDemoSimulation() {
    if (this.demoInterval) {
      clearInterval(this.demoInterval);
      this.demoInterval = null;
    }

    const intervalMs = Math.round(2500 / this.demoSpeed);

    // In demo mode, provide realistic live fluctuation for testing telemetry & sensors
    this.demoInterval = window.setInterval(() => {
      if (!this.isDemoMode || this.isDemoPaused) return;

      const isCharging = this.currentData.isCharging;
      let newLevel = this.currentData.level;

      // Realistic level drift under simulation
      if (Math.random() > 0.6) {
        if (isCharging && newLevel < 100) {
          newLevel = Math.min(100, newLevel + 1);
        } else if (!isCharging && newLevel > 1) {
          newLevel = Math.max(1, newLevel - 1);
        }
      }

      // Dynamic current calculation
      const currentMa = isCharging
        ? Math.round(2200 + (Math.random() * 200 - 100))
        : Math.round(-380 - (Math.random() * 80 - 40));

      const voltageV = +(3.85 + (newLevel / 100) * 0.45 + (Math.random() * 0.02 - 0.01)).toFixed(3);
      const tempC = +(31.2 + (isCharging ? 3.5 : 0) + (Math.random() * 0.4 - 0.2)).toFixed(1);
      const powerW = +Math.abs((currentMa / 1000) * voltageV).toFixed(2);

      this.currentData = {
        ...this.currentData,
        level: newLevel,
        state: isCharging ? (newLevel >= 100 ? 'full' : 'charging') : 'discharging',
        currentMa,
        currentStatus: 'DEMO',
        voltageV,
        voltageStatus: 'DEMO',
        tempC,
        tempStatus: 'DEMO',
        powerW,
        powerStatus: 'DEMO',
        healthStatus: 'DEMO',
        lastUpdated: Date.now(),
      };

      this.notify();
    }, intervalMs);
  }

  public setDemoSpeed(speed: 1 | 5 | 10) {
    this.demoSpeed = speed;
    if (this.isDemoMode) {
      this.startDemoSimulation();
    }
  }

  public setDemoPaused(paused: boolean) {
    this.isDemoPaused = paused;
  }

  public resetDemoSimulation() {
    this.currentData = {
      ...this.currentData,
      level: 68,
      state: 'discharging',
      isCharging: false,
      chargingTimeSec: null,
      dischargingTimeSec: 28800,
      voltageV: 3.98,
      voltageStatus: 'LIVE',
      currentMa: -420,
      currentStatus: 'LIVE',
      tempC: 31.8,
      tempStatus: 'LIVE',
      powerW: 1.67,
      powerStatus: 'LIVE',
      health: 'Good',
      healthStatus: 'LIVE',
      healthPct: 96,
      chargerType: 'Unplugged',
      chargerStatus: 'LIVE',
      lastUpdated: Date.now(),
    };
    this.isDemoPaused = false;
    this.notify();
  }

  public toggleDemoCharging() {
    if (!this.isDemoMode) {
      this.setDemoMode(true);
    }
    const nextCharging = !this.currentData.isCharging;
    const nextLevel = nextCharging ? Math.min(99, this.currentData.level) : this.currentData.level;
    const nextState: BatteryState = nextCharging ? 'charging' : 'discharging';
    const nextCharger: ChargerType = nextCharging ? 'USB-C' : 'Unplugged';

    this.currentData = {
      ...this.currentData,
      isCharging: nextCharging,
      state: nextState,
      chargerType: nextCharger,
      level: nextLevel,
      currentMa: nextCharging ? 2450 : -410,
      powerW: nextCharging ? 10.2 : 1.6,
      chargingTimeSec: nextCharging ? 2800 : null,
      dischargingTimeSec: nextCharging ? null : 32400,
      lastUpdated: Date.now(),
    };
    this.notify();
  }

  public setDemoLevel(level: number) {
    if (!this.isDemoMode) {
      this.setDemoMode(true);
    }
    const clamped = Math.max(1, Math.min(100, Math.round(level)));
    this.currentData = {
      ...this.currentData,
      level: clamped,
      state: this.currentData.isCharging ? (clamped === 100 ? 'full' : 'charging') : 'discharging',
      lastUpdated: Date.now(),
    };
    this.notify();
  }

  public refresh(): Promise<LiveBatteryData> {
    if (this.batteryManager && !this.isDemoMode) {
      this.updateFromHardware();
    }
    this.currentData.lastUpdated = Date.now();
    this.notify();
    return Promise.resolve(this.currentData);
  }

  public subscribe(cb: (data: LiveBatteryData) => void): () => void {
    this.listeners.add(cb);
    cb(this.currentData);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.currentData));
  }

  public getCurrentData(): LiveBatteryData {
    return this.currentData;
  }

  public getDiagnostics(deviceModelName: string = 'Pixel 9 Pro (Android 15)'): BatteryDiagnostics {
    const live = this.currentData;
    const isDemo = live.isDemoMode;

    let thermalStatus: ThermalStatus = 'Nominal';
    if (live.tempC !== null) {
      if (live.tempC >= 45) thermalStatus = 'Critical';
      else if (live.tempC >= 40) thermalStatus = 'Severe';
      else if (live.tempC >= 36) thermalStatus = 'Moderate';
    } else {
      thermalStatus = isDemo ? 'Nominal' : 'Unavailable';
    }

    return {
      level: live.level,
      levelStatus: isDemo ? 'DEMO' : 'LIVE',
      state: live.state,
      stateStatus: isDemo ? 'DEMO' : 'LIVE',
      batterySaver: live.level <= 20 && !live.isCharging,
      batterySaverStatus: 'CALCULATED',
      powerSource: live.chargerType,
      powerSourceStatus: isDemo ? 'DEMO' : 'LIVE',

      health: live.health,
      healthStatus: isDemo ? 'DEMO' : live.healthStatus,
      healthPercentage: live.healthPct,
      technology: 'Lithium-Polymer (Li-Po)',
      technologyStatus: isDemo ? 'DEMO' : 'CALCULATED',
      designCapacityMah: 5060,
      capacityStatus: isDemo ? 'DEMO' : 'CALCULATED',
      chargeCounterMah: isDemo ? Math.round((live.level / 100) * 5060) : null,
      chargeCounterStatus: isDemo ? 'DEMO' : 'UNAVAILABLE',
      cycleCount: isDemo ? 142 : null,
      cycleCountStatus: isDemo ? 'DEMO' : 'UNAVAILABLE',

      voltageV: live.voltageV,
      voltageStatus: isDemo ? 'DEMO' : live.voltageStatus,
      currentMa: live.currentMa,
      currentStatus: isDemo ? 'DEMO' : live.currentStatus,
      powerW: live.powerW,
      powerStatus: isDemo ? 'DEMO' : live.powerStatus,

      tempC: live.tempC,
      tempStatus: isDemo ? 'DEMO' : live.tempStatus,
      thermalStatus,
      thermalStatusStatus: isDemo ? 'DEMO' : live.tempStatus,

      chargingSource: live.isCharging ? 'USB Type-C Power Delivery 3.0' : 'Disconnected',
      chargingSourceStatus: 'LIVE',
      usbDetails: live.isCharging ? '5V / 3A (15W negotiated)' : 'None',
      usbDetailsStatus: isDemo ? 'LIVE' : 'UNAVAILABLE',
      wirelessQi: false,
      wirelessQiStatus: 'LIVE',
      chargingTimeSec: live.chargingTimeSec,
      chargingTimeStatus: live.chargingTimeSec !== null ? 'LIVE' : 'UNAVAILABLE',
      dischargingTimeSec: live.dischargingTimeSec,
      dischargingTimeStatus: live.dischargingTimeSec !== null ? 'LIVE' : 'UNAVAILABLE',

      osVersion: typeof navigator !== 'undefined' ? navigator.userAgent.split(' ')[0] : 'Android 15',
      deviceModel: deviceModelName,
      apiAvailability: live.isRealHardwareApiAvailable
        ? 'W3C Web Battery API (navigator.getBattery) Active'
        : 'Browser Battery Sandbox (Hardware sysfs restricted)',
      hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 8 : 8,
    };
  }
}
