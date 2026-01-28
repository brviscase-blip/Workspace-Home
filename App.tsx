
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import DemandTable from './components/DemandTable';
import KanbanView from './components/KanbanView';
import NotesView from './components/NotesView';
import WeeklyView from './components/WeeklyView';
import TasksView from './components/TasksView';
import DemandModal from './components/DemandModal';
import FocusCard from './components/FocusCard';
import FocusManagementModal from './components/FocusManagementModal';
import SubActivityModal from './components/SubActivityModal';
import NotificationSystem, { Notification, NotificationType } from './components/NotificationSystem';
import Login from './components/Login';
import { ViewType, LayoutType, DemandItem, DemandStatus, Note, Folder, SubActivity, TimeEntry } from './types';
import { LayoutGrid, List, Kanban, Plus, Loader2, CalendarDays, ChevronDown, Check, Terminal, Shield, Cpu } from 'lucide-react';
import { supabase } from './lib/supabase';

interface FilterState {
  status: string;
  requester: string;
  responsible: string;
  contract: string;
  difficulty: string;
  priority: string;
}

const statusOptions: ('TODAS' | 'EM CURSO' | 'CONCLUÍDAS')[] = ['TODAS', 'EM CURSO', 'CONCLUÍDAS'];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(localStorage.getItem('artifacts_user'));
  const [activeView, setActiveView] = useState<ViewType>('DEMANDAS');
  const [layout, setLayout] = useState<LayoutType>(() => (localStorage.getItem('artifacts_layout') as LayoutType) || 'TABLE');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [demands, setDemands] = useState<DemandItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState<'CONNECTING' | 'ONLINE' | 'OFFLINE'>('CONNECTING');
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  
  const [now, setNow] = useState(Date.now());
  const [focusedDemandIds, setFocusedDemandIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFocusManagementOpen, setIsFocusManagementOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [selectedSubDemand, setSelectedSubDemand] = useState<DemandItem | null>(null);
  
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isResponsibleMenuOpen, setIsResponsibleMenuOpen] = useState(false);
  const [isContractMenuOpen, setIsContractMenuOpen] = useState(false);
  
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const responsibleMenuRef = useRef<HTMLDivElement>(null);
  const contractMenuRef = useRef<HTMLDivElement>(null);
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([{ id: 'all', name: 'Todas as Notas', color: 'text-slate-400' }]);
  const [filters, setFilters] = useState<FilterState>(() => {
    const saved = localStorage.getItem('artifacts_filters');
    return saved ? JSON.parse(saved) : { status: '', requester: '', responsible: '', contract: '', difficulty: '', priority: '' };
  });

  const [editingDemand, setEditingDemand] = useState<DemandItem | null>(null);
  const [activeTab, setActiveTab] = useState<'TODAS' | 'EM CURSO' | 'CONCLUÍDAS' | 'SEMANA'>('EM CURSO');
  const [toasts, setToasts] = useState<Notification[]>([]);
  const [history, setHistory] = useState<Notification[]>([]);

  const addNotification = useCallback((message: string, type: NotificationType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setHistory(prev => [...prev, { id, message, type }]);
  }, []);

  const handleRemoveNotification = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) setIsStatusMenuOpen(false);
      if (responsibleMenuRef.current && !responsibleMenuRef.current.contains(event.target as Node)) setIsResponsibleMenuOpen(false);
      if (contractMenuRef.current && !contractMenuRef.current.contains(event.target as Node)) setIsContractMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Persistência de layout e filtros
  useEffect(() => {
    localStorage.setItem('artifacts_layout', layout);
  }, [layout]);

  useEffect(() => {
    localStorage.setItem('artifacts_filters', JSON.stringify(filters));
  }, [filters]);

  const fetchData = useCallback(async (silent = false) => {
    try {
      const { data: folderData } = await supabase.from('folders').select('*').order('created_at');
      if (folderData) setFolders([{ id: 'all', name: 'Todas as Notas', color: 'text-slate-400' }, ...folderData]);

      const { data: noteData } = await supabase.from('notes').select('*').order('updated_at', { ascending: false });
      if (noteData) setNotes(noteData.map(n => ({ ...n, folderId: n.folder_id, updatedAt: n.updated_at, isFavorite: n.is_favorite })));

      const { data: demandData } = await supabase.from('demands').select('*, sub_activities(*)').order('order');
      const { data: logData } = await supabase.from('time_entries').select('*');

      if (demandData) {
        setDemands(demandData.map(d => {
          const dailyLogs: Record<string, number> = {};
          if (logData) {
            logData.filter((l: any) => l.demand_id === d.id).forEach((l: any) => {
              dailyLogs[l.date] = (dailyLogs[l.date] || 0) + l.duration;
            });
          }

          return {
            id: d.id, title: d.title, requester: d.requester, responsible: d.responsible,
            contract: d.contract, startDate: d.start_date, dueDate: d.due_date,
            status: d.status, priority: d.priority, difficulty: d.difficulty,
            pomodoros: d.pomodoros || 0, description: d.description, order: d.order,
            isTimerRunning: d.is_timer_running, timerStartedAt: d.timer_started_at,
            subActivities: d.sub_activities.map((s: any) => ({ id: s.id, title: s.title, completed: s.completed })),
            dailyLogs
          };
        }));
      }
    } catch (error) {
      console.error('❌ [FETCH ERROR]:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchData();
      const ticker = setInterval(() => setNow(Date.now()), 1000);
      
      const channel = supabase
        .channel('timer-global-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'demands' }, () => fetchData(true))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'time_entries' }, () => fetchData(true))
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') setRealtimeStatus('ONLINE');
          else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setRealtimeStatus('OFFLINE');
        });

      const presenceChannel = supabase.channel('global-presence', {
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
        clearInterval(ticker); 
        supabase.removeChannel(channel); 
        supabase.removeChannel(presenceChannel);
      };
    }
  }, [fetchData, currentUser]);

  const handleLogin = (username: string) => {
    setCurrentUser(username);
    localStorage.setItem('artifacts_user', username);
    addNotification(`Bem-vindo, Operador ${username}`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('artifacts_user');
  };

  const handleDeleteDemand = async (id: string) => {
    try {
      const { error } = await supabase.from('demands').delete().eq('id', id);
      if (error) throw error;
      addNotification(`Missão ${id} removida com sucesso.`, 'success');
      fetchData(true);
    } catch (err) {
      addNotification('Erro ao processar exclusão.', 'error');
    }
  };

  const filteredDemands = demands.filter(demand => {
    const matchesSearch = demand.title.toLowerCase().includes(searchQuery.toLowerCase()) || demand.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'TODAS' || 
                      (activeTab === 'EM CURSO' && (demand.status === 'IN_PROGRESS' || demand.status === 'OPEN')) || 
                      (activeTab === 'CONCLUÍDAS' && demand.status === 'COMPLETED') ||
                      (activeTab === 'SEMANA');
    
    const matchesResponsible = !filters.responsible || demand.responsible === filters.responsible;
    const matchesContract = !filters.contract || demand.contract === filters.contract;

    return matchesSearch && matchesTab && matchesResponsible && matchesContract;
  }).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const existingOptions = useMemo(() => {
    return {
      requesters: Array.from(new Set(demands.map(d => d.requester).filter(Boolean))).sort(),
      responsibles: Array.from(new Set(demands.map(d => d.responsible).filter(Boolean))).sort(),
      contracts: Array.from(new Set(demands.map(d => d.contract).filter(Boolean))).sort(),
    };
  }, [demands]);

  const nextDemandId = useMemo(() => {
    if (demands.length === 0) return 'DEM-001';
    const numericIds = demands.map(d => {
      const match = d.id.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    });
    const maxId = Math.max(...numericIds, 0);
    return `DEM-${(maxId + 1).toString().padStart(3, '0')}`;
  }, [demands]);

  const focusedDemands = useMemo(() => {
    return demands.filter(d => focusedDemandIds.includes(d.id) || d.isTimerRunning === true);
  }, [demands, focusedDemandIds]);

  const handleToggleTimer = async (id: string) => {
    const demand = demands.find(d => d.id === id);
    if (!demand) return;
    try {
      if (!demand.isTimerRunning) {
        await supabase.from('demands').update({ is_timer_running: true, timer_started_at: new Date().toISOString() }).eq('id', id);
        addNotification(`Cronômetro iniciado em ${id}`, 'alert');
      } else {
        const elapsed = Math.floor((Date.now() - new Date(demand.timerStartedAt!).getTime()) / 1000);
        const todayStr = new Date().toISOString().split('T')[0];
        
        await supabase.from('time_entries').insert({
          demand_id: id,
          duration: elapsed,
          date: todayStr
        });

        await supabase.from('demands').update({ 
          is_timer_running: false, 
          pomodoros: (demand.pomodoros || 0) + elapsed, 
          timer_started_at: null 
        }).eq('id', id);
        
        addNotification(`Cronômetro pausado. +${elapsed}s logados hoje.`, 'info');
      }
    } catch (err) { addNotification('Erro de sincronização', 'error'); }
  };

  const handleFinishSession = async (id: string) => {
    const demand = demands.find(d => d.id === id);
    if (!demand) return;
    let elapsed = 0;
    if (demand.isTimerRunning && demand.timerStartedAt) {
      elapsed = Math.floor((Date.now() - new Date(demand.timerStartedAt).getTime()) / 1000);
      const todayStr = new Date().toISOString().split('T')[0];
      await supabase.from('time_entries').insert({
        demand_id: id,
        duration: elapsed,
        date: todayStr
      });
    }
    await supabase.from('demands').update({ 
      is_timer_running: false, 
      timer_started_at: null, 
      pomodoros: (demand.pomodoros || 0) + elapsed 
    }).eq('id', id);
    setFocusedDemandIds(prev => prev.filter(fid => fid !== id));
  };

  const handleToggleFocus = async (id: string) => {
    const isAlreadyFocused = focusedDemandIds.includes(id);
    if (!isAlreadyFocused) {
      setFocusedDemandIds(prev => [...prev, id]);
      const demand = demands.find(d => d.id === id);
      if (demand && demand.status === 'OPEN') {
        await supabase.from('demands').update({ status: 'IN_PROGRESS' }).eq('id', id);
        addNotification(`${id} movida para EM CURSO`, 'info');
      }
    } else {
      setFocusedDemandIds(prev => prev.filter(fid => fid !== id));
    }
  };

  const handleManageSubs = (demand: DemandItem) => {
    setSelectedSubDemand(demand);
    setIsSubModalOpen(true);
  };

  const handleUpdateSubActivities = async (demandId: string, subs: SubActivity[]) => {
    try {
      await supabase.from('sub_activities').delete().eq('demand_id', demandId);
      if (subs.length > 0) {
        await supabase.from('sub_activities').insert(
          subs.map(s => ({ demand_id: demandId, title: s.title, completed: s.completed }))
        );
      }
      const demand = demands.find(d => d.id === demandId);
      if (demand) {
        const allCompleted = subs.length > 0 && subs.every(s => s.completed);
        let newStatus: DemandStatus = demand.status;
        if (allCompleted && demand.status !== 'COMPLETED') {
          newStatus = 'COMPLETED';
          await supabase.from('demands').update({ status: 'COMPLETED' }).eq('id', demandId);
        } else if (!allCompleted && demand.status === 'COMPLETED' && subs.length > 0) {
          newStatus = 'IN_PROGRESS';
          await supabase.from('IN_PROGRESS').update({ status: 'IN_PROGRESS' }).eq('id', demandId);
        }
        if (selectedSubDemand && selectedSubDemand.id === demandId) {
          setSelectedSubDemand({ ...selectedSubDemand, subActivities: subs, status: newStatus });
        }
      }
      fetchData(true);
    } catch (err) { addNotification('Erro ao sincronizar sub-atividades', 'error'); }
  };

  const handleUpdateTag = async (category: 'requester' | 'responsible' | 'contract', oldName: string, newName: string) => {
    const { error } = await supabase.from('demands').update({ [category]: newName }).eq(category, oldName).neq('status', 'COMPLETED');
    if (error) addNotification('Erro ao atualizar tag.', 'error');
    else fetchData(true);
  };

  const handleDeleteTag = async (category: 'requester' | 'responsible' | 'contract', tagName: string) => {
    const { error } = await supabase.from('demands').update({ [category]: null }).eq(category, tagName).neq('status', 'COMPLETED');
    if (error) addNotification('Erro ao remover tag.', 'error');
    else fetchData(true);
  };

  const renderView = () => {
    switch (activeView) {
      case 'TAREFAS':
        return <TasksView currentUser={currentUser || ''} />;
      case 'NOTAS':
        return <div className="flex-1 h-full overflow-hidden pt-8"><NotesView notes={notes} setNotes={setNotes} folders={folders} setFolders={setFolders} /></div>;
      case 'DEMANDAS':
      default:
        return (
          <>
            <div className="flex items-center justify-between mb-8 pt-8 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="relative" ref={statusMenuRef}>
                  <button onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)} className={`flex items-center gap-3 px-6 py-2.5 rounded-sm bg-[#030712] border text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl ${activeTab !== 'SEMANA' ? 'border-blue-500/50 text-white' : 'border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                    Status: <span className="text-blue-400">{activeTab === 'SEMANA' ? 'TODAS' : activeTab}</span>
                    <ChevronDown size={14} className={`text-slate-500 transition-transform duration-300 ${isStatusMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isStatusMenuOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-[#030712] border border-slate-800 rounded-sm shadow-2xl z-[1000] overflow-hidden">
                      <div className="p-1 flex flex-col gap-1">
                        {statusOptions.map((opt) => (
                          <button key={opt} onClick={() => { setActiveTab(opt); setIsStatusMenuOpen(false); }} className={`flex items-center justify-between px-4 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === opt ? 'bg-blue-600/10 text-blue-400' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'}`}>
                            {opt} {activeTab === opt && <Check size={14} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={() => setActiveTab(prev => prev === 'SEMANA' ? 'TODAS' : 'SEMANA')} className={`flex items-center gap-2 px-6 py-2.5 rounded-sm border text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl ${activeTab === 'SEMANA' ? 'bg-white text-slate-900 border-white' : 'bg-[#030712] border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'}`}>
                  <CalendarDays size={14} /> Semana
                </button>
                <div className="relative" ref={responsibleMenuRef}>
                  <button onClick={() => setIsResponsibleMenuOpen(!isResponsibleMenuOpen)} className={`flex items-center gap-3 px-6 py-2.5 rounded-sm bg-[#030712] border text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl ${filters.responsible ? 'border-blue-500/50 text-white' : 'border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                    {filters.responsible || 'Responsável'}
                    <ChevronDown size={14} className={`text-slate-500 transition-transform duration-300 ${isResponsibleMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isResponsibleMenuOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-[#030712] border border-slate-800 rounded-sm shadow-2xl z-[1000] overflow-hidden">
                      <div className="max-h-60 overflow-y-auto custom-scrollbar p-1 flex flex-col gap-1">
                        <button onClick={() => { setFilters(prev => ({ ...prev, responsible: '' })); setIsResponsibleMenuOpen(false); }} className={`flex items-center justify-between px-4 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${!filters.responsible ? 'bg-blue-600/10 text-blue-400' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'}`}>
                          TODOS OS OPERADORES {!filters.responsible && <Check size={14} />}
                        </button>
                        {existingOptions.responsibles.map((resp) => (
                          <button key={resp} onClick={() => { setFilters(prev => ({ ...prev, responsible: resp })); setIsResponsibleMenuOpen(false); }} className={`flex items-center justify-between px-4 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${filters.responsible === resp ? 'bg-blue-600/10 text-blue-400' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'}`}>
                            {resp} {filters.responsible === resp && <Check size={14} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative" ref={contractMenuRef}>
                  <button onClick={() => setIsContractMenuOpen(!isContractMenuOpen)} className={`flex items-center gap-3 px-6 py-2.5 rounded-sm bg-[#030712] border text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl ${filters.contract ? 'border-blue-500/50 text-white' : 'border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                    {filters.contract || 'Contrato'}
                    <ChevronDown size={14} className={`text-slate-500 transition-transform duration-300 ${isContractMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isContractMenuOpen && (
                    <div className="absolute top-full left-0 mt-2 w-72 bg-[#030712] border border-slate-800 rounded-sm shadow-2xl z-[1000] overflow-hidden">
                      <div className="max-h-60 overflow-y-auto custom-scrollbar p-1 flex flex-col gap-1">
                        <button onClick={() => { setFilters(prev => ({ ...prev, contract: '' })); setIsContractMenuOpen(false); }} className={`flex items-center justify-between px-4 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${!filters.contract ? 'bg-blue-600/10 text-blue-400' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'}`}>
                          TODOS OS CONTRATOS {!filters.contract && <Check size={14} />}
                        </button>
                        {existingOptions.contracts.map((cont) => (
                          <button key={cont} onClick={() => { setFilters(prev => ({ ...prev, contract: cont })); setIsContractMenuOpen(false); }} className={`flex items-center justify-between px-4 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${filters.contract === cont ? 'bg-blue-600/10 text-blue-400' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'}`}>
                            {cont} {filters.contract === cont && <Check size={14} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-sm border border-slate-800">
                <button onClick={() => setLayout('GRID')} className={`p-1.5 rounded-sm ${layout === 'GRID' ? 'bg-slate-800 text-white' : 'text-slate-600'}`} title="Grid de Foco"><LayoutGrid size={16} /></button>
                <button onClick={() => setLayout('TABLE')} className={`p-1.5 rounded-sm ${layout === 'TABLE' ? 'bg-slate-800 text-white' : 'text-slate-600'}`} title="Tabela Consolidada"><List size={16} /></button>
                <button onClick={() => setLayout('KANBAN')} className={`p-1.5 rounded-sm ${layout === 'KANBAN' ? 'bg-slate-800 text-white' : 'text-slate-600'}`} title="Kanban"><Kanban size={16} /></button>
              </div>
            </div>
            <div className={`flex-1 min-h-0 ${layout === 'KANBAN' || activeTab === 'SEMANA' ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'}`}>
              {activeTab === 'SEMANA' ? <WeeklyView demands={filteredDemands} onEdit={(d) => { setEditingDemand(d); setIsModalOpen(true); }} /> : (
                <div className="h-full pb-4">
                  {layout === 'GRID' && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                      {focusedDemands.map(fd => <FocusCard key={fd.id} demand={fd} now={now} onToggleTimer={() => handleToggleTimer(fd.id)} onRemove={(id) => setFocusedDemandIds(p => p.filter(fid => fid !== id))} onFinishSession={handleFinishSession} onComplete={(id) => supabase.from('demands').update({ status: 'COMPLETED' }).eq('id', id)} />)}
                      <button onClick={() => setIsFocusManagementOpen(true)} className="flex flex-col items-center justify-center rounded-sm border-2 border-dashed border-slate-800/40 bg-slate-900/10 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all h-[340px]"><Plus size={24} className="text-slate-700" /><span className="text-[10px] font-black uppercase tracking-0.2em text-slate-600 mt-2">Vincular Missão</span></button>
                    </div>}
                  {layout === 'TABLE' && <DemandTable demands={filteredDemands} onEdit={(d) => { setEditingDemand(d); setIsModalOpen(true); }} onDelete={handleDeleteDemand} onAdd={() => { setEditingDemand(null); setIsModalOpen(true); }} onManageSubs={handleManageSubs} />}
                  {layout === 'KANBAN' && <KanbanView demands={filteredDemands} onEdit={(d) => { setEditingDemand(d); setIsModalOpen(true); }} onDelete={handleDeleteDemand} onMoveDemand={(id, s) => supabase.from('demands').update({ status: s }).eq('id', id)} onManageSubs={handleManageSubs} />}
                </div>
              )}
            </div>
          </>
        );
    }
  };

  if (!currentUser) return <Login onLogin={handleLogin} />;

  return (
    <div className="flex h-screen w-screen bg-[#020617] text-slate-200 overflow-hidden">
      <Sidebar activeView={activeView} onViewChange={setActiveView} isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} onLogout={handleLogout} />
      
      <main className="flex-1 flex flex-col min-w-0 bg-[#020617] transition-all duration-300">
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-8 flex-1 flex flex-col min-h-0 overflow-hidden">
              {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="animate-spin text-blue-500" size={40} />
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Sincronizando Workspace...</p>
                </div>
              ) : renderView()}
            </div>

            <footer className="h-10 bg-[#030712] border-t border-slate-800 flex items-center px-8 flex-shrink-0">
               <div className="flex items-center gap-6 flex-1">
                  <div className="flex items-center gap-2"><Terminal size={12} className="text-blue-500" /><span className="text-[9px] font-black uppercase tracking-widest text-slate-600">LOG:</span><span className="text-[9px] font-bold text-slate-400 animate-pulse">Handshake seguro com Artifacts-Core-V3... [OK]</span></div>
                  <div className="flex items-center gap-4"><div className="flex items-center gap-1.5"><Cpu size={12} className="text-slate-700" /><span className="text-[9px] font-bold text-slate-600 uppercase">SYS_LOAD: NORMAL</span></div><div className="flex items-center gap-1.5"><Shield size={12} className="text-slate-700" /><span className="text-[9px] font-bold text-slate-600 uppercase">PROTOCOLO: POTA_V1</span></div></div>
               </div>
               <div className="flex items-center gap-4">
                  <div className="flex items-center -space-x-2 mr-2">
                    {onlineUsers.map((user) => (
                      <div key={user} className="w-5 h-5 rounded-full border border-[#030712] bg-slate-800 flex items-center justify-center text-[7px] font-black uppercase text-slate-400" title={user}>
                        {user.substring(0, 2)}
                      </div>
                    ))}
                  </div>
                  <span className="text-[9px] font-black text-slate-700 uppercase">Uptime: 100%</span>
                  <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><span className="text-[9px] font-black text-emerald-500 uppercase">Serviços Estáveis</span></div>
               </div>
            </footer>
          </div>
        </div>
      </main>

      <DemandModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} nextId={nextDemandId} onSave={async (d) => { await supabase.from('demands').upsert({ id: d.id, title: d.title, requester: d.requester, responsible: d.responsible, contract: d.contract, start_date: d.startDate, due_date: d.dueDate, status: d.status, priority: d.priority, difficulty: d.difficulty, pomodoros: d.pomodoros, description: d.description, order: d.order ?? demands.length }); fetchData(); }} editingDemand={editingDemand} existingOptions={existingOptions} onUpdateTag={handleUpdateTag} onDeleteTag={handleDeleteTag} />
      <FocusManagementModal isOpen={isFocusManagementOpen} onClose={() => setIsFocusManagementOpen(false)} availableDemands={demands.filter(d => d.status !== 'COMPLETED')} focusedIds={focusedDemandIds} onToggleFocus={handleToggleFocus} />
      <SubActivityModal isOpen={isSubModalOpen} onClose={() => setIsSubModalOpen(false)} demand={selectedSubDemand} onUpdateSubActivities={handleUpdateSubActivities} />
      <NotificationSystem notifications={toasts} removeNotification={handleRemoveNotification} />
    </div>
  );
};

export default App;
