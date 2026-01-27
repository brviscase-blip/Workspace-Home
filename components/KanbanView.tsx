
import React, { useState } from 'react';
import { DemandItem, DemandStatus } from '../types';
import DemandCard from './DemandCard';
import { AlertCircle, PlayCircle, CheckCircle2, Ban, Plus } from 'lucide-react';

interface KanbanViewProps {
  demands: DemandItem[];
  onEdit: (demand: DemandItem) => void;
  onDelete: (id: string) => void;
  onMoveDemand: (id: string, newStatus: DemandStatus, targetId?: string) => void;
  onAddAtStatus?: (status: DemandStatus) => void;
  onManageSubs?: (demand: DemandItem) => void;
}

const COLUMNS: { status: DemandStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { status: 'OPEN', label: 'ABERTA', icon: <AlertCircle size={14} />, color: 'text-blue-400' },
  { status: 'IN_PROGRESS', label: 'EM CURSO', icon: <PlayCircle size={14} />, color: 'text-yellow-400' },
  { status: 'COMPLETED', label: 'CONCLUÍDA', icon: <CheckCircle2 size={14} />, color: 'text-emerald-400' },
  { status: 'BLOCKED', label: 'BLOQUEADA', icon: <Ban size={14} />, color: 'text-rose-400' },
];

const KanbanView: React.FC<KanbanViewProps> = ({ 
  demands, 
  onEdit, 
  onDelete, 
  onMoveDemand, 
  onAddAtStatus,
  onManageSubs
}) => {
  const [dragOverColumn, setDragOverColumn] = useState<DemandStatus | null>(null);

  const handleDragOverColumn = (e: React.DragEvent, status: DemandStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeaveColumn = () => {
    setDragOverColumn(null);
  };

  const handleDropOnColumn = (e: React.DragEvent, newStatus: DemandStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const demandId = e.dataTransfer.getData('demandId');
    if (demandId) {
      onMoveDemand(demandId, newStatus);
    }
  };

  const handleDropOnCard = (draggedId: string, targetId: string, status: DemandStatus) => {
    onMoveDemand(draggedId, status, targetId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 h-full select-none pb-2">
      {COLUMNS.map((column) => {
        const columnDemands = demands.filter((d) => d.status === column.status);
        const isOver = dragOverColumn === column.status;

        return (
          <div 
            key={column.status} 
            className="flex flex-col h-full min-w-0 bg-[#030712]/30 rounded-sm border border-slate-800/20 overflow-hidden"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between p-4 flex-shrink-0 border-b border-slate-800/40 bg-black/10">
              <div className="flex items-center gap-2">
                <span className={column.color}>{column.icon}</span>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-100">
                  {column.label}
                </h3>
                <span className="bg-slate-800 text-slate-400 text-[9px] px-2 py-0.5 rounded-full font-black">
                  {columnDemands.length}
                </span>
              </div>
              <button 
                onClick={() => onAddAtStatus?.(column.status)}
                className="text-slate-600 hover:text-white transition-colors p-1"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Column Content Area with Internal Scroll */}
            <div 
              onDragOver={(e) => handleDragOverColumn(e, column.status)}
              onDragLeave={handleDragLeaveColumn}
              onDrop={(e) => handleDropOnColumn(e, column.status)}
              className={`flex-1 min-h-0 flex flex-col transition-all duration-200 overflow-hidden ${isOver ? 'bg-blue-500/5' : ''}`}
            >
              <div className="flex-1 space-y-4 p-3 overflow-y-auto custom-scrollbar">
                {columnDemands.map((demand) => (
                  <DemandCard 
                    key={demand.id} 
                    demand={demand} 
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onManageSubs={onManageSubs}
                    onDropOnCard={(draggedId, targetId) => handleDropOnCard(draggedId, targetId, column.status)}
                    isDraggable={true}
                  />
                ))}
                
                {columnDemands.length === 0 && !isOver && (
                  <div className="h-24 border border-dashed border-slate-800/40 rounded-sm flex items-center justify-center opacity-40">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-700">Vazio</span>
                  </div>
                )}
              </div>
              
              <div className="p-3 flex-shrink-0 border-t border-slate-800/30 bg-black/10">
                <button 
                  onClick={() => onAddAtStatus?.(column.status)}
                  className="w-full py-3 rounded-sm border border-dashed border-slate-800 text-slate-600 hover:text-slate-400 hover:border-slate-700 hover:bg-slate-800/20 transition-all text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                >
                  + ITEM
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanView;
