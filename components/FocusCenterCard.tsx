import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw, Target, Zap, Settings2, Plus, X } from 'lucide-react';
import { DemandItem } from '../types';

interface FocusCenterCardProps {
  focusedDemands: DemandItem[];
  onOpenManagement: () => void;
  onPomodoroFinish: (demandId: string) => void;
}

interface PomodoroTimerState {
  timeLeft: number;
  isActive: boolean;
}

const FocusCenterCard: React.FC<FocusCenterCardProps> = ({ focusedDemands, onOpenManagement, onPomodoroFinish }) => {
  // Estado dos timers individuais para cada demanda focada
  const [timers, setTimers] = useState<Record<string, PomodoroTimerState>>({});

  useEffect(() => {
    // Inicializa timers para novas demandas focadas
    const newTimers = { ...timers };
    let changed = false;
    focusedDemands.forEach(d => {
      if (!newTimers[d.id]) {
        newTimers[d.id] = { timeLeft: 25 * 60, isActive: false };
        changed = true;
      }
    });
    // Remove timers de demandas que não estão mais focadas
    Object.keys(timers).forEach(id => {
      if (!focusedDemands.find(d => d.id === id)) {
        delete newTimers[id];
        changed = true;
      }
    });
    if (changed) setTimers(newTimers);
  }, [focusedDemands]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimers(prev => {
        const next = { ...prev };
        let updated = false;
        Object.keys(next).forEach(id => {
          if (next[id].isActive && next[id].timeLeft > 0) {
            next[id] = { ...next[id], timeLeft: next[id].timeLeft - 1 };
            updated = true;
          } else if (next[id].isActive && next[id].timeLeft === 0) {
            next[id] = { ...next[id], isActive: false, timeLeft: 25 * 60 };
            onPomodoroFinish(id);
            updated = true;
          }
        });
        return updated ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onPomodoroFinish]);

  const toggleTimer = (id: string) => {
    setTimers(prev => ({
      ...prev,
      [id]: { ...prev[id], isActive: !prev[id].isActive }
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fix: Cast Object.values to PomodoroTimerState[] to resolve the 'unknown' type error on isActive property
  const anyActive = (Object.values(timers) as PomodoroTimerState[]).some(t => t.isActive);

  return (
    <div className={`group relative bg-[#030712] border-2 rounded-sm p-5 flex flex-col h-[280px] w-full transition-all duration-500 shadow-2xl ${anyActive ? 'border-blue-500 shadow-blue-500/20' : 'border-slate-800'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2">
          <Target size={14} /> Mission Control
        </h3>
        <button 
          onClick={onOpenManagement}
          className="text-slate-500 hover:text-white transition-colors p-1"
          title="Gerenciar Foco"
        >
          <Settings2 size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {focusedDemands.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full border border-dashed border-slate-800 flex items-center justify-center mb-4 group-hover:border-blue-500/50 transition-colors">
               <Plus size={24} className="text-slate-800 group-hover:text-blue-500/50" />
            </div>
            <button 
              onClick={onOpenManagement}
              className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-400 transition-colors"
            >
              Configurar Sessão de Foco
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1">
            {focusedDemands.map(d => {
              const timer = timers[d.id] || { timeLeft: 25 * 60, isActive: false };
              return (
                <div key={d.id} className={`flex items-center justify-between p-3 rounded-sm border transition-all ${timer.isActive ? 'bg-blue-500/10 border-blue-500/40 shadow-lg' : 'bg-slate-900/40 border-slate-800/60'}`}>
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-[9px] font-black text-slate-200 truncate uppercase tracking-tighter">{d.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[12px] font-black text-white tabular-nums">{formatTime(timer.timeLeft)}</span>
                      {timer.isActive && <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-1000" 
                          style={{ width: `${(timer.timeLeft / (25 * 60)) * 100}%` }}
                        />
                      </div>}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => toggleTimer(d.id)}
                    className={`flex-shrink-0 p-2 rounded-full transition-all ${timer.isActive ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                  >
                    {timer.isActive ? <Pause size={12} fill="white" /> : <Play size={12} fill="white" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {focusedDemands.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/50 flex justify-between items-center">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Ativos: {focusedDemands.length}</span>
          <button 
            onClick={onOpenManagement}
            className="text-[8px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest"
          >
            Editar Seleção
          </button>
        </div>
      )}
    </div>
  );
};

export default FocusCenterCard;