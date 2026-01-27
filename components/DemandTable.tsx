
import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, PlayCircle, Ban, Edit2, Trash2, UserCheck, FileText, Calendar, Zap, ListTodo, User, Plus, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { DemandItem, DemandStatus, Priority, Difficulty } from '../types';

interface DemandTableProps {
  demands: DemandItem[];
  onEdit: (demand: DemandItem) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onManageSubs?: (demand: DemandItem) => void;
}

interface ContextMenuState {
  mouseX: number;
  mouseY: number;
  demand: DemandItem | null;
}

const statusConfig: Record<DemandStatus, { label: string, color: string, icon: React.ReactNode }> = {
  OPEN: { label: 'Aberta', color: 'text-blue-400 bg-blue-400/10', icon: <AlertCircle size={10} /> },
  IN_PROGRESS: { label: 'Em Curso', color: 'text-yellow-400 bg-yellow-400/10', icon: <PlayCircle size={10} /> },
  COMPLETED: { label: 'Concluída', color: 'text-emerald-400 bg-emerald-400/10', icon: <CheckCircle2 size={10} /> },
  BLOCKED: { label: 'Bloqueada', color: 'text-rose-400 bg-rose-400/10', icon: <Ban size={10} /> },
  CANCELLED: { label: 'Cancelada', color: 'text-slate-500 bg-slate-500/10', icon: <XCircle size={10} /> }
};

const priorityConfig: Record<Priority, { label: string, style: string }> = {
  HIGH: { label: 'ALTA', style: 'text-rose-500' },
  MEDIUM: { label: 'MÉDIA', style: 'text-yellow-500' },
  LOW: { label: 'BAIXA', style: 'text-slate-500' }
};

