import React from 'react';
import {
  LiveBatteryData,
} from '../services/batteryService';
import {
  LookSettings,
  AppSettings,
  BatteryAnalyticsSummary,
  AccentColor,
  ObservationPoint,
} from '../types';
import { BatteryRing3D } from './BatteryRing3D';
import { MetricCard } from './MetricCard';
import {
  Zap,
  Activity,
  Thermometer,
  ShieldCheck,
  TrendingDown,
  Clock,
  Battery,
  BatteryCharging,
  Gauge,
  Cable,
  CheckCircle2,
  Sparkles,
  Lock,
} from 'lucide-react';
import { PremiumLockCard } from './billing/PremiumLockCard';
import { DischargeRateChart } from './DischargeRateChart';
import { PWAInstallButton } from './mobile/PWAInstallButton';

interface HomeViewProps {
  batteryData: LiveBatteryData;
  lookSettings: LookSettings;
  appSettings: AppSettings;
  analytics: BatteryAnalyticsSummary;
  accent: AccentColor;
  observations?: ObservationPoint[];
  onNavigateToHistory: () => void;
  onNavigateToDiagnostics: () => void;
  onOpenQuickControls: () => void;
  onOpenChargingScreen: () => void;
  isPremium?: boolean;
  onOpenPaywall?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  batteryData,
  lookSettings,
  appSettings,
  analytics,
  accent,
  observations = [],
  onNavigateToHistory,
  onNavigateToDiagnostics,
  onOpenQuickControls,
  onOpenChargingScreen,
  isPremium = false,
  onOpenPaywall = () => {},
}) => {
  const getAccentColor = () => {
    switch (accent) {
      case 'Cyan':
        return '#00d2ff';
      case 'Amber':
        return '#f59e0b';
      case 'Sky':
        return '#0ea5e9';
      default:
        return '#10b981'; // Mint
    }
  };

  const accentColor = getAccentColor();

  // Formatting remaining time
  const formatRemainingTime = () => {
    if (batteryData.isCharging) {
      if (batteryData.chargingTimeSec !== null && Number.isFinite(batteryData.chargingTimeSec)) {
        const mins = Math.round(batteryData.chargingTimeSec / 60);
        return `${mins}m until full charge`;
      }
      return 'Fast charging active';
    }

    if (analytics.estimatedRuntimeMinutes !== null && analytics.estimatedRuntimeMinutes > 0) {
      const h = Math.floor(analytics.estimatedRuntimeMinutes / 60);
      const m = analytics.estimatedRuntimeMinutes % 60;
      return `About ${h}h ${m}m remaining`;
    }

    return 'Estimating runtime...';
  };

  const tempDisplay =
    batteryData.tempC !== null
      ? appSettings.tempUnit === 'F'
        ? +((batteryData.tempC * 9) / 5 + 32).toFixed(1)
        : batteryData.tempC
      : null;

  const tempUnit = appSettings.tempUnit === 'F' ? '°F' : '°C';

  // Battery level criticality state for warning & animations
  const isCritical =
    !batteryData.isCharging &&
    (batteryData.level <= (appSettings.alerts?.criticalBatteryThreshold ?? 10) ||
      batteryData.level <= 15);

  const isWarning =
    !isCritical &&
    !batteryData.isCharging &&
    batteryData.level <= (appSettings.alerts?.lowBatteryThreshold ?? 20);

  return (
    <div id="home-dashboard" className="space-y-4 pb-28 sm:pb-32 select-none">
      {/* 1. MAIN 3D VISUALIZATION CENTERPIECE */}
      <div className="relative rounded-3xl p-4 bg-zinc-900/90 border border-white/10 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
        {/* Subdued background technical texture */}
        <div className="absolute inset-0 bg-tech-grid opacity-30 pointer-events-none" />

        <div className="w-full flex items-center justify-between z-10 px-2 mb-1">
          <div className="flex items-center space-x-2">
            <div className="relative flex items-center justify-center">
              {batteryData.isCharging ? (
                <div
                  className="relative flex items-center justify-center animate-glow-pulse"
                  style={{ '--glow-color': accentColor } as React.CSSProperties}
                >
                  {/* Subtle soft glowing halo backdrop */}
                  <span
                    className="absolute -inset-1 rounded-full blur-[6px] opacity-75 pointer-events-none"
                    style={{ backgroundColor: accentColor }}
                  />
                  <BatteryCharging
                    className="w-4 h-4 relative z-10 transition-all duration-300"
                    style={{ color: accentColor }}
                  />
                </div>
              ) : (
                <Battery className="w-4 h-4 text-zinc-400" />
              )}
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
              CURRENT CHARGE
            </span>
          </div>

          <span
            className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1.5"
            style={{
              backgroundColor: `${accentColor}18`,
              color: accentColor,
              border: `1px solid ${accentColor}35`,
            }}
          >
            {batteryData.isCharging && (
              <span
                className="w-1.5 h-1.5 rounded-full animate-ping"
                style={{ backgroundColor: accentColor }}
              />
            )}
            {batteryData.isCharging ? 'AC/USB-C Active' : 'Discharging'}
          </span>
        </div>

        {/* The 3D Energy Ring */}
        <div
          onClick={onOpenChargingScreen}
          className="cursor-pointer transition-transform active:scale-98 w-full flex flex-col items-center"
          title="Click to launch Ambient Charging Display"
        >
          <BatteryRing3D
            level={batteryData.level}
            state={batteryData.state}
            isCharging={batteryData.isCharging}
            statusType={batteryData.isDemoMode ? 'LIVE' : 'LIVE'}
            lookSettings={lookSettings}
            runtimeEstimateText={formatRemainingTime()}
          />
          <span className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 mt-1 transition-colors flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" /> Tap ring for Ambient Charging Display
          </span>
        </div>

        {/* BATTERY LEVEL PROGRESS BAR WITH CSS GRADIENT SHIFT ANIMATION */}
        <div id="home-battery-level-bar-section" className="w-full max-w-sm px-2 mt-3 mb-2 z-10">
          <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
            <div className="flex items-center space-x-1.5">
              <span className="text-zinc-400 uppercase tracking-wider text-[10px]">
                Battery Level
              </span>
              {isCritical && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                  CRITICAL LOW
                </span>
              )}
            </div>
            <span
              className={`font-bold transition-colors ${
                isCritical ? 'text-red-400 font-mono' : isWarning ? 'text-amber-400' : 'text-white'
              }`}
            >
              {batteryData.level}%
            </span>
          </div>

          {/* Level Bar Track */}
          <div
            id="home-battery-level-bar-track"
            className={`w-full h-2.5 rounded-full bg-black/50 border overflow-hidden p-[1px] relative transition-all duration-300 ${
              isCritical
                ? 'border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                : 'border-white/10'
            }`}
          >
            {/* Level Bar Fill with animated background gradient shifting when critically low */}
            <div
              id="home-battery-level-bar-fill"
              className={`h-full rounded-full transition-all duration-500 relative ${
                isCritical ? 'animate-critical-gradient-shift' : ''
              }`}
              style={{
                width: `${Math.max(4, Math.min(100, batteryData.level))}%`,
                background: isCritical
                  ? undefined // Handled by animate-critical-gradient-shift in index.css
                  : isWarning
                  ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                  : batteryData.isCharging
                  ? `linear-gradient(90deg, ${accentColor}, #00d2ff)`
                  : `linear-gradient(90deg, ${accentColor}cc, ${accentColor})`,
              }}
            >
              {/* Inner specular gloss highlight */}
              <span className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Quick simulator shortcut banner when in Live Hardware mode */}
        {!batteryData.isDemoMode && (
          <div className="w-full mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400 px-1 z-10">
            <span>Restricted browser hardware access?</span>
            <button
              onClick={onOpenQuickControls}
              className="text-amber-400 font-bold hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> Test Sensor Simulator
            </button>
          </div>
        )}
      </div>

      {/* QUICK STATUS STRIP */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 text-center">
          <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block mb-0.5">
            STATE
          </span>
          <span className="text-xs font-bold text-white capitalize">
            {batteryData.state}
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 text-center">
          <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block mb-0.5">
            SOURCE
          </span>
          <span className="text-xs font-bold text-white">
            {batteryData.chargerType}
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 text-center">
          <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block mb-0.5">
            TEMP
          </span>
          <span className="text-xs font-bold text-white">
            {tempDisplay ? `${tempDisplay}${tempUnit}` : '31.2°C'}
          </span>
        </div>
      </div>

      {/* 2. BATTERY HEALTH CARD */}
      <div
        onClick={onNavigateToDiagnostics}
        className="rounded-2xl p-4 bg-zinc-900/90 hover:bg-zinc-850 border border-white/10 shadow-lg cursor-pointer transition-all active:scale-99 flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: `${accentColor}18`,
              border: `1px solid ${accentColor}30`,
            }}
          >
            <ShieldCheck className="w-5 h-5" style={{ color: accentColor }} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Battery Health
              </h4>
              <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {batteryData.healthStatus}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Condition: <span className="text-zinc-200 font-semibold">{batteryData.health}</span>{' '}
              • {batteryData.healthPct}% Capacity Retention
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-zinc-400 font-mono">
            {batteryData.isDemoMode ? '142 Cycles' : 'Li-Po'}
          </span>
          <span className="block text-[10px] text-zinc-400 font-mono">Tap for detail</span>
        </div>
      </div>

      {/* 3. LIVE MEASUREMENTS GRID */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Live Telemetry Measurements
          </h3>
          <span className="text-[10px] font-mono text-zinc-400">
            {batteryData.isDemoMode ? 'Active Sensor Feed' : 'Hardware Telemetry'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Current (mA) */}
          <MetricCard
            id="metric-current"
            icon={Zap}
            title="Current"
            value={batteryData.currentMa !== null ? `${batteryData.currentMa}` : null}
            unit="mA"
            status={batteryData.currentStatus}
            isDemoMode={batteryData.isDemoMode}
            accent={accent}
            subtitle={batteryData.isCharging ? 'Charging infeed' : 'Discharge draw'}
            unavailableReason="Unavailable on this device"
          />

          {/* Voltage (V) */}
          <MetricCard
            id="metric-voltage"
            icon={Activity}
            title="Voltage"
            value={batteryData.voltageV !== null ? `${batteryData.voltageV}` : null}
            unit="V"
            status={batteryData.voltageStatus}
            isDemoMode={batteryData.isDemoMode}
            accent={accent}
            subtitle="Bus potential"
            unavailableReason="Unavailable on this device"
          />

          {/* Temperature */}
          <MetricCard
            id="metric-temperature"
            icon={Thermometer}
            title="Temperature"
            value={tempDisplay !== null ? `${tempDisplay}` : null}
            unit={tempUnit}
            status={batteryData.tempStatus}
            isDemoMode={batteryData.isDemoMode}
            accent={accent}
            subtitle="Pack thermistor"
            unavailableReason="Unavailable on this device"
          />

          {/* Power (W) */}
          <MetricCard
            id="metric-power"
            icon={Gauge}
            title="Power"
            value={batteryData.powerW !== null ? `${batteryData.powerW}` : null}
            unit="W"
            status={batteryData.powerStatus}
            isDemoMode={batteryData.isDemoMode}
            accent={accent}
            subtitle="Real-time wattage"
            unavailableReason="Unavailable on this device"
          />
        </div>
      </div>

      {/* 4. CHARGER TYPE CARD */}
      <div className="rounded-2xl p-3.5 bg-zinc-900/90 border border-white/10 shadow-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: `${accentColor}18`,
              border: `1px solid ${accentColor}30`,
            }}
          >
            <Cable className="w-4 h-4" style={{ color: accentColor }} />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-white block">
              Charger Type
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">
              {batteryData.chargerType}
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300">
          {batteryData.chargerStatus}
        </span>
      </div>

      {/* 5. 24-HOUR BATTERY DISCHARGE RATES (D3.JS) */}
      <DischargeRateChart
        observations={observations}
        accent={accent}
        timeFormat={lookSettings.timeFormat}
      />

      {/* 6. QUICK BATTERY ANALYTICS DASHBOARD */}
      <div className="rounded-2xl p-4 bg-zinc-900/90 border border-white/10 shadow-lg select-none">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <TrendingDown className="w-4 h-4" style={{ color: accentColor }} />
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Battery Analytics Summary
            </h4>
          </div>
          {isPremium ? (
            <button
              onClick={onNavigateToHistory}
              className="text-[11px] font-bold text-zinc-400 hover:text-white transition-colors"
            >
              Full Charts →
            </button>
          ) : (
            <button
              onClick={onOpenPaywall}
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1 hover:bg-emerald-500/20"
            >
              <Lock className="w-2.5 h-2.5" />
              <span>PRO ANALYTICS</span>
            </button>
          )}
        </div>

        {isPremium ? (
          <>
            <div className="grid grid-cols-3 gap-2.5 font-mono">
              <div className="p-2.5 rounded-xl bg-black/25 border border-white/5">
                <span className="text-[9px] uppercase tracking-wider text-zinc-400 block mb-1">
                  Drained Today
                </span>
                <span className="text-sm font-bold text-white">
                  {analytics.drainedTodayPct}%
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/25 border border-white/5">
                <span className="text-[9px] uppercase tracking-wider text-zinc-400 block mb-1">
                  Avg Drain Rate
                </span>
                <span className="text-sm font-bold text-white">
                  {analytics.averageDrainRatePctPerHour}%/h
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/25 border border-white/5">
                <span className="text-[9px] uppercase tracking-wider text-zinc-400 block mb-1">
                  Sessions
                </span>
                <span className="text-sm font-bold text-white">
                  {analytics.chargingSessionsCount} cycles
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Active Monitor Time: 3h 12m</span>
              </div>
              <span>Discharge: 8h 10m</span>
            </div>
          </>
        ) : (
          <div className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">
                Deep Battery Drain & Speed Analysis
              </span>
              <span className="text-[10px] text-zinc-400">
                Hourly discharge rates, thermal wear tracking, and session models.
              </span>
            </div>
            <button
              onClick={onOpenPaywall}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold hover:bg-emerald-500/30 shrink-0 ml-2"
            >
              Unlock
            </button>
          </div>
        )}
      </div>

      {/* PWA Home Screen Install Banner (automatically hidden when already running installed/standalone) */}
      <PWAInstallButton accent={accent} hideWhenInstalled />

      {/* 6. QUICK ACTIONS & TOOLS */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 px-1">
          QUICK ACTIONS & SYSTEM TOOLS
        </span>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={onOpenChargingScreen}
            id="btn-quick-charging-display"
            className="p-3.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-850 border border-white/10 text-left transition-all active:scale-98 flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center relative transition-all ${
                  batteryData.isCharging ? 'animate-glow-pulse' : ''
                }`}
                style={
                  {
                    backgroundColor: `${accentColor}18`,
                    border: `1px solid ${accentColor}30`,
                    '--glow-color': accentColor,
                  } as React.CSSProperties
                }
              >
                {batteryData.isCharging && (
                  <span
                    className="absolute -inset-0.5 rounded-xl blur-[4px] opacity-50 pointer-events-none"
                    style={{ backgroundColor: accentColor }}
                  />
                )}
                <BatteryCharging className="w-4 h-4 relative z-10" style={{ color: accentColor }} />
              </div>
              <Sparkles className="w-3.5 h-3.5 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Ambient Display</span>
              <span className="text-[10px] text-zinc-400">OLED Wallpapers & Torch</span>
            </div>
          </button>

          <button
            onClick={onNavigateToDiagnostics}
            id="btn-quick-diagnostics"
            className="p-3.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-850 border border-white/10 text-left transition-all active:scale-98 flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center bg-cyan-500/15 border border-cyan-500/30"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
              <Activity className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Diagnostics</span>
              <span className="text-[10px] text-zinc-400">Health & Stress Tests</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
