
import React, { useState } from 'react';
import { X, Plus, Trash2, CheckCircle, Circle } from 'lucide-react';
import { DemandItem, SubActivity } from '../types';

interface SubActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  demand: DemandItem | null;
  onUpdateSubActivities: (demandId: string, subs: SubActivity[]) => void;
}

const SubActivityModal: React.FC<SubActivityModalProps> = ({ 
  isOpen, 
  onClose, 
  demand, 
  onUpdateSubActivities 
}) => {
  const [newSubTitle, setNewSubTitle] = useState('');

  if (!isOpen || !demand) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubTitle.trim()) return;
    
    const newSub: SubActivity = {
      id: `sub-${Date.now()}`,
      title: newSubTitle.trim(),
      completed: false
    };
    
    onUpdateSubActivities(demand.id, [...demand.subActivities, newSub]);
    setNewSubTitle('');
  };

  const toggleComplete = (subId: string) => {
    const updated = demand.subActivities.map(s => 
      s.id === subId ? { ...s, completed: !s.completed } : s
    );
    onUpdateSubActivities(demand.id, updated);
  };

  const deleteSub = (subId: string) => {
    const updated = demand.subActivities.filter(s => s.id !== subId);
    onUpdateSubActivities(demand.id, updated);
  };

  const progress = demand.subActivities.length > 0 
    ? Math.round((demand.subActivities.filter(s => s.completed).length / demand.subActivities.length) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-[#020617]/90 backdrop-blur-md p-4">
      <div className="bg-[#030712] border border-slate-800 rounded-sm w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Sub-atividades</h2>
            <p className="text-[10px] text-slate-500 uppercase font-bold truncate max-w-[280px]">{demand.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
              <span>Progresso</span>
              <span className="text-blue-400">{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Quick Add Form */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input 
              autoFocus
              className="flex-1 bg-slate-900/50 border border-slate-800 rounded-sm px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Adicionar nova sub-tarefa..."
              value={newSubTitle}
              onChange={e => setNewSubTitle(e.target.value)}
            />
            <button 
              type="submit"
              className="bg-blue-600 p-2 rounded-sm text-white hover:bg-blue-500 transition-colors"
            >
              <Plus size={20} />
            </button>
          </form>

          {/* List */}
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {demand.subActivities.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-800 rounded-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Nenhuma sub-atividade cadastrada</p>
              </div>
            ) : (
              demand.subActivities.map(sub => (
                <div 
                  key={sub.id}
                  className="group flex items-center justify-between p-3 bg-slate-900/30 border border-slate-800 rounded-sm hover:border-slate-700 transition-all"
                >
                  <button 
                    onClick={() => toggleComplete(sub.id)}
                    className="flex items-center gap-3 text-left flex-1"
                  >
                    {sub.completed ? (
                      <CheckCircle className="text-emerald-500 flex-shrink-0" size={18} />
                    ) : (
                      <Circle className="text-slate-700 flex-shrink-0" size={18} />
                    )}
                    <span className={`text-sm ${sub.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                      {sub.title}
                    </span>
                  </button>
                  <button 
                    onClick={() => deleteSub(sub.id)}
                    className="text-slate-700 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubActivityModal;
