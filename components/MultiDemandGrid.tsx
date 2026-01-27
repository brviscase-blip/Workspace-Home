
import React from 'react';
import { DemandItem } from '../types';
import DemandTable from './DemandTable';
import { ChevronDown, Table as TableIcon } from 'lucide-react';

interface MultiDemandGridProps {
  demands: DemandItem[];
  gridSize: number;
  selectedContracts: string[];
  availableContracts: string[];
  onContractChange: (index: number, contract: string) => void;
  onEdit: (demand: DemandItem) => void;
  onDelete: (id: string) => void;
  onManageSubs: (demand: DemandItem) => void;
}

const MultiDemandGrid: React.FC<MultiDemandGridProps> = ({
  demands,
  gridSize,
  selectedContracts,
  availableContracts,
  onContractChange,
  onEdit,
  onDelete,
  onManageSubs
}) => {
  
  // Helper para renderizar cada slot do grid
  const renderSlot = (index: number) => {
    const selectedContract = selectedContracts[index] || '';
    const filteredDemands = demands.filter(d => d.contract === selectedContract);

    return (
      <div key={index} className="flex flex-col bg-[#030712]/40 border border-slate-800 rounded-sm overflow-hidden h-full shadow-2xl">
        {/* Slot Header com Seletor */}
        <div className="p-3 border-b border-slate-800 bg-black/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TableIcon size={14} className="text-blue-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Slot Operacional {index + 1}</span>
          </div>
          
          <div className="relative group">
            <select 
              value={selectedContract}
              onChange={(e) => onContractChange(index, e.target.value)}
              className="appearance-none bg-[#0f172a] border border-slate-800 rounded-sm px-4 py-1.5 pr-10 text-[10px] font-black uppercase tracking-widest text-blue-400 outline-none hover:border-blue-500 transition-all cursor-pointer"
            >
              <option value="">-- SELECIONAR CONTRATO --</option>
              {availableContracts.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-hover:text-blue-500 transition-colors" />
          </div>
        </div>

        {/* Slot Content with Local Scroll */}
        <div className="flex-1 overflow-auto custom-scrollbar p-2">
          {selectedContract ? (
            <div className="scale-[0.85] origin-top-left" style={{ width: '117.64%', height: '117.64%' }}>
                <DemandTable 
                    demands={filteredDemands} 
                    onEdit={onEdit} 
                    onDelete={onDelete} 
                    onAdd={() => {}} // Botão global no App.tsx
                    onManageSubs={onManageSubs}
                />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
              <TableIcon size={32} className="text-slate-500 mb-3" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Aguardando Seleção de Contrato</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Lógica de layout baseada no gridSize
  const getGridLayout = () => {
    switch (gridSize) {
      case 2:
        return (
          <div className="grid grid-cols-2 gap-4 h-full">
            {renderSlot(0)}
            {renderSlot(1)}
          </div>
        );
      case 3:
        return (
          <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
            {renderSlot(0)}
            {renderSlot(1)}
            <div className="col-span-2 w-1/2 justify-self-center">
              {renderSlot(2)}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
            {renderSlot(0)}
            {renderSlot(1)}
            {renderSlot(2)}
            {renderSlot(3)}
          </div>
        );
      case 5:
        return (
          <div className="flex flex-col gap-4 h-full">
            <div className="grid grid-cols-3 gap-4 h-1/2">
              {renderSlot(0)}
              {renderSlot(1)}
              {renderSlot(2)}
            </div>
            <div className="grid grid-cols-2 gap-4 h-1/2 w-2/3 self-center">
              {renderSlot(3)}
              {renderSlot(4)}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="grid grid-cols-3 grid-rows-2 gap-4 h-full">
            {renderSlot(0)}
            {renderSlot(1)}
            {renderSlot(2)}
            {renderSlot(3)}
            {renderSlot(4)}
            {renderSlot(5)}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full pb-4">
      {getGridLayout()}
    </div>
  );
};

export default MultiDemandGrid;
