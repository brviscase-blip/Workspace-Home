
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Circle, Terminal, ListCheck, Loader2 } from 'lucide-react';
import { DailyTask } from '../types';
import { supabase } from '../lib/supabase';

interface TasksViewProps {
  currentUser: string;
}

const TasksView: React.FC<TasksViewProps> = ({ currentUser }) => {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_name', currentUser)
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

    // Ouve mudanças em tempo real para manter sincronizado com outros terminais
    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_tasks' }, (payload) => {
        // Se a mudança veio de outro lugar, atualizamos a lista
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
      setNewTaskTitle(tempTitle); // Devolve o texto em caso de erro
    }
  };

  const toggleTask = async (id: string, completed: boolean) => {
    // ATUALIZAÇÃO OTIMISTA: Muda o estado local IMEDIATAMENTE
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !completed } : t));

    try {
      const { error } = await supabase
        .from('daily_tasks')
        .update({ completed: !completed })
        .eq('id', id);

      if (error) {
        // Reverte em caso de erro no servidor
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: completed } : t));
        throw error;
      }
    } catch (err) {
      console.error('Erro ao atualizar tarefa:', err);
    }
  };

  const deleteTask = async (id: string) => {
    // ATUALIZAÇÃO OTIMISTA: Remove da lista local IMEDIATAMENTE
    const taskBackup = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));

    try {
      const { error } = await supabase
        .from('daily_tasks')
        .delete()
        .eq('id', id);

      if (error) {
        // Reverte em caso de erro
        if (taskBackup) setTasks(prev => [taskBackup, ...prev]);
        throw error;
      }
    } catch (err) {
      console.error('Erro ao excluir tarefa:', err);
    }
  };

  const pendingCount = tasks.filter(t => !t.completed).length;

  return (
    <div className="flex flex-col h-full bg-[#020617] border border-slate-800 rounded-sm overflow-hidden animate-in fade-in duration-500">
      {/* Header da View */}
      <div className="p-6 border-b border-slate-800 bg-black/20 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-black uppercase tracking-[0.4em] text-white flex items-center gap-3">
            <ListCheck className="text-blue-500" size={18} /> Central de Tarefas
          </h2>
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
            Fluxo operacional diário • {pendingCount} pendentes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-sm bg-slate-900 border border-slate-800 text-[9px] font-black text-slate-500 uppercase tracking-widest">
            Protocolo Ativo
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full p-8">
        {/* Input de Adição */}
        <form onSubmit={addTask} className="mb-10 relative group">
          <div className="absolute -inset-0.5 bg-blue-600 rounded-sm blur-sm opacity-0 group-focus-within:opacity-10 transition duration-500"></div>
          <div className="relative flex gap-2">
            <input 
              autoFocus
              className="flex-1 bg-slate-950 border border-slate-800 rounded-sm px-6 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700 shadow-sm"
              placeholder="O que precisa ser executado hoje?"
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

        {/* Lista de Tarefas */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 pb-10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-slate-700" size={32} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Sincronizando...</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-800/40 rounded-sm opacity-20">
              <Terminal size={40} className="text-slate-700 mb-4" />
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 text-center">Nenhuma tarefa pendente no diretório</p>
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
                      <CheckCircle size={20} strokeWidth={2.5} />
                    ) : (
                      <Circle size={20} strokeWidth={2.5} />
                    )}
                  </button>
                  <span className={`text-[13px] font-bold tracking-tight transition-all duration-500 ${
                    task.completed ? 'text-slate-600 line-through' : 'text-slate-300'
                  }`}>
                    {task.title}
                  </span>
                </div>
                <button 
                  onClick={() => deleteTask(task.id)}
                  className="text-slate-700 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-2 rounded-sm"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TasksView;
