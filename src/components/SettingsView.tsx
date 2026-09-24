import React, { useState } from 'react';
import { AppSettings, LookSettings, AccentColor, NotificationSoundProfile } from '../types';
import {
  Sliders,
  Bell,
  Trash2,
  Download,
  Info,
  Shield,
  Zap,
  Check,
  AlertTriangle,
  RotateCcw,
  Volume2,
  Play,
  Sparkles,
  Cpu,
  Radio,
} from 'lucide-react';
import { NotificationService } from '../services/notificationService';
import { Sound } from '../services/soundService';
import { useSubscription } from '../services/billing/useSubscription';
import { PWAInstallButton } from './mobile/PWAInstallButton';
import { HapticService } from '../services/mobile/hapticService';

interface SettingsViewProps {
  appSettings: AppSettings;
  lookSettings: LookSettings;
  onUpdateAppSettings: (newSettings: AppSettings) => void;
  onUpdateLookSettings?: (newLook: LookSettings) => void;
  onClearHistory: () => void;
  onExportCSV: () => void;
  accent: AccentColor;
  onOpenOnboarding?: () => void;
  isPremium?: boolean;
  onOpenPaywall?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  appSettings,
  lookSettings,
  onUpdateAppSettings,
  onUpdateLookSettings = () => {},
  onClearHistory,
  onExportCSV,
  accent,
  onOpenOnboarding,
  isPremium = false,
  onOpenPaywall = () => {},
}) => {
  const { state: subState, currentPlan, restorePurchases, cancelAutoRenewal, resetToFree } = useSubscription();
  const [restoreFeedback, setRestoreFeedback] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [playingPreview, setPlayingPreview] = useState<NotificationSoundProfile | null>(null);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(
    NotificationService.getInstance().hasPermission()
  );

  const previewSound = (profile: NotificationSoundProfile) => {
    setPlayingPreview(profile);
    Sound.playSound(profile);
    setTimeout(() => setPlayingPreview(null), 600);
  };

  const handleSelectSoundProfile = (profile: NotificationSoundProfile) => {
    previewSound(profile);
    onUpdateAppSettings({
      ...appSettings,
      soundProfile: profile,
      alerts: {
        ...appSettings.alerts,
        soundProfile: profile,
      },
    });
  };

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

  const updateApp = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onUpdateAppSettings({
      ...appSettings,
      [key]: value,
    });
  };

  const handleRequestNotifications = async () => {
    const granted = await NotificationService.getInstance().requestPermission();
    setNotificationPermissionGranted(granted);
    updateApp('notificationsEnabled', granted);
  };

  return (
    <div id="settings-screen" className="space-y-4 pb-28 sm:pb-32 select-none">
      {/* GOOGLE PLAY SUBSCRIPTION MANAGEMENT */}
      <div className="rounded-2xl p-4 bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-emerald-950/20 border border-white/10 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Google Play Subscription
            </h4>
          </div>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
              isPremium
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-zinc-800 text-zinc-400 border-white/10'
            }`}
          >
            {isPremium ? 'PRO VERIFIED' : 'FREE TIER'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Current Status:</span>
            <span className="font-bold text-white font-mono uppercase">
              {subState.status === 'ACTIVE'
                ? 'Active (Auto-Renewing)'
                : subState.status === 'CANCELLED_ACTIVE'
                ? 'Active (Cancels at term end)'
                : subState.status === 'IN_GRACE_PERIOD'
                ? 'In Grace Period'
                : subState.status === 'PENDING'
                ? 'Pending Processing'
                : subState.status === 'EXPIRED'
                ? 'Expired'
                : 'Free Version'}
            </span>
          </div>

          {isPremium && currentPlan && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Plan:</span>
                <span className="font-bold text-emerald-400">
                  {currentPlan.title} ({currentPlan.price})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Next Renewal / Expiry:</span>
                <span className="font-mono text-zinc-200">
                  {new Date(subState.expiryTime).toLocaleDateString()}
                </span>
              </div>
              {subState.orderId && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-500">Order ID:</span>
                  <span className="font-mono text-zinc-400">{subState.orderId}</span>
                </div>
              )}
            </>
          )}

          {restoreFeedback && (
            <p className="text-[11px] text-emerald-400 mt-1 font-mono">{restoreFeedback}</p>
          )}
        </div>

        <div className="flex items-center space-x-2 pt-1">
          {isPremium ? (
            <button
              onClick={() => {
                if (subState.status === 'ACTIVE') {
                  cancelAutoRenewal();
                } else {
                  onOpenPaywall();
                }
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 transition-colors"
            >
              {subState.status === 'ACTIVE' ? 'Cancel Auto-Renewal' : 'Change Plan'}
            </button>
          ) : (
            <button
              onClick={onOpenPaywall}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black tracking-wide transition-colors flex items-center justify-center space-x-1.5 shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5 fill-black" />
              <span>Upgrade with Google Play</span>
            </button>
          )}

          <button
            onClick={async () => {
              HapticService.light();
              setIsRestoring(true);
              setRestoreFeedback(null);
              const res = await restorePurchases();
              setIsRestoring(false);
              setRestoreFeedback(res.message);
              setTimeout(() => setRestoreFeedback(null), 3000);
            }}
            disabled={isRestoring}
            className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-400 hover:text-white transition-colors disabled:opacity-50 touch-press"
          >
            {isRestoring ? 'Restoring...' : 'Restore'}
          </button>
        </div>
      </div>

      {/* MOBILE APPLICATION & STANDALONE INSTALLATION */}
      <PWAInstallButton accent={accent} />

      {/* 1. GENERAL SETTINGS */}
      <div className="rounded-2xl p-4 bg-zinc-900/90 border border-white/10 shadow-lg space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
          General Preferences
        </h4>

        {/* Temperature Unit */}
        <div className="flex items-center justify-between py-1.5 border-b border-white/5">
          <div>
            <span className="text-xs font-semibold text-white block">Temperature Unit</span>
            <span className="text-[10px] text-zinc-400">Celsius (°C) vs Fahrenheit (°F)</span>
          </div>
          <div className="flex items-center space-x-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
            {(['C', 'F'] as const).map((unit) => (
              <button
                key={unit}
                onClick={() => updateApp('tempUnit', unit)}
                className={`px-3 py-1 rounded text-xs font-bold font-mono transition-all ${
                  appSettings.tempUnit === unit
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                °{unit}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Mode */}
        <div className="flex items-center justify-between py-1.5 border-b border-white/5">
          <div>
            <span className="text-xs font-semibold text-white block">Theme Mode</span>
            <span className="text-[10px] text-zinc-400">Dark / Light theme environment</span>
          </div>
          <div className="flex items-center space-x-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
            {(['dark', 'light'] as const).map((th) => (
              <button
                key={th}
                onClick={() => updateApp('theme', th)}
                className={`px-3 py-1 rounded text-xs font-bold capitalize transition-all ${
                  appSettings.theme === th
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {th}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="flex items-center justify-between py-1.5 border-b border-white/5">
          <div>
            <span className="text-xs font-semibold text-white block">App Language</span>
            <span className="text-[10px] text-zinc-400">Localization options</span>
          </div>
          <select
            value={appSettings.language}
            onChange={(e) => updateApp('language', e.target.value)}
            className="bg-black/40 text-xs text-zinc-200 border border-white/10 rounded-lg px-2.5 py-1 focus:outline-hidden"
          >
            <option value="English">English (US)</option>
            <option value="Spanish">Español</option>
            <option value="German">Deutsch</option>
            <option value="French">Français</option>
            <option value="Japanese">日本語</option>
          </select>
        </div>

        {/* Haptic Feedback */}
        <div className="flex items-center justify-between py-1.5 border-b border-white/5">
          <div>
            <span className="text-xs font-semibold text-white block">Haptic Vibrations</span>
            <span className="text-[10px] text-zinc-400">Tactile pulse on navigation & controls</span>
          </div>
          <button
            onClick={() => updateApp('hapticsEnabled', !(appSettings.hapticsEnabled ?? true))}
            id="toggle-haptics"
            className={`w-11 h-6 rounded-full transition-colors relative ${
              (appSettings.hapticsEnabled ?? true) ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                (appSettings.hapticsEnabled ?? true) ? 'transform translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {/* Charging Telemetry HUD Toggle */}
        <div className="flex items-center justify-between py-1.5 border-b border-white/5">
          <div>
            <span className="text-xs font-semibold text-white block">Charging Ambient HUD</span>
            <span className="text-[10px] text-zinc-400">Display electrical telemetry on charging screen</span>
          </div>
          <button
            onClick={() => updateApp('showChargingTelemetry', !(appSettings.showChargingTelemetry ?? true))}
            id="toggle-charging-telemetry"
            className={`w-11 h-6 rounded-full transition-colors relative ${
              (appSettings.showChargingTelemetry ?? true) ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                (appSettings.showChargingTelemetry ?? true) ? 'transform translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {/* Demo Simulation Speed */}
        <div className="flex items-center justify-between py-1.5">
          <div>
            <span className="text-xs font-semibold text-white block">Demo Simulation Speed</span>
            <span className="text-[10px] text-zinc-400">Pace of sensor data progression in Demo Mode</span>
          </div>
          <div className="flex items-center space-x-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
            {([1, 5, 10] as const).map((spd) => (
              <button
                key={spd}
                onClick={() => updateApp('demoSpeed', spd)}
                className={`px-2.5 py-1 rounded text-xs font-bold font-mono transition-all ${
                  (appSettings.demoSpeed ?? 1) === spd
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. HISTORY RETENTION & EXPORT */}
      <div className="rounded-2xl p-4 bg-zinc-900/90 border border-white/10 shadow-lg space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
          History & Telemetry Storage
        </h4>

        {/* Retention Period */}
        <div className="flex items-center justify-between py-1.5 border-b border-white/5">
          <div>
            <span className="text-xs font-semibold text-white block">Data Retention</span>
            <span className="text-[10px] text-zinc-400">Automatically prune older observations</span>
          </div>
          <select
            value={appSettings.historyRetention}
            onChange={(e) =>
              updateApp('historyRetention', e.target.value as AppSettings['historyRetention'])
            }
            className="bg-black/40 text-xs text-zinc-200 border border-white/10 rounded-lg px-2 py-1 focus:outline-hidden"
          >
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
            <option value="90d">90 Days</option>
            <option value="1y">1 Year</option>
            <option value="unlimited">Unlimited</option>
          </select>
        </div>

        {/* Sampling Interval */}
        <div className="flex items-center justify-between py-1.5 border-b border-white/5">
          <div>
            <span className="text-xs font-semibold text-white block">Sampling Interval</span>
            <span className="text-[10px] text-zinc-400">Balances accuracy with storage consumption</span>
          </div>
          <select
            value={appSettings.samplingIntervalSec}
            onChange={(e) => updateApp('samplingIntervalSec', Number(e.target.value))}
            className="bg-black/40 text-xs text-zinc-200 border border-white/10 rounded-lg px-2 py-1 focus:outline-hidden"
          >
            <option value={30}>Every 30 seconds</option>
            <option value={60}>Every 1 minute (Recommended)</option>
            <option value={300}>Every 5 minutes</option>
          </select>
        </div>

        {/* Export and Clear Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={onExportCSV}
            id="btn-export-csv"
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-200 transition-all active:scale-98"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            id="btn-clear-history"
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-bold text-red-400 transition-all active:scale-98"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>

        {/* Confirmation Modal */}
        {showClearConfirm && (
          <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl space-y-2 mt-2">
            <div className="flex items-center space-x-2 text-red-300 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Are you sure you want to clear all history?</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              This will permanently delete all stored battery logs and events on this device.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-zinc-300 bg-white/5 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearHistory();
                  setShowClearConfirm(false);
                }}
                className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-500 shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. ALERTS & NOTIFICATIONS */}
      <div className="rounded-2xl p-4 bg-zinc-900/90 border border-white/10 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Intelligent Alerts & Warnings
          </h4>
          <Bell className="w-4 h-4 text-amber-400" />
        </div>

        {/* Browser Permission Request */}
        {!notificationPermissionGranted && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-300 block">
                Enable System Notifications
              </span>
              <span className="text-[10px] text-zinc-400">
                Receive warnings when battery is low or fully charged
              </span>
            </div>
            <button
              onClick={handleRequestNotifications}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500 text-black hover:bg-amber-400 shadow-sm"
            >
              Allow
            </button>
          </div>
        )}

        {/* Battery Guardian Mode Toggle (80% Overcharge Protection) */}
        <div className="flex items-center justify-between py-2 border-b border-white/5">
          <div className="pr-3 flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white block">Battery Guardian (80% Limit)</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                HEALTH
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 block mt-0.5 leading-relaxed">
              Triggers a desktop notification when charge reaches 80% to protect cycle longevity and prevent overcharging.
            </span>
          </div>
          <button
            id="toggle-battery-guardian"
            type="button"
            role="switch"
            aria-checked={appSettings.batteryGuardian ?? appSettings.alerts.batteryGuardian ?? true}
            onClick={async () => {
              const current = appSettings.batteryGuardian ?? appSettings.alerts.batteryGuardian ?? true;
              const next = !current;
              if (next && !notificationPermissionGranted) {
                await handleRequestNotifications();
              }
              onUpdateAppSettings({
                ...appSettings,
                batteryGuardian: next,
                alerts: {
                  ...appSettings.alerts,
                  batteryGuardian: next,
                },
              });
            }}
            className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${
              (appSettings.batteryGuardian ?? appSettings.alerts.batteryGuardian ?? true)
                ? 'bg-emerald-500'
                : 'bg-zinc-700'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                (appSettings.batteryGuardian ?? appSettings.alerts.batteryGuardian ?? true)
                  ? 'transform translate-x-5'
                  : ''
              }`}
            />
          </button>
        </div>

        {/* Notification Sound Profile Selection (Minimal, Technical, Analog) */}
        <div className="py-2.5 border-b border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4" style={{ color: accentColor }} />
              <div>
                <span className="text-xs font-bold text-white block">Alert Sound Profile</span>
                <span className="text-[10px] text-zinc-400">
                  Select auditory tone profile for low battery and system warnings
                </span>
              </div>
            </div>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider"
              style={{
                backgroundColor: `${accentColor}18`,
                color: accentColor,
                border: `1px solid ${accentColor}35`,
              }}
            >
              {appSettings.alerts?.soundProfile ?? appSettings.soundProfile ?? 'Minimal'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {(
              [
                {
                  id: 'Minimal' as const,
                  name: 'Minimal',
                  desc: 'Clean, subtle dual-tone sine chime',
                  tag: 'Subtle',
                  icon: Sparkles,
                },
                {
                  id: 'Technical' as const,
                  name: 'Technical',
                  desc: 'High-frequency cyber telemetry chirp',
                  tag: 'Cyber HUD',
                  icon: Cpu,
                },
                {
                  id: 'Analog' as const,
                  name: 'Analog',
                  desc: 'Warm resonant acoustic vintage bell',
                  tag: 'Resonant',
                  icon: Radio,
                },
              ] as const
            ).map((profile) => {
              const currentProfile =
                appSettings.alerts?.soundProfile ?? appSettings.soundProfile ?? 'Minimal';
              const isSelected = currentProfile === profile.id;
              const isPlaying = playingPreview === profile.id;
              const IconComp = profile.icon;

              return (
                <div
                  key={profile.id}
                  id={`sound-profile-${profile.id.toLowerCase()}`}
                  onClick={() => handleSelectSoundProfile(profile.id)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all relative flex flex-col justify-between select-none ${
                    isSelected
                      ? 'bg-zinc-850/95 shadow-md ring-1'
                      : 'bg-black/30 border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                  style={
                    isSelected
                      ? {
                          borderColor: `${accentColor}80`,
                          boxShadow: `0 0 12px ${accentColor}25`,
                        }
                      : undefined
                  }
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <IconComp
                          className="w-3.5 h-3.5 transition-colors"
                          style={{ color: isSelected ? accentColor : '#a1a1aa' }}
                        />
                        <span
                          className={`text-xs font-bold ${
                            isSelected ? 'text-white' : 'text-zinc-300'
                          }`}
                        >
                          {profile.name}
                        </span>
                      </div>
                      {isSelected ? (
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${accentColor}25` }}
                        >
                          <Check className="w-2.5 h-2.5 font-bold" style={{ color: accentColor }} />
                        </div>
                      ) : (
                        <span className="text-[9px] font-mono text-zinc-500 uppercase">
                          {profile.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-tight pr-1">
                      {profile.desc}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[9px] font-mono text-zinc-500">
                      {isSelected ? 'Active' : 'Select'}
                    </span>
                    <button
                      type="button"
                      id={`preview-sound-${profile.id.toLowerCase()}`}
                      title={`Preview ${profile.name} alert sound`}
                      onClick={(e) => {
                        e.stopPropagation();
                        previewSound(profile.id);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all ${
                        isPlaying
                          ? 'bg-white/25 text-white scale-105'
                          : 'bg-white/10 hover:bg-white/20 text-zinc-200'
                      }`}
                    >
                      <Play
                        className={`w-2.5 h-2.5 fill-current ${
                          isPlaying ? 'animate-pulse' : ''
                        }`}
                        style={{ color: accentColor }}
                      />
                      <span>{isPlaying ? 'Playing' : 'Preview'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low Battery Alert Threshold */}
        <div className="flex items-center justify-between py-1.5 border-b border-white/5">
          <div>
            <span className="text-xs font-semibold text-white block">Low Battery Alert</span>
            <span className="text-[10px] text-zinc-400">Triggered at {appSettings.alerts.lowBatteryThreshold}%</span>
          </div>
          <select
            value={appSettings.alerts.lowBatteryThreshold}
            onChange={(e) =>
              onUpdateAppSettings({
                ...appSettings,
                alerts: {
                  ...appSettings.alerts,
                  lowBatteryThreshold: Number(e.target.value),
                },
              })
            }
            className="bg-black/40 text-xs text-zinc-200 border border-white/10 rounded-lg px-2 py-1 focus:outline-hidden"
          >
            <option value={25}>25%</option>
            <option value={20}>20%</option>
            <option value={15}>15%</option>
          </select>
        </div>

        {/* Critical Battery Alert Threshold */}
        <div className="flex items-center justify-between py-1.5 border-b border-white/5">
          <div>
            <span className="text-xs font-semibold text-white block">Critical Battery Alert</span>
            <span className="text-[10px] text-zinc-400">Immediate shutdown warning at {appSettings.alerts.criticalBatteryThreshold}%</span>
          </div>
          <select
            value={appSettings.alerts.criticalBatteryThreshold}
            onChange={(e) =>
              onUpdateAppSettings({
                ...appSettings,
                alerts: {
                  ...appSettings.alerts,
                  criticalBatteryThreshold: Number(e.target.value),
                },
              })
            }
            className="bg-black/40 text-xs text-zinc-200 border border-white/10 rounded-lg px-2 py-1 focus:outline-hidden"
          >
            <option value={10}>10%</option>
            <option value={5}>5%</option>
          </select>
        </div>

        {/* High Temperature Warning */}
        <div className="flex items-center justify-between py-1.5">
          <div>
            <span className="text-xs font-semibold text-white block">High Thermal Threshold</span>
            <span className="text-[10px] text-zinc-400">Warns when pack temperature exceeds {appSettings.alerts.highTempThreshold}°C</span>
          </div>
          <select
            value={appSettings.alerts.highTempThreshold}
            onChange={(e) =>
              onUpdateAppSettings({
                ...appSettings,
                alerts: {
                  ...appSettings.alerts,
                  highTempThreshold: Number(e.target.value),
                },
              })
            }
            className="bg-black/40 text-xs text-zinc-200 border border-white/10 rounded-lg px-2 py-1 focus:outline-hidden"
          >
            <option value={38}>38°C (100°F)</option>
            <option value={40}>40°C (104°F)</option>
            <option value={45}>45°C (113°F)</option>
          </select>
        </div>
      </div>

      {/* 4. ABOUT & DATA PRIVACY GUARANTEE */}
      <div className="rounded-2xl p-4 bg-zinc-900/90 border border-white/10 shadow-lg space-y-3">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
            Privacy & Trust Architecture
          </h4>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          BatteryFlow operates with an <span className="text-white font-semibold">Offline-First</span>{' '}
          security design. Your battery charge records, temperature readings, and cycle history
          are stored locally in device storage. Zero battery telemetry is ever sent to external
          servers.
        </p>
        <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-1 font-mono text-[11px]">
          <div className="flex justify-between text-zinc-400">
            <span>Version:</span>
            <span className="text-white font-bold">BatteryFlow 2.4.0 Pro</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Hardware Engine:</span>
            <span className="text-emerald-400 font-bold">W3C Battery v2 + Sysfs Layer</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>License:</span>
            <span className="text-zinc-300">Apache 2.0 Open Source</span>
          </div>
        </div>

        {onOpenOnboarding && (
          <button
            onClick={onOpenOnboarding}
            id="btn-rerun-onboarding"
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-all active:scale-98 flex items-center justify-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Launch System Initialization Setup</span>
          </button>
        )}
      </div>
    </div>
  );
};
