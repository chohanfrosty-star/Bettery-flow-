import React from 'react';
import { MetricStatus, AccentColor } from '../types';
import { Info, HelpCircle } from 'lucide-react';

interface MetricCardProps {
  id: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  value: string | number | null;
  unit?: string;
  status: MetricStatus;
  accent: AccentColor;
  subtitle?: string;
  unavailableReason?: string;
  onClickDetail?: () => void;
  isDemoMode?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  id,
  icon: Icon,
  title,
  value,
  unit,
  status,
  accent,
  subtitle,
  unavailableReason,
  onClickDetail,
  isDemoMode,
}) => {
  const getAccentColor = () => {
    switch (accent) {
      case 'Amber':
        return '#f59e0b';
      case 'Sky':
        return '#0284c7';
      default:
        return '#10b981'; // Mint
    }
  };

  const accentColor = getAccentColor();

  const getStatusBadge = () => {
    // When DEMO mode is enabled globally at top header or status is DEMO, display DEMO badge
    if (status === 'DEMO' || (isDemoMode && status !== 'UNAVAILABLE')) {
      return (
        <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          DEMO
        </span>
      );
    }

    switch (status) {
      case 'LIVE':
        return (
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        );
      case 'CALCULATED':
        return (
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
            CALC
          </span>
        );
      case 'HISTORICAL':
        return (
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
            HIST
          </span>
        );
      case 'UNAVAILABLE':
      default:
        return (
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            UNAVAILABLE
          </span>
        );
    }
  };

  const isUnavailable = status === 'UNAVAILABLE' || value === null;

  return (
    <div
      id={id}
      onClick={onClickDetail}
      className={`relative rounded-2xl p-3.5 transition-all duration-200 border select-none ${
        isUnavailable
          ? 'bg-zinc-900/60 border-zinc-800/80'
          : 'bg-zinc-900/90 hover:bg-zinc-850 border-white/10 hover:border-white/20'
      } shadow-lg flex flex-col justify-between`}
    >
      {/* Top Row: Icon + Title + Status */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center space-x-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{
              backgroundColor: isUnavailable ? 'rgba(255, 255, 255, 0.04)' : `${accentColor}18`,
              border: `1px solid ${isUnavailable ? 'rgba(255, 255, 255, 0.08)' : `${accentColor}30`}`,
            }}
          >
            <Icon
              className="w-3.5 h-3.5"
              style={{ color: isUnavailable ? '#71717a' : accentColor }}
            />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            {title}
          </span>
        </div>
        {getStatusBadge()}
      </div>

      {/* Main Measurement Value */}
      <div className="my-1">
        {isUnavailable ? (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-zinc-400 font-mono leading-tight">
              Unavailable on this device
            </span>
            <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">
              {unavailableReason || 'Hardware measurement not exposed on this device.'}
            </p>
          </div>
        ) : (
          <div className="flex items-baseline space-x-1 font-mono">
            <span className="text-2xl font-black text-white tracking-tight">
              {value}
            </span>
            {unit && (
              <span className="text-xs font-semibold text-zinc-400">
                {unit}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Subtitle / context note */}
      {subtitle && !isUnavailable && (
        <div className="mt-1 text-[10px] text-zinc-400 font-mono flex items-center space-x-1">
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
};
