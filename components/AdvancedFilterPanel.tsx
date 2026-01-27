
import React, { useState, useRef, useEffect } from 'react';
import { X, Filter, RotateCcw, ChevronDown, Check } from 'lucide-react';

interface FilterState {
  status: string;
  requester: string;
  responsible: string;
  contract: string;
  difficulty: string;
  priority: string;
}

interface AdvancedFilterPanelProps {
  isOpen: boolean;
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onReset: () => void;
  options: {
    requesters: string[];
    responsibles: string[];
    contracts: string[];
  };
}

interface CustomFilterSelectProps {
  label: string;
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
}

const CustomFilterSelect: React.FC<CustomFilterSelectProps> = ({ label, value, placeholder, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
        {label}
      </label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-900/80 border rounded-sm px-3 py-2 text-[10px] flex items-center justify-between cursor-pointer transition-all ${
          isOpen ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <span className={`font-bold uppercase tracking-tight truncate ${value ? 'text-blue-400' : 'text-slate-500'}`}>
          {displayLabel}
        </span>
        <ChevronDown size={12} className={`text-slate-600 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-[5000] left-0 w-full mt-1 bg-[#030712] border border-slate-800 rounded-sm shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200 overflow-hidden">
          <div className="p-1 max-h-48 overflow-y-auto custom-scrollbar">
            {/* Opção padrão "TODOS" */}
            <button
              type="button"
              onClick={() => { onChange(''); setIsOpen(false); }}
              className={`w-full text-left px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-between rounded-sm mb-0.5
                ${!value ? 'bg-blue-600/10 text-blue-400' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              {placeholder}
              {!value && <Check size={10} className="text-blue-500" />}
            </button>
            
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-between rounded-sm mb-0.5 last:mb-0
                  ${value === opt.value ? 'bg-blue-600/10 text-blue-400' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <span className="truncate pr-2">{opt.label}</span>
                {value === opt.value && <Check size={10} className="text-blue-500 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({ isOpen, filters, onFilterChange, onReset, options }) => {
  if (!isOpen) return null;

  return (
    <div className="mb-6 p-6 bg-slate-900/30 border border-slate-800/50 rounded-sm animate-in slide-in-from-top-4 duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-sm bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Filter size={12} className="text-blue-500" />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Refinar Resultados</h3>
        </div>
        <button 
          onClick={onReset}
          className="group flex items-center gap-2 text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all"
        >
          <RotateCcw size={12} className="group-hover:rotate-[-120deg] transition-transform duration-500" />
          Resetar Parâmetros
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        <CustomFilterSelect 
          label="Status" 
          placeholder="TODOS"
          value={filters.status}
          onChange={(val) => onFilterChange('status', val)}
          options={[
            { value: 'OPEN', label: 'Aberta' },
            { value: 'IN_PROGRESS', label: 'Em Curso' },
            { value: 'COMPLETED', label: 'Concluída' },
            { value: 'BLOCKED', label: 'Bloqueada' }
          ]}
        />
        <CustomFilterSelect 
          label="Solicitante" 
          placeholder="TODOS"
          value={filters.requester}
          onChange={(val) => onFilterChange('requester', val)}
          options={options.requesters.map(r => ({ value: r, label: r }))}
        />
        <CustomFilterSelect 
          label="Responsável" 
          placeholder="TODOS"
          value={filters.responsible}
          onChange={(val) => onFilterChange('responsible', val)}
          options={options.responsibles.map(r => ({ value: r, label: r }))}
        />
        <CustomFilterSelect 
          label="Contrato" 
          placeholder="TODOS"
          value={filters.contract}
          onChange={(val) => onFilterChange('contract', val)}
          options={options.contracts.map(c => ({ value: c, label: c }))}
        />
        <CustomFilterSelect 
          label="Dificuldade" 
          placeholder="TODOS"
          value={filters.difficulty}
          onChange={(val) => onFilterChange('difficulty', val)}
          options={[
            { value: 'FÁCIL', label: 'Fácil' },
            { value: 'MÉDIA', label: 'Média' },
            { value: 'DIFÍCIL', label: 'Difícil' },
            { value: 'EXTREMA', label: 'Extrema' }
          ]}
        />
        <CustomFilterSelect 
          label="Prioridade" 
          placeholder="TODOS"
          value={filters.priority}
          onChange={(val) => onFilterChange('priority', val)}
          options={[
            { value: 'LOW', label: 'Baixa' },
            { value: 'MEDIUM', label: 'Média' },
            { value: 'HIGH', label: 'Alta' }
          ]}
        />
      </div>
    </div>
  );
};

export default AdvancedFilterPanel;
