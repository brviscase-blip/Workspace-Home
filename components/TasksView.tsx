
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Circle, Terminal, ListCheck, Loader2, Target, CalendarDays, CheckCircle2, LayoutGrid, ClipboardEdit, Edit2, Check, X } from 'lucide-react';
import { DailyTask } from '../types';
import { supabase } from '../lib/supabase';

interface TasksViewProps { currentUser: string; }

type SubTab = 'CADASTRO' | 'HOJE';

const TasksView: React.FC<TasksViewProps> = ({ currentUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('HOJE');
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const fetchTasks = async () => {
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
      console.error('Erro ao buscar tarefas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel('tasks-realtime-v4')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_tasks' }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser]);

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
      fetchTasks();
    } catch (err) {
      console.error('Erro ao adicionar tarefa:', err);
      setNewTaskTitle(tempTitle);
    }
  };

  const handleUpdateTask = async (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    // Otimista
    setTasks(prev => prev.map(t => t.id === id ? { ...t, title: newTitle } : t));
    setEditingId(null);

    try {
      const { error } = await supabase
        .from('daily_tasks')
        .update({ title: newTitle })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('Erro ao editar tarefa:', err);
      fetchTasks(); // Reverte em caso de erro
    }
  };

  const toggleTask = async (id: string, completed: boolean) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !completed } : t));

    try {
      const { error } = await supabase
        .from('daily_tasks')
        .update({ completed: !completed })
        .eq('id', id);

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
      const { error } = await supabase
        .from('daily_tasks')
        .delete()
        .eq('id', id);

      if (error) {
        if (taskBackup) setTasks(prev => [taskBackup, ...prev]);
        throw error;
      }
    } catch (err) {
      console.error('Erro ao excluir tarefa:', err);
    }
  };

  const totalToday = tasks.length;
  const completedToday = tasks.filter(t => t.completed).length;
  const progressPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;
  const goalReached = totalToday > 0 && progressPercent === 100;

  const todayFormatted = new Intl.DateTimeFormat('pt-BR', { 
    dateStyle: 'full' 
  }).format(new Date());

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
        
        {/* Sub-Navegação */}
        <div className="flex items-center bg-black/40 p-1 rounded-sm border border-slate-800">
          <button 
            onClick={() => setActiveSubTab('CADASTRO')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${
              activeSubTab === 'CADASTRO' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <ClipboardEdit size={14} /> Cadastro
          </button>
          <button 
            onClick={() => setActiveSubTab('HOJE')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${
              activeSubTab === 'HOJE' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <LayoutGrid size={14} /> Hoje
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full p-8">
        
        {/* VIEW: HOJE - Focada em Execução e Meta */}
        {activeSubTab === 'HOJE' && (
          <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-500">
            {/* Indicador de Meta Diária */}
            <div className={`mb-8 p-6 border transition-all duration-700 rounded-sm flex flex-col gap-4 ${
              goalReached 
              ? 'bg-emerald-500/5 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.05)]' 
              : 'bg-slate-900/20 border-slate-800 shadow-sm'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-sm flex items-center justify-center transition-all duration-500 ${
                    goalReached ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {goalReached ? <CheckCircle2 size={18} strokeWidth={2.5} /> : <Target size={18} />}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${goalReached ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {goalReached ? 'Objetivo Cumprido' : 'Meta do Ciclo Diário'}
                    </span>
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                      {completedToday} de {totalToday} execuções concluídas
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xl font-black tabular-nums transition-colors ${goalReached ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {progressPercent}%
                  </span>
                </div>
              </div>
              
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/50">
                <div 
                  className={`h-full transition-all duration-1000 ease-out rounded-full ${
                    goalReached ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-blue-600'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Lista Simplificada para Execução */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 pb-10">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="animate-spin text-slate-700" size={32} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Sincronizando...</span>
                </div>
              ) : tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-800/40 rounded-sm opacity-20">
                  <Terminal size={40} className="text-slate-700 mb-4" />
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 text-center">Nenhuma tarefa registrada para hoje</p>
                  <button 
                    onClick={() => setActiveSubTab('CADASTRO')}
                    className="mt-4 text-[10px] font-black uppercase text-blue-500 hover:text-blue-400 underline tracking-widest"
                  >
                    Ir para Cadastro
                  </button>
                </div>
              ) : (
                tasks.map(task => (
                  <div 
                    key={task.id}
                    className={`group flex items-center justify-between p-4 bg-slate-900/20 border rounded-sm transition-all duration-300 ${
                      task.completed 
                        ? 'border-emerald-500/10 opacity-40' 
                        : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/40 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-5 flex-1 mr-4">
                      <button 
                        onClick={() => toggleTask(task.id, task.completed)}
                        className={`flex-shrink-0 transition-all duration-300 transform active:scale-90 ${
                          task.completed ? 'text-emerald-500' : 'text-slate-700 hover:text-blue-500'
                        }`}
                      >
                        {task.completed ? (
                          <CheckCircle size={22} strokeWidth={2.5} />
                        ) : (
                          <Circle size={22} strokeWidth={2.5} />
                        )}
                      </button>
                      <span className={`text-[13px] font-bold tracking-tight transition-all duration-500 ${
                        task.completed ? 'text-slate-600 line-through' : 'text-slate-300'
                      }`}>
                        {task.title}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VIEW: CADASTRO - Focada em Gestão, Edição e Exclusão */}
        {activeSubTab === 'CADASTRO' && (
          <div className="flex flex-col h-full animate-in slide-in-from-left-4 duration-500">
            {/* Input de Adição */}
            <form onSubmit={addTask} className="mb-10 relative group">
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

            {/* Lista com Gestão Completa */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 pb-10">
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-800/40 rounded-sm opacity-20">
                  <Terminal size={40} className="text-slate-700 mb-4" />
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 text-center">Aguardando registro de dados</p>
                </div>
              ) : (
                tasks.map(task => (
                  <div 
                    key={task.id}
                    className="group flex items-center justify-between p-4 bg-slate-900/30 border border-slate-800 rounded-sm hover:border-slate-700 transition-all shadow-sm"
                  >
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
                          <button 
                            onClick={() => handleUpdateTask(task.id, editTitle)}
                            className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded-sm"
                          >
                            <Check size={18} />
                          </button>
                          <button 
                            onClick={() => setEditingId(null)}
                            className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-sm"
                          >
                            <X size={18} />
                          </button>
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
                        <button 
                          onClick={() => { setEditingId(task.id); setEditTitle(task.title); }}
                          className="text-slate-500 hover:text-blue-400 p-2 rounded-sm hover:bg-blue-500/10"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button 
                          onClick={() => deleteTask(task.id)}
                          className="text-slate-500 hover:text-rose-500 p-2 rounded-sm hover:bg-rose-500/10"
                        >
                          <Trash2 size={15} />
                        </button>
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
