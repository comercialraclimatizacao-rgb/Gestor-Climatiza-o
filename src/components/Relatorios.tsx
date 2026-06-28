import React from 'react';
import { BarChart, DollarSign, PieChart, FileText, TrendingUp, Users, Award, ShieldAlert, Star } from 'lucide-react';
import { OrdemServico, Cliente, Equipamento, Tecnico } from '../types';

interface RelatoriosProps {
  ordensServico: OrdemServico[];
  clientes: Cliente[];
  equipamentos: Equipamento[];
  tecnicos: Tecnico[];
}

export default function Relatorios({
  ordensServico,
  clientes,
  equipamentos,
  tecnicos
}: RelatoriosProps) {
  const [monthlyGoal, setMonthlyGoal] = React.useState(() => {
    const saved = localStorage.getItem('clima_monthly_goal');
    return saved ? Number(saved) : 15000;
  });
  const [isEditingGoal, setIsEditingGoal] = React.useState(false);
  const [tempGoal, setTempGoal] = React.useState(monthlyGoal.toString());
  
  // 1. Calculations
  const finalizedOS = ordensServico.filter(o => o.status === 'finalizada');
  const totalFaturamento = finalizedOS.reduce((sum, o) => sum + o.valor_total, 0);
  const mediaFaturamentoOS = finalizedOS.length > 0 ? totalFaturamento / finalizedOS.length : 0;

  // Breakdown of OS counts by category
  const categories = ['instalacao', 'manutencao_preventiva', 'manutencao_corretiva', 'limpeza', 'higienizacao', 'recarga_gas', 'visita_tecnica'];
  const categoryCounts = categories.map(cat => {
    const count = ordensServico.filter(o => o.tipo_servico === cat).length;
    return { name: cat.replace('_', ' '), count };
  }).sort((a, b) => b.count - a.count);

  // Performance of Technicians (Revenue generated from finalized OS)
  const techPerformance = tecnicos.map(t => {
    const jobs = finalizedOS.filter(o => o.tecnico_id === t.id);
    const revenue = jobs.reduce((sum, o) => sum + o.valor_total, 0);
    return {
      nome: t.nome,
      count: jobs.length,
      revenue
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Equipment brand breakdown (number of AC units registered)
  const brandStats: { [brand: string]: number } = {};
  equipamentos.forEach(eq => {
    const brand = eq.marca || 'Outras';
    brandStats[brand] = (brandStats[brand] || 0) + 1;
  });
  const sortedBrands = Object.entries(brandStats)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Relatórios & Estatísticas</h1>
        <p className="text-slate-500 text-xs mt-0.5 font-sans">Acompanhe faturamento de contratos, performance da equipe técnica e análises de equipamentos.</p>
      </div>

      {/* Dynamic customizable Monthly Goal Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 flex-1 w-full">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Meta de Faturamento Mensal</h2>
            {isEditingGoal ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(e.target.value)}
                  className="bg-slate-800 text-white text-xs px-2 py-1 rounded-md border border-slate-700 w-28 focus:outline-hidden focus:border-blue-500 font-mono"
                  placeholder="Meta (R$)"
                />
                <button
                  onClick={() => {
                    const num = Number(tempGoal);
                    if (isNaN(num) || num <= 0) return alert('Insira um valor válido');
                    setMonthlyGoal(num);
                    localStorage.setItem('clima_monthly_goal', num.toString());
                    setIsEditingGoal(false);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-md transition uppercase"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setIsEditingGoal(false)}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-[10px] px-2.5 py-1 rounded-md transition"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setTempGoal(monthlyGoal.toString());
                  setIsEditingGoal(true);
                }}
                className="text-xs text-blue-400 hover:text-blue-300 transition underline decoration-dotted underline-offset-4 font-semibold"
              >
                ✏️ Editar Meta
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              R$ {totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-sm text-slate-400">
              de R$ {monthlyGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Progress bar with percentage */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400">Progresso do Mês</span>
              <span className="font-mono text-blue-400">
                {Math.min(100, Math.round((totalFaturamento / monthlyGoal) * 100))}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalFaturamento / monthlyGoal) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-center justify-center p-4 bg-slate-800/50 rounded-lg border border-slate-800 shrink-0 w-48">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status da Meta</span>
          <span className="text-sm font-bold text-center mt-1">
            {totalFaturamento >= monthlyGoal ? (
              <span className="text-emerald-400">🎯 Meta Atingida!</span>
            ) : (
              <span className="text-amber-400">⚡ Em Andamento</span>
            )}
          </span>
          <span className="text-[11px] text-slate-400 text-center mt-1">
            {totalFaturamento >= monthlyGoal 
              ? 'Excelente desempenho!' 
              : `Faltam R$ ${Math.max(0, monthlyGoal - totalFaturamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          </span>
        </div>
      </div>

      {/* Overview stats panels */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Receita Acumulada</span>
            <span className="text-xl font-extrabold font-mono text-slate-800 block">
              R$ {totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">Total finalizado</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Ticket Médio por OS</span>
            <span className="text-xl font-extrabold font-mono text-blue-800 block">
              R$ {mediaFaturamentoOS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 block font-medium">Faturamento por chamado</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total de OS Emitidas</span>
            <span className="text-xl font-extrabold font-mono text-slate-800 block">
              {ordensServico.length}
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
              💡 {finalizedOS.length} concluídas ({ordensServico.length - finalizedOS.length} ativas)
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg text-slate-500">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Taxa de Conclusão</span>
            <span className="text-xl font-extrabold font-mono text-indigo-800 block">
              {ordensServico.length > 0 
                ? `${Math.round((finalizedOS.length / ordensServico.length) * 100)}%` 
                : '0%'}
            </span>
            <span className="text-[10px] text-slate-400 block font-medium">Eficiência de encerramento</span>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Graphs & Detailed Ledger Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Visual Category Breakdown SVG Graph */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <BarChart className="w-4.5 h-4.5 text-blue-600" /> Distribuição de Serviços (OS)
          </h2>

          <div className="space-y-4">
            {categoryCounts.map((cat, idx) => {
              const maxCount = Math.max(...categoryCounts.map(c => c.count)) || 1;
              const widthPct = (cat.count / maxCount) * 100;

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span className="capitalize">{cat.name}</span>
                    <span className="font-mono text-slate-500">{cat.count} OS</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Brand Reliability Stats */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <PieChart className="w-4.5 h-4.5 text-blue-600" /> Fabricantes Ativos em Clientes
          </h2>

          {sortedBrands.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">Nenhum ar-condicionado cadastrado no sistema.</p>
          ) : (
            <div className="space-y-3.5">
              {sortedBrands.map((brand, idx) => {
                const totalEqs = equipamentos.length || 1;
                const pct = Math.round((brand.count / totalEqs) * 100);

                return (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0"></span>
                      <strong className="font-bold text-slate-700">{brand.name}</strong>
                    </div>

                    <div className="flex items-center gap-4 text-right font-mono text-slate-500">
                      <span>{brand.count} Aparelhos</span>
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 rounded-sm">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top performing Technicians */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs space-y-4 lg:col-span-2">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Users className="w-4.5 h-4.5 text-blue-600" /> Faturamento de Mão de Obra por Técnico
          </h2>

          {techPerformance.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">Nenhum faturamento registrado no sistema.</p>
          ) : (
            <div className="border border-slate-100 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="p-3">Técnico</th>
                    <th className="p-3 text-center">Chamados Concluídos</th>
                    <th className="p-3 text-right">Faturamento Total Gerado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  {techPerformance.map((tp, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 flex items-center gap-2">
                        {idx === 0 && <Star className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />}
                        <span className="font-bold text-slate-800">{tp.nome}</span>
                      </td>
                      <td className="p-3 text-center font-mono font-semibold">{tp.count} OS</td>
                      <td className="p-3 text-right font-mono font-bold text-blue-800">
                        R$ {tp.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
