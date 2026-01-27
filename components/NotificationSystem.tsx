
import React, { useEffect, useRef } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, X, Zap } from 'lucide-react';

export type NotificationType = 'success' | 'warning' | 'info' | 'error' | 'alert';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationSystemProps {
  notifications: Notification[];
  removeNotification: (id: string) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ notifications, removeNotification }) => {
  return (
    <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none">
      {notifications.map((notif) => (
        <NotificationItem 
          key={notif.id} 
          notification={notif} 
          onClose={() => removeNotification(notif.id)} 
        />
      ))}
    </div>
  );
};

const NotificationItem: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
  // Usamos um Ref para manter a referência da função de fechamento sem disparar o useEffect
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    // Iniciamos o timer apenas uma vez quando o componente monta
    const timer = setTimeout(() => {
      closeRef.current();
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification.id]); // Apenas o ID como dependência garante que o timer não resete

  const config = {
    success: { 
      icon: <CheckCircle2 size={16} />, 
      color: 'border-emerald-500/50 text-emerald-400', 
      bg: 'bg-emerald-500/10', 
      glow: 'shadow-emerald-500/20',
      progress: 'bg-emerald-500'
    },
    warning: { 
      icon: <AlertTriangle size={16} />, 
      color: 'border-amber-500/50 text-amber-400', 
      bg: 'bg-amber-500/10', 
      glow: 'shadow-amber-500/20',
      progress: 'bg-amber-500'
    },
    info: { 
      icon: <Info size={16} />, 
      color: 'border-blue-500/50 text-blue-400', 
      bg: 'bg-blue-500/10', 
      glow: 'shadow-blue-500/20',
      progress: 'bg-blue-500'
    },
    error: { 
      icon: <X size={16} />, 
      color: 'border-rose-500/50 text-rose-400', 
      bg: 'bg-rose-500/10', 
      glow: 'shadow-rose-500/20',
      progress: 'bg-rose-500'
    },
    alert: { 
      icon: <Zap size={16} />, 
      color: 'border-purple-500/50 text-purple-400', 
      bg: 'bg-purple-500/10', 
      glow: 'shadow-purple-500/20',
      progress: 'bg-purple-500'
    },
  }[notification.type];

  return (
    <div className={`pointer-events-auto flex flex-col p-0 rounded-sm border backdrop-blur-md shadow-2xl animate-in slide-in-from-right-10 duration-300 relative overflow-hidden ${config.bg} ${config.color} ${config.glow}`}>
      <div className="flex items-center gap-4 p-4">
        <div className="flex-shrink-0">{config.icon}</div>
        <p className="text-[11px] font-black uppercase tracking-widest flex-1">{notification.message}</p>
        <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity">
          <X size={14} />
        </button>
      </div>
      
      <div className="h-[2px] w-full bg-black/20">
        <div 
          className={`h-full ${config.progress}`}
          style={{ 
            animationName: 'shrinkWidth',
            animationDuration: '5000ms',
            animationTimingFunction: 'linear',
            animationFillMode: 'forwards'
          }}
        />
      </div>

      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default NotificationSystem;
