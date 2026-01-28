
import React, { useState, useRef, useEffect } from 'react';
import { Folder, Settings, ClipboardList, ChevronLeft, ChevronRight, StickyNote, ListCheck, LogOut, Shield, Maximize2, Minimize2 } from 'lucide-react';
import { ViewType } from '../types';

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  onViewChange, 
  isCollapsed, 
  onToggleCollapse,
  onLogout
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
    setIsSettingsOpen(false);
  };

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

      {/* Footer / Settings */}
      <div className={`p-6 relative ${isCollapsed ? 'flex justify-center' : ''}`} ref={settingsRef}>
        <button 
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className={`flex items-center gap-3 transition-all duration-300 w-full group p-2 rounded-sm border ${
            isSettingsOpen ? 'bg-slate-800 border-blue-500/50 text-white' : 'text-slate-400 hover:text-white border-transparent'
          } ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? "Configurações" : ""}
        >
          <Settings size={18} className={`${isSettingsOpen ? 'rotate-45' : 'group-hover:rotate-45'} transition-transform duration-500 flex-shrink-0`} />
          {!isCollapsed && (
            <span className="text-xs font-bold tracking-wider animate-in fade-in slide-in-from-left-1 duration-300">
              Configurações
            </span>
          )}
        </button>

        {isSettingsOpen && (
          <div className={`absolute bottom-full mb-2 bg-[#030712] border border-slate-800 rounded-sm shadow-2xl z-[200] overflow-hidden animate-in slide-in-from-bottom-2 duration-300 ${
            isCollapsed ? 'left-4 w-48' : 'left-6 right-6'
          }`}>
            <div className="p-3 border-b border-slate-800/50 bg-black/20">
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <Shield size={10} /> Painel de Controle
               </p>
            </div>
            
            <button 
              className="w-full text-left px-4 py-3 text-[10px] font-black text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-3 uppercase tracking-widest transition-all"
            >
              <Settings size={14} /> Preferências
            </button>

            <button 
              onClick={toggleFullscreen}
              className="w-full text-left px-4 py-3 text-[10px] font-black text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-3 uppercase tracking-widest transition-all border-t border-slate-800/50"
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {isFullscreen ? 'Sair da Tela Cheia' : 'Modo Tela Cheia'}
            </button>

            <button 
              onClick={onLogout}
              className="w-full text-left px-4 py-3 text-[10px] font-black text-rose-500 hover:text-white hover:bg-rose-600 flex items-center gap-3 uppercase tracking-widest transition-all border-t border-slate-800/50"
            >
              <LogOut size={14} /> Terminar Sessão
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
