import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, ShieldAlert, Archive, Hammer, X } from 'lucide-react';
import { Peca } from '../types';

interface EstoqueProps {
  pecas: Peca[];
  addPeca: (part: Omit<Peca, 'id'>) => Peca;
  updatePeca: (part: Peca) => void;
  deletePeca: (id: string) => void;
  adjustStock: (id: string, amount: number) => void;
}

export default function Estoque({
  pecas,
  addPeca,
  updatePeca,
  deletePeca,
  adjustStock
}: EstoqueProps) {
  // States
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'todas' | 'baixos'>('todas');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Peca | null>(null);

  // Form Fields
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [quantidadeEstoque, setQuantidadeEstoque] = useState<number>(10);
  const [estoqueMinimo, setEstoqueMinimo] = useState<number>(3);
  const [valorCusto, setValorCusto] = useState<number>(0);
  const [valorVenda, setValorVenda] = useState<number>(0);

  // Open creation
  const handleOpenCreate = () => {
    setEditingPart(null);
    setNome('');
    setCodigo('');
    setDescricao('');
    setQuantidadeEstoque(10);
    setEstoqueMinimo(3);
    setValorCusto(0);
    setValorVenda(0);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (part: Peca) => {
    setEditingPart(part);
    setNome(part.nome);
    setCodigo(part.codigo);
    setDescricao(part.descricao || '');
    setQuantidadeEstoque(part.quantidade_estoque);
    setEstoqueMinimo(part.estoque_minimo);
    setValorCusto(part.valor_custo);
    setValorVenda(part.valor_venda);
    setIsFormOpen(true);
  };

  // Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !codigo.trim()) return alert('Nome e código da peça são obrigatórios!');

    const partData = {
      nome,
      codigo: codigo.toUpperCase(),
      descricao,
      quantidade_estoque: Number(quantidadeEstoque),
      estoque_minimo: Number(estoqueMinimo),
      valor_custo: Number(valorCusto),
      valor_venda: Number(valorVenda),
      status: 'ativo' as const
    };

    if (editingPart) {
      updatePeca({
        ...editingPart,
        ...partData
      });
    } else {
      addPeca(partData);
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Deseja realmente remover a peça "${name}" do almoxarifado?`)) {
      deletePeca(id);
    }
  };

  // Filter list
  const filteredPecas = pecas.filter(p => {
    const matchesSearch = 
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo.toLowerCase().includes(search.toLowerCase()) ||
      (p.descricao && p.descricao.toLowerCase().includes(search.toLowerCase()));

    const isLow = p.quantidade_estoque <= p.estoque_minimo;
    const matchesStock = stockFilter === 'todas' || isLow;

    return matchesSearch && matchesStock;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Almoxarifado & Estoque</h1>
          <p className="text-slate-500 text-xs mt-0.5">Controle de peças de reposição, fluidos refrigerantes e capacitores.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
        >
          <Plus className="w-4 h-4" /> Adicionar Peça
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center shadow-xs">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar peça por nome, código de barra ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg text-xs transition outline-hidden"
          />
        </div>

        {/* Stock Filter tabs */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setStockFilter('todas')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition ${
              stockFilter === 'todas'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Todos os Itens
          </button>
          <button
            onClick={() => setStockFilter('baixos')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition flex items-center gap-1 ${
              stockFilter === 'baixos'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Estoque Baixo
          </button>
        </div>
      </div>

      {/* Grid of Parts */}
      {filteredPecas.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-100 text-slate-400 space-y-2">
          <Archive className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold">Nenhuma peça encontrada no almoxarifado</p>
          <p className="text-xs">Registre peças para utilizá-las no faturamento das ordens de serviço.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPecas.map((part) => {
            const isLow = part.quantidade_estoque <= part.estoque_minimo;
            const markupPercent = part.valor_custo > 0 
              ? Math.round(((part.valor_venda - part.valor_custo) / part.valor_custo) * 100)
              : 0;

            return (
              <div 
                key={part.id}
                className={`bg-white rounded-xl border p-5 shadow-xs transition flex flex-col justify-between space-y-4 ${
                  isLow ? 'border-amber-200 bg-amber-50/5' : 'border-slate-100 hover:border-blue-200'
                }`}
              >
                <div className="space-y-3">
                  {/* Top line with code and low stock indicator */}
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-600">
                      {part.codigo}
                    </span>

                    {isLow && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded-sm uppercase tracking-wide flex items-center gap-1 animate-pulse">
                        <ShieldAlert className="w-3 h-3" /> Estoque Crítico
                      </span>
                    )}
                  </div>

                  {/* Name and description */}
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{part.nome}</h3>
                    {part.descricao && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">{part.descricao}</p>
                    )}
                  </div>

                  {/* Stock Counters */}
                  <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                    <div className="text-center flex-1">
                      <span className="text-[10px] text-slate-400 block font-medium uppercase">Almoxarifado</span>
                      <strong className={`text-lg font-mono block font-black ${isLow ? 'text-amber-600' : 'text-slate-850'}`}>
                        {part.quantidade_estoque}
                      </strong>
                    </div>
                    <div className="border-r border-slate-200 h-8"></div>
                    <div className="text-center flex-1">
                      <span className="text-[10px] text-slate-400 block font-medium uppercase">Estoque Mínimo</span>
                      <strong className="text-lg font-mono text-slate-600 block font-bold">
                        {part.estoque_minimo}
                      </strong>
                    </div>
                  </div>

                  {/* Cost & Margins pricing */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50 text-xs">
                    <div>
                      <span className="text-slate-400 block">Preço de Custo:</span>
                      <span className="font-mono font-medium text-slate-600">R$ {part.valor_custo.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block">Preço de Venda:</span>
                      <span className="font-mono font-bold text-blue-800 text-sm">R$ {part.valor_venda.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {markupPercent > 0 && (
                    <div className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                      Margem Lucro: +{markupPercent}%
                    </div>
                  )}
                </div>

                {/* Stock adjustments and actions */}
                <div className="pt-3 border-t border-slate-50 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                    <button
                      onClick={() => adjustStock(part.id, -1)}
                      className="px-2 py-1 text-xs font-bold hover:bg-white hover:shadow-xs rounded transition"
                      title="Diminuir estoque"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono font-bold px-2 text-slate-700">{part.quantidade_estoque}</span>
                    <button
                      onClick={() => adjustStock(part.id, 1)}
                      className="px-2 py-1 text-xs font-bold hover:bg-white hover:shadow-xs rounded transition"
                      title="Aumentar estoque"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(part)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 rounded-lg transition"
                      title="Editar Peça"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(part.id, part.nome)}
                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-lg transition"
                      title="Excluir Peça"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-over Drawer Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50 animate-fade-in">
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-800">
                  {editingPart ? 'Editar Cadastro de Peça' : 'Novo Cadastro de Peça'}
                </h2>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {/* Nome */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome Comercial da Peça *</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Gás Refrigerante R410A botija"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                  />
                </div>

                {/* Código */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Código de Referência / SKU *</label>
                  <input
                    type="text"
                    required
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="Ex: GAS-R410A"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition font-mono"
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Descrição do Componente</label>
                  <textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    rows={2}
                    placeholder="Ex: Fluidos de alta qualidade para compressores Inverter..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                  />
                </div>

                {/* Quantidades: Estoque e Estoque Mínimo */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Quantidade em Estoque *</label>
                    <input
                      type="number"
                      required
                      value={quantidadeEstoque}
                      onChange={(e) => setQuantidadeEstoque(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Limite Mínimo de Alerta *</label>
                    <input
                      type="number"
                      required
                      value={estoqueMinimo}
                      onChange={(e) => setEstoqueMinimo(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition text-right"
                    />
                  </div>
                </div>

                {/* Valores Financeiros */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Preço de Custo Unitário (R$)</label>
                    <input
                      type="number"
                      value={valorCusto}
                      onChange={(e) => setValorCusto(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition text-right font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Preço de Venda Unitário (R$)</label>
                    <input
                      type="number"
                      value={valorVenda}
                      onChange={(e) => setValorVenda(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition text-right font-mono font-bold"
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex gap-3">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="flex-1 py-2 text-xs font-semibold border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Salvar Cadastro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
