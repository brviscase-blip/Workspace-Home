
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Trash2, CheckCircle2, AlertTriangle, Info, Zap, X, Clock, LogOut, MessageSquare, Maximize2, Minimize2 } from 'lucide-react';
import { Notification, NotificationType } from './NotificationSystem';
import ChatPanel from './ChatPanel';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  onSearchChange: (query: string) => void;
  title: string;
  history: Notification[];
  onClearHistory: () => void;
  onRemoveHistoryItem: (id: string) => void;
  onLogout: () => void;
  currentUser: string | null;
  onlineUsers?: string[];
}

const Header: React.FC<HeaderProps> = ({ 
  onSearchChange, 
  title, 
  history, 
  onClearHistory, 
  onRemoveHistoryItem,
  onLogout,
  currentUser,
  onlineUsers = []
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsPanelOpen(false);
      }
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        setIsChatOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', currentUser)
        .eq('is_read', false);
      setUnreadCount(count || 0);
    };

    fetchUnread();

    const channel = supabase
      .channel('unread-tracker')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchUnread)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

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
          
          <button 
            onClick={toggleFullscreen}
            className="text-slate-400 hover:text-white transition-all active:scale-95 p-2 rounded-sm"
            title={isFullscreen ? "Sair da Tela Cheia" : "Modo Tela Cheia"}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>

          <div className="relative" ref={chatRef}>
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`relative text-slate-400 hover:text-white transition-all active:scale-95 p-2 rounded-sm ${isChatOpen ? 'bg-blue-500/10 text-blue-400' : ''}`}
              title="Chat Seguro"
            >
              <MessageSquare size={20} className={unreadCount > 0 ? 'animate-bounce' : ''} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center bg-emerald-500 rounded-full border-2 border-[#020617] text-[8px] font-black text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {isChatOpen && (
              <div className="absolute right-0 mt-4 w-[480px] animate-in fade-in slide-in-from-top-2 duration-200 shadow-2xl">
                <ChatPanel currentUser={currentUser || ''} onClose={() => setIsChatOpen(false)} />
              </div>
            )}
          </div>

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
            <div className="flex items-center -space-x-2 mr-2">
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

            {/* Sessão / Logout */}
            <button 
              onClick={onLogout}
              className="flex items-center gap-3 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-sm hover:border-rose-500/50 hover:bg-rose-500/5 transition-all group active:scale-95 shadow-lg shadow-black/20"
            >
              <div className="flex flex-col items-end mr-1 hidden sm:flex">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-rose-500/70 transition-colors">Terminar Sessão</span>
                <span className="text-[10px] font-bold text-white uppercase">{currentUser}</span>
              </div>
              <div className="w-8 h-8 rounded-sm bg-black/40 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-rose-500 group-hover:border-rose-500/30 transition-all">
                <LogOut size={16} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
