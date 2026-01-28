
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Trash2, CheckCircle, Circle, Terminal, ListCheck, Loader2, Target, 
  CalendarDays, CheckCircle2, LayoutGrid, ClipboardEdit, Edit2, Check, X, 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Zap, Activity, Flame,
  Settings2, AlertTriangle, Book, Dumbbell, Droplets, Brain, Timer, Heart, 
  Smile, Coffee, Laptop, ShieldCheck, Stars, Calendar
} from 'lucide-react';
import { DailyTask } from '../types';
import { supabase } from '../lib/supabase';

interface TasksViewProps { currentUser: string; }

type SubTab = 'CALENDARIO' | 'HOJE' | 'HABITOS' | 'CADASTRO';

interface Habit {
  id: string;
  title: string;
  days: boolean[]; // 7 dias da semana
  streak: number;
  iconName: string;
  color: string;
  startDate: string;
}

// Mapa de ícones disponíveis para seleção
const HABIT_ICONS = [
  { name: 'Activity', icon: Activity },
  { name: 'Book', icon: Book },
  { name: 'Dumbbell', icon: Dumbbell },
  { name: 'Droplets', icon: Droplets },
  { name: 'Brain', icon: Brain },
  { name: 'Timer', icon: Timer },
  { name: 'Heart', icon: Heart },
  { name: 'Smile', icon: Smile },
  { name: 'Coffee', icon: Coffee },
  { name: 'Laptop', icon: Laptop },
  { name: 'ShieldCheck', icon: ShieldCheck },
  { name: 'Stars', icon: Stars },
];

// Cores operacionais consistentes
const HABIT_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Slate', value: '#64748b' },
];

