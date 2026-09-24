export type BatteryState = 'charging' | 'discharging' | 'full' | 'not-charging' | 'unknown';

export type MetricStatus = 'LIVE' | 'CALCULATED' | 'HISTORICAL' | 'UNAVAILABLE' | 'DEMO';

export type CapabilityStatus = 'SUPPORTED' | 'UNSUPPORTED' | 'UNKNOWN' | 'STALE';

export type BatteryHealth = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Unavailable';

export type ChargerType = 'USB-C' | 'AC Fast Charger' | 'Wireless (Qi)' | 'Unplugged' | 'Unknown';

export type ThermalStatus = 'Nominal' | 'Moderate' | 'Severe' | 'Critical' | 'Unavailable';

export type TabType = 'home' | 'history' | 'diagnostics' | 'look' | 'settings';

export type AccentColor = 'Cyan' | 'Mint' | 'Amber' | 'Sky';

export type NotificationSoundProfile = 'Minimal' | 'Technical' | 'Analog';

export type ChargingWallpaperStyle = 'aurora' | 'grid' | 'liquid' | 'minimal';

export type ChargingAnimationMode = 'None' | 'Pulse' | 'Orbit' | 'Flow' | 'Aurora';

export type ChargingScreenMode = 'always' | 'unlocked' | 'notification' | 'disabled';

export interface ObservationPoint {
  id: string;
  timestamp: number;
  level: number; // 0 to 100
  state: BatteryState;
  currentMa: number | null; // negative for discharge, positive for charge
  voltageV: number | null;
  tempC: number | null;
  powerW: number | null;
  chargerType: ChargerType;
}

export interface BatteryEvent {
  id: string;
  timestamp: number;
  title: string;
  description: string;
  type: 'charging' | 'discharging' | 'alert' | 'system' | 'health';
  severity: 'info' | 'success' | 'warning' | 'critical';
}

export interface LookSettings {
  clockStyle: 'Digital' | 'Editorial' | 'Mono';
  batteryIndicator: 'Ring' | 'Arc' | 'Minimal';
  wallpaper: 'Midnight' | 'Graphite' | 'Mist' | 'OLED';
  chargingWallpaper: ChargingWallpaperStyle;
  chargingAnimation: ChargingAnimationMode;
  accent: AccentColor;
  timeFormat: '12h' | '24h';
  animationIntensity: 'Subtle' | 'Normal' | 'Dynamic' | 'Off';
  graphSmoothing: boolean;
  density: 'Comfortable' | 'Compact';
  amoledMode: boolean;
  depth3dIntensity: 'Off' | 'Medium' | 'High';
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  tempUnit: 'C' | 'F';
  language: string;
  historyRetention: '7d' | '30d' | '90d' | '1y' | 'unlimited';
  samplingIntervalSec: number;
  chargingScreenMode: ChargingScreenMode;
  showChargingTelemetry: boolean;
  hapticsEnabled: boolean;
  demoSpeed: 1 | 5 | 10;
  demoSimulationPaused: boolean;
  firstLaunchDone: boolean;
  alerts: {
    lowBattery: boolean;
    lowBatteryThreshold: number;
    criticalBattery: boolean;
    criticalBatteryThreshold: number;
    highTemp: boolean;
    highTempThreshold: number;
    fullyCharged: boolean;
    fastDrain: boolean;
    fastDrainThreshold: number;
    batteryGuardian: boolean;
    soundProfile?: NotificationSoundProfile;
  };
  soundProfile?: NotificationSoundProfile;
  batteryGuardian: boolean;
  notificationsEnabled: boolean;
  demoMode: boolean;
  simulatedDevice: string;
}

export interface BatteryDiagnostics {
  // Core
  level: number;
  levelStatus: MetricStatus;
  state: BatteryState;
  stateStatus: MetricStatus;
  batterySaver: boolean;
  batterySaverStatus: MetricStatus;
  powerSource: ChargerType;
  powerSourceStatus: MetricStatus;

  // Battery Hardware
  health: BatteryHealth;
  healthStatus: MetricStatus;
  healthPercentage: number;
  technology: string;
  technologyStatus: MetricStatus;
  designCapacityMah: number;
  capacityStatus: MetricStatus;
  chargeCounterMah: number | null;
  chargeCounterStatus: MetricStatus;
  cycleCount: number | null;
  cycleCountStatus: MetricStatus;

  // Electrical
  voltageV: number | null;
  voltageStatus: MetricStatus;
  currentMa: number | null;
  currentStatus: MetricStatus;
  powerW: number | null;
  powerStatus: MetricStatus;

  // Thermal
  tempC: number | null;
  tempStatus: MetricStatus;
  thermalStatus: ThermalStatus;
  thermalStatusStatus: MetricStatus;

  // Charging
  chargingSource: string;
  chargingSourceStatus: MetricStatus;
  usbDetails: string;
  usbDetailsStatus: MetricStatus;
  wirelessQi: boolean;
  wirelessQiStatus: MetricStatus;
  chargingTimeSec: number | null;
  chargingTimeStatus: MetricStatus;
  dischargingTimeSec: number | null;
  dischargingTimeStatus: MetricStatus;

  // System
  osVersion: string;
  deviceModel: string;
  apiAvailability: string;
  hardwareConcurrency: number;
}

export interface BatteryAnalyticsSummary {
  drainedTodayPct: number;
  averageDrainRatePctPerHour: number;
  estimatedRuntimeMinutes: number | null;
  chargingSessionsCount: number;
  screenOnMinutes: number;
  chargingDurationMinutes: number;
  dischargeDurationMinutes: number;
  peakTemperatureC: number | null;
}
