
import { DemandItem } from './types';

export const MOCK_DEMANDS: DemandItem[] = [
  {
    id: 'DEM-001',
    title: 'Análise de Risco Trimestral',
    requester: 'Diretoria Financeira',
    responsible: 'Carlos Andrade',
    contract: 'CONTR-2024-08',
    startDate: '01 Out, 2025',
    dueDate: '25 Out, 2025',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    difficulty: 'DIFÍCIL',
    pomodoros: 0,
    description: 'Preparar relatório detalhado de riscos operacionais para o Q4.',
    subActivities: [
      { id: 'sub-1', title: 'Coletar dados do setor A', completed: true },
      { id: 'sub-2', title: 'Entrevistar gestores', completed: false }
    ],
    order: 0
  },
  {
    id: 'DEM-002',
    title: 'Atualização de Contratos PJ',
    requester: 'Jurídico',
    responsible: 'Beatriz Silva',
    contract: 'CONTR-2025-12',
    startDate: '15 Out, 2025',
    dueDate: '30 Out, 2025',
    status: 'OPEN',
    priority: 'MEDIUM',
    difficulty: 'MÉDIA',
    pomodoros: 0,
    description: 'Revisar cláusulas de confidencialidade nos novos contratos.',
    subActivities: [],
    order: 1
  },
  {
    id: 'DEM-003',
    title: 'Auditoria Interna Sistemas',
    requester: 'TI Segurança',
    responsible: 'Ricardo Lima',
    contract: 'SV-TI-2025',
    startDate: '05 Nov, 2025',
    dueDate: '15 Nov, 2025',
    status: 'BLOCKED',
    priority: 'HIGH',
    difficulty: 'EXTREMA',
    pomodoros: 0,
    description: 'Verificação de logs de acesso aos servidores principais.',
    subActivities: [],
    order: 2
  },
  {
    id: 'DEM-004',
    title: 'Apresentação de Resultados',
    requester: 'Marketing',
    responsible: 'Ana Costa',
    contract: 'MKT-001-2025',
    startDate: '10 Out, 2025',
    dueDate: '20 Out, 2025',
    status: 'COMPLETED',
    priority: 'LOW',
    difficulty: 'FÁCIL',
    pomodoros: 0,
    description: 'Consolidar métricas das campanhas de Setembro.',
    subActivities: [],
    order: 3
  }
];
