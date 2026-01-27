
import React from 'react';
import { Play, Pause, X, UserCheck, CheckCircle, Clock } from 'lucide-react';
import { DemandItem, Priority, Difficulty } from '../types';

interface FocusCardProps {
  demand: DemandItem;
  now: number;
  onToggleTimer: () => void;
  onRemove: (id: string) => void;
  onFinishSession: (id: string) => void;
  onComplete: (id: string) => void;
}

const priorityConfig: Record<Priority, { label: string, style: string }> = {
  HIGH: { label: 'ALTA', style: 'text-rose-500 border-rose-500/30 bg-rose-500/5' },
  MEDIUM: { label: 'MÉDIA', style: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/5' },
  LOW: { label: 'BAIXA', style: 'text-slate-500 border-slate-500/30 bg-slate-500/5' }
};

const FocusCard: React.FC<FocusCardProps> = ({ 
  demand, 
  now,
  onToggleTimer, 
  onRemove, 
  onFinishSession
}) => {
  const priority = priorityConfig[demand.priority];

  const currentSessionSeconds = (demand.isTimerRunning && demand.timerStartedAt)
    ? Math.max(0, Math.floor((now - new Date(demand.timerStartedAt).getTime()) / 1000))
    : 0;

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`group relative bg-[#030712] border-2 rounded-sm p-4 flex flex-col h-[340px] w-full transition-all duration-500 shadow-2xl overflow-hidden ${demand.isTimerRunning ? 'border-blue-500 shadow-blue-500/30 ring-1 ring-blue-500/20' : 'border-slate-800'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest bg-slate-900 px-1.5 py-0.5 rounded-sm border border-slate-800">
            {demand.id}
          </span>
          <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-blue-400">
            <div className={`w-1 h-1 rounded-full ${demand.isTimerRunning ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'}`} />
            {demand.isTimerRunning ? 'Sincronizado' : 'Pausado'}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onFinishSession(demand.id)}
            className="text-slate-600 hover:text-emerald-400 transition-colors p-1"
            title="Finalizar e Acumular"
          >
            <CheckCircle size={14} />
          </button>
          <button 
            onClick={() => onRemove(demand.id)}
            className="text-slate-600 hover:text-rose-500 transition-colors p-1"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Título e Responsável */}
      <div className="mb-2">
        <h3 className="text-[12px] font-black text-white uppercase tracking-tight mb-2 line-clamp-1 border-l-2 border-blue-500 pl-2">
          {demand.title}
        </h3>
        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase truncate">
          <UserCheck size={11} className="text-blue-500 flex-shrink-0" />
          <span className="text-blue-400 truncate">{demand.responsible}</span>
        </div>
      </div>

      {/* Cronômetro */}
      <div className={`flex-1 flex flex-col justify-center items-center rounded-sm border transition-all my-1 py-2 ${demand.isTimerRunning ? 'bg-blue-500/5 border-blue-500/20' : 'bg-black/20 border-slate-800/30'}`}>
        <div className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1.5">Contador Realtime</div>
        <div className="relative mb-2 text-center">
          <div className={`text-2xl font-black tabular-nums tracking-tighter transition-colors ${demand.isTimerRunning ? 'text-white' : 'text-slate-500'}`}>
            {formatTime(currentSessionSeconds)}
          </div>
        </div>

        <button 
          onClick={onToggleTimer}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-xl ${demand.isTimerRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-500'} text-white`}
        >
          {demand.isTimerRunning ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" className="ml-1" />}
        </button>
      </div>

      {/* Rodapé */}
      <div className="mt-auto pt-2 border-t border-slate-800/50 flex items-center justify-between">
         <div className="flex gap-2">
           <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border ${priority.style}`}>
             PRIORIDADE {priority.label}
           </span>
         </div>
         <div className="flex items-center gap-1.5 text-blue-400">
            <Clock size={11} />
            <span className="text-[9px] font-black tabular-nums">
               {Math.floor((demand.pomodoros || 0) / 60)} min acumulados
            </span>
         </div>
      </div>
    </div>
  );
};

export default FocusCard;
