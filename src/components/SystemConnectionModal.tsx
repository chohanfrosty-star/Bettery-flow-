import React, { useState } from 'react';
import {
  ShieldCheck,
  BatteryCharging,
  Bell,
  Camera,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Info,
  X,
} from 'lucide-react';
import { NotificationService } from '../services/notificationService';
import { HardwareControls } from '../services/hardwareControls';
import { motion, AnimatePresence } from 'motion/react';
import { AccentColor } from '../types';

interface SystemConnectionModalProps {
  isOpen: boolean;
  onComplete: () => void;
  accent: AccentColor;
}

export const SystemConnectionModal: React.FC<SystemConnectionModalProps> = ({
  isOpen,
  onComplete,
  accent,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [notificationGranted, setNotificationGranted] = useState(
    NotificationService.getInstance().hasPermission()
  );
  const [systemConnected, setSystemConnected] = useState(true);

  if (!isOpen) return null;

  const handleRequestNotifications = async () => {
    HardwareControls.vibrate(15);
    const granted = await NotificationService.getInstance().requestPermission();
    setNotificationGranted(granted);
    if (granted) {
      NotificationService.getInstance().triggerAlert(
        'permission-granted',
        'Notifications Active',
        'BatteryFlow will notify you on critical battery events.',
        'success'
      );
    }
  };

  const handleFinish = () => {
    HardwareControls.vibrate([15, 50, 25]);
    localStorage.setItem('batteryflow_first_launch_done', 'true');
    onComplete();
  };

  return (
    <div
      id="system-connection-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="system-connection-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl select-none"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="w-full max-w-sm rounded-3xl bg-zinc-900 border border-white/10 shadow-2xl p-6 text-white overflow-hidden relative"
      >
        {/* Decorative Top Accent Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 block font-bold">
                SYSTEM INTEGRATION
              </span>
              <h2 id="system-connection-title" className="text-base font-bold text-white leading-tight">
                Device Initialization
              </h2>
            </div>
          </div>
          <button
            onClick={handleFinish}
            aria-label="Skip initialization"
            className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progression Indicators */}
        <div className="flex items-center space-x-1.5 mb-5">
          <div
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              step >= 1 ? 'bg-cyan-400' : 'bg-white/10'
            }`}
          />
          <div
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              step >= 2 ? 'bg-cyan-400' : 'bg-white/10'
            }`}
          />
          <div
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              step >= 3 ? 'bg-cyan-400' : 'bg-white/10'
            }`}
          />
        </div>

        {/* STEP 1: Battery Hardware Connection */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
              <div className="flex items-start space-x-3">
                <BatteryCharging className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Battery Telemetry Listener
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    BatteryFlow hooks directly into standard Android hardware battery controller
                    events to monitor charge levels, charging current, and power states in real-time.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-400">Connection Status:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 inline" /> ACTIVE & READY
                </span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 leading-normal">
              No private data is accessed. BatteryFlow operates 100% offline with zero cloud telemetry.
            </p>

            <button
              onClick={() => {
                HardwareControls.vibrate(10);
                setStep(2);
              }}
              className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all shadow-lg active:scale-98"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Notifications */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
              <div className="flex items-start space-x-3">
                <Bell className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Battery Alerts & Notifications
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    Receive instant system alerts when your battery reaches critical levels (&lt;10%),
                    completes full charging (100%), or detects high thermal stress.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-400">Alerts Permission:</span>
                <span
                  className={`font-bold flex items-center gap-1 ${
                    notificationGranted ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {notificationGranted ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 inline" /> GRANTED
                    </>
                  ) : (
                    'OPTIONAL / PENDING'
                  )}
                </span>
              </div>
            </div>

            {!notificationGranted ? (
              <button
                onClick={handleRequestNotifications}
                className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                Enable Notifications
              </button>
            ) : (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-center text-xs font-mono">
                ✓ Notifications Successfully Enabled
              </div>
            )}

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setStep(1)}
                className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-400 text-xs font-bold uppercase tracking-wider"
              >
                Back
              </button>
              <button
                onClick={() => {
                  HardwareControls.vibrate(10);
                  setStep(3);
                }}
                className="flex-1 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all shadow-lg active:scale-98"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Confirmation and Readiness */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                System Connection Active
              </h3>
              <p className="text-[11px] text-zinc-300 font-mono">
                Ready for live device readings & 3D telemetry
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1.5 text-xs text-zinc-400">
              <div className="flex items-center justify-between">
                <span>Hardware Battery Controller:</span>
                <span className="text-emerald-400 font-mono font-bold">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Flashlight & Camera Quick Controls:</span>
                <span className="text-cyan-400 font-mono font-bold">Ready</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Data Trust Model:</span>
                <span className="text-zinc-200 font-mono font-bold">Strict Live Badges</span>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-xl active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>Launch BatteryFlow</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
