
import React, { useState } from 'react';
import { X, Check, Search, Target } from 'lucide-react';
import { DemandItem } from '../types';

interface FocusManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableDemands: DemandItem[];
  focusedIds: string[];
  onToggleFocus: (id: string) => void;
}

const FocusManagementModal: React.FC<FocusManagementModalProps> = ({ 
  isOpen, 
  onClose, 
  availableDemands, 
  focusedIds, 
  onToggleFocus 
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = availableDemands.filter(d => 
    d.title.toLowerCase().includes(search.toLowerCase()) || 
    d.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center bg-[#020617]/90 backdrop-blur-md p-4">
      <div className="bg-[#030712] border border-slate-800 rounded-sm w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
              <Target size={14} className="text-blue-500" /> Vincular ao Centro de Foco
            </h2>
            <p className="text-[10px] text-slate-500 uppercase font-bold">Quais demandas você vai atacar agora?</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-slate-800/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
            <input 
              className="w-full bg-slate-900/50 border border-slate-800 rounded-sm pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Pesquisar demandas ativas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-[10px] font-black text-slate-700 uppercase tracking-widest">
              Nenhuma demanda disponível para foco
            </div>
          ) : (
            filtered.map(demand => {
              const isSelected = focusedIds.includes(demand.id);
              return (
                <button
                  key={demand.id}
                  onClick={() => onToggleFocus(demand.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-sm transition-all border ${
                    isSelected ? 'bg-blue-600/10 border-blue-600/50 text-white' : 'hover:bg-slate-800/40 border-transparent text-slate-400'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-all ${
                    isSelected ? 'bg-blue-600 border-blue-500' : 'bg-slate-900 border-slate-700'
                  }`}>
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[11px] font-black uppercase tracking-tight truncate">{demand.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-bold text-slate-600">{demand.id}</span>
                      <span className="text-[8px] font-black text-slate-700">|</span>
                      <span className="text-[9px] font-bold text-slate-500 truncate">{demand.responsible}</span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="p-6 border-t border-slate-800 flex justify-between items-center bg-black/20">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{focusedIds.length} selecionadas</span>
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-blue-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/10 rounded-sm"
          >
            Fechar e Ativar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FocusManagementModal;
