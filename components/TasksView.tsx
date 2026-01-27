
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, CheckCircle, Circle, Terminal, ListCheck, Loader2, Target, 
  CalendarDays, CheckCircle2, LayoutGrid, ClipboardEdit, Edit2, Check, X, 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon 
} from 'lucide-react';
import { DailyTask } from '../types';
import { supabase } from '../lib/supabase';

interface TasksViewProps { currentUser: string; }

type SubTab = 'HOJE' | 'CALENDARIO' | 'CADASTRO';

const TasksView: React.FC<TasksViewProps> = ({ currentUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('HOJE');
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [calendarTasks, setCalendarTasks] = useState<DailyTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  // Estado para o Calendário
  const [viewDate, setViewDate] = useState(new Date());

  const fetchTodayTasks = async () => {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_name', currentUser)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error('Erro ao buscar tarefas de hoje:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMonthTasks = async () => {
    try {
      const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
      const lastDay = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0, 23, 59, 59);

      const { data, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_name', currentUser)
        .gte('created_at', firstDay.toISOString())
        .lte('created_at', lastDay.toISOString());

      if (error) throw error;
      setCalendarTasks(data || []);
    } catch (err) {
      console.error('Erro ao buscar tarefas do mês:', err);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'CALENDARIO') {
      fetchMonthTasks();
    } else {
      fetchTodayTasks();
    }

    const channel = supabase
      .channel('tasks-realtime-v6')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_tasks' }, () => {
        fetchTodayTasks();
        if (activeSubTab === 'CALENDARIO') fetchMonthTasks();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser, activeSubTab, viewDate]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const tempTitle = newTaskTitle.trim();
    setNewTaskTitle('');

    try {
      const { error } = await supabase.from('daily_tasks').insert([{
        title: tempTitle,
        user_name: currentUser,
        completed: false
      }]);

      if (error) throw error;
      fetchTodayTasks();
    } catch (err) {
      console.error('Erro ao adicionar tarefa:', err);
      setNewTaskTitle(tempTitle);
    }
  };

  const handleUpdateTask = async (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, title: newTitle } : t));
    setEditingId(null);

    try {
      const { error } = await supabase.from('daily_tasks').update({ title: newTitle }).eq('id', id);
      if (error) throw error;
    } catch (err) {
      fetchTodayTasks();
    }
  };

  const toggleTask = async (id: string, completed: boolean) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !completed } : t));
    try {
      const { error } = await supabase.from('daily_tasks').update({ completed: !completed }).eq('id', id);
      if (error) {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: completed } : t));
        throw error;
      }
    } catch (err) {
      console.error('Erro ao atualizar tarefa:', err);
    }
  };

  const deleteTask = async (id: string) => {
    const taskBackup = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      const { error } = await supabase.from('daily_tasks').delete().eq('id', id);
      if (error) {
        if (taskBackup) setTasks(prev => [taskBackup, ...prev]);
        throw error;
      }
    } catch (err) {
      console.error('Erro ao excluir tarefa:', err);
    }
  };

  // Lógica de Renderização do Calendário
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [viewDate]);

  const monthName = viewDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  const totalToday = tasks.length;
  const completedToday = tasks.filter(t => t.completed).length;
  const progressPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;
  const goalReached = totalToday > 0 && progressPercent === 100;

  const todayFormatted = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(new Date());

  return (
    <div className="flex flex-col h-full bg-[#020617] border border-slate-800 rounded-sm overflow-hidden animate-in fade-in duration-500">
      {/* Header da View */}
      <div className="p-6 border-b border-slate-800 bg-black/20 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-black uppercase tracking-[0.4em] text-white flex items-center gap-3">
            <ListCheck className="text-blue-500" size={18} /> Central de Tarefas
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <CalendarDays size={12} className="text-slate-500" />
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
              {todayFormatted}
            </p>
          </div>
        </div>
        
        {/* Sub-Navegação Expandida - Ordem atualizada: CALENDÁRIO antes de HOJE */}
        <div className="flex items-center bg-black/40 p-1 rounded-sm border border-slate-800">
          <button 
            onClick={() => setActiveSubTab('CALENDARIO')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${
              activeSubTab === 'CALENDARIO' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <CalendarIcon size={14} /> Calendário
          </button>
          <button 
            onClick={() => setActiveSubTab('HOJE')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${
              activeSubTab === 'HOJE' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <LayoutGrid size={14} /> Hoje
          </button>
          <button 
            onClick={() => setActiveSubTab('CADASTRO')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${
              activeSubTab === 'CADASTRO' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <ClipboardEdit size={14} /> Cadastro
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden w-full px-8 pt-8">
        
        {/* VIEW: HOJE - Split-Focus (Original) */}
        {activeSubTab === 'HOJE' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full animate-in slide-in-from-right-4 duration-500">
            <div className="lg:col-span-7 flex flex-col h-full overflow-hidden">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Fluxo de Trabalho</span>
                <span className="text-[10px] font-bold text-slate-600 uppercase tabular-nums">{tasks.length} ITENS</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 pb-10">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-slate-700" size={32} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Sincronizando...</span>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-800/40 rounded-sm opacity-20">
                    <Terminal size={40} className="text-slate-700 mb-4" />
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 text-center">Lista vazia para hoje</p>
                  </div>
                ) : (
                  tasks.map(task => (
                    <div 
                      key={task.id}
                      className={`group flex items-center justify-between p-4 bg-slate-900/20 border rounded-sm transition-all duration-300 ${
                        task.completed ? 'border-emerald-500/10 opacity-40' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/40 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-5 flex-1 mr-4">
                        <button onClick={() => toggleTask(task.id, task.completed)} className={`flex-shrink-0 transition-all duration-300 transform active:scale-90 ${task.completed ? 'text-emerald-500' : 'text-slate-700 hover:text-blue-500'}`}>
                          {task.completed ? <CheckCircle size={22} strokeWidth={2.5} /> : <Circle size={22} strokeWidth={2.5} />}
                        </button>
                        <span className={`text-[13px] font-bold tracking-tight transition-all duration-500 ${task.completed ? 'text-slate-600 line-through' : 'text-slate-300'}`}>
                          {task.title}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="lg:col-span-5 flex flex-col">
              <div className="mb-4"><span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Performance Diária</span></div>
              <div className={`p-8 border transition-all duration-700 rounded-sm flex flex-col gap-6 w-full ${goalReached ? 'bg-emerald-500/5 border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.08)]' : 'bg-slate-900/20 border-slate-800 shadow-sm'}`}>
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-sm flex items-center justify-center transition-all duration-500 ${goalReached ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}><Target size={24} /></div>
                    <div className="text-right"><span className={`text-3xl font-black tabular-nums transition-colors ${goalReached ? 'text-emerald-400' : 'text-slate-300'}`}>{progressPercent}%</span></div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className={`text-[12px] font-black uppercase tracking-[0.2em] transition-colors ${goalReached ? 'text-emerald-400' : 'text-slate-400'}`}>{goalReached ? 'Objetivo Cumprido' : 'Meta do Ciclo Diário'}</span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{completedToday} de {totalToday} execuções concluídas</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/50">
                  <div className={`h-full transition-all duration-1000 ease-out rounded-full ${goalReached ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-blue-600'}`} style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: CALENDÁRIO - Grid Mensal Gigante */}
        {activeSubTab === 'CALENDARIO' && (
          <div className="flex flex-col h-full animate-in zoom-in-95 duration-500 overflow-hidden">
            {/* Navegação de Mês */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                  className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-sm transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <h3 className="text-lg font-black text-white uppercase tracking-[0.2em] min-w-[200px] text-center">
                  {monthName}
                </h3>
                <button 
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                  className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-sm transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              <button 
                onClick={() => setViewDate(new Date())}
                className="px-4 py-2 border border-slate-800 rounded-sm text-[10px] font-black uppercase text-slate-500 hover:text-white hover:border-slate-600 transition-all"
              >
                Retornar ao Mês Atual
              </button>
            </div>

            {/* Grid do Calendário */}
            <div className="flex-1 grid grid-cols-7 border-t border-l border-slate-800 overflow-hidden bg-slate-950/20">
              {/* Dias da Semana */}
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(d => (
                <div key={d} className="p-3 border-r border-b border-slate-800 bg-black/40 text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{d}</span>
                </div>
              ))}
              
              {/* Células de Dias */}
              {calendarDays.map((day, idx) => {
                const isToday = day && day === new Date().getDate() && viewDate.getMonth() === new Date().getMonth() && viewDate.getFullYear() === new Date().getFullYear();
                
                const dayTasks = day ? calendarTasks.filter(t => {
                  const d = new Date(t.created_at);
                  return d.getDate() === day && d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear();
                }) : [];

                return (
                  <div 
                    key={idx} 
                    className={`min-h-[100px] border-r border-b border-slate-800 p-2 transition-all group overflow-hidden ${
                      day ? 'bg-transparent' : 'bg-slate-900/10'
                    } ${isToday ? 'ring-2 ring-inset ring-blue-500 shadow-[inset_0_0_15px_rgba(59,130,246,0.1)]' : 'hover:bg-slate-900/20'}`}
                  >
                    {day && (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-black ${isToday ? 'text-blue-400' : 'text-slate-700'}`}>
                            {day.toString().padStart(2, '0')}
                          </span>
                          {dayTasks.length > 0 && (
                            <span className="text-[8px] font-bold text-slate-600 tabular-nums">
                              {dayTasks.filter(t => t.completed).length}/{dayTasks.length}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          {dayTasks.slice(0, 4).map(t => (
                            <div 
                              key={t.id} 
                              className={`text-[9px] font-bold py-0.5 px-1.5 rounded-[2px] truncate ${
                                t.completed 
                                  ? 'bg-emerald-500/5 text-emerald-500/40 line-through border-l border-emerald-500/20' 
                                  : 'bg-blue-600/10 text-blue-400 border-l border-blue-500/50'
                              }`}
                            >
                              {t.title}
                            </div>
                          ))}
                          {dayTasks.length > 4 && (
                            <span className="text-[8px] font-black text-slate-700 ml-1">
                              + {dayTasks.length - 4} ITENS
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW: CADASTRO */}
        {activeSubTab === 'CADASTRO' && (
          <div className="flex flex-col h-full animate-in slide-in-from-left-4 duration-500 max-w-4xl mx-auto w-full">
            <form onSubmit={addTask} className="mb-10 relative group w-full">
              <div className="absolute -inset-0.5 bg-blue-600 rounded-sm blur-sm opacity-0 group-focus-within:opacity-10 transition duration-500"></div>
              <div className="relative flex gap-2">
                <input 
                  autoFocus
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-sm px-6 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700 shadow-sm"
                  placeholder="Novo item operacional..."
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="bg-blue-600 px-6 rounded-sm text-white hover:bg-blue-500 transition-all disabled:opacity-30 flex items-center justify-center shadow-md active:scale-95"
                >
                  <Plus size={20} strokeWidth={3} />
                </button>
              </div>
            </form>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 pb-10">
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-800/40 rounded-sm opacity-20">
                  <Terminal size={40} className="text-slate-700 mb-4" />
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 text-center">Aguardando registro de dados</p>
                </div>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className="group flex items-center justify-between p-4 bg-slate-900/30 border border-slate-800 rounded-sm hover:border-slate-700 transition-all shadow-sm">
                    <div className="flex items-center gap-5 flex-1 mr-4">
                      {editingId === task.id ? (
                        <div className="flex items-center gap-2 flex-1 animate-in fade-in duration-200">
                          <input 
                            autoFocus
                            className="flex-1 bg-slate-950 border border-blue-500 rounded-sm px-3 py-1 text-sm text-white outline-none"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            onKeyDown={e => {
                              if(e.key === 'Enter') handleUpdateTask(task.id, editTitle);
                              if(e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <button onClick={() => handleUpdateTask(task.id, editTitle)} className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded-sm"><Check size={18} /></button>
                          <button onClick={() => setEditingId(null)} className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-sm"><X size={18} /></button>
                        </div>
                      ) : (
                        <>
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.completed ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-slate-700'}`} />
                          <span className={`text-[13px] font-bold tracking-tight ${task.completed ? 'text-slate-600 line-through' : 'text-slate-300'}`}>
                            {task.title}
                          </span>
                        </>
                      )}
                    </div>
                    {editingId !== task.id && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setEditingId(task.id); setEditTitle(task.title); }} className="text-slate-500 hover:text-blue-400 p-2 rounded-sm hover:bg-blue-500/10"><Edit2 size={15} /></button>
                        <button onClick={() => deleteTask(task.id)} className="text-slate-500 hover:text-rose-500 p-2 rounded-sm hover:bg-rose-500/10"><Trash2 size={15} /></button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksView;
