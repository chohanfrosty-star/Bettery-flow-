import React, { useState, useMemo } from 'react';
import { ObservationPoint, AccentColor } from '../types';

export type ChartMetricType = 'level' | 'temp' | 'voltage' | 'current' | 'power';

interface TelemetryChartProps {
  observations: ObservationPoint[];
  activeMetric: ChartMetricType;
  onSelectMetric: (metric: ChartMetricType) => void;
  timeFilter: '1H' | '6H' | '24H' | '7D' | '30D';
  onSelectTimeFilter: (filter: '1H' | '6H' | '24H' | '7D' | '30D') => void;
  accent: AccentColor;
  tempUnit: 'C' | 'F';
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  observations,
  activeMetric,
  onSelectMetric,
  timeFilter,
  onSelectTimeFilter,
  accent,
  tempUnit,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

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

  // Metrics definitions
  const metricConfigs: Record<
    ChartMetricType,
    { label: string; unit: string; color: string; getY: (p: ObservationPoint) => number | null }
  > = {
    level: {
      label: 'Battery %',
      unit: '%',
      color: accentColor,
      getY: (p) => p.level,
    },
    temp: {
      label: 'Temperature',
      unit: tempUnit === 'F' ? '°F' : '°C',
      color: '#f97316',
      getY: (p) => {
        if (p.tempC === null) return null;
        return tempUnit === 'F' ? +(p.tempC * 1.8 + 32).toFixed(1) : p.tempC;
      },
    },
    voltage: {
      label: 'Voltage',
      unit: 'V',
      color: '#8b5cf6',
      getY: (p) => p.voltageV,
    },
    current: {
      label: 'Current',
      unit: 'mA',
      color: '#06b6d4',
      getY: (p) => p.currentMa,
    },
    power: {
      label: 'Power',
      unit: 'W',
      color: '#ec4899',
      getY: (p) => p.powerW,
    },
  };

  const currentConfig = metricConfigs[activeMetric];

  // Extract non-null data points
  const validData = useMemo(() => {
    return observations
      .map((p) => ({
        point: p,
        val: currentConfig.getY(p),
      }))
      .filter((item): item is { point: ObservationPoint; val: number } => item.val !== null);
  }, [observations, currentConfig]);

  // Statistics: min, max, avg, drain
  const stats = useMemo(() => {
    if (validData.length === 0) {
      return { min: null, max: null, avg: null, latest: null, drainTrend: null };
    }
    const vals = validData.map((d) => d.val);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const avg = +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
    const latest = vals[vals.length - 1];

    let drainTrend: string | null = null;
    if (validData.length >= 2 && activeMetric === 'level') {
      const first = validData[0];
      const last = validData[validData.length - 1];
      const hours = Math.max(0.2, (last.point.timestamp - first.point.timestamp) / (3600 * 1000));
      const delta = last.val - first.val;
      const rate = +(delta / hours).toFixed(1);
      drainTrend = rate >= 0 ? `+${rate}%/hr` : `${rate}%/hr`;
    }

    return { min, max, avg, latest, drainTrend };
  }, [validData, activeMetric]);

