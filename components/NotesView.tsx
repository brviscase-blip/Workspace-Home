
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Plus, Search, Folder, Star, Trash2, 
  Bold, Italic, List, ListOrdered, Palette, Link as LinkIcon,
  ChevronDown, MoreHorizontal, Check, X, FolderPlus, Settings,
  StickyNote, AlertTriangle, GripVertical
} from 'lucide-react';
import { Note, Folder as NoteFolder } from '../types';
import { supabase } from '../lib/supabase';

interface NotesViewProps {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  folders: NoteFolder[];
  setFolders: React.Dispatch<React.SetStateAction<NoteFolder[]>>;
}

const FONT_COLORS = [
  { name: 'Branco', value: '#f8fafc' },
  { name: 'Slate', value: '#94a3b8' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Ciano', value: '#06b6d4' },
  { name: 'Esmeralda', value: '#10b981' },
  { name: 'Amarelo', value: '#eab308' },
  { name: 'Laranja', value: '#f97316' },
  { name: 'Rosa', value: '#f43f5e' },
  { name: 'Roxo', value: '#a855f7' },
  { name: 'Índigo', value: '#6366f1' },
];

const NotesView: React.FC<NotesViewProps> = ({ notes, setNotes, folders, setFolders }) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(notes[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolderId, setActiveFolderId] = useState('all');
  const [showSidebarMenu, setShowSidebarMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  
  // Estados para Drag and Drop
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [dragOverNoteId, setDragOverNoteId] = useState<string | null>(null);
  
  // Estados para Gestão de Pastas
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isManagementMode, setIsManagementMode] = useState(false);
  
  const [localTitle, setLocalTitle] = useState('');
  const titleTimeoutRef = useRef<any>(null);

  // Estados de Exclusão
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);
  
  const [isFolderDeleteModalOpen, setIsFolderDeleteModalOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<NoteFolder | null>(null);
  const [folderDeleteInput, setFolderDeleteInput] = useState('');

  const sidebarMenuRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const folderPickerRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const activeNote = useMemo(() => notes.find(n => n.id === selectedNoteId), [notes, selectedNoteId]);

  useEffect(() => {
    if (activeNote) {
      setLocalTitle(activeNote.title);
    } else {
      setLocalTitle('');
    }
  }, [selectedNoteId, notes]);

  const filteredNotes = useMemo(() => {
    const base = notes.filter(n => {
      const matchesFolder = activeFolderId === 'all' || n.folderId === activeFolderId;
      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           n.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFolder && matchesSearch;
    });
    
    if (searchQuery) {
        return base.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    return base;
  }, [notes, activeFolderId, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarMenuRef.current && !sidebarMenuRef.current.contains(event.target as Node)) setShowSidebarMenu(false);
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) setShowColorPicker(false);
      if (folderPickerRef.current && !folderPickerRef.current.contains(event.target as Node)) setShowFolderPicker(false);
      if (linkInputRef.current && !linkInputRef.current.contains(event.target as Node)) setShowLinkInput(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const refreshNotes = async () => {
    const { data } = await supabase.from('notes').select('*').order('updated_at', { ascending: false });
    if (data) {
      setNotes(data.map(n => ({ ...n, folderId: n.folder_id, updatedAt: n.updated_at, isFavorite: n.is_favorite })));
    }
  };

  const refreshFolders = async () => {
    const { data } = await supabase.from('folders').select('*').order('created_at');
    if (data) setFolders([{ id: 'all', name: 'Todas as Notas', color: 'text-slate-400' }, ...data]);
  };

  const handleCreateNote = async () => {
    const newNote = {
      title: 'Nova Nota',
      content: '',
      folder_id: activeFolderId === 'all' ? (folders[1]?.id || null) : activeFolderId,
      tags: [],
      is_favorite: false
    };
    const { data, error } = await supabase.from('notes').insert([newNote]).select();
    if (!error && data) {
      refreshNotes();
      setSelectedNoteId(data[0].id);
    }
  };

  const updateNoteInSupabase = async (id: string, updates: any) => {
    const dbUpdates: any = { ...updates };
    if ('folderId' in updates) { dbUpdates.folder_id = updates.folderId; delete dbUpdates.folderId; }
    if ('isFavorite' in updates) { dbUpdates.is_favorite = updates.isFavorite; delete dbUpdates.isFavorite; }
    
    await supabase.from('notes').update({ ...dbUpdates, updated_at: new Date().toISOString() }).eq('id', id);
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n));
  };

  const handleNoteDragStart = (e: React.DragEvent, noteId: string) => {
    setDraggingNoteId(noteId);
    e.dataTransfer.setData('noteId', noteId);
    e.dataTransfer.effectAllowed = 'move';
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.4';
  };

  const handleNoteDragEnd = (e: React.DragEvent) => {
    setDraggingNoteId(null);
    setDragOverFolderId(null);
    setDragOverNoteId(null);
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
  };

  const handleFolderDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    if (folderId === 'all') return;
    setDragOverFolderId(folderId);
  };

  const handleFolderDrop = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    setDragOverFolderId(null);
    const noteId = e.dataTransfer.getData('noteId');
    if (noteId && folderId !== 'all') {
      handleMoveToFolder(noteId, folderId);
    }
  };

  const handleNoteDragOver = (e: React.DragEvent, targetNoteId: string) => {
    e.preventDefault();
    if (draggingNoteId === targetNoteId) return;
    setDragOverNoteId(targetNoteId);
  };

  const handleNoteDrop = (e: React.DragEvent, targetNoteId: string) => {
    e.preventDefault();
    setDragOverNoteId(null);
    const draggedNoteId = e.dataTransfer.getData('noteId');
    if (draggedNoteId && draggedNoteId !== targetNoteId) {
      reorderNotes(draggedNoteId, targetNoteId);
    }
  };

  const reorderNotes = (draggedId: string, targetId: string) => {
    setNotes(prev => {
      const newNotes = [...prev];
      const draggedIndex = newNotes.findIndex(n => n.id === draggedId);
      const targetIndex = newNotes.findIndex(n => n.id === targetId);
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [removed] = newNotes.splice(draggedIndex, 1);
        newNotes.splice(targetIndex, 0, removed);
      }
      return newNotes;
    });
  };

  const handleTitleChange = (newTitle: string) => {
    setLocalTitle(newTitle);
    if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
    titleTimeoutRef.current = setTimeout(() => {
      if (selectedNoteId) {
        updateNoteInSupabase(selectedNoteId, { title: newTitle });
      }
    }, 500);
  };

  const handleDeleteClick = (id: string) => {
    setNoteIdToDelete(id);
    setIsConfirmDeleteOpen(true);
  };

  const executeDelete = async () => {
    if (!noteIdToDelete) return;
    await supabase.from('notes').delete().eq('id', noteIdToDelete);
    setNotes(prev => prev.filter(n => n.id !== noteIdToDelete));
    if (selectedNoteId === noteIdToDelete) setSelectedNoteId(null);
    setIsConfirmDeleteOpen(false);
    setNoteIdToDelete(null);
  };

  const handleStartCreateFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCreatingFolder(true);
    setShowSidebarMenu(false);
  };

  const handleConfirmCreateFolder = async () => {
    if (newFolderName.trim()) {
      const { error } = await supabase.from('folders').insert([{ 
        name: newFolderName.trim(), 
        color: 'text-blue-500' 
      }]);
      if (!error) {
        await refreshFolders();
        setNewFolderName('');
        setIsCreatingFolder(false);
      }
    } else {
      setIsCreatingFolder(false);
    }
  };

  const handleDeleteFolderClick = (e: React.MouseEvent, folder: NoteFolder) => {
    e.stopPropagation();
    if (folder.id === 'all') return;
    setFolderToDelete(folder);
    setFolderDeleteInput('');
    setIsFolderDeleteModalOpen(true);
  };

  const executeDeleteFolder = async () => {
    if (!folderToDelete) return;
    const { error } = await supabase.from('folders').delete().eq('id', folderToDelete.id);
    if (!error) {
      if (activeFolderId === folderToDelete.id) setActiveFolderId('all');
      await refreshFolders();
      setIsFolderDeleteModalOpen(false);
      setFolderToDelete(null);
    }
  };

  const handleInput = () => {
    if (editorRef.current && selectedNoteId) {
      updateNoteInSupabase(selectedNoteId, { content: editorRef.current.innerHTML });
    }
  };

  const execCommand = (command: string, value: string | null = null) => {
    document.execCommand(command, false, value || '');
    handleInput();
  };

  const handleFontColor = (color: string) => {
    execCommand('foreColor', color);
    setShowColorPicker(false);
  };

  const handleMoveToFolder = (noteId: string, folderId: string) => {
    updateNoteInSupabase(noteId, { folderId });
    setShowFolderPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === ' ') {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      const container = range.startContainer;
      if (container.nodeType === Node.TEXT_NODE) {
        const text = container.textContent || '';
        const offset = range.startOffset;
        const textBeforeCursor = text.substring(0, offset).trim();
        let command = '';
        let charsToDelete = 0;
        if (textBeforeCursor === '*' || textBeforeCursor === '-') {
          command = 'insertUnorderedList';
          charsToDelete = textBeforeCursor.length;
        } else if (textBeforeCursor === '1.') {
          command = 'insertOrderedList';
          charsToDelete = 2;
        }
        if (command) {
          e.preventDefault();
          try {
            const deleteRange = document.createRange();
            deleteRange.setStart(container, offset - charsToDelete);
            deleteRange.setEnd(container, offset);
            selection.removeAllRanges();
            selection.addRange(deleteRange);
            document.execCommand('delete', false);
            document.execCommand(command, false);
            handleInput();
          } catch (err) {
            console.error('Autoformatting Error:', err);
          }
        }
      }
    }
  };

  useEffect(() => {
    if (editorRef.current && activeNote) {
      if (editorRef.current.innerHTML !== activeNote.content) {
        editorRef.current.innerHTML = activeNote.content;
      }
    }
  }, [selectedNoteId]);

  const activeNoteFolder = folders.find(f => f.id === activeNote?.folderId);

  return (
    <div className="flex h-full w-full bg-[#020617] border border-slate-800 rounded-sm overflow-hidden animate-in fade-in duration-500">
      {/* COLUNA 1: SIDEBAR BIBLIOTECAS */}
      <div className="w-64 border-r border-slate-800 flex flex-col bg-[#030712] flex-shrink-0">
        <div className="p-4 border-b border-slate-800 bg-black/20 flex items-center justify-between relative" ref={sidebarMenuRef}>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bibliotecas</h3>
            <button onClick={() => setShowSidebarMenu(!showSidebarMenu)} className={`p-1 rounded-sm transition-all ${showSidebarMenu ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}><MoreHorizontal size={14}/></button>
            {showSidebarMenu && (
              <div className="absolute top-full right-4 mt-1 w-48 bg-[#030712] border border-slate-800 rounded-sm shadow-2xl z-[100] overflow-hidden">
                <button onClick={handleStartCreateFolder} className="w-full text-left px-4 py-3 text-[10px] font-black text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-2 uppercase tracking-widest border-b border-slate-800/50 transition-colors">
                  <FolderPlus size={12} /> Nova Pasta
                </button>
                <button 
                  onClick={() => { setIsManagementMode(!isManagementMode); setShowSidebarMenu(false); }} 
                  className={`w-full text-left px-4 py-3 text-[10px] font-black flex items-center gap-2 uppercase tracking-widest transition-colors ${isManagementMode ? 'bg-amber-500/10 text-amber-500 hover:text-amber-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <Settings size={12} /> {isManagementMode ? 'Sair do Gerenciar' : 'Gerenciar'}
                </button>
              </div>
            )}
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {folders.map(folder => {
            const isDragOver = dragOverFolderId === folder.id;
            const isActive = activeFolderId === folder.id;
            return (
              <button 
                key={folder.id} 
                disabled={isManagementMode && folder.id === 'all'}
                onClick={() => !isManagementMode && setActiveFolderId(folder.id)} 
                onDragOver={(e) => handleFolderDragOver(e, folder.id)}
                onDragLeave={() => setDragOverFolderId(null)}
                onDrop={(e) => handleFolderDrop(e, folder.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all border ${
                  isActive 
                    ? 'bg-blue-600/10 text-blue-400 border-blue-600/30' 
                    : isDragOver 
                      ? 'drop-target-active' 
                      : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300 border-transparent'
                } ${isManagementMode && folder.id !== 'all' ? 'cursor-default' : ''}`}
              >
                <Folder size={14} className={isActive || isDragOver ? 'text-blue-500' : folder.color} />
                <span className="text-[11px] font-bold uppercase tracking-tight flex-1 text-left truncate">{folder.name}</span>
                {isManagementMode && folder.id !== 'all' && (
                  <button onClick={(e) => handleDeleteFolderClick(e, folder)} className="p-1 rounded-sm text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={12} /></button>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* COLUNA 2: LISTA DE NOTAS (COM REORDENAÇÃO) */}
      <div className="w-80 border-r border-slate-800 flex flex-col bg-[#020617] flex-shrink-0">
        <div className="p-4 border-b border-slate-800 bg-black/10 flex items-center gap-2">
          <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
             <input placeholder="Pesquisar..." className="w-full bg-slate-900/50 border border-slate-800 rounded-sm pl-10 pr-4 py-2 text-[11px] text-white focus:outline-none focus:border-blue-500" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <button onClick={handleCreateNote} className="h-[34px] px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-sm transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2 flex-shrink-0 shadow-lg shadow-blue-500/10">
            <Plus size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {filteredNotes.map(note => {
            const isDragging = draggingNoteId === note.id;
            const isDragOver = dragOverNoteId === note.id;
            const isSelected = selectedNoteId === note.id;
            
            return (
              <div 
                key={note.id}
                onDragOver={(e) => handleNoteDragOver(e, note.id)}
                onDragLeave={() => setDragOverNoteId(null)}
                onDrop={(e) => handleNoteDrop(e, note.id)}
                className={`relative transition-all ${isDragOver ? 'pt-2' : ''}`}
              >
                {isDragOver && (
                   <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] z-10 animate-pulse" />
                )}

                <button 
                  draggable={true}
                  onDragStart={(e) => handleNoteDragStart(e, note.id)}
                  onDragEnd={handleNoteDragEnd}
                  onClick={() => setSelectedNoteId(note.id)} 
                  className={`w-full text-left p-4 border-b border-slate-800/50 transition-all group flex items-start gap-3 cursor-grab active:cursor-grabbing ${
                    isSelected ? 'bg-[#0f172a] border-l-4 border-l-blue-500' : 'hover:bg-slate-900/40'
                  } ${isDragging ? 'opacity-20 scale-95' : ''}`}
                >
                  <div className="mt-0.5 opacity-30 group-hover:opacity-100 transition-opacity text-slate-500">
                    <GripVertical size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                       <h4 className={`text-xs font-black uppercase tracking-tight truncate flex-1 ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{note.title}</h4>
                       {note.isFavorite && (
                         <Star size={12} className="text-amber-500 fill-amber-500 flex-shrink-0 animate-in zoom-in duration-300" />
                       )}
                    </div>
                    <div className="text-[8px] font-black uppercase text-slate-700 mt-2">{new Date(note.updatedAt).toLocaleDateString()}</div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* COLUNA 3: EDITOR DE NOTAS */}
      <div className="flex-1 flex flex-col bg-[#030712] relative overflow-hidden">
        {activeNote ? (
          <>
            <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-black/20 flex-shrink-0">
               <div className="flex items-center gap-1">
                  <button onMouseDown={e => e.preventDefault()} onClick={() => execCommand('bold')} className="p-2 hover:bg-slate-800 rounded-sm text-slate-400 hover:text-white transition-all"><Bold size={16} /></button>
                  <button onMouseDown={e => e.preventDefault()} onClick={() => execCommand('italic')} className="p-2 hover:bg-slate-800 rounded-sm text-slate-400 hover:text-white transition-all"><Italic size={16} /></button>
                  <div className="relative" ref={colorPickerRef}>
                    <button onMouseDown={e => e.preventDefault()} onClick={() => setShowColorPicker(!showColorPicker)} className={`p-2 hover:bg-slate-800 rounded-sm transition-all ${showColorPicker ? 'text-blue-500 bg-blue-500/10' : 'text-slate-400 hover:text-white'}`}><Palette size={16} /></button>
                    {showColorPicker && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-[#030712] border border-slate-800 rounded-sm shadow-2xl z-[1000] p-3 grid grid-cols-5 gap-2">
                        {FONT_COLORS.map((color) => (<button key={color.value} onMouseDown={e => e.preventDefault()} onClick={() => handleFontColor(color.value)} className="w-6 h-6 rounded-full border border-white/10" style={{ backgroundColor: color.value }} />))}
                      </div>
                    )}
                  </div>
                  <button onMouseDown={e => e.preventDefault()} onClick={() => execCommand('insertUnorderedList')} className="p-2 hover:bg-slate-800 rounded-sm text-slate-400 hover:text-white transition-all"><List size={16} /></button>
               </div>
               <div className="flex items-center gap-3">
                  <button 
                    onClick={() => updateNoteInSupabase(activeNote.id, { isFavorite: !activeNote.isFavorite })} 
                    className={`p-2 rounded-sm transition-all ${activeNote.isFavorite ? 'text-amber-500 bg-amber-500/10' : 'text-slate-500 hover:bg-slate-800'}`}
                    title={activeNote.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    <Star size={18} fill={activeNote.isFavorite ? 'currentColor' : 'none'} className={activeNote.isFavorite ? 'animate-in zoom-in duration-300' : ''} />
                  </button>
                  <button onClick={() => handleDeleteClick(activeNote.id)} className="p-2 hover:text-rose-500 text-slate-500 transition-all"><Trash2 size={16} /></button>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar py-12 px-8 lg:px-24">
               <div className="flex items-center gap-4 mb-8 group">
                  <input 
                    className="flex-1 bg-transparent border-none focus:ring-0 text-3xl font-black text-white uppercase placeholder:text-slate-800" 
                    value={localTitle} 
                    placeholder="Título da Nota" 
                    onChange={e => handleTitleChange(e.target.value)} 
                  />
               </div>
               <div ref={editorRef} contentEditable onInput={handleInput} onKeyDown={handleKeyDown} className="w-full min-h-full text-slate-300 leading-relaxed text-base focus:outline-none note-editor prose prose-invert prose-blue max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-800" data-placeholder="Comece a documentar..." />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-10">
            <StickyNote size={64} className="mb-6" />
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Nenhuma nota ativa</h3>
          </div>
        )}
      </div>

      {/* Modais de Exclusão */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#030712] border border-slate-800 rounded-sm w-full max-w-xs p-6 text-center">
            <AlertTriangle size={24} className="text-rose-500 mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase text-slate-400 mb-6">Confirmar exclusão desta nota?</p>
            <div className="flex gap-2">
              <button onClick={() => setIsConfirmDeleteOpen(false)} className="flex-1 py-2 text-[10px] font-black uppercase text-slate-600 border border-slate-800 rounded-sm">Não</button>
              <button onClick={executeDelete} className="flex-1 py-2 text-[10px] font-black uppercase text-white bg-rose-600 rounded-sm">Sim, Apagar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesView;
