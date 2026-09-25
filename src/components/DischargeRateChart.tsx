import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import { ObservationPoint, AccentColor } from '../types';
import { TrendingDown, Activity, AlertTriangle, Clock, Zap, ShieldAlert, Sparkles } from 'lucide-react';
import { HapticService } from '../services/mobile/hapticService';

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
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);
  const [scrubberX, setScrubberX] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const lastHapticIndexRef = useRef<number>(-1);

  // Responsive dimensions state
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 360,
    height: 220,
  });

  const getAccentHex = (acc: AccentColor): string => {
    switch (acc) {
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

  const accentColor = getAccentHex(accent);

  // ResizeObserver to automatically adapt SVG to mobile screen width
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          setDimensions({
            width,
            height: Math.min(240, Math.max(190, Math.round(width * 0.58))),
          });
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Process raw observations into 24-hour rolling telemetry data points
  const { chartData, avgRate, peakRate, currentRate, peakPoint, highDrainCount } = useMemo(() => {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    // Filter to observations within the last 24h and sort ascending
    const filtered = (observations || [])
      .filter((p) => p.timestamp >= twentyFourHoursAgo)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (filtered.length < 2) {
      return {
        chartData: [],
        avgRate: 0,
        peakRate: 0,
        currentRate: 0,
        peakPoint: null as ChartDataPoint | null,
        highDrainCount: 0,
      };
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
          const deltaLevel = prev.level - curr.level;
          if (deltaLevel > 0) {
            ratePerHour = +(deltaLevel / deltaHours).toFixed(1);
          } else if (curr.state === 'discharging' && curr.currentMa && curr.currentMa < 0) {
            // Fallback estimation using current draw (4000mAh reference capacity)
            const estimatedDropPerHour = Math.abs(curr.currentMa) / 40;
            ratePerHour = +estimatedDropPerHour.toFixed(1);
          }
        }
      }

      // Bound realistic discharge rate between 0 and 35 %/h
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
        powerW: curr.powerW ?? null,
        currentMa: curr.currentMa ?? null,
      });
    }

    const calculatedAvg =
      rates.length > 0 ? +(rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(1) : 4.2;
    const calculatedPeak = rates.length > 0 ? Math.max(...rates) : 12.5;
    const latestRate = data.length > 0 ? data[data.length - 1].dischargeRate : 0;

    let peakItem: ChartDataPoint | null = null;
    let highCount = 0;

    for (const d of data) {
      if (!peakItem || d.dischargeRate > peakItem.dischargeRate) {
        peakItem = d;
      }
      if (d.dischargeRate >= 10) {
        highCount++;
      }
    }

    return {
      chartData: data,
      avgRate: calculatedAvg,
      peakRate: calculatedPeak,
      currentRate: latestRate,
      peakPoint: peakItem,
      highDrainCount: highCount,
    };
  }, [observations, timeFormat]);

  // Chart Margins & Inner Canvas Dimensions
  const margin = { top: 22, right: 14, bottom: 28, left: 34 };
  const innerWidth = Math.max(0, dimensions.width - margin.left - margin.right);
  const innerHeight = Math.max(0, dimensions.height - margin.top - margin.bottom);

  // D3 Scales Calculation
  const { xScale, yScale, areaPath, linePath, yTicks, xTicks, yMax } = useMemo(() => {
    if (chartData.length < 2 || innerWidth <= 0 || innerHeight <= 0) {
      return {
        xScale: null,
        yScale: null,
        areaPath: '',
        linePath: '',
        yTicks: [],
        xTicks: [],
        yMax: 0,
      };
    }

    const minTime = chartData[0].timestamp;
    const maxTime = chartData[chartData.length - 1].timestamp;

    const xs = d3.scaleTime().domain([new Date(minTime), new Date(maxTime)]).range([0, innerWidth]);

    const targetMax =
      viewMode === 'rate'
        ? Math.max(14, Math.ceil(peakRate * 1.2))
        : 100;

    const ys = d3
      .scaleLinear()
      .domain([0, targetMax])
      .range([innerHeight, 0])
      .nice();

    // D3 Curve & Area Generators
    const valueAccessor = (d: ChartDataPoint) =>
      viewMode === 'rate' ? d.dischargeRate : d.level;

    const lineGenerator = d3
      .line<ChartDataPoint>()
      .x((d) => xs(new Date(d.timestamp)))
      .y((d) => ys(valueAccessor(d)))
      .curve(d3.curveMonotoneX);

    const areaGenerator = d3
      .area<ChartDataPoint>()
      .x((d) => xs(new Date(d.timestamp)))
      .y0(innerHeight)
      .y1((d) => ys(valueAccessor(d)))
      .curve(d3.curveMonotoneX);

    const lPath = lineGenerator(chartData) || '';
    const aPath = areaGenerator(chartData) || '';

    // Calculate intelligent tick steps
    const yTickValues = ys.ticks(4);
    const xTickValues = xs.ticks(innerWidth > 320 ? 5 : 4);

    return {
      xScale: xs,
      yScale: ys,
      areaPath: aPath,
      linePath: lPath,
      yTicks: yTickValues,
      xTicks: xTickValues,
      yMax: targetMax,
    };
  }, [chartData, viewMode, peakRate, innerWidth, innerHeight]);

  // Touch & Pointer Scrubber Interaction
  const handlePointerMove = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (!xScale || !svgRef.current || chartData.length < 2) return;

      const rect = svgRef.current.getBoundingClientRect();
      const pointerX = event.clientX - rect.left - margin.left;

      if (pointerX < 0 || pointerX > innerWidth) {
        setHoveredPoint(null);
        setScrubberX(null);
        return;
      }

      const hoveredDate = xScale.invert(pointerX);
      const hoveredTimestamp = hoveredDate.getTime();

      // D3 Bisector for fast O(log N) lookup
      const bisect = d3.bisector<ChartDataPoint, number>((d) => d.timestamp).center;
      const index = bisect(chartData, hoveredTimestamp);
      const clampedIndex = Math.max(0, Math.min(chartData.length - 1, index));
      const targetPoint = chartData[clampedIndex];

      if (targetPoint) {
        setHoveredPoint(targetPoint);
        setScrubberX(xScale(new Date(targetPoint.timestamp)));

        // Haptic feedback trigger on point change
        if (lastHapticIndexRef.current !== clampedIndex) {
          lastHapticIndexRef.current = clampedIndex;
          HapticService.light();
        }
      }
    },
    [xScale, chartData, innerWidth, margin.left]
  );

  const handlePointerLeave = useCallback(() => {
    setHoveredPoint(null);
    setScrubberX(null);
    lastHapticIndexRef.current = -1;
  }, []);

  // Format D3 X-Axis ticks
  const formatXTick = (date: Date): string => {
    const hours = date.getHours();
    const mins = date.getMinutes().toString().padStart(2, '0');
    if (timeFormat === '12h') {
      const period = hours >= 12 ? 'P' : 'A';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${mins}${period}`;
    }
    return `${hours.toString().padStart(2, '0')}:${mins}`;
  };

  return (
    <div
      id="battery-discharge-chart-card"
      className="rounded-2xl p-4 bg-zinc-900/90 border border-white/10 shadow-xl space-y-3 relative overflow-hidden select-none"
    >
      {/* Aurora Ambient Radial Glow */}
      <div
        className="absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl opacity-15 pointer-events-none transition-colors duration-500"
        style={{ backgroundColor: accentColor }}
      />

      {/* Card Header & Controls */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-300"
            style={{
              backgroundColor: `${accentColor}18`,
              border: `1px solid ${accentColor}30`,
            }}
          >
            <TrendingDown className="w-4 h-4" style={{ color: accentColor }} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-100">
                Discharge Rate (24H)
              </h4>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/5 text-zinc-400 border border-white/5 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-cyan-400" /> D3.js
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
              <Clock className="w-2.5 h-2.5" /> 24-hour continuous rolling telemetry
            </span>
          </div>
        </div>

        {/* View Mode Toggle: Rate vs Level */}
        <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/10 text-[10px] font-mono">
          <button
            onClick={() => {
              HapticService.light();
              setViewMode('rate');
            }}
            className={`px-2 py-0.8 rounded font-semibold transition-all ${
              viewMode === 'rate'
                ? 'bg-white/15 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Rate (%/h)
          </button>
          <button
            onClick={() => {
              HapticService.light();
              setViewMode('level');
            }}
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

      {/* 24-Hour KPI Summary Strip */}
      <div className="grid grid-cols-3 gap-2 relative z-10">
        <div className="p-2 rounded-xl bg-black/35 border border-white/5 font-mono">
          <span className="text-[9px] uppercase tracking-wider text-zinc-400 block">
            Avg Drain
          </span>
          <div className="flex items-baseline space-x-1 mt-0.5">
            <span className="text-sm font-bold text-white tabular-nums">{avgRate}</span>
            <span className="text-[10px] text-zinc-400">%/h</span>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-black/35 border border-white/5 font-mono">
          <span className="text-[9px] uppercase tracking-wider text-zinc-400 block">
            Peak Drain
          </span>
          <div className="flex items-baseline space-x-1 mt-0.5">
            <span className="text-sm font-bold text-amber-400 tabular-nums">{peakRate}</span>
            <span className="text-[10px] text-zinc-400">%/h</span>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-black/35 border border-white/5 font-mono">
          <span className="text-[9px] uppercase tracking-wider text-zinc-400 block">
            Active Drain
          </span>
          <div className="flex items-baseline space-x-1 mt-0.5">
            <span className="text-sm font-bold tabular-nums" style={{ color: accentColor }}>
              {currentRate > 0 ? `${currentRate}` : 'Idle'}
            </span>
            {currentRate > 0 && <span className="text-[10px] text-zinc-400">%/h</span>}
          </div>
        </div>
      </div>

      {/* High Discharge Anomaly Callout Banner */}
      {viewMode === 'rate' && highDrainCount > 0 && peakPoint && peakRate >= 10 && (
        <div className="rounded-xl px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-[11px] text-amber-300 font-mono">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Peak spike: <strong>{peakPoint.dischargeRate}%/h</strong> at {peakPoint.timeLabel}
            </span>
          </div>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 uppercase font-bold">
            Heavy Load
          </span>
        </div>
      )}

      {/* Interactive D3 SVG Canvas Container */}
      <div
        ref={containerRef}
        className="w-full relative z-10 pt-1 pb-1 touch-pan-y"
        style={{ minHeight: `${dimensions.height}px` }}
      >
        {chartData.length >= 2 && xScale && yScale ? (
          <div className="relative w-full">
            <svg
              ref={svgRef}
              width={dimensions.width}
              height={dimensions.height}
              className="overflow-visible cursor-crosshair select-none block"
              onPointerMove={handlePointerMove}
              onPointerDown={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              onPointerCancel={handlePointerLeave}
            >
              <defs>
                {/* Area Gradient with smooth vertical fade */}
                <linearGradient id="d3RateGlowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentColor} stopOpacity={0.4} />
                  <stop offset="65%" stopColor={accentColor} stopOpacity={0.08} />
                  <stop offset="100%" stopColor={accentColor} stopOpacity={0.0} />
                </linearGradient>

                {/* Subtle Amber Threshold Gradient for high drain zone */}
                <linearGradient id="d3HighDrainGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>

                {/* Scrubber Glow Filter */}
                <filter id="scrubberGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <g transform={`translate(${margin.left}, ${margin.top})`}>
                {/* High Drain (>10%/h) Warning Zone Background (Rate View Only) */}
                {viewMode === 'rate' && yScale(10) > 0 && (
                  <g className="pointer-events-none">
                    <rect
                      x={0}
                      y={0}
                      width={innerWidth}
                      height={Math.max(0, yScale(10))}
                      fill="url(#d3HighDrainGradient)"
                    />
                    <line
                      x1={0}
                      y1={yScale(10)}
                      x2={innerWidth}
                      y2={yScale(10)}
                      stroke="#f59e0b"
                      strokeWidth={1}
                      strokeDasharray="2 3"
                      strokeOpacity={0.4}
                    />
                    <text
                      x={innerWidth - 4}
                      y={Math.max(10, yScale(10) - 4)}
                      fill="#f59e0b"
                      fontSize={8}
                      fontFamily="monospace"
                      textAnchor="end"
                      opacity={0.7}
                    >
                      Threshold (10%/h)
                    </text>
                  </g>
                )}

                {/* Horizontal Grid Lines & Y-Axis Labels */}
                {yTicks.map((tickVal) => {
                  const y = yScale(tickVal);
                  if (y < 0 || y > innerHeight) return null;
                  return (
                    <g key={`y-tick-${tickVal}`} className="pointer-events-none">
                      <line
                        x1={0}
                        y1={y}
                        x2={innerWidth}
                        y2={y}
                        stroke="rgba(255, 255, 255, 0.07)"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={-6}
                        y={y + 3}
                        fill="#71717a"
                        fontSize={9}
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        {tickVal}
                        {viewMode === 'rate' ? '%' : '%'}
                      </text>
                    </g>
                  );
                })}

                {/* Vertical Time Ticks & X-Axis Labels */}
                {xTicks.map((tickDate, idx) => {
                  const x = xScale(tickDate);
                  if (x < 0 || x > innerWidth) return null;
                  return (
                    <g key={`x-tick-${idx}`} className="pointer-events-none">
                      <line
                        x1={x}
                        y1={0}
                        x2={x}
                        y2={innerHeight}
                        stroke="rgba(255, 255, 255, 0.04)"
                      />
                      <text
                        x={x}
                        y={innerHeight + 16}
                        fill="#71717a"
                        fontSize={9}
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {formatXTick(tickDate)}
                      </text>
                    </g>
                  );
                })}

                {/* 24H Average Drain Reference Line (Rate View Only) */}
                {viewMode === 'rate' && avgRate > 0 && yScale(avgRate) <= innerHeight && (
                  <g className="pointer-events-none">
                    <line
                      x1={0}
                      y1={yScale(avgRate)}
                      x2={innerWidth}
                      y2={yScale(avgRate)}
                      stroke="#a1a1aa"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      strokeOpacity={0.65}
                    />
                    <text
                      x={6}
                      y={Math.max(10, yScale(avgRate) - 4)}
                      fill="#a1a1aa"
                      fontSize={8.5}
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      Avg {avgRate}%/h
                    </text>
                  </g>
                )}

                {/* D3 Area Path */}
                <path
                  d={areaPath}
                  fill="url(#d3RateGlowGradient)"
                  className="pointer-events-none transition-all duration-300"
                />

                {/* D3 Main Trend Line Path */}
                <path
                  d={linePath}
                  fill="none"
                  stroke={accentColor}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pointer-events-none transition-all duration-300"
                />

                {/* Peak Rate Highlight Indicator (when not hovering) */}
                {!hoveredPoint && peakPoint && viewMode === 'rate' && (
                  <g
                    transform={`translate(${xScale(new Date(peakPoint.timestamp))}, ${yScale(
                      peakPoint.dischargeRate
                    )})`}
                    className="pointer-events-none"
                  >
                    <circle r={6} fill="#f59e0b" opacity={0.25} />
                    <circle r={3} fill="#f59e0b" stroke="#ffffff" strokeWidth={1.5} />
                  </g>
                )}

                {/* Interactive Touch Scrubber Line & Dot */}
                {scrubberX !== null && hoveredPoint && (
                  <g className="pointer-events-none">
                    {/* Vertical Scrubber Crosshair */}
                    <line
                      x1={scrubberX}
                      y1={0}
                      x2={scrubberX}
                      y2={innerHeight}
                      stroke={accentColor}
                      strokeWidth={1.5}
                      strokeDasharray="2 2"
                      opacity={0.8}
                    />

                    {/* Active Highlight Dot on the curve */}
                    <g
                      transform={`translate(${scrubberX}, ${yScale(
                        viewMode === 'rate' ? hoveredPoint.dischargeRate : hoveredPoint.level
                      )})`}
                    >
                      <circle
                        r={8}
                        fill={accentColor}
                        opacity={0.35}
                        filter="url(#scrubberGlow)"
                      />
                      <circle
                        r={4.5}
                        fill={accentColor}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    </g>
                  </g>
                )}
              </g>
            </svg>

            {/* Floating Interactive Scrubber HUD Tooltip */}
            {hoveredPoint && scrubberX !== null && (
              <div
                className="absolute z-30 pointer-events-none transition-all duration-75"
                style={{
                  top: '6px',
                  left: `${Math.min(
                    innerWidth - 70,
                    Math.max(margin.left, margin.left + scrubberX - 75)
                  )}px`,
                }}
              >
                <div className="bg-zinc-950/95 border border-white/20 px-3 py-2 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs min-w-[155px]">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-1.5 text-zinc-400 text-[10px]">
                    <span className="font-bold text-white">{hoveredPoint.timeLabel}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
                        hoveredPoint.isCharging
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {hoveredPoint.isCharging ? 'Charging' : 'Discharging'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Drain Rate:</span>
                      <span
                        className="font-bold tabular-nums"
                        style={{
                          color:
                            hoveredPoint.dischargeRate >= 10
                              ? '#f87171'
                              : hoveredPoint.dischargeRate >= 6
                              ? '#fbbf24'
                              : '#ffffff',
                        }}
                      >
                        {hoveredPoint.dischargeRate} %/h
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Battery Level:</span>
                      <span className="font-bold text-emerald-400 tabular-nums">
                        {hoveredPoint.level}%
                      </span>
                    </div>

                    {hoveredPoint.powerW !== null && (
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-zinc-400">Power:</span>
                        <span className="text-zinc-300 tabular-nums">
                          {hoveredPoint.powerW} W
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-44 flex flex-col items-center justify-center text-center p-4">
            <Activity className="w-6 h-6 text-zinc-600 mb-2 animate-pulse" />
            <span className="text-xs text-zinc-400 font-mono">
              Collecting 24-hour discharge telemetry...
            </span>
          </div>
        )}
      </div>

      {/* Chart Footer Indicator */}
      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono pt-1 border-t border-white/5">
        <span className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full inline-block transition-colors duration-300"
            style={{ backgroundColor: accentColor }}
          />
          {viewMode === 'rate'
            ? 'Discharge velocity slope (%/h)'
            : 'Battery state-of-charge SOC (%)'}
        </span>
        <span className="text-zinc-400 hidden sm:inline">D3 Monotone Spline Interpolation</span>
        <span className="text-zinc-400 sm:hidden">D3 24H</span>
      </div>
    </div>
  );
};