  // SVG dimensions
  const width = 380;
  const height = 180;
  const padding = { top: 20, right: 15, bottom: 25, left: 35 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Scales
  const bounds = useMemo(() => {
    if (validData.length === 0) return { minY: 0, maxY: 100, minX: 0, maxX: 1 };

    let minY = Math.min(...validData.map((d) => d.val));
    let maxY = Math.max(...validData.map((d) => d.val));

    if (activeMetric === 'level') {
      minY = Math.min(0, Math.floor(minY / 10) * 10);
      maxY = 100;
    } else {
      const margin = (maxY - minY) * 0.1 || 1;
      minY = +(minY - margin).toFixed(1);
      maxY = +(maxY + margin).toFixed(1);
    }

    const minX = validData[0].point.timestamp;
    const maxX = validData[validData.length - 1].point.timestamp;

    return { minY, maxY, minX, maxX: maxX === minX ? minX + 1 : maxX };
  }, [validData, activeMetric]);

  const pointsString = useMemo(() => {
    if (validData.length === 0) return '';

    return validData
      .map((d) => {
        const x =
          padding.left +
          ((d.point.timestamp - bounds.minX) / (bounds.maxX - bounds.minX)) * chartW;
        const y =
          padding.top +
          chartH -
          ((d.val - bounds.minY) / (bounds.maxY - bounds.minY)) * chartH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [validData, bounds, padding, chartW, chartH]);

  const activePoint = hoverIndex !== null && validData[hoverIndex] ? validData[hoverIndex] : null;

  return (
    <div
      id="telemetry-chart-card"
      className="rounded-2xl p-4 bg-zinc-900/90 border border-white/10 shadow-xl select-none"
    >
      {/* Top Header: Metric Selector & Time Range Filter */}
      <div className="flex flex-col gap-3 mb-3">
        {/* Metric Selector Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none">
          {(['level', 'temp', 'voltage', 'current', 'power'] as ChartMetricType[]).map((m) => {
            const isSelected = activeMetric === m;
            const cfg = metricConfigs[m];
            return (
              <button
                key={m}
                id={`chart-metric-${m}`}
                onClick={() => onSelectMetric(m)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap border ${
                  isSelected
                    ? 'text-white border-white/20 shadow-sm'
                    : 'text-zinc-400 bg-white/5 border-transparent hover:bg-white/10 hover:text-zinc-200'
                }`}
                style={isSelected ? { backgroundColor: `${cfg.color}35`, borderColor: `${cfg.color}60` } : undefined}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Time Filter Buttons (1H, 6H, 24H, 7D, 30D) */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
            Range Filter
          </span>
          <div className="flex items-center space-x-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
            {(['1H', '6H', '24H', '7D', '30D'] as const).map((range) => {
              const isActive = timeFilter === range;
              return (
                <button
                  key={range}
                  id={`time-filter-${range}`}
                  onClick={() => onSelectTimeFilter(range)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                    isActive
                      ? 'bg-white/15 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  style={isActive ? { color: accentColor } : undefined}
                >
                  {range}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-4 gap-2 py-2 mb-2 border-y border-white/5 bg-black/20 rounded-xl px-3 font-mono">
        <div>
          <span className="text-[9px] uppercase tracking-wider text-zinc-400 block">Current</span>
          <span className="text-xs font-bold text-white">
            {stats.latest !== null ? `${stats.latest}${currentConfig.unit}` : '—'}
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-zinc-400 block">Min / Max</span>
          <span className="text-xs font-semibold text-zinc-300">
            {stats.min !== null && stats.max !== null
              ? `${stats.min} / ${stats.max}`
              : '—'}
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-zinc-400 block">Average</span>
          <span className="text-xs font-semibold text-zinc-300">
            {stats.avg !== null ? `${stats.avg}${currentConfig.unit}` : '—'}
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-zinc-400 block">Trend</span>
          <span
            className="text-xs font-bold"
            style={{ color: stats.drainTrend ? accentColor : '#a1a1aa' }}
          >
            {stats.drainTrend || 'Stable'}
          </span>
        </div>
      </div>

      {/* SVG Interactive Chart Area */}
      <div className="relative w-full overflow-hidden">
        {validData.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/10 rounded-xl">
            <span className="text-sm font-semibold text-zinc-300 mb-1">
              No telemetry in this range
            </span>
            <p className="text-xs text-zinc-400 max-w-xs">
              {activeMetric === 'temp' || activeMetric === 'voltage' || activeMetric === 'current'
                ? 'Hardware sensor is unavailable on this device or needs Demo Mode to simulate.'
                : 'Keep BatteryFlow active to collect more continuous observations.'}
            </p>
          </div>
        ) : (
          <div className="relative">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = ((e.clientX - rect.left) / rect.width) * width;
                const relX = mouseX - padding.left;
                if (relX >= 0 && relX <= chartW && validData.length > 0) {
                  const fraction = relX / chartW;
                  const idx = Math.min(
                    validData.length - 1,
                    Math.max(0, Math.round(fraction * (validData.length - 1)))
                  );
                  setHoverIndex(idx);
                }
              }}
              onMouseLeave={() => setHoverIndex(null)}
              onTouchMove={(e) => {
                const touch = e.touches[0];
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = ((touch.clientX - rect.left) / rect.width) * width;
                const relX = mouseX - padding.left;
                if (relX >= 0 && relX <= chartW && validData.length > 0) {
                  const fraction = relX / chartW;
                  const idx = Math.min(
                    validData.length - 1,
                    Math.max(0, Math.round(fraction * (validData.length - 1)))
                  );
                  setHoverIndex(idx);
                }
              }}
              onTouchEnd={() => setHoverIndex(null)}
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={currentConfig.color} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={currentConfig.color} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.33, 0.66, 1].map((ratio) => {
                const y = padding.top + chartH * ratio;
                const val = (bounds.maxY - ratio * (bounds.maxY - bounds.minY)).toFixed(0);
                return (
                  <g key={ratio}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={width - padding.right}
                      y2={y}
                      stroke="rgba(255, 255, 255, 0.06)"
                      strokeDasharray="2 4"
                    />
                    <text
                      x={padding.left - 6}
                      y={y + 3}
                      fill="#71717a"
                      fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="end"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Area fill */}
              {pointsString && (
                <polygon
                  points={`${padding.left},${padding.top + chartH} ${pointsString} ${
                    width - padding.right
                  },${padding.top + chartH}`}
                  fill="url(#chartGradient)"
                />
              )}

              {/* Line path */}
              {pointsString && (
                <polyline
                  points={pointsString}
                  fill="none"
                  stroke={currentConfig.color}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Scrubber Crosshair & Tooltip */}
              {activePoint && hoverIndex !== null && (
                <g>
                  {/* Scrubber vertical line */}
                  <line
                    x1={
                      padding.left +
                      ((activePoint.point.timestamp - bounds.minX) / (bounds.maxX - bounds.minX)) *
                        chartW
                    }
                    y1={padding.top}
                    x2={
                      padding.left +
                      ((activePoint.point.timestamp - bounds.minX) / (bounds.maxX - bounds.minX)) *
                        chartW
                    }
                    y2={padding.top + chartH}
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                    strokeOpacity="0.7"
                  />
                  {/* Active dot */}
                  <circle
                    cx={
                      padding.left +
                      ((activePoint.point.timestamp - bounds.minX) / (bounds.maxX - bounds.minX)) *
                        chartW
                    }
                    cy={
                      padding.top +
                      chartH -
                      ((activePoint.val - bounds.minY) / (bounds.maxY - bounds.minY)) * chartH
                    }
                    r="4.5"
                    fill="#ffffff"
                    stroke={currentConfig.color}
                    strokeWidth="2.5"
                  />
                </g>
              )}
            </svg>

            {/* Hover Tooltip floating box */}
            {activePoint && (
              <div
                className="absolute top-2 right-2 bg-zinc-950/95 border border-white/20 px-2.5 py-1.5 rounded-lg shadow-xl font-mono text-[11px] pointer-events-none"
                style={{ backdropFilter: 'blur(8px)' }}
              >
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">
                    {activePoint.val} {currentConfig.unit}
                  </span>
                  <span className="text-[10px] text-zinc-400 capitalize">
                    {activePoint.point.state}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400">
                  {new Date(activePoint.point.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
