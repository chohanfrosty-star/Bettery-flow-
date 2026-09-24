import React, { useEffect, useState } from 'react';
import { NotificationService, ToastAlert } from '../services/notificationService';
import { AlertTriangle, CheckCircle, Info, Flame, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastAlert[]>([]);

  useEffect(() => {
    const unsub = NotificationService.getInstance().subscribeToasts(setToasts);
    return unsub;
  }, []);

  const getToastIcon = (sev: ToastAlert['severity']) => {
    switch (sev) {
      case 'critical':
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      default:
        return <Info className="w-4 h-4 text-sky-400" />;
    }
  };

  const getBorderColor = (sev: ToastAlert['severity']) => {
    switch (sev) {
      case 'critical':
        return 'border-red-500/50 bg-red-950/80';
      case 'warning':
        return 'border-amber-500/50 bg-amber-950/80';
      case 'success':
        return 'border-emerald-500/50 bg-emerald-950/80';
      default:
        return 'border-sky-500/50 bg-sky-950/80';
    }
  };

  return (
    <div className="fixed top-14 left-4 right-4 z-50 pointer-events-none max-w-sm mx-auto space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`pointer-events-auto p-3 rounded-xl border shadow-xl backdrop-blur-md flex items-start space-x-3 text-white ${getBorderColor(
              toast.severity
            )}`}
          >
            <div className="mt-0.5">{getToastIcon(toast.severity)}</div>
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold leading-tight">{toast.title}</h5>
              <p className="text-[11px] text-zinc-300 mt-0.5 leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => NotificationService.getInstance().dismissToast(toast.id)}
              className="text-zinc-400 hover:text-white p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
