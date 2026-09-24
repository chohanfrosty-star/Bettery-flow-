import React from 'react';
import { X, Zap, Battery, Sparkles, Smartphone, ShieldCheck, Thermometer } from 'lucide-react';
import { LiveBatteryData } from '../services/batteryService';
import { AccentColor } from '../types';

interface QuickControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  batteryData: LiveBatteryData;
  onToggleCharging: () => void;
  onSetLevel: (level: number) => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  accent: AccentColor;
}

export const QuickControlsModal: React.FC<QuickControlsModalProps> = ({
  isOpen,
  onClose,
  batteryData,
  onToggleCharging,
  onSetLevel,
  isDemoMode,
  onToggleDemoMode,
  accent,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="modal-quick-controls-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        id="modal-quick-controls-content"
        className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-white/15 p-5 shadow-2xl space-y-4 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Sensor & Simulator Hub
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Demo Mode Toggle */}
        <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold block">
              {isDemoMode ? 'Demo Simulator Active' : 'Live Hardware Mode'}
            </span>
            <span className="text-[10px] text-zinc-400">
              {isDemoMode
                ? 'Simulating full electrical & thermal telemetry'
                : 'Reading physical battery controller'}
            </span>
          </div>
          <button
            onClick={onToggleDemoMode}
            id="btn-modal-toggle-demo"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isDemoMode
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-white/10 text-zinc-300 hover:bg-white/20'
            }`}
          >
            {isDemoMode ? 'Active' : 'Enable'}
          </button>
        </div>

        {/* Interactive Level Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-zinc-400">Battery Charge Level:</span>
            <span className="font-bold text-white">{batteryData.level}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={batteryData.level}
            onChange={(e) => onSetLevel(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
            <span>Critical (5%)</span>
            <span>Half (50%)</span>
            <span>Full (100%)</span>
          </div>
        </div>

        {/* Quick Level Presets */}
        <div className="grid grid-cols-4 gap-1.5">
          {[12, 35, 78, 100].map((preset) => (
            <button
              key={preset}
              onClick={() => onSetLevel(preset)}
              className="py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-semibold text-zinc-300"
            >
              {preset}%
            </button>
          ))}
        </div>

        {/* Charger Toggle Button */}
        <div className="pt-1">
          <button
            onClick={onToggleCharging}
            id="btn-modal-toggle-charging"
            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
              batteryData.isCharging
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>
              {batteryData.isCharging
                ? 'Disconnect Charger (Unplug)'
                : 'Connect Fast USB-C Charger'}
            </span>
          </button>
        </div>

        <div className="text-[10px] text-zinc-400 text-center leading-relaxed">
          Interactive tester for validating battery rings, animations, history records, and alerts.
        </div>
      </div>
    </div>
  );
};
