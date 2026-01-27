
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

    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_tasks' }, fetchTasks)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const { error } = await supabase.from('daily_tasks').insert([{
        title: newTaskTitle.trim(),
        user_name: currentUser,
        completed: false
      }]);

      if (error) throw error;
      setNewTaskTitle('');
      fetchTasks();
    } catch (err) {
      console.error('Erro ao adicionar tarefa:', err);
    }
  };

  const toggleTask = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('daily_tasks')
        .update({ completed: !completed })
        .eq('id', id);

      if (error) throw error;
      fetchTasks();
    } catch (err) {
      console.error('Erro ao atualizar tarefa:', err);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('daily_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchTasks();
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
          <div className="px-3 py-1 rounded-sm bg-blue-600/10 border border-blue-500/30 text-[9px] font-black text-blue-400 uppercase tracking-widest">
            Sincronizado
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full p-8">
        {/* Input de Adição */}
        <form onSubmit={addTask} className="mb-10 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-sm blur opacity-10 group-focus-within:opacity-30 transition duration-500"></div>
          <div className="relative flex gap-2">
            <input 
              autoFocus
              className="flex-1 bg-slate-900 border border-slate-800 rounded-sm px-6 py-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-700 shadow-xl"
              placeholder="O que precisa ser executado hoje? (Pressione Enter)"
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
            />
            <button 
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="bg-blue-600 px-6 rounded-sm text-white hover:bg-blue-500 transition-all disabled:opacity-50 flex items-center justify-center shadow-lg shadow-blue-500/20"
            >
              <Plus size={20} strokeWidth={3} />
            </button>
          </div>
        </form>

        {/* Lista de Tarefas */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 pb-10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-blue-500" size={32} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Acessando Banco de Dados...</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800/40 rounded-sm opacity-30">
              <Terminal size={40} className="text-slate-700 mb-4" />
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600">Nenhum registro no radar operacional</p>
            </div>
          ) : (
            tasks.map(task => (
              <div 
                key={task.id}
                className={`group flex items-center justify-between p-4 bg-slate-900/30 border rounded-sm transition-all duration-300 hover:shadow-xl hover:shadow-black/40 ${
                  task.completed ? 'border-emerald-500/10 opacity-50' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-5 flex-1 mr-4">
                  <button 
                    onClick={() => toggleTask(task.id, task.completed)}
                    className={`flex-shrink-0 transition-all duration-300 transform active:scale-75 ${
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
                    task.completed ? 'text-slate-500 line-through' : 'text-slate-200'
                  }`}>
                    {task.title}
                  </span>
                </div>
                <button 
                  onClick={() => deleteTask(task.id)}
                  className="text-slate-800 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-rose-500/5 rounded-sm"
                >
                  <Trash2 size={16} />
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