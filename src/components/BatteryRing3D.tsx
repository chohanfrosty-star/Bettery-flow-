import React, { useEffect, useRef } from 'react';
import { BatteryState, LookSettings, MetricStatus } from '../types';
import { Zap, AlertTriangle, ShieldCheck, BatteryCharging } from 'lucide-react';

interface BatteryRing3DProps {
  level: number; // 0 to 100
  state: BatteryState;
  isCharging: boolean;
  statusType: MetricStatus;
  lookSettings: LookSettings;
  runtimeEstimateText: string;
}

export const BatteryRing3D: React.FC<BatteryRing3DProps> = ({
  level,
  state,
  isCharging,
  statusType,
  lookSettings,
  runtimeEstimateText,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const getAccentColors = () => {
    switch (lookSettings.accent) {
      case 'Cyan':
        return {
          primary: '#00d2ff',
          glow: 'rgba(0, 210, 255, 0.4)',
          deepGlow: 'rgba(0, 210, 255, 0.15)',
          gradientStart: '#38bdf8',
          gradientEnd: '#00d2ff',
        };
      case 'Amber':
        return {
          primary: '#f59e0b',
          glow: 'rgba(245, 158, 11, 0.35)',
          deepGlow: 'rgba(245, 158, 11, 0.12)',
          gradientStart: '#fbbf24',
          gradientEnd: '#d97706',
        };
      case 'Sky':
        return {
          primary: '#0ea5e9',
          glow: 'rgba(14, 165, 233, 0.35)',
          deepGlow: 'rgba(14, 165, 233, 0.12)',
          gradientStart: '#38bdf8',
          gradientEnd: '#0284c7',
        };
      default: // Mint
        return {
          primary: '#10b981',
          glow: 'rgba(16, 185, 129, 0.35)',
          deepGlow: 'rgba(16, 185, 129, 0.12)',
          gradientStart: '#34d399',
          gradientEnd: '#059669',
        };
    }
  };

  const colors = getAccentColors();
  const isFullyCharged = level >= 100 && isCharging;
  const isCritical = level <= 10 && !isCharging;
  const isWarning = level <= 20 && !isCharging;

  const activeColor = isCritical
    ? '#ef4444'
    : isWarning
    ? '#f59e0b'
    : isFullyCharged
    ? '#10b981'
    : isCharging
    ? '#00d2ff'
    : colors.primary;

  const activeGradientStart = isCritical
    ? '#f87171'
    : isWarning
    ? '#fbbf24'
    : isFullyCharged
    ? '#34d399'
    : isCharging
    ? '#38bdf8'
    : colors.gradientStart;

  const activeGradientEnd = isCritical
    ? '#b91c1c'
    : isWarning
    ? '#d97706'
    : isFullyCharged
    ? '#059669'
    : isCharging
    ? '#00d2ff'
    : colors.gradientEnd;

  // Particle animation on Canvas for charging orbital energy
  useEffect(() => {
    if (
      !isCharging ||
      lookSettings.chargingAnimation !== 'Orbit' ||
      lookSettings.animationIntensity === 'Off'
    ) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const particlesCount = lookSettings.animationIntensity === 'Dynamic' ? 24 : 14;
    const particles = Array.from({ length: particlesCount }, (_, i) => ({
      angle: (i / particlesCount) * Math.PI * 2,
      speed: 0.015 + Math.random() * 0.01,
      radius: 104 + (Math.random() * 10 - 5),
      size: 1.5 + Math.random() * 2,
      alpha: 0.3 + Math.random() * 0.6,
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      particles.forEach((p) => {
        p.angle += p.speed;
        const x = cx + Math.cos(p.angle) * p.radius;
        const y = cy + Math.sin(p.angle) * p.radius;

        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = activeColor;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = activeColor;
        ctx.shadowBlur = 6;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isCharging, lookSettings.chargingAnimation, lookSettings.animationIntensity, activeColor]);

  // Dimension setup
  const size = 260;
  const strokeWidth = lookSettings.batteryIndicator === 'Minimal' ? 4 : 12;
  const radius = 98;
  const circumference = 2 * Math.PI * radius;

  // Arc calculations if in Arc mode (240 deg span)
  const isArcMode = lookSettings.batteryIndicator === 'Arc';
  const arcTotalAngle = (240 * Math.PI) / 180;
  const arcLength = radius * arcTotalAngle;
  const arcStrokeDasharray = `${(level / 100) * arcLength} ${arcLength * 2}`;
  const arcOffset = 0;

  // Standard ring calculation (360 deg)
  const ringStrokeDashoffset = circumference - (level / 100) * circumference;

  const stateLabel =
    state === 'charging'
      ? 'Charging'
      : state === 'full'
      ? 'Fully Charged'
      : 'Discharging';

  return (
    <div
      id="battery-visualization-container"
      className="relative flex flex-col items-center justify-center my-2 select-none"
    >
      {/* 3D Ambient Atmospheric Glow Layer */}
      {lookSettings.depth3dIntensity !== 'Off' && (
        <div
          className="absolute w-64 h-64 rounded-full pointer-events-none transition-all duration-700 ease-out"
          style={{
            background: `radial-gradient(circle, ${
              isCritical ? 'rgba(239, 68, 68, 0.22)' : colors.deepGlow
            } 0%, transparent 70%)`,
            filter: 'blur(32px)',
            transform: isCharging ? 'scale(1.12)' : 'scale(1.0)',
          }}
        />
      )}

      {/* SVG Dimensional Visualization */}
      <div className="relative w-[260px] h-[260px] flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className={`transform transition-transform duration-500 ${
            isArcMode ? 'rotate-[-30deg]' : '-rotate-90'
          }`}
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Energy Gradient */}
            <linearGradient id="batteryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={activeGradientStart} />
              <stop offset="100%" stopColor={activeGradientEnd} />
            </linearGradient>

            {/* Dimensional Shadow */}
            <filter id="depthShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="4"
                floodColor="#000000"
                floodOpacity="0.6"
              />
            </filter>

            {/* Outer Rim Light Filter */}
            <filter id="rimGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Outer Rim Base */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius + 8}
            fill="none"
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth={1.5}
          />

          {/* Track Base (Unfilled) */}
          {isArcMode ? (
            <path
              d={`M ${size / 2 + radius * Math.cos(-Math.PI * 0.67)} ${
                size / 2 + radius * Math.sin(-Math.PI * 0.67)
              } A ${radius} ${radius} 0 1 1 ${
                size / 2 + radius * Math.cos(Math.PI * 0.67)
              } ${size / 2 + radius * Math.sin(Math.PI * 0.67)}`}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          ) : (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.07)"
              strokeWidth={strokeWidth}
            />
          )}

          {/* Secondary Energy Track for Charging */}
          {isCharging && !isArcMode && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius - 12}
              fill="none"
              stroke={activeColor}
              strokeWidth={2}
              strokeDasharray="4 8"
              strokeOpacity="0.4"
              className={lookSettings.animationIntensity !== 'Off' ? 'animate-spin' : ''}
              style={{ animationDuration: '14s' }}
            />
          )}

          {/* Active Level Energy Ring */}
          {isArcMode ? (
            <path
              d={`M ${size / 2 + radius * Math.cos(-Math.PI * 0.67)} ${
                size / 2 + radius * Math.sin(-Math.PI * 0.67)
              } A ${radius} ${radius} 0 1 1 ${
                size / 2 + radius * Math.cos(Math.PI * 0.67)
              } ${size / 2 + radius * Math.sin(Math.PI * 0.67)}`}
              fill="none"
              stroke="url(#batteryGrad)"
              strokeWidth={strokeWidth}
              strokeDasharray={arcStrokeDasharray}
              strokeDashoffset={arcOffset}
              strokeLinecap="round"
              filter="url(#rimGlow)"
              className="transition-all duration-700 ease-out"
            />
          ) : (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#batteryGrad)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={ringStrokeDashoffset}
              strokeLinecap="round"
              filter="url(#rimGlow)"
              className="transition-all duration-700 ease-out"
            />
          )}
        </svg>

        {/* Canvas Layer for Orbital Particles */}
        {isCharging && lookSettings.chargingAnimation === 'Orbit' && (
          <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className="absolute inset-0 pointer-events-none z-10"
          />
        )}

        {/* Center Technical Information HUD */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          {/* Status Icon & State Header */}
          <div className="flex items-center space-x-1.5 mb-0.5">
            {isCharging ? (
              <div
                className="relative flex items-center justify-center animate-glow-pulse"
                style={{ '--glow-color': activeColor } as React.CSSProperties}
              >
                {/* Subtle glowing halo aura */}
                <span
                  className="absolute -inset-1 rounded-full blur-[6px] opacity-65 pointer-events-none"
                  style={{ backgroundColor: activeColor }}
                />
                <BatteryCharging
                  className="w-4 h-4 relative z-10 transition-colors"
                  style={{ color: activeColor }}
                />
              </div>
            ) : isCritical ? (
              <AlertTriangle className="w-4 h-4 text-red-500 animate-bounce" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            )}
            <span
              className="text-[11px] font-bold tracking-widest uppercase transition-colors"
              style={{ color: activeColor }}
            >
              {stateLabel}
            </span>
          </div>

          {/* Primary High-Contrast Percentage */}
          <div className="flex items-baseline justify-center font-display tracking-tight font-black leading-none my-1">
            <span className="text-6xl text-white drop-shadow-md">
              {level}
            </span>
            <span
              className="text-2xl font-bold ml-1"
              style={{ color: activeColor }}
            >
              %
            </span>
          </div>

          {/* Estimated Runtime or Charge Remaining */}
          <div className="mt-1 flex flex-col items-center">
            <span className="text-[11px] text-zinc-400 font-mono tracking-wide">
              {runtimeEstimateText}
            </span>
          </div>

          {/* Live Data Badge */}
          <div className="mt-2">
            <span className="text-[9px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/10">
              {statusType === 'LIVE' ? 'LIVE DEVICE READING' : 'CALCULATED READING'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
