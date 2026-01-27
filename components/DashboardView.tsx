
import React, { useMemo } from 'react';
import { User, CheckCircle2, AlertTriangle, Clock, Target, ShieldCheck, Zap, AlertCircle, Timer, Milestone, UserPlus, Gauge, ArrowRight, TrendingUp, Info } from 'lucide-react';
import { DemandItem, Difficulty, Priority } from '../types';

interface DashboardViewProps {
  demands: DemandItem[];
}

const DashboardView: React.FC<DashboardViewProps> = ({ demands }) => {
  const DIFFICULTY_WEIGHTS: Record<Difficulty, number> = {
    'FÁCIL': 1, 'MÉDIA': 2, 'DIFÍCIL': 4, 'EXTREMA': 8
  };

  const parseDate = (dateStr: string): Date => {
    const months: Record<string, number> = {
      'Jan': 0, 'Fev': 1, 'Mar': 2, 'Abr': 3, 'Mai': 4, 'Jun': 5,
      'Jul': 6, 'Ago': 7, 'Set': 8, 'Out': 9, 'Nov': 10, 'Dez': 11
    };
    try {
      const parts = dateStr.replace(',', '').split(' ');
      if (parts.length < 3) return new Date(2099, 11, 31);
      const [day, monthStr, year] = parts;
      return new Date(parseInt(year), months[monthStr] || 0, parseInt(day));
    } catch {
      return new Date(2099, 11, 31);
    }
  };

  const processedStats = useMemo(() => {
    const now = new Date();
    const stats = demands.reduce((acc, demand) => {
      const resp = demand.responsible;
      if (!acc[resp]) {
        acc[resp] = {
          name: resp,
          total: 0,
          inProgress: 0,
          completed: 0,
          blocked: 0,
          overdue: 0,
          urgent: 0,
          onTime: 0,
          loadScore: 0,
          lastActivity: demand.dueDate
        };
      }

      const s = acc[resp];
      s.total += 1;
      if (demand.status === 'IN_PROGRESS') s.inProgress += 1;
      if (demand.status === 'COMPLETED') s.completed += 1;
      if (demand.status === 'BLOCKED') s.blocked += 1;

      if (demand.status !== 'COMPLETED' && demand.status !== 'CANCELLED') {
        const dueDate = parseDate(demand.dueDate);
        const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        
        if (diffDays < 0) s.overdue += 1;
        else if (diffDays <= 3) s.urgent += 1;
        else s.onTime += 1;

        s.loadScore += DIFFICULTY_WEIGHTS[demand.difficulty] || 0;
      }

      return acc;
    }, {} as Record<string, any>);

    return Object.values(stats).sort((a: any, b: any) => b.loadScore - a.loadScore);
  }, [demands]);

  const getCapacitySatus = (score: number) => {
    if (score === 0) return { label: 'DISPONÍVEL', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', desc: 'Capacidade livre detectada. Prontidão para novas demandas.' };
    if (score <= 6) return { label: 'CARGA IDEAL', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', desc: 'Fluxo equilibrado. Mantém ritmo de entrega estável.' };
    if (score <= 15) return { label: 'ATAREFADO', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', desc: 'Ocupação elevada. Recomenda-se evitar novas alocações.' };
    return { label: 'SATURADO', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30', desc: 'Risco de gargalo. Requer redistribuição de tarefas imediata.' };
  };

  return (
    <div className="flex flex-col h-full space-y-6 no-scrollbar pb-10">
      {/* Resumo de Gestão */}
      <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0f172a]/40 border border-slate-800 p-4 rounded-sm flex items-center justify-between">
          <div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Capacidade Squad</p>
            <h2 className="text-xl font-black text-white">84% <span className="text-[10px] text-emerald-500 font-bold">Saudável</span></h2>
          </div>
          <Gauge className="text-emerald-500" size={24} />
        </div>
        <div className="bg-[#0f172a]/40 border border-slate-800 p-4 rounded-sm flex items-center justify-between">
          <div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Alertas de Prazo</p>
            <h2 className="text-xl font-black text-white">{demands.filter(d => d.status !== 'COMPLETED').length} <span className="text-[10px] text-rose-500 font-bold">Pendentes</span></h2>
          </div>
          <AlertCircle className="text-rose-500" size={24} />
        </div>
        <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-sm flex items-center justify-between">
          <div>
            <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Próxima Alocação</p>
            <h2 className="text-xl font-black text-white uppercase">{processedStats.find(s => s.loadScore < 7)?.name || 'Ninguém'}</h2>
          </div>
          <UserPlus className="text-blue-500" size={24} />
        </div>
      </div>

      {/* Grid de Colaboradores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-y-auto no-scrollbar">
        {processedStats.map((stats: any) => {
          const cap = getCapacitySatus(stats.loadScore);
          const totalActive = stats.onTime + stats.urgent + stats.overdue;
          const healthPerc = totalActive > 0 ? Math.round(((stats.onTime) / totalActive) * 100) : 100;

          return (
            <div key={stats.name} className="bg-[#030712] border border-slate-800 rounded-sm flex flex-col shadow-2xl hover:border-slate-700 transition-all overflow-hidden group">
              {/* Identificação e Status Operacional */}
              <div className="p-4 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-sm bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:border-blue-500 transition-colors">
                     <User size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">{stats.name}</h3>
                    <div className={`mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[9px] font-black ${cap.bg} ${cap.color} border ${cap.border}`}>
                       <ShieldCheck size={10} fill="currentColor" /> {cap.label}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                   <div className="text-2xl font-black text-white tabular-nums leading-none">{stats.loadScore}</div>
                   <div className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">Índice de Carga</div>
                </div>
              </div>

              {/* Métricas de Trabalho */}
              <div className="p-5 grid grid-cols-2 gap-8">
                
                {/* Ocupação */}
                <div className="space-y-6">
                  <div>
                    <label className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] block mb-3">Distribuição de Volume</label>
                    <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                       <div 
                         className={`h-full rounded-full transition-all duration-1000 ${stats.loadScore > 15 ? 'bg-rose-500' : stats.loadScore > 6 ? 'bg-yellow-500' : 'bg-emerald-500'}`} 
                         style={{ width: `${Math.min((stats.loadScore / 20) * 100, 100)}%` }}
                       />
                    </div>
                    <div className="flex justify-between mt-2">
                       <span className="text-[9px] font-black text-slate-400 uppercase">Tarefas Ativas: {totalActive}</span>
                       <span className="text-[9px] font-black text-slate-400 uppercase">Total: {stats.total}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/20 border border-slate-800/50 p-3 rounded-sm">
                     <p className="text-[9px] text-slate-400 font-medium leading-relaxed italic">
                        <Info size={10} className="inline mr-1 mb-0.5" />
                        "{cap.desc}"
                     </p>
                  </div>
                </div>

                {/* Integridade de Prazos */}
                <div className="space-y-4">
                  <label className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] block">Saúde de Entrega</label>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-sm bg-rose-500/5 border border-rose-500/10">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={12} className="text-rose-500" />
                        <span className="text-[10px] font-bold text-slate-300">Atrasado / Crítico</span>
                      </div>
                      <span className="text-xs font-black text-rose-500">{stats.overdue + stats.urgent}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-sm bg-emerald-500/5 border border-emerald-500/10">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-300">Dentro do Cronograma</span>
                      </div>
                      <span className="text-xs font-black text-emerald-500">{stats.onTime}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-sm bg-slate-900/50 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <Milestone size={12} className="text-slate-600" />
                        <span className="text-[10px] font-bold text-slate-500">Bloqueios Ativos</span>
                      </div>
                      <span className="text-xs font-black text-slate-400">{stats.blocked}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Veredito de Gestão (Algoritmo do Sistema) */}
              <div className="mt-auto px-5 py-3 bg-black/40 border-t border-slate-800 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <TrendingUp size={14} className={healthPerc > 80 ? 'text-emerald-500' : 'text-yellow-500'} />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                       Confiabilidade: <span className="text-white">{healthPerc}%</span>
                    </span>
                 </div>
                 <button className="flex items-center gap-2 text-[9px] font-black text-blue-400 hover:text-white uppercase tracking-widest transition-colors">
                    Relatório Detalhado <ArrowRight size={12} />
                 </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardView;
