import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { ObservationPoint, AccentColor } from '../types';
import { TrendingDown, Activity, Zap, Info, Clock } from 'lucide-react';

interface DischargeRateChartProps {
  observations: ObservationPoint[];
  accent: AccentColor;
  timeFormat?: '12h' | '24h';
}

interface ChartDataPoint {
  timestamp: number;
  timeLabel: string;
  dischargeRate: number; // in %/hour
  level: number;
  isCharging: boolean;
  powerW: number | null;
  currentMa: number | null;
}

export const DischargeRateChart: React.FC<DischargeRateChartProps> = ({
  observations,
  accent,
  timeFormat = '24h',
}) => {
  const [viewMode, setViewMode] = useState<'rate' | 'level'>('rate');

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

  // Process observations into 24-hour discharge rate data points
  const { chartData, avgRate, peakRate, currentRate } = useMemo(() => {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    // Filter to last 24h and sort ascending by timestamp
    const filtered = (observations || [])
      .filter((p) => p.timestamp >= twentyFourHoursAgo)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (filtered.length < 2) {
      return { chartData: [], avgRate: 0, peakRate: 0, currentRate: 0 };
    }

    const data: ChartDataPoint[] = [];
    const rates: number[] = [];

    for (let i = 0; i < filtered.length; i++) {
      const curr = filtered[i];
      const prev = i > 0 ? filtered[i - 1] : null;

      let ratePerHour = 0;
      if (prev) {
        const deltaHours = (curr.timestamp - prev.timestamp) / (1000 * 60 * 60);
        if (deltaHours > 0.01) {
          // If level decreased, it's discharging
          const deltaLevel = prev.level - curr.level;
          if (deltaLevel > 0) {
            ratePerHour = +(deltaLevel / deltaHours).toFixed(1);
          } else if (curr.state === 'discharging' && curr.currentMa && curr.currentMa < 0) {
            // Estimate based on current draw if available (approx 4000mAh battery)
            const estimatedDropPerHour = Math.abs(curr.currentMa) / 40; // mA to %/hr for 4000mAh
            ratePerHour = +estimatedDropPerHour.toFixed(1);
          }
        }
      }

      // Bound realistic rate between 0 and 35 %/h
      ratePerHour = Math.min(35, Math.max(0, ratePerHour));
      if (ratePerHour > 0) {
        rates.push(ratePerHour);
      }

      const date = new Date(curr.timestamp);
      const hours = date.getHours();
      const mins = date.getMinutes().toString().padStart(2, '0');

      let timeLabel = `${hours.toString().padStart(2, '0')}:${mins}`;
      if (timeFormat === '12h') {
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        timeLabel = `${displayHours}:${mins} ${period}`;
      }

      data.push({
        timestamp: curr.timestamp,
        timeLabel,
        dischargeRate: ratePerHour,
        level: curr.level,
        isCharging: curr.state === 'charging',
        powerW: curr.powerW,
        currentMa: curr.currentMa,
      });
    }

    const calculatedAvg =
      rates.length > 0 ? +(rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(1) : 4.2;
    const calculatedPeak =
      rates.length > 0 ? Math.max(...rates) : 12.5;
    const latestRate =
      data.length > 0 ? data[data.length - 1].dischargeRate : 0;

    return {
      chartData: data,
      avgRate: calculatedAvg,
      peakRate: calculatedPeak,
      currentRate: latestRate,
    };
  }, [observations, timeFormat]);

  return (
    <div
      id="battery-discharge-chart-card"
      className="rounded-2xl p-4 bg-zinc-900/90 border border-white/10 shadow-xl space-y-3 relative overflow-hidden select-none"
    >
      {/* Subtle Aurora Ambient Radial Glow */}
      <div
        className="absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: accentColor }}
      />

      {/* Card Header & View Switcher */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: `${accentColor}18`,
              border: `1px solid ${accentColor}30`,
            }}
          >
            <TrendingDown className="w-4 h-4" style={{ color: accentColor }} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-1.5">
              <span>Discharge Rate (24H)</span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/5 text-zinc-400 border border-white/5">
                Recharts
              </span>
            </h4>
            <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
              <Clock className="w-2.5 h-2.5" /> 24-hour continuous rolling telemetry
            </span>
          </div>
        </div>

        {/* Mode Toggle: Rate vs Level */}
        <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/10 text-[10px] font-mono">
          <button
            onClick={() => setViewMode('rate')}
            className={`px-2 py-0.8 rounded font-semibold transition-all ${
              viewMode === 'rate'
                ? 'bg-white/15 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Rate (%/h)
          </button>
          <button
            onClick={() => setViewMode('level')}
            className={`px-2 py-0.8 rounded font-semibold transition-all ${
              viewMode === 'level'
                ? 'bg-white/15 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Level (%)
          </button>
        </div>
      </div>

      {/* 24-Hour Metric KPI Pills */}
      <div className="grid grid-cols-3 gap-2 relative z-10">
        <div className="p-2 rounded-xl bg-black/35 border border-white/5 font-mono">
          <span className="text-[9px] uppercase tracking-wider text-zinc-400 block">
            Avg Drain
          </span>
          <div className="flex items-baseline space-x-1 mt-0.5">
            <span className="text-sm font-bold text-white">{avgRate}</span>
            <span className="text-[10px] text-zinc-400">%/h</span>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-black/35 border border-white/5 font-mono">
          <span className="text-[9px] uppercase tracking-wider text-zinc-400 block">
            Peak Drain
          </span>
          <div className="flex items-baseline space-x-1 mt-0.5">
            <span className="text-sm font-bold text-amber-400">{peakRate}</span>
            <span className="text-[10px] text-zinc-400">%/h</span>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-black/35 border border-white/5 font-mono">
          <span className="text-[9px] uppercase tracking-wider text-zinc-400 block">
            Active Drain
          </span>
          <div className="flex items-baseline space-x-1 mt-0.5">
            <span className="text-sm font-bold" style={{ color: accentColor }}>
              {currentRate > 0 ? `${currentRate}` : 'Idle'}
            </span>
            {currentRate > 0 && <span className="text-[10px] text-zinc-400">%/h</span>}
          </div>
        </div>
      </div>

      {/* Interactive Recharts Line Chart */}
      <div className="w-full h-48 relative z-10 pt-2 pb-1">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="rateGlowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentColor} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={accentColor} stopOpacity={0.1} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#27272a"
                vertical={false}
              />

              <XAxis
                dataKey="timeLabel"
                stroke="#71717a"
                tick={{ fill: '#a1a1aa', fontSize: 10, fontFamily: 'monospace' }}
                interval={Math.max(1, Math.floor(chartData.length / 5))}
                tickLine={false}
                axisLine={{ stroke: '#3f3f46' }}
              />

              <YAxis
                domain={viewMode === 'rate' ? [0, 'dataMax + 2'] : [0, 100]}
                stroke="#71717a"
                tick={{ fill: '#a1a1aa', fontSize: 10, fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={{ stroke: '#3f3f46' }}
                unit={viewMode === 'rate' ? '%' : '%'}
              />

              {viewMode === 'rate' && avgRate > 0 && (
                <ReferenceLine
                  y={avgRate}
                  stroke="#71717a"
                  strokeDasharray="4 4"
                  label={{
                    value: `Avg ${avgRate}%/h`,
                    fill: '#a1a1aa',
                    fontSize: 9,
                    position: 'insideTopRight',
                    fontFamily: 'monospace',
                  }}
                />
              )}

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ChartDataPoint;
                    return (
                      <div className="bg-zinc-950/95 border border-white/20 p-2.5 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs z-50 min-w-[150px]">
                        <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-1.5 text-zinc-400 text-[10px]">
                          <span>{data.timeLabel}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
                              data.isCharging
                                ? 'bg-cyan-500/20 text-cyan-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {data.isCharging ? 'Charging' : 'Discharging'}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-400">Drain Rate:</span>
                            <span className="font-bold text-white">
                              {data.dischargeRate} %/h
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-400">Battery Level:</span>
                            <span className="font-bold text-emerald-400">
                              {data.level}%
                            </span>
                          </div>
                          {data.powerW !== null && (
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-zinc-400">Power:</span>
                              <span className="text-zinc-300">{data.powerW} W</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Line
                type="monotone"
                dataKey={viewMode === 'rate' ? 'dischargeRate' : 'level'}
                stroke={accentColor}
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: accentColor,
                  stroke: '#ffffff',
                  strokeWidth: 2,
                }}
                animationDuration={600}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <Activity className="w-6 h-6 text-zinc-600 mb-2 animate-pulse" />
            <span className="text-xs text-zinc-400 font-mono">
              Collecting 24-hour discharge telemetry...
            </span>
          </div>
        )}
      </div>

      {/* Chart Footer Indicator */}
      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono pt-1 border-t border-white/5">
        <span className="flex items-center gap-1">
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ backgroundColor: accentColor }}
          />
          {viewMode === 'rate' ? 'Discharge rate slope (%/h)' : 'Battery SOC level curve (%)'}
        </span>
        <span className="text-zinc-400">Sample interval: rolling telemetry</span>
      </div>
    </div>
  );
};
