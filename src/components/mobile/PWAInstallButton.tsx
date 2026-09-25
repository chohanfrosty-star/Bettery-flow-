import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle, X } from 'lucide-react';
import { usePWAInstall } from '../../services/mobile/usePWAInstall';
import { AccentColor } from '../../types';
import { HapticService } from '../../services/mobile/hapticService';

interface PWAInstallButtonProps {
  accent: AccentColor;
  className?: string;
  variant?: 'compact' | 'full';
  hideWhenInstalled?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  accent,
  className = '',
  variant = 'full',
  hideWhenInstalled = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already installed/standalone, display a subtle "Installed" badge if full and not hideWhenInstalled, or null
  if (isInstalled) {
    if (variant === 'compact' || hideWhenInstalled) return null;
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
        <span>Installed Native Mobile App</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    HapticService.medium();
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  const getAccentBg = () => {
    switch (accent) {
      case 'Cyan':
        return 'bg-cyan-500 hover:bg-cyan-400 text-black';
      case 'Amber':
        return 'bg-amber-500 hover:bg-amber-400 text-black';
      case 'Sky':
        return 'bg-sky-500 hover:bg-sky-400 text-black';
      default:
        return 'bg-emerald-500 hover:bg-emerald-400 text-black';
    }
  };

  return (
    <>
      {variant === 'compact' ? (
        <button
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold touch-press shadow-md ${getAccentBg()} ${className}`}
          title="Install as Android / Mobile Application"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>
      ) : (
        <div
          className={`p-4 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-xl space-y-2.5 select-none ${className}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Mobile App Experience
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Full standalone Android APK/PWA with hardware telemetry
                </p>
              </div>
            </div>
            <button
              onClick={handleInstallClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold touch-press shadow-lg ${getAccentBg()}`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          </div>
        </div>
      )}

      {/* iOS Safari Installation Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-white/10 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                Add to Home Screen
              </h3>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-zinc-300 leading-relaxed font-sans">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span className="w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center font-mono font-bold shrink-0 text-[10px]">
                  1
                </span>
                <span>
                  Tap the <strong className="text-white">Share</strong> button (box with upward arrow) in the browser toolbar.
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span className="w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center font-mono font-bold shrink-0 text-[10px]">
                  2
                </span>
                <span>
                  Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span className="w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center font-mono font-bold shrink-0 text-[10px]">
                  3
                </span>
                <span>
                  Launch BatteryFlow from your home screen for full immersion.
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
