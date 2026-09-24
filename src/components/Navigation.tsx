import React from 'react';
import { Home, History, Activity, Palette, Settings } from 'lucide-react';
import { TabType, AccentColor } from '../types';
import { motion } from 'motion/react';
import { HapticService } from '../services/mobile/hapticService';

interface NavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  accent: AccentColor;
  density?: 'Comfortable' | 'Compact';
}

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'HOME', icon: Home },
  { id: 'history', label: 'HISTORY', icon: History },
  { id: 'diagnostics', label: 'DIAGNOSTICS', icon: Activity },
  { id: 'look', label: 'LOOK', icon: Palette },
  { id: 'settings', label: 'SETTINGS', icon: Settings },
];

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  accent,
  density = 'Comfortable',
}) => {
  const getAccentColorHex = () => {
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

  const accentColor = getAccentColorHex();
  const isCompact = density === 'Compact';

  const handleTabClick = (tabId: TabType) => {
    HapticService.light();
    onSelectTab(tabId);
  };

  return (
    <nav
      id="bottom-navigation-bar"
      role="tablist"
      aria-label="Main Application Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 max-w-lg mx-auto backdrop-blur-2xl bg-zinc-950/92 border-t border-white/10 px-3 pb-[max(env(safe-area-inset-bottom,0px),0.5rem)] shadow-[0_-8px_30px_rgba(0,0,0,0.6)]"
    >
      <div className={`flex items-center justify-between ${isCompact ? 'py-1' : 'py-2'}`}>
        {NAV_ITEMS.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              role="tab"
              aria-selected={isActive}
              aria-label={`Navigate to ${item.label}`}
              onClick={() => handleTabClick(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 rounded-xl transition-all duration-150 select-none touch-press ${
                isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {/* Active Indicator Backdrop */}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    backgroundColor: `${accentColor}18`,
                    border: `1px solid ${accentColor}35`,
                  }}
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}

              {/* Icon */}
              <div className="relative z-10 flex items-center justify-center">
                <Icon
                  className={`transition-all duration-200 ${
                    isCompact ? 'w-4 h-4' : 'w-5 h-5'
                  } ${isActive ? 'scale-110' : 'scale-100'}`}
                  style={isActive ? { color: accentColor } : undefined}
                />
              </div>

              {/* Label */}
              <span
                className={`relative z-10 font-bold uppercase tracking-wider transition-all duration-200 ${
                  isCompact ? 'text-[9px] mt-0.5' : 'text-[10px] mt-1'
                } ${isActive ? 'font-black' : 'font-medium'}`}
                style={isActive ? { color: accentColor } : undefined}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
