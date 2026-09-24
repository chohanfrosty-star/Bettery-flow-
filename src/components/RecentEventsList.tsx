import React from 'react';
import { BatteryEvent, AccentColor } from '../types';
import {
  Zap,
  BatteryCharging,
  BatteryWarning,
  CheckCircle2,
  Clock,
  Flame,
  ShieldAlert,
  ArrowDownRight,
} from 'lucide-react';

interface RecentEventsListProps {
  events: BatteryEvent[];
  accent: AccentColor;
  onClearEvents?: () => void;
}

export const RecentEventsList: React.FC<RecentEventsListProps> = ({
  events,
  accent,
  onClearEvents,
}) => {
  const getEventIcon = (event: BatteryEvent) => {
    switch (event.type) {
      case 'charging':
        return <Zap className="w-4 h-4 text-emerald-400" />;
      case 'discharging':
        return <ArrowDownRight className="w-4 h-4 text-sky-400" />;
      case 'alert':
        return <BatteryWarning className="w-4 h-4 text-amber-400" />;
      case 'health':
        return <Flame className="w-4 h-4 text-red-400" />;
      case 'system':
      default:
        return <CheckCircle2 className="w-4 h-4 text-zinc-400" />;
    }
  };

  const formatEventTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div
      id="recent-events-container"
      className="rounded-2xl p-4 bg-zinc-900/90 border border-white/10 shadow-xl select-none"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-zinc-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
            Recent Battery Events
          </h3>
        </div>
        <span className="text-[10px] font-mono font-bold text-zinc-400 px-2 py-0.5 rounded bg-white/5 border border-white/5">
          {events.length} Events
        </span>
      </div>

      {events.length === 0 ? (
        <div className="py-6 text-center text-xs text-zinc-400 border border-dashed border-white/10 rounded-xl">
          No recent battery events recorded.
        </div>
      ) : (
        <div className="space-y-2.5">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-start space-x-3 p-2.5 rounded-xl bg-black/25 hover:bg-black/40 border border-white/5 transition-all"
            >
              <div className="mt-0.5 p-1.5 rounded-lg bg-white/5 border border-white/10 flex-shrink-0">
                {getEventIcon(event)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-200 truncate">
                    {event.title}
                  </h4>
                  <span className="text-[10px] text-zinc-400 font-mono ml-2 whitespace-nowrap">
                    {formatEventTime(event.timestamp)}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                  {event.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
