import React, { useState, useEffect } from 'react';
import { BatteryCharging, RefreshCw, Zap, ShieldCheck, Sparkles, SlidersHorizontal, Info } from 'lucide-react';
import { LookSettings } from '../types';
import { HapticService } from '../services/mobile/hapticService';

interface HeaderProps {
  isCharging: boolean;
  isDemoMode: boolean;
  isHardwareApiAvailable: boolean;
  lookSettings: LookSettings;
  onToggleDemoMode: () => void;
  onRefresh: () => void;
  onOpenQuickControls?: () => void;
  onOpenChargingScreen?: () => void;
  isPremium?: boolean;
  onOpenPaywall?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isCharging,
  isDemoMode,
  isHardwareApiAvailable,
  lookSettings,
  onToggleDemoMode,
  onRefresh,
  onOpenQuickControls,
  onOpenChargingScreen,
  isPremium = false,
  onOpenPaywall,
}) => {
  const [timeString, setTimeString] = useState('');
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: lookSettings.timeFormat === '12h',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [lookSettings.timeFormat]);

  const handleRefresh = () => {
    setIsRotating(true);
    onRefresh();
    setTimeout(() => setIsRotating(false), 600);
  };

  const getAccentColorHex = () => {
    switch (lookSettings.accent) {
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

  const accentColor = getAccentColorHex();

  return (
    <header className="w-full pt-[max(env(safe-area-inset-top,0px),0.75rem)] pb-2.5 px-4 flex items-center justify-between border-b border-white/5 relative z-20 backdrop-blur-md">
      {/* Brand Identity */}
      <div className="flex items-center space-x-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center relative shadow-sm cursor-pointer touch-press"
          onClick={() => {
            HapticService.light();
            onOpenChargingScreen?.();
          }}
          title="Open Ambient Charging Display"
          style={{
            backgroundColor: `${accentColor}20`,
            border: `1px solid ${accentColor}40`,
          }}
        >
          <Zap className="w-4 h-4 transition-transform duration-300" style={{ color: accentColor }} />
          {isCharging && (
            <span
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: accentColor }}
            />
          )}
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-black tracking-wider uppercase text-zinc-100 font-display">
              BATTERY<span style={{ color: accentColor }}>FLOW</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-white/10 text-zinc-300 border border-white/10">
              v2.4
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-[10px] text-zinc-400">
            {isDemoMode ? (
              <span className="text-amber-400 font-medium flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 inline" /> DEMO SENSORS
              </span>
            ) : isHardwareApiAvailable ? (
              <span className="text-emerald-400 font-medium flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                LIVE HARDWARE
              </span>
            ) : (
              <span className="text-zinc-400 font-medium flex items-center gap-0.5">
                <Info className="w-2.5 h-2.5 inline" /> SANDBOX MODE
              </span>
            )}
            <span>•</span>
            <span className="font-mono text-zinc-300">{timeString}</span>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center space-x-1.5">
        {/* Pro Status / Upgrade Button */}
        {onOpenPaywall && (
          <button
            onClick={() => {
              HapticService.medium();
              onOpenPaywall();
            }}
            id="btn-header-pro-status"
            className={`px-2 py-1 text-[11px] font-black uppercase tracking-wider rounded-md transition-all flex items-center space-x-1 border touch-press ${
              isPremium
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                : 'bg-gradient-to-r from-emerald-500 to-cyan-400 text-black border-none font-extrabold hover:opacity-95 shadow-sm'
            }`}
            title={isPremium ? 'BatteryFlow Pro Active - View Google Play Subscription' : 'Upgrade to BatteryFlow Pro via Google Play'}
          >
            <Sparkles className="w-3 h-3" />
            <span>{isPremium ? 'PRO' : 'GO PRO'}</span>
          </button>
        )}

        {/* Ambient Charging Display button */}
        {onOpenChargingScreen && (
          <button
            onClick={() => {
              HapticService.light();
              onOpenChargingScreen();
            }}
            id="btn-header-charging-screen"
            aria-label="Open Ambient Charging Screen"
            title="Open Fullscreen Ambient Charging Wallpaper"
            className="p-1.5 rounded-md bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 border border-white/10 transition-all touch-press"
          >
            <BatteryCharging className="w-3.5 h-3.5" style={{ color: isCharging ? accentColor : undefined }} />
          </button>
        )}

        {/* Demo Mode Toggle Button */}
        <button
          onClick={() => {
            HapticService.light();
            onToggleDemoMode();
          }}
          id="btn-toggle-demo-mode"
          aria-label={isDemoMode ? 'Switch to Real Hardware' : 'Enable Demo Simulation'}
          title={isDemoMode ? 'Click to use Real Hardware API' : 'Click to test full sensors in Demo Mode'}
          className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-all flex items-center space-x-1 border touch-press ${
            isDemoMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>{isDemoMode ? 'Demo' : 'Simulator'}</span>
        </button>

        {/* Quick Refresh */}
        <button
          onClick={() => {
            HapticService.light();
            handleRefresh();
          }}
          id="btn-header-refresh"
          aria-label="Refresh battery telemetry"
          title="Refresh Battery Telemetry"
          className="p-1.5 rounded-md bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 border border-white/10 transition-all touch-press"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
        </button>

        {/* Quick controls modal trigger */}
        {onOpenQuickControls && (
          <button
            onClick={() => {
              HapticService.light();
              onOpenQuickControls();
            }}
            id="btn-quick-controls"
            aria-label="Open Quick Controls"
            title="Interactive Battery Simulator Controls"
            className="p-1.5 rounded-md bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 border border-white/10 transition-all touch-press"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
};
