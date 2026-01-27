
import React, { useMemo } from 'react';
import { DemandItem, DemandStatus, Priority } from '../types';
import { Clock, CheckCircle2, User, PlayCircle, Ban, XCircle, Calendar, Zap, Timer } from 'lucide-react';

interface WeeklyViewProps {
  demands: DemandItem[];
  onEdit: (demand: DemandItem) => void;
}

const statusConfig: Record<DemandStatus, { color: string }> = {
  OPEN: { color: 'bg-blue-500' },
  IN_PROGRESS: { color: 'bg-yellow-500' },
  COMPLETED: { color: 'bg-emerald-500' },
  BLOCKED: { color: 'bg-rose-500' },
  CANCELLED: { color: 'bg-slate-500' }
};

const WeeklyView: React.FC<WeeklyViewProps> = ({ demands, onEdit }) => {
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}h`;
  };

  const getInitials = (name: string | null) => {
    if (!name) return '??';
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const parseDate = (dateStr: string): Date | null => {
    const months: Record<string, number> = {
      'Jan': 0, 'Fev': 1, 'Mar': 2, 'Abr': 3, 'Mai': 4, 'Jun': 5,
      'Jul': 6, 'Ago': 7, 'Set': 8, 'Out': 9, 'Nov': 10, 'Dez': 11
    };
    try {
      const parts = dateStr.replace(',', '').split(' ');
      if (parts.length < 3) return null;
      const day = parseInt(parts[0]);
      const month = months[parts[1]] ?? 0;
      const year = parseInt(parts[2]);
      return new Date(year, month, day);
    } catch {
      return null;
    }
  };

  const weekDates = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diffToMonday));
    monday.setHours(0, 0, 0, 0);

    return [0, 1, 2, 3, 4].map(offset => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + offset);
      return date;
    });
  }, []);

  const weekDays = [
    { name: 'Segunda', id: 1, date: weekDates[0] },
    { name: 'Terça', id: 2, date: weekDates[1] },
    { name: 'Quarta', id: 3, date: weekDates[2] },
    { name: 'Quinta', id: 4, date: weekDates[3] },
    { name: 'Sexta', id: 5, date: weekDates[4] },
  ];

  const groupedDemands = useMemo(() => {
    const groups: Record<number, DemandItem[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    demands.forEach(demand => {
      const startDate = parseDate(demand.startDate);
      const dueDate = parseDate(demand.dueDate);
      if (!startDate) return;

      weekDays.forEach(day => {
        const currentDayDate = day.date;
        const isAfterStart = currentDayDate >= startDate;
        const isBeforeEnd = dueDate ? currentDayDate <= dueDate : true;
        const isActiveOnDay = demand.status === 'COMPLETED' ? (isAfterStart && isBeforeEnd) : isAfterStart;
        if (isActiveOnDay) groups[day.id].push(demand);
      });
    });
    return groups;
  }, [demands, weekDays]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="flex gap-4 h-full w-full overflow-x-auto custom-scrollbar pb-6 select-none px-0">
      {weekDays.map((day) => {
        const dayDemands = groupedDemands[day.id] || [];
        const isToday = day.date.getTime() === today.getTime();
        const dateStr = day.date.toISOString().split('T')[0];

        return (
          <div key={day.id} className={`flex flex-col flex-1 min-w-[280px] h-full bg-[#030712]/40 border rounded-sm transition-all duration-500 ${isToday ? 'border-blue-500/40 bg-blue-500/5 ring-1 ring-blue-500/10' : 'border-slate-800/40'}`}>
            <div className={`p-4 border-b flex items-center justify-between flex-shrink-0 ${isToday ? 'border-blue-500/20 bg-blue-500/10' : 'border-slate-800/40 bg-black/30'}`}>
              <div className="flex flex-col">
                <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] ${isToday ? 'text-blue-400' : 'text-slate-100'}`}>{day.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{day.date.getDate().toString().padStart(2, '0')}/{(day.date.getMonth() + 1).toString().padStart(2, '0')}</span>
                  <span className="text-[8px] font-black text-slate-700">•</span>
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{dayDemands.length} Atividades</span>
                </div>
              </div>
              {isToday && <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-600 rounded-sm text-[8px] font-black text-white uppercase tracking-widest shadow-lg shadow-blue-500/20"><Calendar size={10} /> Hoje</div>}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 bg-[#020617]/20">
              {dayDemands.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-10 py-10"><Clock size={32} className="text-slate-500 mb-3" /><p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Sem Atividade</p></div>
              ) : (
                dayDemands.map((demand) => {
                  const dayDuration = demand.dailyLogs?.[dateStr] || 0;
                  return (
                    <div key={`${day.id}-${demand.id}`} onClick={() => onEdit(demand)} className="group bg-[#04091a] border border-slate-800/60 p-3 rounded-sm hover:border-blue-500/50 hover:bg-slate-800/50 transition-all cursor-pointer relative overflow-hidden shadow-sm">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusConfig[demand.status].color} opacity-80`} />
                      
                      {/* Header do Card */}
                      <div className="flex justify-between items-center mb-3 pl-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{demand.id}</span>
                          <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-sm bg-blue-600/10 border border-blue-500/30">
                            <span className="text-[8px] font-black text-blue-400 uppercase leading-none">{getInitials(demand.responsible)}</span>
                          </div>
                        </div>
                        {dayDuration > 0 && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-emerald-500/10 border border-emerald-500/30">
                             <Timer size={10} className="text-emerald-500" />
                             <span className="text-[9px] font-black text-emerald-400 tabular-nums">{formatTime(dayDuration)}</span>
                          </div>
                        )}
                      </div>

                      <h4 className="text-[11px] font-black text-slate-300 uppercase tracking-tight mb-4 line-clamp-2 pl-2 group-hover:text-blue-400 transition-colors leading-tight">{demand.title}</h4>

                      <div className="pl-2 mb-4">
                        <div className="h-0.5 w-full bg-slate-900 rounded-full overflow-hidden">
                           <div className={`h-full bg-blue-500 transition-all duration-500 ${demand.status === 'COMPLETED' ? 'bg-emerald-500' : ''}`} style={{ width: dayDuration > 0 ? '100%' : '0%' }} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-1 pl-2 border-t border-slate-800/40 pt-3">
                         <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-blue-400 uppercase">
                               <User size={10} />
                               <span className="truncate max-w-[140px]">{demand.responsible}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500">
                               <Zap size={10} className="text-blue-500 opacity-70" />
                               <span className="uppercase tracking-tighter">TOTAL: {formatTime(demand.pomodoros)}</span>
                            </div>
                         </div>
                         <div className="flex items-center opacity-80 group-hover:opacity-100 transition-opacity">
                           {demand.status === 'COMPLETED' ? <CheckCircle2 size={12} className="text-emerald-500" /> : demand.status === 'IN_PROGRESS' ? <PlayCircle size={12} className="text-yellow-500" /> : <Clock size={12} className="text-blue-500" />}
                         </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WeeklyView;
