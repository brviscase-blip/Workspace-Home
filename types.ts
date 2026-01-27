
import React from 'react';

export type ViewType = 'DEMANDAS' | 'NOTAS' | 'TAREFAS';
export type LayoutType = 'GRID' | 'TABLE' | 'KANBAN';
export type FileCategory = 'TODOS OS ATIVOS' | 'DOCUMENTOS' | 'FINANCEIROS' | 'JURÍDICOS';
export type DemandStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type Difficulty = 'FÁCIL' | 'MÉDIA' | 'DIFÍCIL' | 'EXTREMA';

export interface FileItem {
  id: string;
  name: string;
  category: string;
  size: string;
  type: 'doc' | 'excel' | 'ppt' | 'pdf' | 'security';
  filterCategory: FileCategory;
}

export interface SubActivity {
  id: string;
  title: string;
  completed: boolean;
}

export interface DailyTask {
  id: string;
  title: string;
  completed: boolean;
  user_name: string;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  demand_id: string;
  duration: number;
  date: string;
}

export interface DemandItem {
  id: string;
  title: string;
  requester: string;
  responsible: string;
  contract: string;
  startDate: string;
  dueDate: string;
  status: DemandStatus;
  priority: Priority;
  difficulty: Difficulty;
  pomodoros: number;
  description: string;
  subActivities: SubActivity[];
  order?: number;
  isTimerRunning?: boolean;
  timerStartedAt?: string | null;
  dailyLogs?: Record<string, number>; // Mapeia "YYYY-MM-DD" para segundos
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string;
  tags: string[];
  updatedAt: string;
  isFavorite: boolean;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
}

export interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}