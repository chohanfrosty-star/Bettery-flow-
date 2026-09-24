import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../services/mobile/useOnlineStatus';

export const MobileOfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-2 left-4 right-4 z-50 flex items-center justify-between gap-2.5 px-3.5 py-2 bg-amber-500/90 text-black rounded-xl shadow-lg backdrop-blur-md font-sans text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 shrink-0 text-black" />
        <span>Offline Mode — Live hardware telemetry continues locally</span>
      </div>
      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-black/20 text-black">
        Local
      </span>
    </div>
  );
};
