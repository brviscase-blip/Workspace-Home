
import React, { useMemo } from 'react';
import { User, ShieldCheck, Zap, AlertCircle, CheckCircle2, Milestone, TrendingUp, ArrowRight, Gauge, Clock, Target, AlertTriangle } from 'lucide-react';
import { DemandItem, Difficulty } from '../types';

interface EfficiencyViewProps {
  demands: DemandItem[];
}

const EfficiencyView: React.FC<EfficiencyViewProps> = ({ demands }) => {
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
    const statsMap: Record<string, any> = {};

    demands.forEach(demand => {
      const resp = demand.responsible || 'Sem Atribuição';
      if (!statsMap[resp]) {
        statsMap[resp] = {
          name: resp,
          total: 0,
          completed: 0,
          active: 0,
          overdue: 0,
          onTime: 0,
          blocked: 0,
          loadScore: 0,
          difficulties: { 'FÁCIL': 0, 'MÉDIA': 0, 'DIFÍCIL': 0, 'EXTREMA': 0 }
        };
      }

      const s = statsMap[resp];
      s.total += 1;
      s.difficulties[demand.difficulty] += 1;

      if (demand.status === 'COMPLETED') {
        s.completed += 1;
      } else if (demand.status !== 'CANCELLED') {
        s.active += 1;
        if (demand.status === 'BLOCKED') s.blocked += 1;

        // Deadline check
        const dueDate = parseDate(demand.dueDate);
        if (dueDate < now) {
          s.overdue += 1;
        } else {
          s.onTime += 1;
        }

        // Weighted load score
        s.loadScore += DIFFICULTY_WEIGHTS[demand.difficulty] || 0;
      }
    });

    return Object.values(statsMap).sort((a, b) => b.loadScore - a.loadScore);
  }, [demands]);

  const getCapacityStatus = (score: number) => {
    if (score === 0) return { label: 'DISPONÍVEL', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', desc: 'Capacidade livre detectada.' };
    if (score <= 6) return { label: 'CARGA IDEAL', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', desc: 'Fluxo equilibrado.' };
    if (score <= 15) return { label: 'ATAREFADO', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', desc: 'Ocupação elevada.' };
    return { label: 'SATURADO', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30', desc: 'Risco de gargalo.' };
  };

  const globalProductivity = demands.length > 0 
    ? Math.round((demands.filter(d => d.status === 'COMPLETED').length / demands.length) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full space-y-6 overflow-y-auto no-scrollbar pb-10">
      {/* Resumo de Gestão do Squad */}
      <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0f172a]/40 border border-slate-800 p-4 rounded-sm flex items-center justify-between">
          <div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Squad Health</p>
            <h2 className="text-xl font-black text-white">{globalProductivity}% <span className="text-[10px] text-emerald-500 font-bold">Taxa Entrega</span></h2>
          </div>
          <Gauge className="text-emerald-500" size={24} />
        </div>
        <div className="bg-[#0f172a]/40 border border-slate-800 p-4 rounded-sm flex items-center justify-between">
          <div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Atrasos Críticos</p>
            <h2 className="text-xl font-black text-white">{demands.filter(d => d.status !== 'COMPLETED' && parseDate(d.dueDate) < new Date()).length} <span className="text-[10px] text-rose-500 font-bold">Incidentes</span></h2>
          </div>
          <AlertCircle className="text-rose-500" size={24} />
        </div>
        <div className="bg-[#0f172a]/40 border border-slate-800 p-4 rounded-sm flex items-center justify-between">
          <div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Tarefas Ativas</p>
            <h2 className="text-xl font-black text-white">{demands.filter(d => d.status !== 'COMPLETED').length} <span className="text-[10px] text-blue-500 font-bold">Total</span></h2>
          </div>
          <Milestone className="text-blue-500" size={24} />
        </div>
        <div className="bg-[#0f172a]/40 border border-slate-800 p-4 rounded-sm flex items-center justify-between">
          <div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Membros Ativos</p>
            <h2 className="text-xl font-black text-white">{processedStats.length} <span className="text-[10px] text-slate-500 font-bold">Colaboradores</span></h2>
          </div>
          <User className="text-slate-500" size={24} />
        </div>
      </div>

      {/* Grid de Painéis Individuais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {processedStats.map((stats: any) => {
          const cap = getCapacityStatus(stats.loadScore);
          const productivity = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
          const healthPerc = stats.active > 0 ? Math.round((stats.onTime / stats.active) * 100) : 100;

          return (
            <div key={stats.name} className="bg-[#030712] border border-slate-800 rounded-sm flex flex-col shadow-2xl hover:border-slate-700 transition-all overflow-hidden group">
              {/* Header do Responsável */}
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

              {/* Corpo: Métricas e Dificuldade */}
              <div className="p-5 grid grid-cols-2 gap-8">
                
                {/* Coluna 1: Alocação e Produtividade */}
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                       <label className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">Produtividade Histórica</label>
                       <span className="text-[10px] font-black text-white">{productivity}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                       <div 
                         className={`h-full rounded-full transition-all duration-1000 ${productivity > 80 ? 'bg-emerald-500' : productivity > 40 ? 'bg-blue-500' : 'bg-slate-700'}`} 
                         style={{ width: `${productivity}%` }}
                       />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                     <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-sm text-center">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total</p>
                        <p className="text-lg font-black text-white">{stats.total}</p>
                     </div>
                     <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-sm text-center">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Ativas</p>
                        <p className="text-lg font-black text-blue-400">{stats.active}</p>
                     </div>
                  </div>
                </div>

                {/* Coluna 2: Dificuldade e Prazos */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] block mb-2">Mix de Complexidade</label>
                    <div className="flex h-4 w-full rounded-sm overflow-hidden border border-slate-800">
                       {Object.entries(stats.difficulties).map(([dif, count]: [any, any]) => {
                         const perc = stats.total > 0 ? (count / stats.total) * 100 : 0;
                         const color = dif === 'EXTREMA' ? 'bg-rose-600' : dif === 'DIFÍCIL' ? 'bg-orange-500' : dif === 'MÉDIA' ? 'bg-amber-500' : 'bg-emerald-500';
                         if (count === 0) return null;
                         return (
                           <div key={dif} style={{ width: `${perc}%` }} className={`${color} h-full border-r border-slate-900/20`} title={`${dif}: ${count}`} />
                         );
                       })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-sm bg-rose-500/5 border border-rose-500/10">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={12} className="text-rose-500" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Atrasado</span>
                      </div>
                      <span className="text-xs font-black text-rose-500">{stats.overdue}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-sm bg-emerald-500/5 border border-emerald-500/10">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Em Dia</span>
                      </div>
                      <span className="text-xs font-black text-emerald-500">{stats.onTime}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer de Resumo Técnico */}
              <div className="mt-auto px-5 py-3 bg-black/40 border-t border-slate-800 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <TrendingUp size={14} className={healthPerc > 80 ? 'text-emerald-500' : 'text-yellow-500'} />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                       Índice de Confiança: <span className="text-white">{healthPerc}%</span>
                    </span>
                 </div>
                 <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                       <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Bloqueios: {stats.blocked}</span>
                    </div>
                    <button className="flex items-center gap-2 text-[9px] font-black text-blue-400 hover:text-white uppercase tracking-widest transition-colors">
                       Ver Atividades <ArrowRight size={12} />
                    </button>
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EfficiencyView;
