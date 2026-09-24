import React, { useState } from 'react';
import { ObservationPoint, BatteryEvent, AccentColor } from '../types';
import { TelemetryChart, ChartMetricType } from './TelemetryChart';
import { RecentEventsList } from './RecentEventsList';
import { History as HistoryIcon, Download, Sparkles, Lock, BarChart3, Clock } from 'lucide-react';
import { PremiumLockCard } from './billing/PremiumLockCard';

interface HistoryViewProps {
  observations: ObservationPoint[];
  events: BatteryEvent[];
  accent: AccentColor;
  tempUnit: 'C' | 'F';
  timeFilter: '1H' | '6H' | '24H' | '7D' | '30D';
  onSelectTimeFilter: (filter: '1H' | '6H' | '24H' | '7D' | '30D') => void;
  onExportCSV: () => void;
  onClearHistory: () => void;
  totalStoredSamples?: number;
  isPremium?: boolean;
  onOpenPaywall?: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  observations,
  events,
  accent,
  tempUnit,
  timeFilter,
  onSelectTimeFilter,
  onExportCSV,
  onClearHistory,
  totalStoredSamples,
  isPremium = false,
  onOpenPaywall = () => {},
}) => {
  const [activeMetric, setActiveMetric] = useState<ChartMetricType>('level');

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

  const handleExport = () => {
    if (!isPremium) {
      onOpenPaywall();
      return;
    }
    onExportCSV();
  };

  return (
    <div id="history-screen" className="space-y-4 pb-28 sm:pb-32 select-none">
      {/* Top Header & Export Action */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <HistoryIcon className="w-5 h-5" style={{ color: accentColor }} />
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Battery Telemetry History
          </h2>
        </div>
        <button
          onClick={handleExport}
          id="btn-history-export-csv"
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg border text-xs font-semibold transition-all active:scale-95 ${
            isPremium
              ? 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300'
              : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
          }`}
          title={isPremium ? 'Export Telemetry Data as CSV' : 'Export Reports (Pro Feature)'}
        >
          {isPremium ? (
            <Download className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Lock className="w-3 h-3 text-emerald-400" />
          )}
          <span>Export CSV</span>
          {!isPremium && (
            <span className="text-[9px] font-bold px-1 rounded bg-emerald-500/20 text-emerald-400 font-mono">
              PRO
            </span>
          )}
        </button>
      </div>

      {/* Main Interactive Multi-Metric Chart: Gated for Pro */}
      {isPremium ? (
        <TelemetryChart
          observations={observations}
          activeMetric={activeMetric}
          onSelectMetric={setActiveMetric}
          timeFilter={timeFilter}
          onSelectTimeFilter={onSelectTimeFilter}
          accent={accent}
          tempUnit={tempUnit}
        />
      ) : (
        <div className="space-y-3">
          <PremiumLockCard
            title="Historical Battery Charts & Multi-Metric Curves"
            description="Access interactive level, voltage, current, and temperature charts across 1h, 6h, 24h, 7d, and 30d observation windows."
            onUnlock={onOpenPaywall}
            accent={accent}
          />
        </div>
      )}

      {/* Observation Store Statistics & Storage Health */}
      <div className="rounded-2xl p-4 bg-zinc-900/90 border border-white/10 shadow-lg flex items-center justify-between font-mono text-xs">
        <div>
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
            Stored Samples
          </span>
          <span className="font-bold text-white text-sm">
            {totalStoredSamples !== undefined ? `${totalStoredSamples} samples` : `${observations.length} samples`}
            {totalStoredSamples !== undefined && (
              <span className="text-xs text-zinc-400 font-normal ml-1">
                ({observations.length} in window)
              </span>
            )}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
            Local Persistence
          </span>
          <span className="text-emerald-400 font-bold flex items-center gap-1 justify-end">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Encrypted LocalStorage
          </span>
        </div>
      </div>

      {/* Recent Battery Events & Charging Session History: Gated for Pro */}
      {isPremium ? (
        <RecentEventsList events={events} accent={accent} />
      ) : (
        <div className="space-y-3">
          <div className="rounded-2xl p-4 bg-zinc-900/90 border border-white/10 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Charging Session History
                </h4>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                PRO FEATURE
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mb-3">
              Charging session logs, connection timestamps, thermal rise, and cycle degradation events are recorded securely in Pro.
            </p>
            <button
              onClick={onOpenPaywall}
              className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Unlock Session Logs with BatteryFlow Pro</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
