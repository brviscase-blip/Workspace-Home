
import React from 'react';
import { Folder, Settings, ClipboardList, ChevronLeft, ChevronRight, StickyNote, ListCheck } from 'lucide-react';
import { ViewType } from '../types';

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  onViewChange, 
  isCollapsed, 
  onToggleCollapse 
}) => {
  return (
    <aside 
      className={`bg-[#030712] border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out relative z-[100] ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button 
        onClick={onToggleCollapse}
        className="absolute -right-3 top-20 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg border border-[#020617] hover:bg-blue-500 transition-all z-50 group"
        title={isCollapsed ? "Expandir Sidebar" : "Recolher Sidebar"}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Branding */}
      <div className={`p-6 flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="flex-shrink-0 w-10 h-10 bg-black border border-slate-800 rounded-sm flex items-center justify-center">
          <Folder className="text-white" size={20} />
        </div>
        {!isCollapsed && (
          <div className="animate-in fade-in slide-in-from-left-2 duration-300">
            <h2 className="text-sm font-black tracking-widest text-white uppercase whitespace-nowrap">Artifacts</h2>
            <p className="text-[10px] text-slate-500 font-medium whitespace-nowrap">Cofre Vibrante v3</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-0 mt-4 overflow-hidden space-y-1">
        <button 
          onClick={() => onViewChange('DEMANDAS')}
          className={`w-full flex items-center gap-3 px-6 py-4 transition-all duration-200 border-l-2 ${
            activeView === 'DEMANDAS' 
              ? 'bg-[#0f172a] border-blue-500 text-white shadow-lg' 
              : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/20'
          } ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? "Demandas" : ""}
        >
          <ClipboardList size={18} className="flex-shrink-0" />
          {!isCollapsed && (
            <span className="text-xs font-bold tracking-wider animate-in fade-in slide-in-from-left-1 duration-300">
              Demandas
            </span>
          )}
        </button>

        <button 
          onClick={() => onViewChange('TAREFAS')}
          className={`w-full flex items-center gap-3 px-6 py-4 transition-all duration-200 border-l-2 ${
            activeView === 'TAREFAS' 
              ? 'bg-[#0f172a] border-blue-500 text-white shadow-lg' 
              : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/20'
          } ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? "Tarefas" : ""}
        >
          <ListCheck size={18} className="flex-shrink-0" />
          {!isCollapsed && (
            <span className="text-xs font-bold tracking-wider animate-in fade-in slide-in-from-left-1 duration-300">
              Tarefas
            </span>
          )}
        </button>

        <button 
          onClick={() => onViewChange('NOTAS')}
          className={`w-full flex items-center gap-3 px-6 py-4 transition-all duration-200 border-l-2 ${
            activeView === 'NOTAS' 
              ? 'bg-[#0f172a] border-blue-500 text-white shadow-lg' 
              : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/20'
          } ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? "Notas" : ""}
        >
          <StickyNote size={18} className="flex-shrink-0" />
          {!isCollapsed && (
            <span className="text-xs font-bold tracking-wider animate-in fade-in slide-in-from-left-1 duration-300">
              Notas
            </span>
          )}
        </button>
      </nav>

      {/* Footer */}
      <div className={`p-6 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <button 
          className={`flex items-center gap-3 text-slate-400 hover:text-white transition-colors w-full group ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? "Configurações" : ""}
        >
          <Settings size={18} className="group-hover:rotate-45 transition-transform duration-500 flex-shrink-0" />
          {!isCollapsed && (
            <span className="text-xs font-bold tracking-wider animate-in fade-in slide-in-from-left-1 duration-300">
              Configurações
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;