const DemandTable: React.FC<DemandTableProps> = ({ demands, onEdit, onDelete, onAdd, onManageSubs }) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [demandToDelete, setDemandToDelete] = useState<DemandItem | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent, demand: DemandItem) => {
    e.preventDefault();
    setContextMenu({
      mouseX: e.clientX,
      mouseY: e.clientY,
      demand
    });
  };

  const closeMenu = () => setContextMenu(null);

  useEffect(() => {
    const handleClick = () => closeMenu();
    const handleKeyDown = (e: KeyboardEvent) => { 
      if (e.key === 'Escape') {
        closeMenu();
        setDemandToDelete(null);
      }
    };
    
    if (contextMenu || demandToDelete) {
      window.addEventListener('click', handleClick);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu, demandToDelete]);

  const calculateProgress = (demand: DemandItem) => {
    const totalSubs = demand.subActivities?.length || 0;
    if (totalSubs > 0) {
      const completedSubs = demand.subActivities.filter(s => s.completed).length;
      return Math.round((completedSubs / totalSubs) * 100);
    }
    return demand.status === 'COMPLETED' ? 100 : 0;
  };

  const formatAccumulatedTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const confirmDelete = () => {
    if (demandToDelete) {
      onDelete(demandToDelete.id);
      setDemandToDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-start">
        <button 
          onClick={onAdd}
          className="flex items-center gap-2 px-6 py-2.5 rounded-sm border border-dashed border-blue-500/30 bg-blue-500/5 text-blue-400 hover:border-blue-500 hover:bg-blue-500/10 transition-all text-[10px] font-black uppercase tracking-[0.2em] group"
        >
          <Plus size={14} className="group-hover:scale-125 transition-transform" />
          Registrar Nova Demanda
        </button>
      </div>

      <div className="w-full overflow-x-auto bg-[#0f172a]/20 border border-slate-800 rounded-sm">
        <table className="w-full text-center border-collapse min-w-[1200px] table-fixed">
          <thead>
            <tr className="border-b-2 border-slate-700 bg-[#030712] shadow-sm">
              <th className="w-[10%] px-3 py-5 text-[9px] font-black tracking-widest text-slate-400 uppercase text-center">ID</th>
              <th className="w-[10%] px-3 py-5 text-[9px] font-black tracking-widest text-slate-200 uppercase text-left">Título</th>
              <th className="w-[10%] px-3 py-5 text-[9px] font-black tracking-widest text-slate-200 uppercase text-center">Status</th>
              <th className="w-[10%] px-3 py-5 text-[9px] font-black tracking-widest text-slate-200 uppercase text-center">Estágio Operacional</th>
              <th className="w-[10%] px-3 py-5 text-[9px] font-black tracking-widest text-slate-200 uppercase text-center">Solicitante</th>
              <th className="w-[10%] px-3 py-5 text-[9px] font-black tracking-widest text-slate-200 uppercase text-center">Responsável</th>
              <th className="w-[10%] px-3 py-5 text-[9px] font-black tracking-widest text-slate-200 uppercase text-center">Contrato</th>
              <th className="w-[10%] px-3 py-5 text-[9px] font-black tracking-widest text-slate-200 uppercase text-center">Prazo</th>
              <th className="w-[10%] px-3 py-5 text-[9px] font-black tracking-widest text-slate-200 uppercase text-center">Tempo Foco</th>
              <th className="w-[10%] px-3 py-5 text-[9px] font-black tracking-widest text-slate-200 uppercase text-center">Prioridade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {demands.map((demand) => {
              const status = statusConfig[demand.status];
              const priority = priorityConfig[demand.priority];
              const progress = calculateProgress(demand);
              const totalCount = demand.subActivities?.length || 0;
              const completedCount = demand.subActivities?.filter(s => s.completed).length || 0;

              return (
                <tr 
                  key={demand.id} 
                  onContextMenu={(e) => handleContextMenu(e, demand)}
                  className="group even:bg-[#0f172a]/40 odd:bg-transparent hover:bg-blue-600/5 transition-all duration-200 cursor-default"
                >
                  <td className="px-3 py-4 text-[10px] font-bold text-slate-600 truncate text-center">{demand.id}</td>
                  <td className="px-3 py-4 overflow-hidden text-left">
                    <div className="flex flex-col max-w-full items-start">
                      <span className="text-[13px] font-bold text-white group-hover:text-blue-400 transition-colors truncate w-full">
                        {demand.title}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate w-full">{demand.description}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase ${status.color}`}>
                      {status.icon}
                      {status.label}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <div 
                      onClick={() => onManageSubs?.(demand)}
                      className="group/sub flex flex-col gap-1.5 cursor-pointer hover:bg-white/5 p-2 rounded-sm transition-all border border-transparent hover:border-slate-800 items-center"
                    >
                      {totalCount > 0 ? (
                        <div className="w-full max-w-[80px]">
                          <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest mb-1">
                            <span className="text-slate-500 group-hover/sub:text-blue-400 transition-colors">
                              {completedCount}/{totalCount}
                            </span>
                            <span className={progress === 100 ? 'text-emerald-500' : 'text-slate-400'}>{progress}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-blue-500'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-1">
                          <span className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-slate-600 group-hover/sub:text-blue-400 transition-colors">
                            <Plus size={10} strokeWidth={3} /> ADD SUB
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-[11px] font-semibold text-slate-400 truncate text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <User size={10} className="text-slate-600 flex-shrink-0" />
                      <span className="truncate">{demand.requester}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-[11px] font-semibold text-slate-400 truncate text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <UserCheck size={10} className="text-slate-600 flex-shrink-0" />
                      <span className="truncate">{demand.responsible}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-[11px] font-semibold text-slate-400 truncate text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <FileText size={10} className="text-slate-600 flex-shrink-0" />
                      <span className="truncate">{demand.contract}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-[9px] font-bold text-slate-400 uppercase whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Calendar size={10} className="text-slate-600" />
                      {demand.dueDate}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-[11px] font-bold text-slate-300 truncate text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Clock size={11} className="text-blue-500" />
                      <span className="tabular-nums">{formatAccumulatedTime(demand.pomodoros || 0)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${priority.style}`}>
                      {priority.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MENU DE CONTEXTO PIXEL-PERFECT */}
      {contextMenu && (
        <div 
          ref={menuRef}
          className="fixed z-[9999] bg-[#030712] border border-blue-500/30 rounded-sm shadow-2xl py-1 w-48 animate-in fade-in zoom-in duration-150 backdrop-blur-md"
          style={{ 
            top: contextMenu.mouseY, 
            left: contextMenu.mouseX,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-slate-800/50 mb-1 bg-black/20">
             <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Ações: {contextMenu.demand?.id}</p>
          </div>
          <button 
            onClick={() => { onEdit(contextMenu.demand!); closeMenu(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-blue-400 hover:bg-blue-600/10 transition-all"
          >
            <Edit2 size={12} className="text-blue-500" />
            Editar Missão
          </button>
          <button 
            onClick={() => { setDemandToDelete(contextMenu.demand); closeMenu(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
          >
            <Trash2 size={12} className="text-rose-500" />
            Excluir Registro
          </button>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {demandToDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setDemandToDelete(null)}>
          <div 
            className="bg-[#030712] border border-rose-500/30 rounded-sm w-full max-w-sm p-8 shadow-2xl shadow-rose-500/10 animate-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20">
                <AlertTriangle size={32} className="text-rose-500 animate-pulse" />
              </div>
              <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-white mb-2">Protocolo de Exclusão</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-8">
                Confirmar remoção permanente da demanda <span className="text-rose-400">{demandToDelete.id}</span>? Esta ação não pode ser revertida.
              </p>
              
              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => setDemandToDelete(null)}
                  className="flex-1 px-4 py-3 border border-slate-800 rounded-sm text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
                >
                  Abortar
                </button>
                <button 
                  onClick={confirmDelete}
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

export default DemandTable;
