
import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Search, Check, ChevronDown, Calendar as CalendarIcon, ChevronLeft, ChevronRight, AlertCircle, PlayCircle, CheckCircle2, Ban, Zap, BarChart3, XCircle, User, UserCheck, FileText, Edit2, Trash2 } from 'lucide-react';
import { DemandItem, DemandStatus, Priority, Difficulty } from '../types';

interface DemandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (demand: DemandItem) => void;
  nextId: string;
  editingDemand?: DemandItem | null;
  existingOptions: {
    requesters: string[];
    responsibles: string[];
    contracts: string[];
  };
  onUpdateTag: (category: 'requester' | 'responsible' | 'contract', oldName: string, newName: string) => void;
  onDeleteTag: (category: 'requester' | 'responsible' | 'contract', tagName: string) => void;
}

interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}

interface CustomSelectProps {
  label: string;
  value: string;
  onChange: (val: any) => void;
  options: SelectOption[];
}

const CustomSelect: React.FC<CustomSelectProps> = ({ label, value, onChange, options }) => {
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

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-900/50 border rounded-sm px-4 py-2 text-xs flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-slate-800 hover:border-slate-700'}`}
      >
        <div className="flex items-center gap-2">
          {selectedOption.icon && <span className={selectedOption.color}>{selectedOption.icon}</span>}
          <span className="text-white font-bold uppercase tracking-tight">{selectedOption.label}</span>
        </div>
        <ChevronDown size={14} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-[4000] left-0 w-full mt-1 bg-[#030712] border border-slate-800 rounded-sm shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200 overflow-hidden">
          <div className="p-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between group rounded-sm mb-0.5 last:mb-0
                  ${value === opt.value ? 'bg-blue-600/10 text-blue-400' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <div className="flex items-center gap-2">
                   {opt.icon && <span className={value === opt.value ? 'text-blue-400' : opt.color}>{opt.icon}</span>}
                   {opt.label}
                </div>
                {value === opt.value && <Check size={10} className="text-blue-500" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface CustomTextAreaProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  maxLength?: number;
}

const CustomTextArea: React.FC<CustomTextAreaProps> = ({ label, value, onChange, placeholder, maxLength = 500 }) => {
  return (
    <div className="space-y-1 relative">
      <div className="flex justify-between items-end">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</label>
        <span className={`text-[8px] font-black uppercase tracking-widest ${value.length >= maxLength ? 'text-rose-500' : 'text-slate-600'}`}>
          {value.length} / {maxLength}
        </span>
      </div>
      <div className="relative group">
        <textarea
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full bg-slate-900/50 border border-slate-800 rounded-sm px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all h-32 resize-none custom-scrollbar placeholder:text-slate-700"
          value={value}
          onChange={e => onChange(e.target.value)}
        />
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <BarChart3 size={12} className="text-slate-800" />
        </div>
      </div>
    </div>
  );
};

interface CustomDatePickerProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ label, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const fullMonths = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateLabel = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  const days = [];
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const handleSelectDay = (day: number) => {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange(formatDateLabel(selected));
    setIsOpen(false);
  };

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-900/50 border rounded-sm px-4 py-2 text-sm flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-slate-800 hover:border-slate-700'}`}
      >
        <span className={value ? 'text-white' : 'text-slate-600'}>{value || placeholder}</span>
        <CalendarIcon size={14} className="text-slate-500" />
      </div>
      {isOpen && (
        <div className="absolute z-[4000] left-0 mt-1 w-72 bg-[#030712] border border-slate-800 rounded-sm shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-black/40">
            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="text-slate-500 hover:text-white transition-colors"><ChevronLeft size={16} /></button>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-white uppercase tracking-widest">{fullMonths[viewDate.getMonth()]}</span>
              <span className="text-[9px] font-bold text-slate-500">{viewDate.getFullYear()}</span>
            </div>
            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="text-slate-500 hover:text-white transition-colors"><ChevronRight size={16} /></button>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-7 mb-1">{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (<span key={i} className="text-center text-[8px] font-black text-slate-600 uppercase py-1">{d}</span>))}</div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => (
                <div key={i} className="aspect-square flex items-center justify-center">
                  {day !== null ? (
                    <button type="button" onClick={() => handleSelectDay(day)} className={`w-full h-full rounded-sm text-[10px] font-bold transition-all flex items-center justify-center ${value.startsWith(day.toString().padStart(2, '0')) && value.includes(months[viewDate.getMonth()]) ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>{day}</button>
                  ) : <div className="w-full h-full" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface TagSelectorProps {
  label: string;
  category: 'requester' | 'responsible' | 'contract';
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
  icon?: React.ReactNode;
  onUpdateTag: (category: 'requester' | 'responsible' | 'contract', oldName: string, newName: string) => void;
  onDeleteTag: (category: 'requester' | 'responsible' | 'contract', tagName: string) => void;
}

const TagSelector: React.FC<TagSelectorProps> = ({ 
  label, category, value, onChange, options, placeholder, icon, onUpdateTag, onDeleteTag 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deletingTag, setDeletingTag] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setEditingTag(null);
        setDeletingTag(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const showCreateOption = searchTerm && !options.some(opt => opt.toLowerCase() === searchTerm.toLowerCase());

  const handleEditInit = (e: React.MouseEvent, tagName: string) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingTag(tagName);
    setEditValue(tagName);
    setDeletingTag(null);
  };

  const handleSaveEdit = (e: React.MouseEvent | React.KeyboardEvent, oldName: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (editValue.trim() && editValue.trim() !== oldName) {
      onUpdateTag(category, oldName, editValue.trim());
    }
    setEditingTag(null);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingTag(null);
  };

  const handleDeleteInit = (e: React.MouseEvent, tagName: string) => {
    e.stopPropagation();
    e.preventDefault();
    setDeletingTag(tagName);
    setEditingTag(null);
  };

  const handleConfirmDelete = (e: React.MouseEvent, tagName: string) => {
    e.stopPropagation();
    e.preventDefault();
    onDeleteTag(category, tagName);
    setDeletingTag(null);
    if (value === tagName) onChange('');
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDeletingTag(null);
  };

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-900/50 border rounded-sm px-4 py-2 text-sm flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-slate-800 hover:border-slate-700'}`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {icon && <div className="text-slate-600 flex-shrink-0">{icon}</div>}
          {value ? (
            <span className="px-2 py-0.5 rounded-sm bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-black uppercase tracking-tight truncate">
              {value}
            </span>
          ) : (
            <span className="text-slate-600 truncate">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={14} className={`text-slate-500 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-[3000] w-full mt-1 bg-[#030712] border border-slate-800 rounded-sm shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="p-2 border-b border-slate-800/50 flex items-center gap-2 bg-black/40">
            <Search size={12} className="text-slate-500" />
            <input 
              autoFocus 
              className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-xs text-slate-300 placeholder:text-slate-700 p-0" 
              placeholder="Pesquisar histórico..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
          <div className="max-h-48 overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div 
                  key={opt}
                  className={`w-full px-4 py-2 transition-all flex items-center justify-between group/opt border-b border-slate-800/20 last:border-none min-h-[46px]
                    ${value === opt ? 'bg-blue-600/10' : 'hover:bg-slate-800/40'}`}
                >
                  {editingTag === opt ? (
                    <div className="flex-1 flex items-center gap-2 animate-in fade-in duration-200">
                       <input 
                         autoFocus
                         className="flex-1 bg-slate-950 border border-blue-500 rounded-sm px-2 py-1 text-[11px] font-bold text-white outline-none"
                         value={editValue}
                         onChange={e => setEditValue(e.target.value)}
                         onClick={e => e.stopPropagation()}
                         onKeyDown={e => {
                            if(e.key === 'Enter') handleSaveEdit(e, opt);
                            if(e.key === 'Escape') handleCancelEdit(e as any);
                         }}
                       />
                       <button 
                         type="button"
                         onClick={e => handleSaveEdit(e, opt)} 
                         className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-sm transition-colors"
                         title="Salvar"
                       >
                         <Check size={14} strokeWidth={3} />
                       </button>
                       <button 
                         type="button"
                         onClick={handleCancelEdit} 
                         className="p-1.5 text-slate-500 hover:bg-slate-500/10 rounded-sm transition-colors"
                         title="Cancelar"
                       >
                         <X size={14} strokeWidth={3} />
                       </button>
                    </div>
                  ) : deletingTag === opt ? (
                    <div className="flex-1 flex items-center justify-between animate-in slide-in-from-right-2 duration-300">
                       <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                         <AlertCircle size={14} /> Apagar?
                       </span>
                       <div className="flex items-center gap-1.5">
                          <button type="button" onClick={e => handleConfirmDelete(e, opt)} className="px-3 py-1 bg-rose-600 text-white text-[9px] font-black uppercase rounded-sm hover:bg-rose-500 shadow-lg shadow-rose-500/20">Sim</button>
                          <button type="button" onClick={handleCancelDelete} className="px-3 py-1 bg-slate-800 text-slate-400 text-[9px] font-black uppercase rounded-sm hover:text-white transition-colors">Não</button>
                       </div>
                    </div>
                  ) : (
                    <>
                      <button 
                        type="button" 
                        onClick={() => { onChange(opt); setIsOpen(false); setSearchTerm(''); }} 
                        className={`text-left text-[11px] font-bold uppercase tracking-tight flex-1 truncate
                          ${value === opt ? 'text-blue-400' : 'text-slate-500 group-hover/opt:text-slate-200'}`}
                      >
                        {opt}
                      </button>
                      <div className="flex items-center gap-1">
                        <button 
                          type="button"
                          onClick={(e) => handleEditInit(e, opt)} 
                          className="opacity-0 group-hover/opt:opacity-100 p-2 text-slate-600 hover:text-blue-400 transition-all rounded-sm hover:bg-blue-500/5"
                          title="Editar Nome"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => handleDeleteInit(e, opt)} 
                          className="opacity-0 group-hover/opt:opacity-100 p-2 text-slate-600 hover:text-rose-500 transition-all rounded-sm hover:bg-rose-500/5"
                          title="Excluir Tag"
                        >
                          <Trash2 size={13} />
                        </button>
                        {value === opt && <Check size={14} className="text-blue-500 flex-shrink-0 ml-1" strokeWidth={3} />}
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : !showCreateOption && (
              <div className="px-4 py-6 text-center">
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">Histórico Vazio</p>
              </div>
            )}
            
            {showCreateOption && (
              <button 
                type="button" 
                onClick={() => { onChange(searchTerm); setIsOpen(false); setSearchTerm(''); }} 
                className="w-full text-left px-4 py-4 bg-blue-600/5 border-t border-slate-800/50 flex items-center gap-3 text-blue-400 hover:bg-blue-600/10 transition-all"
              >
                <div className="w-7 h-7 rounded-sm bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                  <Plus size={16} strokeWidth={3} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Nova Tag:</span>
                  <span className="text-xs font-black text-white truncate">{searchTerm}</span>
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const DemandModal: React.FC<DemandModalProps> = ({ 
  isOpen, onClose, onSave, nextId, editingDemand, existingOptions, onUpdateTag, onDeleteTag 
}) => {
  const [formData, setFormData] = useState<Omit<DemandItem, 'id'>>({
    title: '', requester: '', responsible: '', contract: '', startDate: '', dueDate: '', status: 'OPEN', priority: 'MEDIUM', difficulty: 'MÉDIA', pomodoros: 0, description: '', subActivities: []
  });

  useEffect(() => {
    if (editingDemand) {
      setFormData({ ...editingDemand });
    } else {
      setFormData({ title: '', requester: '', responsible: '', contract: '', startDate: '', dueDate: '', status: 'OPEN', priority: 'MEDIUM', difficulty: 'MÉDIA', pomodoros: 0, description: '', subActivities: [] });
    }
  }, [editingDemand, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Usa o ID sequencial calculado se for uma nova demanda
    onSave({ ...formData, id: editingDemand?.id || nextId });
    onClose();
  };

  const statusOptions: SelectOption[] = [
    { value: 'OPEN', label: 'Aberta', icon: <AlertCircle size={12} />, color: 'text-blue-400' },
    { value: 'IN_PROGRESS', label: 'Em Curso', icon: <PlayCircle size={12} />, color: 'text-yellow-400' },
    { value: 'COMPLETED', label: 'Concluída', icon: <CheckCircle2 size={12} />, color: 'text-emerald-400' },
    { value: 'BLOCKED', label: 'Bloqueada', icon: <Ban size={12} />, color: 'text-rose-400' },
    { value: 'CANCELLED', label: 'Cancelada', icon: <XCircle size={12} />, color: 'text-slate-500' },
  ];

  const priorityOptions: SelectOption[] = [
    { value: 'LOW', label: 'Baixa', icon: <Zap size={12} />, color: 'text-slate-500' },
    { value: 'MEDIUM', label: 'Média', icon: <Zap size={12} />, color: 'text-yellow-500' },
    { value: 'HIGH', label: 'Alta', icon: <Zap size={12} />, color: 'text-rose-500' },
  ];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#020617]/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#030712] border border-slate-800 rounded-sm w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 my-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex flex-col">
            <h2 className="text-sm font-black uppercase tracking-widest text-white">{editingDemand ? 'Editar Demanda' : 'Nova Demanda'}</h2>
            {!editingDemand && <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ID Atribuído: {nextId}</span>}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Título da Demanda</label>
            <input required autoFocus placeholder="Digite o título da demanda..." className="w-full bg-slate-900/50 border border-slate-800 rounded-sm px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TagSelector 
              label="Solicitante" 
              category="requester"
              placeholder="Buscar histórico..." 
              value={formData.requester} 
              options={existingOptions.requesters} 
              onChange={(val) => setFormData({ ...formData, requester: val })} 
              icon={<User size={14} />}
              onUpdateTag={onUpdateTag}
              onDeleteTag={onDeleteTag}
            />
            <TagSelector 
              label="Responsável" 
              category="responsible"
              placeholder="Buscar histórico..." 
              value={formData.responsible} 
              options={existingOptions.responsibles} 
              onChange={(val) => setFormData({ ...formData, responsible: val })} 
              icon={<UserCheck size={14} />}
              onUpdateTag={onUpdateTag}
              onDeleteTag={onDeleteTag}
            />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <TagSelector 
              label="Contrato" 
              category="contract"
              placeholder="Buscar histórico..." 
              value={formData.contract} 
              options={existingOptions.contracts} 
              onChange={(val) => setFormData({ ...formData, contract: val })} 
              icon={<FileText size={14} />}
              onUpdateTag={onUpdateTag}
              onDeleteTag={onDeleteTag}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomDatePicker label="Prazo Final (Entrega)" placeholder="Selecione o prazo" value={formData.dueDate} onChange={(val) => setFormData({ ...formData, dueDate: val })} />
            <div className="grid grid-cols-2 gap-4">
              <CustomSelect label="Status" value={formData.status} options={statusOptions} onChange={(val) => setFormData({ ...formData, status: val })} />
              <CustomSelect label="Prioridade" value={formData.priority} options={priorityOptions} onChange={(val) => setFormData({ ...formData, priority: val })} />
            </div>
          </div>

          <CustomTextArea label="Descrição Detalhada" placeholder="Descreva os objetivos desta missão..." value={formData.description} onChange={(val) => setFormData({ ...formData, description: val })} />

          <div className="flex gap-3 pt-4 border-t border-slate-800">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-sm border border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-800 transition-all">Cancelar</button>
            <button type="submit" className="flex-1 px-4 py-3 rounded-sm bg-blue-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all">{editingDemand ? 'Atualizar Missão' : 'Iniciar Missão'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DemandModal;
