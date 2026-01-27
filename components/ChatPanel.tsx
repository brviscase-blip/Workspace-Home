
import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Check, CheckCheck, X, Shield, Lock, Maximize2, Minimize2, Circle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string;
  is_read: boolean;
}

interface Profile {
  display_name: string;
  username: string;
}

interface ChatPanelProps {
  currentUser: string;
  onClose: () => void;
}

const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';

const ChatPanel: React.FC<ChatPanelProps> = ({ currentUser, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('display_name, username');
    if (data) {
      const others = data.filter(p => p.display_name !== currentUser);
      setProfiles(others);
      if (others.length > 0) setSelectedPartner(others[0].display_name);
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

  const fetchMessages = async () => {
    if (!selectedPartner) return;
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq."${currentUser}",receiver_id.eq."${selectedPartner}"),and(sender_id.eq."${selectedPartner}",receiver_id.eq."${currentUser}")`)
      .order('created_at', { ascending: true });
    
    if (!error && data) {
      setMessages(data);
    }
  };

  const markAsRead = async () => {
    if (!selectedPartner) return;
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', currentUser)
      .eq('sender_id', selectedPartner)
      .eq('is_read', false);
  };

  // --- Realtime & Presence ---
  useEffect(() => {
    if (!selectedPartner) return;

    fetchMessages();
    markAsRead();

    // Canal de Mensagens e Leitura
    const msgChannel = supabase
      .channel('chat-v3-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as Message;
        
        // Se for uma nova mensagem relevante para este chat
        if (payload.eventType === 'INSERT') {
          if ((msg.sender_id === currentUser && msg.receiver_id === selectedPartner) || 
              (msg.sender_id === selectedPartner && msg.receiver_id === currentUser)) {
            
            if (msg.receiver_id === currentUser) {
              audioRef.current?.play().catch(() => {});
              markAsRead(); // Marca como lido se o chat estiver aberto
            }
            
            setMessages(prev => {
              if (prev.find(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        } 
        
        // Se for atualização de leitura (Check Duplo Azul)
        if (payload.eventType === 'UPDATE') {
          setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
        }
      })
      .subscribe();

    // Canal de Presença (Online Status)
    const presenceChannel = supabase.channel('online-status', {
      config: { presence: { key: currentUser } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users = Object.keys(state);
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [currentUser, selectedPartner]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isExpanded]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending || !selectedPartner) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from('messages').insert([{
        sender_id: currentUser,
        receiver_id: selectedPartner,
        text: text,
        is_read: false
      }]);
      
      if (error) throw error;
      setInputText('');
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const isPartnerOnline = selectedPartner ? onlineUsers.includes(selectedPartner) : false;

  return (
    <>
      {isExpanded && <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9998]" onClick={() => setIsExpanded(false)} />}
      
      <div className={isExpanded 
        ? "fixed inset-8 z-[9999] bg-[#030712] border-2 border-slate-800 rounded-sm flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden"
        : "bg-[#030712] border border-slate-800 rounded-sm flex flex-col h-[650px] w-full overflow-hidden shadow-2xl relative"}>
        
        {/* HEADER */}
        <div className="p-5 border-b border-slate-800 bg-black/40 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-sm border flex items-center justify-center transition-all shadow-lg ${isPartnerOnline ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>
              <span className="text-[10px] font-black uppercase tracking-tighter">
                {getInitials(selectedPartner)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-white leading-none">Console de Comunicação</h4>
                <div className="flex items-center -space-x-1.5 ml-2">
                  {onlineUsers.slice(0, 5).map(u => (
                    <div key={u} title={`${u} (ONLINE)`} className="w-5 h-5 rounded-full border border-[#030712] bg-slate-800 flex items-center justify-center shadow-sm">
                      <span className="text-[6px] font-black text-slate-400">{getInitials(u)}</span>
                    </div>
                  ))}
                  {onlineUsers.length > 5 && (
                    <div className="w-5 h-5 rounded-full border border-[#030712] bg-blue-600 flex items-center justify-center shadow-sm">
                      <span className="text-[6px] font-black text-white">+{onlineUsers.length - 5}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                {profiles.length > 1 ? (
                  <select 
                    className="bg-slate-900 border border-slate-800 text-[9px] font-black uppercase text-blue-400 rounded-sm px-1 outline-none"
                    value={selectedPartner || ''}
                    onChange={(e) => setSelectedPartner(e.target.value)}
                  >
                    {profiles.map(p => {
                      const isOnline = onlineUsers.includes(p.display_name);
                      return <option key={p.username} value={p.display_name}>{p.display_name} {isOnline ? '●' : ''}</option>;
                    })}
                  </select>
                ) : (
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">{selectedPartner}</span>
                )}
                <p className={`text-[10px] font-bold uppercase tracking-tighter flex items-center gap-2 ${isPartnerOnline ? 'text-emerald-500' : 'text-slate-600'}`}>
                  <div className={`w-2 h-2 rounded-full ${isPartnerOnline ? 'bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]' : 'bg-slate-800'}`} /> 
                  {isPartnerOnline ? '(ONLINE)' : '(OFFLINE)'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-sm">
              {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-rose-500 transition-colors bg-white/5 rounded-sm">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* CHAT AREA */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(30,41,59,0.08),transparent)]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20">
              <Lock size={48} className="mb-6 text-slate-700" />
              <p className="text-[12px] font-black uppercase tracking-[0.4em]">Tunelamento Seguro: {selectedPartner}</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === currentUser;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-sm text-[13px] font-medium leading-relaxed whitespace-pre-wrap shadow-sm ${
                      isMe ? 'bg-blue-600 text-white border border-blue-500/50' : 'bg-slate-900 text-slate-200 border border-slate-800'
                    }`}>
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && (
                        <div className={msg.is_read ? 'text-blue-400' : 'text-slate-600'}>
                          {msg.is_read ? <CheckCheck size={13} strokeWidth={3} /> : <Check size={13} strokeWidth={3} />}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* INPUT */}
        <form onSubmit={handleSendMessage} className="p-5 border-t border-slate-800 bg-black/40">
          <div className="relative group">
            <textarea 
              rows={2}
              placeholder="Digite aqui... (Ctrl + Enter para enviar)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { 
                if (e.key === 'Enter' && e.ctrlKey) { 
                  e.preventDefault(); 
                  handleSendMessage(); 
                } 
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-sm py-4 pl-5 pr-14 text-[13px] text-white focus:outline-none focus:border-blue-500 transition-all font-medium resize-none min-h-[56px] custom-scrollbar"
            />
            <button 
              type="submit"
              disabled={!inputText.trim() || isSending}
              className={`absolute right-3 bottom-3.5 p-2 rounded-sm transition-all ${inputText.trim() && !isSending ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-800'}`}
              title="Pressione Ctrl + Enter para enviar"
            >
              {isSending ? <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <Send size={18} />}
            </button>
          </div>
          <div className="mt-4 flex items-center justify-between px-1 opacity-50">
            <div className="flex items-center gap-3">
              <Shield size={10} className="text-slate-500" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">AES-256 BIT ENCRYPTION</span>
            </div>
            <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">
              ENTER: Quebra de Linha | CTRL + ENTER: Enviar
            </span>
          </div>
        </form>
      </div>
    </>
  );
};

export default ChatPanel;
