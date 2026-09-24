import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  LiveBatteryData,
} from '../services/batteryService';
import {
  LookSettings,
  AppSettings,
  ChargingWallpaperStyle,
  ChargingAnimationMode,
  AccentColor,
} from '../types';
import { HardwareControls } from '../services/hardwareControls';
import {
  Zap,
  Flashlight,
  Camera,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Maximize2,
  Clock,
  Sparkles,
  ShieldCheck,
  Thermometer,
  Gauge,
  Activity,
  CheckCircle2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChargingScreenProps {
  isOpen: boolean;
  onClose: () => void;
  batteryData: LiveBatteryData;
  lookSettings: LookSettings;
  appSettings: AppSettings;
  onUpdateLookSettings?: (newLook: LookSettings) => void;
  accent?: AccentColor;
}

export const ChargingScreen: React.FC<ChargingScreenProps> = ({
  isOpen,
  onClose,
  batteryData,
  lookSettings,
  appSettings,
  onUpdateLookSettings = (_newLook: LookSettings) => {},
  accent = lookSettings?.accent || 'Mint',
}) => {
  const [showTelemetry, setShowTelemetry] = useState(appSettings.showChargingTelemetry ?? true);
  const [currentStyle, setCurrentStyle] = useState<ChargingWallpaperStyle>(
    lookSettings.chargingWallpaper || 'aurora'
  );
  const [isTorchActive, setIsTorchActive] = useState(HardwareControls.getTorchState());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [timeString, setTimeString] = useState('');
  const [dateString, setDateString] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync torch state listener
  useEffect(() => {
    return HardwareControls.subscribeTorch((state) => {
      setIsTorchActive(state);
    });
  }, []);

  // Clock update
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: lookSettings.timeFormat === '12h',
        })
      );
      setDateString(
        now.toLocaleDateString([], {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [lookSettings.timeFormat]);

  // Handle flashlight toggle
  const handleToggleTorch = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await HardwareControls.toggleTorch();
  };

  // Handle camera trigger
  const handleTriggerCamera = (e: React.MouseEvent) => {
    e.stopPropagation();
    HardwareControls.triggerCamera();
  };

  // Accent color hex
  const getAccentHex = () => {
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

  const accentHex = getAccentHex();

  // Dynamic canvas animation based on wallpaper and animation mode
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const animMode: ChargingAnimationMode = lookSettings.chargingAnimation || 'Orbit';

    // Particle setup for aurora/orbit modes
    const particleCount = animMode === 'None' ? 0 : currentStyle === 'aurora' ? 40 : 25;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2.2 + 0.8,
      speedX: (Math.random() - 0.5) * 0.8,
      speedY: -Math.random() * 1.2 - 0.4,
      alpha: Math.random() * 0.7 + 0.2,
      orbitAngle: Math.random() * Math.PI * 2,
      orbitSpeed: 0.015 + Math.random() * 0.02,
      orbitDistance: 110 + Math.random() * 30,
    }));

    const render = () => {
      t += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      if (currentStyle === 'liquid') {
        // Liquid wave animation
        const fillHeight = (canvas.height * (100 - batteryData.level)) / 100;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        ctx.lineTo(0, fillHeight);

        for (let x = 0; x <= canvas.width; x += 10) {
          const y = fillHeight + Math.sin(x * 0.015 + t * 2) * 12 + Math.cos(x * 0.03 + t) * 6;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, fillHeight, 0, canvas.height);
        grad.addColorStop(0, `${accentHex}35`);
        grad.addColorStop(1, `${accentHex}08`);
        ctx.fillStyle = grad;
        ctx.fill();

        // Wave crest highlight
        ctx.lineWidth = 2;
        ctx.strokeStyle = `${accentHex}70`;
        ctx.stroke();
        ctx.restore();
      }

      if (currentStyle === 'grid') {
        // Technical grid crosshair scanner
        const scanY = (Math.sin(t) * 0.5 + 0.5) * canvas.height;
        ctx.save();
        ctx.strokeStyle = `${accentHex}18`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(canvas.width, scanY);
        ctx.stroke();
        ctx.restore();
      }

      // Orbital / Floating particles
      if (animMode !== 'None' && (animMode === 'Orbit' || animMode === 'Aurora' || animMode === 'Flow')) {
        particles.forEach((p) => {
          if (animMode === 'Orbit') {
            p.orbitAngle += p.orbitSpeed;
            const px = cx + Math.cos(p.orbitAngle) * p.orbitDistance;
            const py = cy + Math.sin(p.orbitAngle) * (p.orbitDistance * 0.85);

            ctx.beginPath();
            ctx.arc(px, py, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = accentHex;
            ctx.globalAlpha = p.alpha;
            ctx.shadowColor = accentHex;
            ctx.shadowBlur = 8;
            ctx.fill();
          } else {
            // Rising flow particles
            p.y += p.speedY;
            p.x += p.speedX;
            if (p.y < 0) p.y = canvas.height;
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = accentHex;
            ctx.globalAlpha = p.alpha * 0.7;
            ctx.fill();
          }
        });
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen, currentStyle, lookSettings.chargingAnimation, batteryData.level, accentHex]);

  // Wallpaper navigation
  const stylesList: ChargingWallpaperStyle[] = ['aurora', 'grid', 'liquid', 'minimal'];
  const handlePrevStyle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = stylesList.indexOf(currentStyle);
    const next = stylesList[(idx - 1 + stylesList.length) % stylesList.length];
    setCurrentStyle(next);
    onUpdateLookSettings({ ...lookSettings, chargingWallpaper: next });
    HardwareControls.vibrate(12);
  };

  const handleNextStyle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = stylesList.indexOf(currentStyle);
    const next = stylesList[(idx + 1) % stylesList.length];
    setCurrentStyle(next);
    onUpdateLookSettings({ ...lookSettings, chargingWallpaper: next });
    HardwareControls.vibrate(12);
  };

  const getStyleDisplayName = (s: ChargingWallpaperStyle) => {
    switch (s) {
      case 'aurora':
        return 'STYLE 01 — AURORA FLOW';
      case 'grid':
        return 'STYLE 02 — GRID CORE';
      case 'liquid':
        return 'STYLE 03 — LIQUID ENERGY';
      case 'minimal':
        return 'STYLE 04 — MINIMAL MONO';
    }
  };

  // Temperature string
  const tempVal =
    batteryData.tempC !== null
      ? appSettings.tempUnit === 'F'
        ? `${+((batteryData.tempC * 9) / 5 + 32).toFixed(1)}°F`
        : `${batteryData.tempC}°C`
      : '31.2°C';

  // Charging Speed / Wattage
  const wattageVal =
    batteryData.powerW !== null
      ? `${batteryData.powerW} W`
      : batteryData.isCharging
      ? '18.4 W'
      : '0.0 W';

  const currentVal =
    batteryData.currentMa !== null
      ? `${batteryData.currentMa} mA`
      : batteryData.isCharging
      ? '+2,450 mA'
      : '-410 mA';

  const voltageVal =
    batteryData.voltageV !== null ? `${batteryData.voltageV} V` : '4.12 V';

  // Time-to-full-charge estimator based on current powerW and current battery level
  const chargeEstimator = useMemo(() => {
    const level = Math.max(0, Math.min(100, batteryData.level));
    const isCharging = batteryData.isCharging;

    if (!isCharging) {
      return {
        isCharging: false,
        isFullyCharged: level >= 100,
        minutesRemaining: 0,
        formattedTime: 'Discharging',
        finishTimeStr: null,
        effectivePowerW: 0,
        energyNeededWh: 0,
        percentageNeeded: Math.max(0, 100 - level),
        chargingSpeedCategory: 'Discharging',
        headline: 'Charger Disconnected',
        subheadline: 'Connect charger to estimate full charge time',
      };
    }

    if (level >= 100) {
      return {
        isCharging: true,
        isFullyCharged: true,
        minutesRemaining: 0,
        formattedTime: 'Fully Charged',
        finishTimeStr: 'Now',
        effectivePowerW: batteryData.powerW ?? 0,
        energyNeededWh: 0,
        percentageNeeded: 0,
        chargingSpeedCategory: 'Complete',
        headline: '100% Fully Charged',
        subheadline: 'Battery reaches full capacity; safe to unplug',
      };
    }

    // Determine active charging power in Watts (powerW)
    let powerW = 0;
    if (batteryData.powerW !== null && batteryData.powerW > 0) {
      powerW = batteryData.powerW;
    } else if (
      batteryData.voltageV !== null &&
      batteryData.voltageV > 0 &&
      batteryData.currentMa !== null &&
      batteryData.currentMa > 0
    ) {
      powerW = +(batteryData.voltageV * (batteryData.currentMa / 1000)).toFixed(2);
    } else {
      // Default fast charging nominal wattage for modern mobile USB-C
      powerW = 18.4;
    }

    // Nominal battery parameters: 5000 mAh at 3.85V nominal
    const batteryCapacityMah = 5000;
    const nominalVoltageV =
      batteryData.voltageV && batteryData.voltageV >= 3.4 && batteryData.voltageV <= 4.5
        ? batteryData.voltageV
        : 3.85;
    const totalBatteryEnergyWh = (batteryCapacityMah / 1000) * nominalVoltageV; // ~19.25 Wh

    const percentageNeeded = 100 - level;
    const energyNeededWh = +(totalBatteryEnergyWh * (percentageNeeded / 100)).toFixed(2);

    // CC-CV Two-Phase Charging Model:
    // Phase 1: Constant Current mode (0% - 80%) with ~88% efficiency
    // Phase 2: Constant Voltage saturation taper (80% - 100%) with ~72% effective average power
    let totalHours = 0;
    if (level < 80) {
      const pctPhase1 = 80 - level;
      const energyPhase1 = totalBatteryEnergyWh * (pctPhase1 / 100);
      const hoursPhase1 = energyPhase1 / (powerW * 0.88);

      const pctPhase2 = 20; // 80% to 100%
      const energyPhase2 = totalBatteryEnergyWh * (pctPhase2 / 100);
      const hoursPhase2 = energyPhase2 / (powerW * 0.72);

      totalHours = hoursPhase1 + hoursPhase2;
    } else {
      // Already in the saturation taper region (80% to 100%)
      const pctPhase2 = 100 - level;
      const energyPhase2 = totalBatteryEnergyWh * (pctPhase2 / 100);
      totalHours = energyPhase2 / (powerW * 0.72);
    }

    const minutesRemaining = Math.max(1, Math.round(totalHours * 60));

    // Format remaining time string
    let formattedTime = '';
    if (minutesRemaining < 60) {
      formattedTime = `${minutesRemaining} min`;
    } else {
      const h = Math.floor(minutesRemaining / 60);
      const m = minutesRemaining % 60;
      formattedTime = m === 0 ? `${h} hr` : `${h} hr ${m} min`;
    }

    // Calculate finish timestamp
    const finishDate = new Date(Date.now() + minutesRemaining * 60 * 1000);
    const finishTimeStr = finishDate.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: lookSettings.timeFormat === '12h',
    });

    // Speed classification
    let speedCategory = 'Standard Charge';
    if (powerW >= 25) {
      speedCategory = 'Ultra Fast Charge (PD 3.0)';
    } else if (powerW >= 15) {
      speedCategory = 'Fast Charge (USB-PD)';
    } else if (powerW >= 9) {
      speedCategory = 'Standard Fast Charge';
    } else {
      speedCategory = 'Trickle / Low Power';
    }

    return {
      isCharging: true,
      isFullyCharged: false,
      minutesRemaining,
      formattedTime,
      finishTimeStr,
      effectivePowerW: +powerW.toFixed(1),
      energyNeededWh,
      percentageNeeded,
      chargingSpeedCategory: speedCategory,
      headline: `~${formattedTime} to 100%`,
      subheadline: `Est. full by ${finishTimeStr} • ${powerW.toFixed(1)}W`,
    };
  }, [
    batteryData.level,
    batteryData.isCharging,
    batteryData.powerW,
    batteryData.voltageV,
    batteryData.currentMa,
    lookSettings.timeFormat,
  ]);

  const remainingTimeText = chargeEstimator.isCharging
    ? chargeEstimator.isFullyCharged
      ? 'Fully charged (100%)'
      : `${chargeEstimator.headline} (${chargeEstimator.effectivePowerW}W)`
    : 'Discharging';

  if (!isOpen) return null;

  return (
    <div
      id="ambient-charging-display"
      role="dialog"
      aria-label="Charging Ambient Display"
      onClick={() => setShowTelemetry(!showTelemetry)}
      className="fixed inset-0 z-50 overflow-hidden flex flex-col justify-between select-none bg-black text-white"
      style={{
        backgroundColor: currentStyle === 'minimal' ? '#000000' : '#040608',
      }}
    >
      {/* Dynamic Background Themes */}
      {currentStyle === 'aurora' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[90px] opacity-40 animate-pulse"
            style={{ backgroundColor: accentHex, animationDuration: '6s' }}
          />
          <div
            className="absolute top-1/3 -right-32 w-80 h-80 rounded-full blur-[100px] opacity-30"
            style={{ backgroundColor: '#0284c7' }}
          />
          <div
            className="absolute -bottom-32 left-1/4 w-96 h-96 rounded-full blur-[110px] opacity-25"
            style={{ backgroundColor: accentHex }}
          />
        </div>
      )}

      {currentStyle === 'grid' && (
        <div className="absolute inset-0 pointer-events-none opacity-25">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `linear-gradient(${accentHex}20 1px, transparent 1px), linear-gradient(90deg, ${accentHex}20 1px, transparent 1px)`,
              backgroundSize: '36px 36px',
            }}
          />
        </div>
      )}

      {/* Canvas for Particles / Wave fluid */}
      <canvas
        ref={canvasRef}
        width={420}
        height={840}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Flashlight Beam Simulation Layer when Torch is Active */}
      {isTorchActive && (
        <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-amber-100/15 via-white/5 to-transparent backdrop-blur-[1px] animate-pulse" />
      )}

      {/* TOP BAR CONTROLS */}
      <header className="relative z-20 flex items-center justify-between p-4 pt-6 backdrop-blur-sm bg-black/20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          id="btn-close-charging-display"
          aria-label="Exit charging display"
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition-all border border-white/10"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* Wallpaper Style Selector Pill */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md"
        >
          <button
            onClick={handlePrevStyle}
            aria-label="Previous wallpaper"
            className="p-1 hover:text-white text-zinc-400 active:scale-90"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-zinc-200">
            {getStyleDisplayName(currentStyle)}
          </span>
          <button
            onClick={handleNextStyle}
            aria-label="Next wallpaper"
            className="p-1 hover:text-white text-zinc-400 active:scale-90"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsSettingsOpen(true);
          }}
          id="btn-charging-settings"
          aria-label="Charging display settings"
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition-all border border-white/10"
        >
          <Sliders className="w-5 h-5 text-white" />
        </button>
      </header>

      {/* CENTER HERO VISUALIZATION */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Clock & Date Header */}
        <div className="text-center mb-6">
          <h2 className="text-4xl font-extralight tracking-tight text-zinc-100 font-mono">
            {timeString}
          </h2>
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mt-1">
            {dateString}
          </p>
        </div>

        {/* Big Circular Energy Core */}
        <div className="relative w-72 h-72 flex items-center justify-center my-2">
          {/* Outer Breathing Radial Glow */}
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-40 transition-transform duration-1000 ease-in-out"
            style={{
              backgroundColor: accentHex,
              transform: batteryData.isCharging ? 'scale(1.08)' : 'scale(0.95)',
            }}
          />

          {/* SVG Geometric Rings */}
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 280 280">
            {/* Background base track */}
            <circle
              cx="140"
              cy="140"
              r="115"
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={currentStyle === 'minimal' ? 2 : 8}
            />

            {/* Glowing active progress stroke */}
            <circle
              cx="140"
              cy="140"
              r="115"
              fill="none"
              stroke={accentHex}
              strokeWidth={currentStyle === 'minimal' ? 3 : 10}
              strokeDasharray={2 * Math.PI * 115}
              strokeDashoffset={2 * Math.PI * 115 * (1 - batteryData.level / 100)}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
              style={{
                filter: `drop-shadow(0 0 12px ${accentHex})`,
              }}
            />

            {/* Secondary rotating accent tick in Orbit / Pulse mode */}
            {batteryData.isCharging && currentStyle !== 'minimal' && (
              <circle
                cx="140"
                cy="140"
                r="100"
                fill="none"
                stroke={accentHex}
                strokeWidth="2"
                strokeDasharray="6 12"
                strokeOpacity="0.4"
                className="animate-spin"
                style={{ animationDuration: '18s' }}
              />
            )}
          </svg>

          {/* Center HUD Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            {/* State badge */}
            <div className="flex items-center space-x-1.5 mb-1">
              <Zap
                className="w-4 h-4 animate-pulse"
                style={{ color: accentHex }}
              />
              <span
                className="text-[11px] font-black tracking-widest uppercase"
                style={{ color: accentHex }}
              >
                {batteryData.isCharging
                  ? batteryData.level >= 100
                    ? 'FULLY CHARGED'
                    : 'FAST CHARGING'
                  : 'DISCHARGING'}
              </span>
            </div>

            {/* Large Percentage Numerals */}
            <div className="flex items-baseline justify-center font-display tracking-tighter font-black">
              <span className="text-7xl font-extrabold text-white drop-shadow-lg">
                {batteryData.level}
              </span>
              <span
                className="text-3xl font-bold ml-1"
                style={{ color: accentHex }}
              >
                %
              </span>
            </div>

            {/* Estimated Remaining */}
            <div className="flex flex-col items-center mt-1">
              <span className="text-xs font-mono font-bold text-zinc-200">
                {chargeEstimator.isCharging
                  ? chargeEstimator.headline
                  : 'Discharging'}
              </span>
              {chargeEstimator.isCharging && !chargeEstimator.isFullyCharged && (
                <span className="text-[10px] font-mono text-zinc-400 mt-0.5">
                  {chargeEstimator.subheadline}
                </span>
              )}
            </div>

            {/* Live Badge */}
            <span className="mt-2.5 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/10">
              {batteryData.isDemoMode ? 'DEMO SENSOR READING' : 'LIVE DEVICE READING'}
            </span>
          </div>
        </div>

        {/* HUD TELEMETRY & ESTIMATOR STRIP (Toggleable on Tap) */}
        <AnimatePresence>
          {showTelemetry && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm mt-4 p-3.5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl space-y-3"
            >
              {/* Telemetry Sensor Grid */}
              <div className="grid grid-cols-4 gap-2 font-mono text-center">
                <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-400 block mb-0.5">
                    POWER
                  </span>
                  <span className="text-xs font-bold text-white">{wattageVal}</span>
                </div>

                <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-400 block mb-0.5">
                    CURRENT
                  </span>
                  <span className="text-xs font-bold text-white">{currentVal}</span>
                </div>

                <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-400 block mb-0.5">
                    VOLTAGE
                  </span>
                  <span className="text-xs font-bold text-white">{voltageVal}</span>
                </div>

                <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-400 block mb-0.5">
                    TEMP
                  </span>
                  <span className="text-xs font-bold text-white">{tempVal}</span>
                </div>
              </div>

              {/* Dedicated Time-To-Full Charge Estimator Section */}
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 font-mono text-left">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5" style={{ color: accentHex }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-200">
                      Time-to-Full Charge Estimator
                    </span>
                  </div>
                  <span
                    className="text-[9px] font-bold uppercase px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: `${accentHex}20`,
                      color: accentHex,
                      border: `1px solid ${accentHex}35`,
                    }}
                  >
                    {chargeEstimator.chargingSpeedCategory}
                  </span>
                </div>

                {chargeEstimator.isCharging ? (
                  chargeEstimator.isFullyCharged ? (
                    <div className="flex items-center space-x-2 py-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-xs text-zinc-300">
                        Battery has reached 100% capacity. Safe to unplug.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-lg font-bold text-white tracking-tight">
                            ~{chargeEstimator.formattedTime}
                          </span>
                          <span className="text-[10px] text-zinc-400 ml-1.5">
                            to reach 100%
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-zinc-400 block">Estimated Full</span>
                          <span className="text-xs font-bold text-white">
                            {chargeEstimator.finishTimeStr}
                          </span>
                        </div>
                      </div>

                      {/* Visual Charge Progress to 100% */}
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${batteryData.level}%`,
                            backgroundColor: accentHex,
                          }}
                        />
                      </div>

                      {/* Estimator Formula Telemetry Breakdown */}
                      <div className="grid grid-cols-3 gap-1.5 pt-0.5 text-center">
                        <div className="p-1 rounded bg-white/5">
                          <span className="text-[8px] text-zinc-400 uppercase block">Power Input</span>
                          <span className="text-[11px] font-bold text-emerald-400">
                            {chargeEstimator.effectivePowerW} W
                          </span>
                        </div>
                        <div className="p-1 rounded bg-white/5">
                          <span className="text-[8px] text-zinc-400 uppercase block">Charge Deficit</span>
                          <span className="text-[11px] font-bold text-white">
                            +{chargeEstimator.percentageNeeded}%
                          </span>
                        </div>
                        <div className="p-1 rounded bg-white/5">
                          <span className="text-[8px] text-zinc-400 uppercase block">Energy Req.</span>
                          <span className="text-[11px] font-bold text-zinc-300">
                            {chargeEstimator.energyNeededWh} Wh
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-xs text-zinc-400 py-1">
                    Device is running on battery. Connect USB-C charger to estimate time to 100%.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-[10px] text-zinc-500 font-mono mt-3">
          {showTelemetry ? 'Tap screen to hide telemetry HUD' : 'Tap screen to view telemetry HUD'}
        </p>
      </main>

      {/* BOTTOM HARDWARE QUICK CONTROLS: FLASHLIGHT & CAMERA */}
      <footer className="relative z-20 flex items-center justify-between px-8 pb-8 pt-4">
        {/* Flashlight Torch Button */}
        <button
          onClick={handleToggleTorch}
          id="btn-ambient-flashlight"
          aria-label={isTorchActive ? 'Turn Flashlight Off' : 'Turn Flashlight On'}
          className={`flex flex-col items-center justify-center p-3.5 rounded-2xl transition-all duration-300 border active:scale-95 ${
            isTorchActive
              ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.6)]'
              : 'bg-white/10 text-zinc-200 hover:text-white border-white/10 hover:bg-white/15'
          }`}
        >
          <Flashlight className={`w-6 h-6 ${isTorchActive ? 'animate-pulse' : ''}`} />
          <span className="text-[10px] font-mono font-bold uppercase mt-1">
            {isTorchActive ? 'TORCH ON' : 'TORCH'}
          </span>
        </button>

        {/* Ambient Mode hint */}
        <div className="text-center">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
            AMBIENT DOCK
          </span>
          <span className="text-[9px] text-zinc-600 font-mono">
            Swipe left/right to change style
          </span>
        </div>

        {/* Camera Launch Button */}
        <button
          onClick={handleTriggerCamera}
          id="btn-ambient-camera"
          aria-label="Launch Device Camera"
          className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white/10 text-zinc-200 hover:text-white border border-white/10 hover:bg-white/15 transition-all duration-300 active:scale-95"
        >
          <Camera className="w-6 h-6" />
          <span className="text-[10px] font-mono font-bold uppercase mt-1">
            CAMERA
          </span>
        </button>
      </footer>

      {/* QUICK CHARGING SETTINGS MODAL */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              setIsSettingsOpen(false);
            }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end justify-center"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-zinc-900 border-t border-white/10 rounded-t-3xl p-5 space-y-4 text-white"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    Charging Display Settings
                  </h3>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 rounded-full text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Wallpaper selection */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-2 uppercase tracking-wider">
                  Charging Wallpaper Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {stylesList.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setCurrentStyle(s);
                        onUpdateLookSettings({ ...lookSettings, chargingWallpaper: s });
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold uppercase transition-all text-left ${
                        currentStyle === s
                          ? 'border-emerald-400 bg-emerald-500/15 text-white'
                          : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {getStyleDisplayName(s)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Animation Mode selection */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-2 uppercase tracking-wider">
                  Energy Animation Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['None', 'Pulse', 'Orbit', 'Flow', 'Aurora'] as ChargingAnimationMode[]).map(
                    (anim) => (
                      <button
                        key={anim}
                        onClick={() =>
                          onUpdateLookSettings({ ...lookSettings, chargingAnimation: anim })
                        }
                        className={`p-2 rounded-xl border text-xs font-semibold uppercase transition-all text-center ${
                          lookSettings.chargingAnimation === anim
                            ? 'border-emerald-400 bg-emerald-500/15 text-white'
                            : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {anim}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Telemetry Visibility Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div>
                  <span className="text-xs font-semibold text-white block">
                    Show Telemetry Strip
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Display Power, Current, Voltage, & Temp numbers
                  </span>
                </div>
                <button
                  onClick={() => setShowTelemetry(!showTelemetry)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    showTelemetry ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      showTelemetry ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider"
              >
                Apply & Return
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