// --- COMPONENTE DATE PICKER CUSTOMIZADO ---
interface CustomDatePickerProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ label, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const fullMonths = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateLabel = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  const days = [];
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const handleSelectDay = (day: number) => {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange(formatDateLabel(selected));
    setIsOpen(false);
  };

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-950 border rounded-sm px-4 py-3 text-sm flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'border-blue-500 ring-1 ring-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'border-slate-800 hover:border-slate-700'}`}
      >
        <span className={value ? 'text-white font-bold' : 'text-slate-700'}>{value || placeholder}</span>
        <CalendarIcon size={16} className={value ? 'text-blue-500' : 'text-slate-600'} />
      </div>
      {isOpen && (
        <div className="absolute z-[6000] left-0 mt-1 w-full min-w-[260px] bg-[#030712] border border-slate-800 rounded-sm shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200 overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-black/40">
            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-sm transition-all"><ChevronLeft size={16} /></button>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-white uppercase tracking-widest">{fullMonths[viewDate.getMonth()]}</span>
              <span className="text-[9px] font-bold text-slate-500">{viewDate.getFullYear()}</span>
            </div>
            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-sm transition-all"><ChevronRight size={16} /></button>
          </div>
          <div className="p-2">
            <div className="grid grid-cols-7 mb-1">{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (<span key={i} className="text-center text-[8px] font-black text-slate-700 uppercase py-1">{d}</span>))}</div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} className="w-full h-full" />;

                const isToday = 
                  day === new Date().getDate() && 
                  viewDate.getMonth() === new Date().getMonth() && 
                  viewDate.getFullYear() === new Date().getFullYear();

                const isSelected = 
                  value.startsWith(day.toString().padStart(2, '0')) && 
                  value.includes(months[viewDate.getMonth()]) &&
                  value.includes(viewDate.getFullYear().toString());

                return (
                  <div key={i} className="aspect-square flex items-center justify-center">
                    <button 
                      type="button" 
                      onClick={() => handleSelectDay(day)} 
                      className={`w-full h-full rounded-sm text-[10px] font-bold transition-all flex flex-col items-center justify-center relative overflow-hidden ${
                        isSelected 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 z-10' 
                          : isToday
                            ? 'bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-500/50'
                            : 'text-slate-500 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {day}
                      {isToday && !isSelected && (
                        <div className="absolute bottom-1 w-1 h-1 bg-blue-500 rounded-full" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Footer Informativo */}
          <div className="p-2 border-t border-slate-800/50 bg-black/20 flex justify-center">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full ring-1 ring-blue-500/50 bg-blue-500/10" />
                <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Indicador do Dia Atual</span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TasksView: React.FC<TasksViewProps> = ({ currentUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('HOJE');
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [calendarTasks, setCalendarTasks] = useState<DailyTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // Estados para o Modal de Hábito
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitStartDate, setNewHabitStartDate] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Activity');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  // Estado para Confirmação de Exclusão
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  
  // Estado para o Calendário
  const [viewDate, setViewDate] = useState(new Date());

  // Mock de hábitos
  const [habits, setHabits] = useState<Habit[]>([
    { id: 'h1', title: 'Leitura Técnica', days: [true, true, true, false, false, false, false], streak: 3, iconName: 'Book', color: '#3b82f6', startDate: '01 Jan, 2026' },
    { id: 'h2', title: 'Atividade Física', days: [true, false, true, false, true, false, false], streak: 1, iconName: 'Dumbbell', color: '#10b981', startDate: '15 Jan, 2026' },
    { id: 'h3', title: 'Meditação Protocolar', days: [true, true, true, true, true, true, false], streak: 6, iconName: 'Brain', color: '#8b5cf6', startDate: '05 Jan, 2026' },
    { id: 'h4', title: 'Beber Água', days: [false, false, false, false, false, false, false], streak: 0, iconName: 'Droplets', color: '#06b6d4', startDate: '20 Jan, 2026' },
  ]);

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
      .channel('tasks-realtime-v7')
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

  const handleSaveHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim() || !newHabitStartDate) return;

    if (editingHabit) {
      setHabits(prev => prev.map(h => 
        h.id === editingHabit.id 
        ? { ...h, title: newHabitTitle.trim(), iconName: selectedIcon, color: selectedColor, startDate: newHabitStartDate } 
        : h
      ));
    } else {
      const newHabit: Habit = {
        id: `h-${Date.now()}`,
        title: newHabitTitle.trim(),
        days: [false, false, false, false, false, false, false],
        streak: 0,
        iconName: selectedIcon,
        color: selectedColor,
        startDate: newHabitStartDate
      };
      setHabits(prev => [...prev, newHabit]);
    }

    setNewHabitTitle('');
    setNewHabitStartDate('');
    setEditingHabit(null);
    setIsHabitModalOpen(false);
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

  const toggleHabitDay = (habitId: string, dayIndex: number) => {
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        const newDays = [...h.days];
        newDays[dayIndex] = !newDays[dayIndex];
        return { ...h, days: newDays };
      }
      return h;
    }));
  };

  const confirmDeleteHabit = () => {
    if (habitToDelete) {
      setHabits(prev => prev.filter(h => h.id !== habitToDelete.id));
      setHabitToDelete(null);
    }
  };

  const HabitIcon = ({ name, color, size = 20 }: { name: string, color: string, size?: number }) => {
    const iconObj = HABIT_ICONS.find(i => i.name === name) || HABIT_ICONS[0];
    const IconComponent = iconObj.icon;
    return <IconComponent size={size} style={{ color }} />;
  };

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
  const weekDaysShort = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

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
            onClick={() => setActiveSubTab('HABITOS')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${
              activeSubTab === 'HABITOS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Zap size={14} /> Hábitos
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

      <div className="flex-1 flex flex-col overflow-hidden w-full px-8 pt-8 pb-12">
        
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
              <div className="mb-4"><span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Performance Diária</span></div>
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

        {activeSubTab === 'HABITOS' && (
          <div className="flex flex-col h-full animate-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Monitor de Rotinas</span>
                <p className="text-[11px] font-bold text-slate-500 uppercase mt-1">Consistência Operacional Semanal</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-sm">
                  <Flame size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-black text-emerald-400 uppercase">Foco Ativo</span>
                </div>
              </div>
            </div>

            <div className="mb-8 flex justify-start">
              <button 
                onClick={() => {
                  setEditingHabit(null);
                  setNewHabitTitle('');
                  setNewHabitStartDate('');
                  setSelectedIcon('Activity');
                  setSelectedColor('#3b82f6');
                  setIsHabitModalOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-sm border border-dashed border-blue-500/30 bg-blue-500/5 text-blue-400 hover:border-blue-500 hover:bg-blue-500/10 transition-all text-[10px] font-black uppercase tracking-[0.2em] group shadow-xl"
              >
                <Plus size={14} className="group-hover:scale-125 transition-transform" />
                Registrar Novo Hábito
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2 pb-10">
              {habits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-800/40 rounded-sm opacity-20">
                  <Activity size={40} className="text-slate-700 mb-4" />
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 text-center">Nenhum hábito configurado</p>
                </div>
              ) : (
                habits.map(habit => (
                  <div key={habit.id} className="bg-slate-900/30 border border-slate-800 rounded-sm p-6 hover:border-slate-700 transition-all group shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4 min-w-[200px]">
                        <div 
                          className="w-10 h-10 rounded-sm border flex items-center justify-center transition-all"
                          style={{ 
                            backgroundColor: `${habit.color}10`, 
                            borderColor: `${habit.color}30`,
                            boxShadow: `0 0 10px ${habit.color}10`
                          }}
                        >
                          <HabitIcon name={habit.iconName} color={habit.color} />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-[13px] font-black text-white uppercase tracking-tight">{habit.title}</h4>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-2">
                              <Flame size={10} className="text-orange-500" />
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{habit.streak} Dias</span>
                            </div>
                            <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
                              <Calendar size={10} className="text-slate-600" />
                              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{habit.startDate}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 grid grid-cols-7 gap-2 max-w-md">
                        {habit.days.map((done, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-2">
                            <span className="text-[8px] font-black text-slate-600 tracking-tighter">{weekDaysShort[idx]}</span>
                            <button 
                              onClick={() => toggleHabitDay(habit.id, idx)}
                              className={`w-full aspect-square rounded-sm border transition-all flex items-center justify-center ${
                                done 
                                  ? 'shadow-[0_0_15px_rgba(59,130,246,0.3)] text-white' 
                                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                              }`}
                              style={{ 
                                backgroundColor: done ? habit.color : '',
                                borderColor: done ? habit.color : ''
                              }}
                            >
                              {done && <Check size={14} strokeWidth={4} />}
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-6 min-w-[150px] justify-end">
                        <div className="text-right mr-2">
                          <span className="text-2xl font-black text-white tabular-nums">
                            {Math.round((habit.days.filter(d => d).length / 7) * 100)}%
                          </span>
                          <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Aderência</p>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => {
                              setEditingHabit(habit);
                              setNewHabitTitle(habit.title);
                              setNewHabitStartDate(habit.startDate);
                              setSelectedIcon(habit.iconName);
                              setSelectedColor(habit.color);
                              setIsHabitModalOpen(true);
                            }}
                            className="p-2 text-slate-600 hover:text-blue-400 hover:bg-blue-400/10 rounded-sm"
                            title="Editar Hábito"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => setHabitToDelete(habit)}
                            className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-sm"
                            title="Remover Hábito"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'CALENDARIO' && (
          <div className="flex-1 flex flex-col animate-in zoom-in-95 duration-500 overflow-hidden">
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

            <div className="flex-1 grid grid-cols-7 border-t border-l border-slate-800 overflow-hidden bg-slate-950/20 rounded-sm">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(d => (
                <div key={d} className="p-3 border-r border-b border-slate-800 bg-black/40 text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{d}</span>
                </div>
              ))}
              
              {calendarDays.map((day, idx) => {
                const isToday = day && day === new Date().getDate() && viewDate.getMonth() === new Date().getMonth() && viewDate.getFullYear() === new Date().getFullYear();
                
                const dayTasks = day ? calendarTasks.filter(t => {
                  const d = new Date(t.created_at);
                  return d.getDate() === day && d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear();
                }) : [];

                return (
                  <div 
                    key={idx} 
                    className={`min-h-[80px] border-r border-b border-slate-800 p-2 transition-all group overflow-hidden ${
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

      {/* MODAL DE CADASTRO/EDIÇÃO DE HÁBITO */}
      {isHabitModalOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 px-4">
          <div className="bg-[#030712] border border-slate-800 rounded-sm w-full max-w-lg shadow-2xl animate-in zoom-in duration-300 overflow-visible">
            <div className="p-6 border-b border-slate-800 bg-black/20 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                   <Zap size={14} className="text-blue-500" /> Protocolo de Rotina
                </h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  {editingHabit ? 'Atualizar parâmetros da rotina' : 'Configurar novo hábito operacional'}
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsHabitModalOpen(false);
                  setEditingHabit(null);
                }}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveHabit} className="p-6 space-y-8">
              {/* Título */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Identificação da Rotina</label>
                <div className="relative group">
                   <Settings2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-colors" size={16} />
                   <input 
                      autoFocus
                      required
                      placeholder="Ex: Leitura de Logs de Segurança..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-sm py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-slate-800"
                      value={newHabitTitle}
                      onChange={e => setNewHabitTitle(e.target.value)}
                   />
                </div>
              </div>

              {/* Data de Início Customizada */}
              <CustomDatePicker 
                label="Data do Início (Marco Zero)"
                placeholder="Selecione a data de ativação..."
                value={newHabitStartDate}
                onChange={setNewHabitStartDate}
              />

              {/* Seletor de Ícones */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Assinatura Visual (Ícone)</label>
                <div className="grid grid-cols-6 gap-2">
                  {HABIT_ICONS.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = selectedIcon === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setSelectedIcon(item.name)}
                        className={`aspect-square rounded-sm border flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-blue-600/20 border-blue-500 text-blue-400 scale-110 shadow-lg' 
                            : 'bg-slate-950 border-slate-800 text-slate-600 hover:border-slate-600 hover:text-slate-400'
                        }`}
                        title={item.name}
                      >
                        <IconComp size={20} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seletor de Cores */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Cromatismo Operacional (Cor)</label>
                <div className="flex flex-wrap gap-3">
                  {HABIT_COLORS.map((color) => {
                    const isSelected = selectedColor === color.value;
                    return (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setSelectedColor(color.value)}
                        className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                          isSelected ? 'border-white scale-125 shadow-xl' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color.value }}
                      >
                        {isSelected && <Check size={14} className="text-white drop-shadow-md" strokeWidth={4} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-sm flex items-start gap-4">
                 <div className="w-12 h-12 rounded-sm border flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${selectedColor}15`, borderColor: `${selectedColor}40` }}>
                    <HabitIcon name={selectedIcon} color={selectedColor} size={24} />
                 </div>
                 <div className="flex-1 min-w-0">
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1">Resumo do Protocolo</span>
                    <p className="text-[11px] text-slate-200 font-bold uppercase truncate">
                       {newHabitTitle || 'Aguardando título...'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                       <Calendar size={10} className="text-slate-600" />
                       <span className="text-[9px] font-black text-slate-500 uppercase">{newHabitStartDate || 'Data não definida'}</span>
                    </div>
                 </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setIsHabitModalOpen(false);
                    setEditingHabit(null);
                  }}
                  className="flex-1 px-4 py-3 border border-slate-800 rounded-sm text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={!newHabitTitle.trim() || !newHabitStartDate}
                  className="flex-1 px-4 py-3 bg-blue-600 rounded-sm text-[10px] font-black uppercase tracking-widest text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-30"
                >
                  {editingHabit ? 'Salvar Alterações' : 'Ativar Hábito'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {habitToDelete && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 px-4" onClick={() => setHabitToDelete(null)}>
          <div 
            className="bg-[#030712] border border-rose-500/30 rounded-sm w-full max-w-sm p-8 shadow-2xl shadow-rose-500/10 animate-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20">
                <AlertTriangle size={32} className="text-rose-500 animate-pulse" />
              </div>
              <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-white mb-2">Protocolo de Exclusão</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-8 leading-relaxed">
                Confirmar remoção permanente do hábito <span className="text-rose-400">"{habitToDelete.title}"</span>? Esta ação não pode ser revertida.
              </p>
              
              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => setHabitToDelete(null)}
                  className="flex-1 px-4 py-3 border border-slate-800 rounded-sm text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
                >
                  Abortar
                </button>
                <button 
                  onClick={confirmDeleteHabit}
                  className="flex-1 px-4 py-3 bg-rose-600 rounded-sm text-[10px] font-black uppercase tracking-widest text-white hover:bg-rose-500 shadow-lg shadow-rose-500/20 transition-all"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksView;
