
import React, { useState } from 'react';
import { Clock, CheckCircle2, PlayCircle, Ban, Edit2, Trash2, UserCheck, Zap, ListTodo, XCircle, GripVertical } from 'lucide-react';
import { DemandItem, DemandStatus, Priority, Difficulty } from '../types';

interface DemandCardProps {
  demand: DemandItem;
  isFocused?: boolean;
  onEdit?: (demand: DemandItem) => void;
  onDelete?: (id: string) => void;
  onManageSubs?: (demand: DemandItem) => void;
  onDropOnCard?: (draggedId: string, targetId: string) => void;
  isDraggable?: boolean;
}

const statusConfig: Record<DemandStatus, { label: string, color: string, icon: React.ReactNode }> = {
  OPEN: { label: 'ABERTA', color: 'text-blue-400 bg-blue-400/10', icon: <Clock size={10} /> },
  IN_PROGRESS: { label: 'EM CURSO', color: 'text-yellow-400 bg-yellow-400/10', icon: <PlayCircle size={10} /> },
  COMPLETED: { label: 'CONCLUÍDA', color: 'text-emerald-400 bg-emerald-400/10', icon: <CheckCircle2 size={10} /> },
  BLOCKED: { label: 'BLOQUEADA', color: 'text-rose-400 bg-rose-400/10', icon: <Ban size={10} /> },
  CANCELLED: { label: 'CANCELADA', color: 'text-slate-500 bg-slate-500/10', icon: <XCircle size={10} /> }
};

const priorityConfig: Record<Priority, { label: string, style: string }> = {
  HIGH: { label: 'ALTA', style: 'text-rose-500' },
  MEDIUM: { label: 'MÉDIA', style: 'text-yellow-500' },
  LOW: { label: 'BAIXA', style: 'text-slate-500' }
};

const DemandCard: React.FC<DemandCardProps> = ({ 
  demand, 
  isFocused = false,
  onEdit, 
  onDelete, 
  onManageSubs,
  onDropOnCard, 
  isDraggable 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const status = statusConfig[demand.status];
  const priority = priorityConfig[demand.priority];

  const totalSubs = demand.subActivities?.length || 0;
  const completedCount = demand.subActivities?.filter(s => s.completed).length || 0;
  
  const progress = totalSubs > 0 
    ? Math.round((completedCount / totalSubs) * 100)
    : (demand.status === 'COMPLETED' ? 100 : 0);

  const formatAccumulatedTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!isDraggable) return;
    const element = e.currentTarget as HTMLElement;
    e.dataTransfer.setData('demandId', demand.id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { if (element) element.style.opacity = '0.4'; }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    if (target) target.style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDraggable) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    if (!isDraggable) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const draggedId = e.dataTransfer.getData('demandId');
    if (draggedId && draggedId !== demand.id) onDropOnCard?.(draggedId, demand.id);
  };

  return (
    <div 
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group relative bg-[#04091a] border rounded-sm p-4 hover:border-slate-700 transition-all duration-300 flex flex-col h-[180px] w-full
        ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''} 
        ${isFocused ? 'border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/20' : 'border-[#1e293b]/30'}
        ${isDragOver ? 'border-blue-500 ring-1 ring-blue-500/30' : ''}
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
           <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase ${status.color}`}>
            <div className="w-2 h-2 rounded-full border border-current flex items-center justify-center">
              <div className="w-1 h-1 bg-current rounded-full" />
            </div>
            {status.label}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-600 tracking-wider">
            <span className="uppercase">{demand.id}</span>
            <GripVertical size={12} className="opacity-40" />
          </div>
          
          <div className="flex items-center gap-2">
             <button 
                onClick={(e) => { e.stopPropagation(); onEdit?.(demand); }} 
                className="p-1 hover:text-white text-slate-500 transition-colors"
             >
               <Edit2 size={14} strokeWidth={2.5} />
             </button>
             <button 
                onClick={(e) => { e.stopPropagation(); onDelete?.(demand.id); }} 
                className="w-7 h-7 rounded-[4px] border border-slate-800 bg-slate-900/50 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all"
             >
               <Trash2 size={14} strokeWidth={2.5} />
             </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <h3 className="text-[13px] font-black text-slate-100 mb-4 leading-tight tracking-tight line-clamp-2 uppercase">
          {demand.title}
        </h3>

        <div className="mb-3 space-y-1.5">
          <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-600">
            <span>Progresso</span>
            <span className="text-slate-300">{progress}%</span>
          </div>
          <div className="h-1 w-full bg-[#0a1226] rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
           <Clock size={12} className="text-blue-500" />
           <span className="tabular-nums">{formatAccumulatedTime(demand.pomodoros || 0)}</span>
        </div>
      </div>

      <div className="border-t border-slate-800/40 pt-3 mt-auto flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400 truncate">
          <UserCheck size={12} className="text-blue-500 flex-shrink-0" />
          <span className="truncate uppercase">{demand.responsible}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[9px] font-bold text-slate-600 uppercase">{demand.dueDate}</span>
          <span className={`text-[10px] font-black uppercase tracking-widest ${priority.style}`}>
            {priority.label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DemandCard;
