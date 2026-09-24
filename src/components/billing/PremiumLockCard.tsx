import React from 'react';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { AccentColor } from '../../types';

interface PremiumLockCardProps {
  title: string;
  description: string;
  onUnlock: () => void;
  accent?: AccentColor;
  compact?: boolean;
}

export const PremiumLockCard: React.FC<PremiumLockCardProps> = ({
  title,
  description,
  onUnlock,
  accent = 'Mint',
  compact = false,
}) => {
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

  if (compact) {
    return (
      <div
        onClick={onUnlock}
        className="p-3 rounded-2xl bg-zinc-900/80 border border-white/10 hover:border-emerald-500/40 cursor-pointer transition-all flex items-center justify-between group shadow-lg"
      >
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block group-hover:text-emerald-400 transition-colors">
              {title}
            </span>
            <span className="text-[10px] text-zinc-400 block">{description}</span>
          </div>
        </div>

        <div className="flex items-center space-x-1 text-[11px] font-bold text-emerald-400 font-mono">
          <span>PRO</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl p-5 overflow-hidden border border-emerald-500/20 bg-gradient-to-br from-[#0c1619] via-[#0b1017] to-[#07090e] shadow-xl text-center">
      {/* Background radial accent */}
      <div
        className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: accentHex }}
      />

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md mb-2.5">
          <Lock className="w-5 h-5" />
        </div>

        <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-mono font-bold tracking-wider text-emerald-400 uppercase mb-1">
          <Sparkles className="w-2.5 h-2.5" />
          <span>BatteryFlow Pro Feature</span>
        </div>

        <h4 className="text-sm font-black text-white tracking-tight">{title}</h4>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs">{description}</p>

        <button
          onClick={onUnlock}
          className="mt-3.5 py-2 px-4 rounded-xl font-bold text-xs tracking-wide transition-all shadow-lg flex items-center space-x-1.5 cursor-pointer hover:scale-[1.02]"
          style={{
            backgroundColor: accentHex,
            color: '#000000',
          }}
        >
          <span>Unlock with Pro</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
