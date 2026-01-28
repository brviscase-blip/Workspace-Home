
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Trash2, CheckCircle2, AlertTriangle, Info, Zap, X, Clock } from 'lucide-react';
import { Notification, NotificationType } from './NotificationSystem';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  onSearchChange: (query: string) => void;
  title: string;
  history: Notification[];
  onClearHistory: () => void;
  onRemoveHistoryItem: (id: string) => void;
  currentUser: string | null;
  onlineUsers?: string[];
}

const Header: React.FC<HeaderProps> = ({ 
  onSearchChange, 
  title, 
  history, 
  onClearHistory, 
  onRemoveHistoryItem,
  currentUser,
  onlineUsers = []
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string | null) => {
    if (!name) return '??';
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={12} className="text-emerald-500" />;
      case 'warning': return <AlertTriangle size={12} className="text-amber-500" />;
      case 'error': return <Trash2 size={12} className="text-rose-500" />;
      case 'alert': return <Zap size={12} className="text-purple-500" />;
      default: return <Info size={12} className="text-blue-500" />;
    }
  };

  return (
    <header className="flex items-center justify-between px-8 py-6 relative z-[1000]">
      <div className="flex items-center gap-8 flex-1">
        <h1 className="text-2xl font-bold text-white transition-all duration-300">{title}</h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          
          <div className="relative" ref={panelRef}>
            <button 
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className={`relative text-slate-400 hover:text-white transition-all active:scale-95 p-2 rounded-sm ${isPanelOpen ? 'bg-slate-800 text-white' : ''}`}
              title="Notificações"
            >
              <Bell size={20} />
              {history.length > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center bg-blue-500 rounded-full border-2 border-[#020617] text-[8px] font-black text-white">
                  {history.length}
                </span>
              )}
            </button>

            {isPanelOpen && (
              <div className="absolute right-0 mt-4 w-80 bg-[#030712] border border-slate-800 rounded-sm shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-black/20">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-200 flex items-center gap-2">
                    <Clock size={12} /> Histórico de Ações
                  </h3>
                  {history.length > 0 && (
                    <button 
                      onClick={onClearHistory}
                      className="text-[9px] font-black text-slate-500 hover:text-rose-400 uppercase tracking-tighter flex items-center gap-1 transition-colors"
                    >
                      Limpar Tudo
                    </button>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  {history.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Nenhuma atividade recente</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/50">
                      {history.map((item) => (
                        <div key={item.id} className="p-3 hover:bg-slate-800/30 transition-colors group flex items-start gap-3">
                          <div className="mt-0.5">{getIcon(item.type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-slate-300 leading-tight font-medium">
                              {item.message}
                            </p>
                          </div>
                          <button 
                            onClick={() => onRemoveHistoryItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-rose-500 transition-all"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      )).reverse()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Pilha de Operadores Online */}
            <div className="flex items-center -space-x-2">
              {onlineUsers.map((user) => (
                <div 
                  key={user} 
                  title={`${user} (ONLINE)`}
                  className="relative group cursor-help animate-in zoom-in duration-300"
                >
                  <div className={`w-8 h-8 rounded-full border-2 border-[#020617] flex items-center justify-center shadow-lg transition-transform group-hover:-translate-y-1 ${user === currentUser ? 'bg-blue-600/20 border-blue-500/40' : 'bg-slate-800 border-slate-700'}`}>
                    <span className={`text-[10px] font-black uppercase tracking-tight ${user === currentUser ? 'text-blue-400' : 'text-slate-300'}`}>
                      {getInitials(user)}
                    </span>
                  </div>
                  {/* Ponto indicador de Live */}
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#020617] animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
