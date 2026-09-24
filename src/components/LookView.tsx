import React from 'react';
import {
  LookSettings,
  AccentColor,
  ChargingWallpaperStyle,
  ChargingAnimationMode,
} from '../types';
import { BatteryRing3D } from './BatteryRing3D';
import {
  Palette,
  Sparkles,
  Moon,
  Sun,
  Sliders,
  Check,
  BatteryCharging,
  Maximize2,
  Tv,
  Lock,
} from 'lucide-react';

interface LookViewProps {
  lookSettings: LookSettings;
  onChangeLookSettings: (newSettings: LookSettings) => void;
  batteryLevel: number;
  isCharging: boolean;
  onOpenChargingScreen?: () => void;
  isPremium?: boolean;
  onOpenPaywall?: () => void;
}

export const LookView: React.FC<LookViewProps> = ({
  lookSettings,
  onChangeLookSettings,
  batteryLevel,
  isCharging,
  onOpenChargingScreen,
  isPremium = false,
  onOpenPaywall = () => {},
}) => {
  const updateSetting = <K extends keyof LookSettings>(key: K, value: LookSettings[K]) => {
    onChangeLookSettings({
      ...lookSettings,
      [key]: value,
    });
  };

  const accents: { name: AccentColor; color: string }[] = [
    { name: 'Cyan', color: '#00d2ff' },
    { name: 'Mint', color: '#10b981' },
    { name: 'Amber', color: '#f59e0b' },
    { name: 'Sky', color: '#0ea5e9' },
  ];

  const chargingWallpapers: {
    id: ChargingWallpaperStyle;
    title: string;
    desc: string;
    isPro: boolean;
  }[] = [
    { id: 'minimal', title: 'Minimal Mono', desc: 'Deep black & razor-thin ring (Free)', isPro: false },
    { id: 'grid', title: 'Grid Core', desc: 'Technical cyber grid & HUD (Free)', isPro: false },
    { id: 'aurora', title: 'Aurora Flow', desc: 'Flowing volumetric light gradients (Pro)', isPro: true },
    { id: 'liquid', title: 'Liquid Energy', desc: 'Dynamic oscillating fluid waves (Pro)', isPro: true },
  ];

  const animationModes: { mode: ChargingAnimationMode; isPro: boolean }[] = [
    { mode: 'None', isPro: false },
    { mode: 'Pulse', isPro: false },
    { mode: 'Orbit', isPro: true },
    { mode: 'Flow', isPro: true },
    { mode: 'Aurora', isPro: true },
  ];

  const handleSelectWallpaper = (wp: typeof chargingWallpapers[0]) => {
    if (wp.isPro && !isPremium) {
      onOpenPaywall();
      return;
    }
    updateSetting('chargingWallpaper', wp.id);
  };

  const handleSelectAnimation = (item: typeof animationModes[0]) => {
    if (item.isPro && !isPremium) {
      onOpenPaywall();
      return;
    }
    updateSetting('chargingAnimation', item.mode);
  };

  return (
    <div id="look-screen" className="space-y-4 pb-28 sm:pb-32 select-none">
      {/* Live Interactive Preview Card */}
      <div className="rounded-2xl p-4 bg-zinc-900/90 border border-white/10 shadow-xl overflow-hidden relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Live Customization Preview
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            {lookSettings.batteryIndicator} • {lookSettings.accent}
          </span>
        </div>

        {/* Mini Preview Stage */}
        <div className="py-2 flex items-center justify-center bg-black/40 rounded-xl border border-white/5 relative overflow-hidden">
          <div className="scale-90 transform-gpu">
            <BatteryRing3D
              level={batteryLevel}
              state={isCharging ? 'charging' : 'discharging'}
              isCharging={isCharging}
              statusType="LIVE"
              lookSettings={lookSettings}
              runtimeEstimateText="Preview Active"
            />
          </div>
        </div>
      </div>

      {/* Control 1: ACCENT COLOR */}
      <div className="rounded-2xl p-4 bg-zinc-900/90 border border-white/10 shadow-lg">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-3">
          Accent Color
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {accents.map((acc) => {
            const isSelected = lookSettings.accent === acc.name;
            return (
              <button
                key={acc.name}
                id={`accent-${acc.name.toLowerCase()}`}
                onClick={() => updateSetting('accent', acc.name)}
                className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-white/40 bg-white/10 shadow-md'
                    : 'border-white/5 bg-black/20 hover:bg-white/5'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full shadow-xs"
                  style={{ backgroundColor: acc.color }}
                />
                <span className="text-xs font-bold text-white">{acc.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-white ml-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Control 2: FULL-SCREEN CHARGING WALLPAPERS (AMBIENT DISPLAY) */}
      <div className="rounded-2xl p-4 bg-zinc-900/90 border border-white/10 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BatteryCharging className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Charging Ambient Wallpaper
            </h4>
          </div>
          {onOpenChargingScreen && (
            <button
              onClick={onOpenChargingScreen}
              className="text-[11px] font-bold text-cyan-400 hover:underline flex items-center gap-1"
            >
              <Maximize2 className="w-3 h-3" /> Preview Fullscreen
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {chargingWallpapers.map((wp) => {
            const isSelected = lookSettings.chargingWallpaper === wp.id;
            return (
              <button
                key={wp.id}
                onClick={() => handleSelectWallpaper(wp)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-sm'
                    : 'bg-black/20 text-zinc-400 border-white/5 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-white uppercase">{wp.title}</span>
                    {wp.isPro && !isPremium && (
                      <span className="text-[9px] font-bold font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> PRO
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <p className="text-[10px] text-zinc-400 mt-1 leading-tight">{wp.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Control 3: BATTERY INDICATOR STYLE */}
      <div className="rounded-2xl p-4 bg-zinc-900/90 border border-white/10 shadow-lg">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-3">
          Dashboard Indicator Geometry
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {(['Ring', 'Arc', 'Minimal'] as const).map((style) => {
            const isSelected = lookSettings.batteryIndicator === style;
            return (
              <button
                key={style}
                id={`indicator-style-${style.toLowerCase()}`}
                onClick={() => updateSetting('batteryIndicator', style)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                    : 'bg-black/20 text-zinc-400 border-white/5 hover:text-zinc-200'
                }`}
              >
                {style}
              </button>
            );
          })}
        </div>
      </div>

      {/* Control 4: CHARGING ANIMATION MODE */}
      <div className="rounded-2xl p-4 bg-zinc-900/90 border border-white/10 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Charging Energy Animation Mode
          </h4>
          <span className="text-[10px] font-mono text-zinc-400">
            {isPremium ? 'All Unlocked' : 'Pro Modes Gated'}
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {animationModes.map((item) => {
            const isSelected = lookSettings.chargingAnimation === item.mode;
            return (
              <button
                key={item.mode}
                id={`charging-anim-${item.mode.toLowerCase()}`}
                onClick={() => handleSelectAnimation(item)}
                className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center space-y-0.5 ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                    : 'bg-black/20 text-zinc-400 border-white/5 hover:text-zinc-200'
                }`}
              >
                <span>{item.mode}</span>
                {item.isPro && !isPremium && (
                  <span className="text-[8px] font-bold font-mono px-1 rounded bg-emerald-500/20 text-emerald-400 flex items-center gap-0.5">
                    <Lock className="w-2 h-2" /> PRO
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Control 5: TECHNICAL WALLPAPER THEME */}
      <div className="rounded-2xl p-4 bg-zinc-900/90 border border-white/10 shadow-lg">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-3">
          Dashboard Backdrop Theme
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {(['Midnight', 'Graphite', 'Mist'] as const).map((wp) => {
            const isSelected = lookSettings.wallpaper === wp;
            return (
              <button
                key={wp}
                id={`wallpaper-${wp.toLowerCase()}`}
                onClick={() => updateSetting('wallpaper', wp)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                    : 'bg-black/20 text-zinc-400 border-white/5 hover:text-zinc-200'
                }`}
              >
                {wp}
              </button>
            );
          })}
        </div>
      </div>

      {/* Control 6: TOGGLE OPTIONS (AMOLED, Density, Time Format, Smoothing) */}
      <div className="rounded-2xl p-4 bg-zinc-900/90 border border-white/10 shadow-lg space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
          Display & Rhythm
        </h4>

        {/* AMOLED Mode */}
        <div className="flex items-center justify-between py-1.5 border-b border-white/5">
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-white block">AMOLED Mode</span>
              {!isPremium && (
                <span className="text-[9px] font-bold font-mono px-1 rounded bg-emerald-500/20 text-emerald-400 flex items-center gap-0.5">
                  <Lock className="w-2 h-2" /> PRO
                </span>
              )}
            </div>
            <span className="text-[10px] text-zinc-400">Pure #000000 background for power saving</span>
          </div>
          <button
            onClick={() => {
              if (!isPremium && !lookSettings.amoledMode) {
                onOpenPaywall();
                return;
              }
              updateSetting('amoledMode', !lookSettings.amoledMode);
            }}
            id="toggle-amoled"
            className={`w-11 h-6 rounded-full transition-colors relative ${
              lookSettings.amoledMode ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                lookSettings.amoledMode ? 'transform translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {/* Dashboard Density */}
        <div className="flex items-center justify-between py-1.5 border-b border-white/5">
          <div>
            <span className="text-xs font-semibold text-white block">Compact Density</span>
            <span className="text-[10px] text-zinc-400">Tighter margins and padding for small phones</span>
          </div>
          <button
            onClick={() =>
              updateSetting(
                'density',
                lookSettings.density === 'Compact' ? 'Comfortable' : 'Compact'
              )
            }
            id="toggle-density"
            className={`w-11 h-6 rounded-full transition-colors relative ${
              lookSettings.density === 'Compact' ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                lookSettings.density === 'Compact' ? 'transform translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {/* 12h / 24h Clock */}
        <div className="flex items-center justify-between py-1.5">
          <div>
            <span className="text-xs font-semibold text-white block">24-Hour Time Format</span>
            <span className="text-[10px] text-zinc-400">Switch between 12-hour AM/PM and 24-hour military clock</span>
          </div>
          <button
            onClick={() =>
              updateSetting('timeFormat', lookSettings.timeFormat === '24h' ? '12h' : '24h')
            }
            id="toggle-time-format"
            className={`w-11 h-6 rounded-full transition-colors relative ${
              lookSettings.timeFormat === '24h' ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                lookSettings.timeFormat === '24h' ? 'transform translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
