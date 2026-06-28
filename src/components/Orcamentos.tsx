import React, { useState } from 'react';
import { 
  FileText, Plus, Trash2, Printer, Check, Copy, Sparkles, 
  Settings2, User, Cpu, ShieldCheck, DollarSign, Calendar, FileCheck, Info
} from 'lucide-react';
import { Cliente, Equipamento, OrdemServico, EmpresaConfig } from '../types';

interface OrcamentosProps {
  clientes: Cliente[];
  equipamentos: Equipamento[];
  ordensServico: OrdemServico[];
  empresaConfig: EmpresaConfig;
}

interface ItemOrcamento {
  id: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
}

export default function Orcamentos({
  clientes,
  equipamentos,
  ordensServico,
  empresaConfig
}: OrcamentosProps) {
  // Budget creation form state
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [customClienteNome, setCustomClienteNome] = useState('');
  const [customClienteTel, setCustomClienteTel] = useState('');
  const [customClienteEnd, setCustomClienteEnd] = useState('');

  const [selectedEquipamentoId, setSelectedEquipamentoId] = useState<string>('');
  const [customEquipMarca, setCustomEquipMarca] = useState('');
  const [customEquipModelo, setCustomEquipModelo] = useState('');
  const [customEquipCapacidade, setCustomEquipCapacidade] = useState('12000 BTUs');

  const [numeroOrcamento, setNumeroOrcamento] = useState(() => `ORC-${Math.floor(1000 + Math.random() * 9000)}`);
  const [dataEmissao, setDataEmissao] = useState(() => new Date().toISOString().split('T')[0]);
  const [validadeDias, setValidadeDias] = useState(15);
  const [formaPagamento, setFormaPagamento] = useState('À vista com 5% de desconto, ou 3x sem juros no cartão');
  const [prazoExecucao, setPrazoExecucao] = useState('1 a 2 dias úteis após aprovação');
  const [garantiaMeses, setGarantiaMeses] = useState(12);
  const [observacoes, setObservacoes] = useState('Incluso materiais para fixação e furações em alvenaria. Não incluso pontos de energia elétrica por conta do cliente.');

  // Items list
  const [items, setItems] = useState<ItemOrcamento[]>([
    { id: '1', descricao: 'Higienização Completa de Ar Condicionado Split Evaporadora + Condensadora', quantidade: 1, valor_unitario: 180.00 },
    { id: '2', descricao: 'Carga de Gás Ecológico R410A com detecção prévia de vazamentos', quantidade: 1, valor_unitario: 220.00 },
    { id: '3', descricao: 'Suporte de Parede Reforçado com Amortecedores de Vibração', quantidade: 1, valor_unitario: 85.00 }
  ]);

  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemVal, setNewItemVal] = useState('');
  const [descontoPercent, setDescontoPercent] = useState(0);

  // Layout selection
  const [activeLayout, setActiveLayout] = useState<'timbrado' | 'moderno' | 'tecnico' | 'minimalista'>('timbrado');

  // Load from OrdemServico option
  const [selectedOSId, setSelectedOSId] = useState('');

  // Auto-fill from selected Client
  const handleClienteChange = (id: string) => {
    setSelectedClienteId(id);
    if (id && id !== 'custom') {
      const c = clientes.find(item => item.id === id);
      if (c) {
        setCustomClienteNome(c.nome);
        setCustomClienteTel(c.whatsapp || c.telefone || '');
        setCustomClienteEnd(c.endereco || '');
        
        // Filter equipments of this client
        const clientEqs = equipamentos.filter(e => e.cliente_id === id);
        if (clientEqs.length > 0) {
          setSelectedEquipamentoId(clientEqs[0].id);
          setCustomEquipMarca(clientEqs[0].marca);
          setCustomEquipModelo(clientEqs[0].modelo || '');
          setCustomEquipCapacidade(clientEqs[0].capacidade || '12000 BTUs');
        } else {
          setSelectedEquipamentoId('');
          setCustomEquipMarca('');
          setCustomEquipModelo('');
        }
      }
    } else {
      setCustomClienteNome('');
      setCustomClienteTel('');
      setCustomClienteEnd('');
      setSelectedEquipamentoId('');
      setCustomEquipMarca('');
      setCustomEquipModelo('');
    }
  };

  // Auto-fill from selected Equipment
  const handleEquipamentoChange = (id: string) => {
    setSelectedEquipamentoId(id);
    if (id && id !== 'custom') {
      const eq = equipamentos.find(e => e.id === id);
      if (eq) {
        setCustomEquipMarca(eq.marca);
        setCustomEquipModelo(eq.modelo || '');
        setCustomEquipCapacidade(eq.capacidade || '12000 BTUs');
      }
    } else {
      setCustomEquipMarca('');
      setCustomEquipModelo('');
    }
  };

  // Auto-fill from Ordem de Serviço
  const handleLoadFromOS = (osId: string) => {
    setSelectedOSId(osId);
    if (!osId) return;

    const os = ordensServico.find(o => o.id === osId);
    if (os) {
      // Set client
      handleClienteChange(os.cliente_id);
      
      // Set equipment
      const eq = equipamentos.find(e => e.id === os.equipamento_id);
      if (eq) {
        setSelectedEquipamentoId(eq.id);
        setCustomEquipMarca(eq.marca);
        setCustomEquipModelo(eq.modelo || '');
        setCustomEquipCapacidade(eq.capacidade || '12000 BTUs');
      }

      // Convert checklist or description into items
      const osItems: ItemOrcamento[] = [];
      
      if (os.descricao_servico) {
        osItems.push({
          id: `os_serv_${Date.now()}`,
          descricao: os.descricao_servico,
          quantidade: 1,
          valor_unitario: os.valor_total > 150 ? os.valor_total - 120 : os.valor_total
        });
      }

      if (os.pecas_utilizadas && os.pecas_utilizadas.length > 0) {
        os.pecas_utilizadas.forEach((p, idx) => {
          osItems.push({
            id: `os_peca_${Date.now()}_${idx}`,
            descricao: `Peça: ${p.nome_peca}`,
            quantidade: p.quantidade,
            valor_unitario: p.preco_unitario
          });
        });
      } else if (os.valor_total > 150) {
        osItems.push({
          id: `os_pecas_fallback_${Date.now()}`,
          descricao: 'Insumos, tubulações, abraçadeiras e fluído refrigerante inclusos',
          quantidade: 1,
          valor_unitario: 120.00
        });
      }

      setItems(osItems);
      setObservacoes(`Orçamento extraído a partir da Ordem de Serviço #${os.codigo_os}. ${observacoes}`);
    }
  };

  // Items Handlers
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemDesc) return alert('Por favor, digite a descrição do item.');
    const val = parseFloat(newItemVal) || 0;
    if (val <= 0) return alert('O valor unitário deve ser maior que zero.');

    const newItem: ItemOrcamento = {
      id: `item_${Date.now()}`,
      descricao: newItemDesc,
      quantidade: newItemQty,
      valor_unitario: val
    };

    setItems(prev => [...prev, newItem]);
    setNewItemDesc('');
    setNewItemQty(1);
    setNewItemVal('');
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Totals calculations
  const subtotal = items.reduce((sum, item) => sum + (item.quantidade * item.valor_unitario), 0);
  const valorDesconto = (subtotal * descontoPercent) / 100;
  const valorTotal = subtotal - valorDesconto;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1 print:p-0 print:bg-white select-text">
      
      {/* HEADER BANNER - Hidden on Print */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-950 p-5 rounded-2xl text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold font-sans tracking-tight">Gerador de Orçamentos com Papel Timbrado</h1>
          <p className="text-blue-100 text-xs font-sans max-w-2xl">
            Crie propostas de altíssima conversão técnica para seus clientes. Alterne instantaneamente entre os 4 layouts de timbrados oficiais da R.A Climatização e mande por WhatsApp ou imprima.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrint}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* QUICK PRE-FILL ACTION - Hidden on Print */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-800 rounded-lg shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide">Importar de Ordem de Serviço</h3>
            <p className="text-[11px] text-blue-700 mt-0.5">Selecione uma OS cadastrada para preencher o orçamento instantaneamente.</p>
          </div>
        </div>
        
        <select
          value={selectedOSId}
          onChange={e => handleLoadFromOS(e.target.value)}
          className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-bold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-72"
        >
          <option value="">-- Selecionar OS --</option>
          {ordensServico.map(os => {
            const client = clientes.find(c => c.id === os.cliente_id);
            return (
              <option key={os.id} value={os.id}>
                OS #{os.codigo_os} - {client?.nome || 'Cliente'} (R$ {os.valor_total})
              </option>
            );
          })}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: EDITING FORM - 5 cols - Hidden on Print */}
        <div className="lg:col-span-5 space-y-6 print:hidden">
          
          {/* CLIENT & EQUIPMENT INFO */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" /> Dados do Cliente e Equipamento
            </h3>

            {/* Select Client */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase block">Selecione o Cliente Cadastrado</label>
              <select
                value={selectedClienteId}
                onChange={e => handleClienteChange(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Digitar Manualmente --</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            {/* Client manual inputs */}
            <div className="grid grid-cols-1 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Nome do Cliente</label>
                <input 
                  type="text" 
                  value={customClienteNome}
                  onChange={e => setCustomClienteNome(e.target.value)}
                  placeholder="Ex: Condomínio Edifício Real"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Contato / Telefone</label>
                  <input 
                    type="text" 
                    value={customClienteTel}
                    onChange={e => setCustomClienteTel(e.target.value)}
                    placeholder="Ex: (11) 99999-8888"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Capacidade Equipamento</label>
                  <select
                    value={customEquipCapacidade}
                    onChange={e => setCustomEquipCapacidade(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                  >
                    <option value="9000 BTUs">9.000 BTUs</option>
                    <option value="12000 BTUs">12.000 BTUs</option>
                    <option value="18000 BTUs">18.000 BTUs</option>
                    <option value="24000 BTUs">24.000 BTUs</option>
                    <option value="30000 BTUs">30.000 BTUs</option>
                    <option value="36000 BTUs">36.000 BTUs</option>
                    <option value="60000 BTUs">60.000 BTUs</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Endereço do Cliente</label>
                <input 
                  type="text" 
                  value={customClienteEnd}
                  onChange={e => setCustomClienteEnd(e.target.value)}
                  placeholder="Ex: Alameda Lorena, 1500 - Ap 42"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                />
              </div>
            </div>

            {/* Equipment details */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Marca do Aparelho</label>
                <input 
                  type="text" 
                  value={customEquipMarca}
                  onChange={e => setCustomEquipMarca(e.target.value)}
                  placeholder="Ex: Daikin, Fujitsu, LG"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Modelo / Tipo</label>
                <input 
                  type="text" 
                  value={customEquipModelo}
                  onChange={e => setCustomEquipModelo(e.target.value)}
                  placeholder="Ex: Inverter Hi-Wall"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* BUDGET METADATA & TERMS */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Settings2 className="w-4 h-4 text-indigo-600" /> Condições Comerciais e Prazos
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Número Proposta</label>
                <input 
                  type="text" 
                  value={numeroOrcamento}
                  onChange={e => setNumeroOrcamento(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Validade da Proposta</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={validadeDias}
                    onChange={e => setValidadeDias(parseInt(e.target.value) || 10)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold pr-10"
                  />
                  <span className="absolute right-3 top-1.5 text-[10px] text-slate-400 font-bold">dias</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase block">Forma de Pagamento</label>
              <input 
                type="text" 
                value={formaPagamento}
                onChange={e => setFormaPagamento(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Prazo de Execução</label>
                <input 
                  type="text" 
                  value={prazoExecucao}
                  onChange={e => setPrazoExecucao(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Garantia (Meses)</label>
                <input 
                  type="number" 
                  value={garantiaMeses}
                  onChange={e => setGarantiaMeses(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase block">Observações / Escopo Adicional</label>
              <textarea
                rows={2}
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium resize-none focus:outline-none"
              ></textarea>
            </div>
          </div>

          {/* PROPOSAL ITEMS */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" /> Itens e Serviços do Orçamento
              </h3>
              <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">
                {items.length} itens
              </span>
            </div>

            {/* List of current items */}
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100 group">
                  <div className="space-y-0.5 max-w-[80%]">
                    <p className="text-xs font-semibold text-slate-700 truncate">{item.descricao}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {item.quantidade}x R$ {item.valor_unitario.toLocaleString('pt-BR')} = <span className="font-bold text-slate-600">R$ {(item.quantidade * item.valor_unitario).toLocaleString('pt-BR')}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1 text-slate-400 hover:text-red-500 transition shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-[11px] text-slate-400 text-center py-4 italic">Nenhum item adicionado à proposta.</p>
              )}
            </div>

            {/* Form to add item */}
            <form onSubmit={handleAddItem} className="space-y-2 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <input 
                  type="text" 
                  placeholder="Descrição do Serviço ou Peça..." 
                  value={newItemDesc}
                  onChange={e => setNewItemDesc(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <input 
                    type="number" 
                    min="1"
                    placeholder="Qtd" 
                    value={newItemQty}
                    onChange={e => setNewItemQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="Valor Unitário (R$)" 
                    value={newItemVal}
                    onChange={e => setNewItemVal(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-1.5 bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Adicionar Item à Proposta
              </button>
            </form>

            {/* Discount Control */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Aplicar Desconto (%)</span>
              <div className="relative w-24">
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  value={descontoPercent}
                  onChange={e => setDescontoPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-right pr-6"
                />
                <span className="absolute right-2 top-1 text-xs text-slate-400 font-bold">%</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: TIMBRADO PREVIEW FRAME - 7 cols */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* SWITCH TIMBRADO LAYOUT BAR - Hidden on Print */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs print:hidden space-y-2">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Selecione o Tipo de Papel Timbrado (4 Opções Disponíveis)
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => setActiveLayout('timbrado')}
                className={`py-2 px-1 text-[11px] font-extrabold rounded-lg transition border text-center cursor-pointer ${activeLayout === 'timbrado' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'}`}
              >
                1. Timbrado R.A
              </button>
              <button
                onClick={() => setActiveLayout('moderno')}
                className={`py-2 px-1 text-[11px] font-extrabold rounded-lg transition border text-center cursor-pointer ${activeLayout === 'moderno' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'}`}
              >
                2. Moderno Ex.
              </button>
              <button
                onClick={() => setActiveLayout('tecnico')}
                className={`py-2 px-1 text-[11px] font-extrabold rounded-lg transition border text-center cursor-pointer ${activeLayout === 'tecnico' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'}`}
              >
                3. Técnico Det.
              </button>
              <button
                onClick={() => setActiveLayout('minimalista')}
                className={`py-2 px-1 text-[11px] font-extrabold rounded-lg transition border text-center cursor-pointer ${activeLayout === 'minimalista' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'}`}
              >
                4. Minimalista
              </button>
            </div>
          </div>

          {/* THE PREVIEW WRAPPER */}
          <div className="bg-slate-100 p-4 sm:p-6 rounded-2xl border border-slate-200 flex justify-center shadow-inner overflow-x-auto print:p-0 print:border-none print:bg-white print:shadow-none">
            
            {/* A4 PROPORTION SHEET */}
            <div id="print-sheet" className="w-[210mm] min-h-[297mm] bg-white p-[15mm] relative shadow-lg print:shadow-none print:p-0 print:w-full select-text shrink-0">
              
              {/* 1. TIMBRADO OFICIAL LAYOUT (BLUE AND CYAN WAVES / HEADER DETAILS) */}
              {activeLayout === 'timbrado' && (
                <div className="h-full flex flex-col justify-between font-sans text-slate-800">
                  {/* WATERMARK BACKGROUND */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden">
                    <span className="text-[200px] leading-none">🌬️</span>
                  </div>

                  <div>
                    {/* Header bar and branding */}
                    <div className="flex justify-between items-start border-b-2 border-blue-600 pb-5 mb-6 relative">
                      {/* Wave logo representation */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-700 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-sm">
                          RA
                        </div>
                        <div>
                          <h2 className="text-xl font-extrabold text-blue-900 tracking-tight leading-tight">R.A Climatização</h2>
                          <p className="text-[10px] text-cyan-600 font-bold uppercase tracking-widest leading-none mt-0.5">Instalação & Manutenção Preventiva</p>
                        </div>
                      </div>
                      
                      {/* Top Right Blue Aesthetic Accent */}
                      <div className="text-right space-y-1">
                        <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white px-3 py-1 rounded text-[11px] font-extrabold uppercase tracking-widest inline-block">
                          PROPOSTA COMERCIAL
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono font-semibold">Reg.: {numeroOrcamento}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Data: {dataEmissao.split('-').reverse().join('/')}</p>
                      </div>
                    </div>

                    {/* Meta info columns */}
                    <div className="grid grid-cols-2 gap-8 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100 text-xs">
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-blue-700 uppercase tracking-wider">Prestador de Serviço:</p>
                        <p className="font-extrabold text-slate-800">{empresaConfig.nome_empresa}</p>
                        <p className="text-slate-500">CNPJ: {empresaConfig.cnpj}</p>
                        <p className="text-slate-500">Endereço: {empresaConfig.endereco}</p>
                        <p className="text-slate-500">Tel/Whats: {empresaConfig.whatsapp}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-blue-700 uppercase tracking-wider">Cliente destinatário:</p>
                        <p className="font-extrabold text-slate-800">{customClienteNome || '[Nome do Cliente]'}</p>
                        {customClienteTel && <p className="text-slate-500">Contato: {customClienteTel}</p>}
                        {customClienteEnd && <p className="text-slate-500">Localização: {customClienteEnd}</p>}
                        {(customEquipMarca || customEquipModelo) && (
                          <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-blue-800 font-semibold">
                            <span>❄️</span>
                            <span>{customEquipMarca} {customEquipModelo} ({customEquipCapacidade})</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Table of items */}
                    <div className="mb-6">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-blue-900 text-white uppercase text-[9px] font-extrabold tracking-wider">
                            <th className="py-2 px-3 rounded-l">Item</th>
                            <th className="py-2 px-3">Descrição do Serviço / Peça</th>
                            <th className="py-2 px-3 text-center">Qtd</th>
                            <th className="py-2 px-3 text-right">Unitário</th>
                            <th className="py-2 px-3 text-right rounded-r">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/80">
                          {items.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3 font-mono font-semibold text-slate-400">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-medium text-slate-700">{item.descricao}</td>
                              <td className="py-2.5 px-3 text-center font-mono">{item.quantidade}</td>
                              <td className="py-2.5 px-3 text-right font-mono">R$ {item.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">R$ {(item.quantidade * item.valor_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Financial summary box */}
                    <div className="flex justify-end mb-6 text-xs">
                      <div className="w-64 bg-slate-50 p-3 rounded-lg border border-slate-200/60 space-y-1.5 font-sans">
                        <div className="flex justify-between text-slate-500">
                          <span>Subtotal:</span>
                          <span className="font-mono">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        {descontoPercent > 0 && (
                          <div className="flex justify-between text-emerald-600 font-semibold">
                            <span>Desconto ({descontoPercent}%):</span>
                            <span className="font-mono">- R$ {valorDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm font-extrabold text-blue-900">
                          <span>Valor Total:</span>
                          <span className="font-mono text-base text-blue-900">R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Scope and Terms */}
                    <div className="space-y-3 text-[11px] leading-relaxed border-t border-slate-200 pt-4">
                      <div>
                        <strong className="text-slate-800 uppercase text-[9px] tracking-wide block mb-0.5 text-blue-800">Condições Comerciais:</strong>
                        <p className="text-slate-600 font-medium"><span className="text-slate-400">💵 Forma de Pagamento:</span> {formaPagamento}</p>
                        <p className="text-slate-600 font-medium"><span className="text-slate-400">⏱️ Validade do Orçamento:</span> {validadeDias} dias corridos</p>
                        <p className="text-slate-600 font-medium"><span className="text-slate-400">⚡ Prazo de Execução:</span> {prazoExecucao}</p>
                        <p className="text-slate-600 font-medium"><span className="text-slate-400">🛡️ Garantia de Serviços:</span> {garantiaMeses} meses nos serviços e peças aplicados</p>
                      </div>
                      
                      {observacoes && (
                        <div>
                          <strong className="text-slate-800 uppercase text-[9px] tracking-wide block mb-0.5 text-blue-800">Notas Operacionais:</strong>
                          <p className="text-slate-500 italic text-[10px]">{observacoes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SIGNATURE & CYAN/BLUE POLYGON FOOTER */}
                  <div className="pt-10">
                    <div className="grid grid-cols-2 gap-12 text-center text-xs mb-8">
                      <div className="space-y-1">
                        <div className="h-10 border-b border-slate-300"></div>
                        <p className="font-bold text-slate-800">{empresaConfig.nome_empresa}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Especialista R.A Climatização</p>
                      </div>
                      <div className="space-y-1">
                        <div className="h-10 border-b border-slate-300"></div>
                        <p className="font-bold text-slate-800">{customClienteNome || 'De acordo do Cliente'}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Assinatura do Responsável</p>
                      </div>
                    </div>

                    {/* Bottom wave graphic bar */}
                    <div className="h-4 bg-gradient-to-r from-blue-800 via-blue-600 to-cyan-500 rounded-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 h-full w-24 bg-cyan-400 skew-x-30 origin-bottom-left"></div>
                    </div>
                    <div className="text-center text-[9px] text-slate-400 font-medium mt-1 font-mono">
                      R.A Climatização • CNPJ {empresaConfig.cnpj} • contato@raclimatizacao.com.br
                    </div>
                  </div>
                </div>
              )}

              {/* 2. MODERNO EXECUTIVO LAYOUT */}
              {activeLayout === 'moderno' && (
                <div className="h-full flex flex-col justify-between font-sans text-slate-800">
                  <div>
                    {/* Header layout */}
                    <div className="flex justify-between items-center bg-slate-900 text-white p-6 -mx-[15mm] -mt-[15mm] mb-8">
                      <div className="space-y-1">
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-1.5">
                          <span>❄️</span> R.A Climatização
                        </h2>
                        <p className="text-xs text-slate-300 uppercase tracking-widest font-semibold font-mono">Engineering & Technical Solutions</p>
                      </div>
                      <div className="text-right space-y-0.5 font-mono">
                        <span className="bg-amber-500 text-slate-950 font-extrabold px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">
                          PROPOSTA #{numeroOrcamento}
                        </span>
                        <p className="text-[10px] text-slate-400 pt-1">Emissão: {dataEmissao.split('-').reverse().join('/')}</p>
                      </div>
                    </div>

                    {/* Metadata boxes */}
                    <div className="grid grid-cols-2 gap-4 mb-6 text-xs font-sans">
                      <div className="border border-slate-200 rounded-xl p-4 space-y-1 bg-slate-50/50">
                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">DADOS CORPORATIVOS</p>
                        <p className="font-extrabold text-slate-800">{empresaConfig.nome_empresa}</p>
                        <p className="text-slate-500">CNPJ: {empresaConfig.cnpj}</p>
                        <p className="text-slate-500">Telefone: {empresaConfig.telefone}</p>
                        <p className="text-slate-500">Endereço: {empresaConfig.endereco}</p>
                      </div>
                      <div className="border border-slate-200 rounded-xl p-4 space-y-1 bg-slate-50/50">
                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">CLIENTE DESTINATÁRIO</p>
                        <p className="font-extrabold text-slate-800">{customClienteNome || '[Nome do Cliente]'}</p>
                        <p className="text-slate-500">Local: {customClienteEnd || 'Endereço não informado'}</p>
                        <p className="text-slate-500">Contato: {customClienteTel || 'Telefone não informado'}</p>
                        {(customEquipMarca || customEquipModelo) && (
                          <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold">
                            {customEquipMarca} {customEquipModelo} ({customEquipCapacidade})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Items table */}
                    <div className="mb-6 border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-white uppercase text-[9px] font-bold tracking-wider">
                            <th className="py-3 px-4">Item</th>
                            <th className="py-3 px-4">Especificação do Serviço Realizado</th>
                            <th className="py-3 px-4 text-center">Quant.</th>
                            <th className="py-3 px-4 text-right">Preço Unit.</th>
                            <th className="py-3 px-4 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {items.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-slate-50/80">
                              <td className="py-3 px-4 font-mono font-bold text-slate-400">{String(idx + 1).padStart(2, '0')}</td>
                              <td className="py-3 px-4 font-bold text-slate-800">{item.descricao}</td>
                              <td className="py-3 px-4 text-center font-mono font-semibold text-slate-600">{item.quantidade}</td>
                              <td className="py-3 px-4 text-right font-mono text-slate-600">R$ {item.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">R$ {(item.quantidade * item.valor_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary layout */}
                    <div className="flex justify-end mb-6 text-xs">
                      <div className="w-72 bg-slate-900 text-white p-4 rounded-xl space-y-2 shadow-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Subtotal Serviços:</span>
                          <span className="font-mono">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        {descontoPercent > 0 && (
                          <div className="flex justify-between text-emerald-400 font-semibold">
                            <span>Desconto Promocional ({descontoPercent}%):</span>
                            <span className="font-mono">- R$ {valorDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-extrabold text-white">
                          <span>Valor Final Líquido:</span>
                          <span className="font-mono text-base text-amber-400">R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Conditions */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[11px] leading-relaxed grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">CONDIÇÕES FINANCEIRAS</span>
                        <p className="font-semibold text-slate-700"><span className="text-slate-400">Condições:</span> {formaPagamento}</p>
                        <p className="font-semibold text-slate-700"><span className="text-slate-400">Prazo Execução:</span> {prazoExecucao}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">CRITÉRIOS TÉCNICOS</span>
                        <p className="font-semibold text-slate-700"><span className="text-slate-400">Validade Proposta:</span> {validadeDias} dias</p>
                        <p className="font-semibold text-slate-700"><span className="text-slate-400">Garantia Unificada:</span> {garantiaMeses} meses contra vazamentos e ruídos</p>
                      </div>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="pt-8">
                    <div className="grid grid-cols-2 gap-8 text-center text-xs">
                      <div>
                        <div className="h-10 border-b border-slate-200"></div>
                        <p className="font-bold text-slate-800 mt-2">{empresaConfig.nome_empresa}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Diretoria de Engenharia RA</p>
                      </div>
                      <div>
                        <div className="h-10 border-b border-slate-200"></div>
                        <p className="font-bold text-slate-800 mt-2">{customClienteNome || 'Cliente'}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Aprovação de Proposta</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. TÉCNICO DETALHADO LAYOUT */}
              {activeLayout === 'tecnico' && (
                <div className="h-full flex flex-col justify-between font-mono text-[11px] text-slate-800">
                  <div>
                    {/* Header with technical border box */}
                    <div className="border border-slate-900 p-4 mb-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-base font-extrabold text-slate-950 uppercase">[R.A CLIMATIZAÇÃO - LAUDO DE ORÇAMENTO TÉCNICO]</h2>
                          <p className="text-[9px] text-slate-500">HVAC GENERAL MAINTENANCE WORK order proposal</p>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-slate-950 uppercase text-xs">REG: {numeroOrcamento}</p>
                          <p className="text-[9px] text-slate-400">{dataEmissao.split('-').reverse().join('/')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Technical metadata table style */}
                    <div className="grid grid-cols-12 border-x border-t border-slate-900 mb-6">
                      <div className="col-span-6 p-2.5 border-r border-b border-slate-900">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block">01 / UNIDADE OPERACIONAL (PRESTADOR)</span>
                        <p className="font-bold text-slate-800">{empresaConfig.nome_empresa}</p>
                        <p>CNPJ: {empresaConfig.cnpj}</p>
                        <p>END: {empresaConfig.endereco}</p>
                        <p>TEL: {empresaConfig.whatsapp}</p>
                      </div>
                      <div className="col-span-6 p-2.5 border-b border-slate-900">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block">02 / UNIDADE EXECUTORA (CLIENTE)</span>
                        <p className="font-bold text-slate-800">{customClienteNome || '[Nome do Cliente]'}</p>
                        <p>END: {customClienteEnd || 'Não informado'}</p>
                        <p>TEL: {customClienteTel || 'Não informado'}</p>
                        <p className="font-bold text-slate-800">EQP: {customEquipMarca} {customEquipModelo} ({customEquipCapacidade})</p>
                      </div>
                    </div>

                    {/* Technical Checklist Accent */}
                    <div className="border border-slate-900 p-3 mb-6 bg-slate-50">
                      <p className="text-[9px] font-bold uppercase text-slate-500 mb-1.5">[DIAGNÓSTICO TÉCNICO PREVENTIVO E PROCEDIMENTOS PADRÃO EXECUTADOS]</p>
                      <div className="grid grid-cols-3 gap-y-1 text-[10px]">
                        <div className="flex items-center gap-1.5"><span className="text-slate-800">✅</span> Limpeza da Serpentina</div>
                        <div className="flex items-center gap-1.5"><span className="text-slate-800">✅</span> Higienização do Dreno</div>
                        <div className="flex items-center gap-1.5"><span className="text-slate-800">✅</span> Carga de Fluído Gás</div>
                        <div className="flex items-center gap-1.5"><span className="text-slate-800">✅</span> Correção de Ruídos</div>
                        <div className="flex items-center gap-1.5"><span className="text-slate-800">✅</span> Aperto de Bornes</div>
                        <div className="flex items-center gap-1.5"><span className="text-slate-800">✅</span> Teste de Corrente</div>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="border border-slate-900 mb-6">
                      <table className="w-full text-left text-[11px] border-collapse font-mono">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-900 text-slate-800 font-extrabold">
                            <th className="py-2 px-3 border-r border-slate-900 text-[10px]">CÓD</th>
                            <th className="py-2 px-3 border-r border-slate-900 text-[10px]">DESCRIÇÃO ESPECÍFICA DO SERVIÇO</th>
                            <th className="py-2 px-3 border-r border-slate-900 text-center text-[10px]">QTD</th>
                            <th className="py-2 px-3 border-r border-slate-900 text-right text-[10px]">V. UNIT.</th>
                            <th className="py-2 px-3 text-right text-[10px]">V. TOTAL</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900">
                          {items.map((item, idx) => (
                            <tr key={item.id}>
                              <td className="py-2 px-3 border-r border-slate-900 font-bold text-slate-500">{String(idx + 1).padStart(3, '0')}</td>
                              <td className="py-2 px-3 border-r border-slate-900">{item.descricao}</td>
                              <td className="py-2 px-3 border-r border-slate-900 text-center">{item.quantidade}</td>
                              <td className="py-2 px-3 border-r border-slate-900 text-right">R$ {item.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              <td className="py-2 px-3 text-right font-bold">R$ {(item.quantidade * item.valor_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Table */}
                    <div className="flex justify-end mb-6 font-mono">
                      <div className="w-72 border border-slate-900 p-3 space-y-1">
                        <div className="flex justify-between">
                          <span>SUBTOTAL:</span>
                          <span>R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        {descontoPercent > 0 && (
                          <div className="flex justify-between text-slate-600 font-bold">
                            <span>DESCONTO ({descontoPercent}%):</span>
                            <span>- R$ {valorDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-dashed border-slate-900 pt-1 font-extrabold text-slate-950">
                          <span>VALOR LÍQUIDO:</span>
                          <span>R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Scope and Notes */}
                    <div className="border border-slate-900 p-3 bg-slate-50 text-[10px] space-y-1 leading-relaxed">
                      <p><strong>FORMAS DE LIQUIDAÇÃO:</strong> {formaPagamento}</p>
                      <p><strong>GARANTIA OPERACIONAL:</strong> {garantiaMeses} meses a partir desta data.</p>
                      <p><strong>VALIDADE DO ORÇAMENTO:</strong> {validadeDias} dias.</p>
                      {observacoes && <p className="italic"><strong>NOTAS:</strong> {observacoes}</p>}
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="pt-8">
                    <div className="grid grid-cols-2 gap-8 text-center text-[10px] uppercase font-bold">
                      <div>
                        <p>_____________________________________</p>
                        <p className="mt-1">Responsável Técnico RA Climatização</p>
                      </div>
                      <div>
                        <p>_____________________________________</p>
                        <p className="mt-1">Responsável pela Aprovação do Cliente</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. MINIMALISTA ELEGANTE LAYOUT */}
              {activeLayout === 'minimalista' && (
                <div className="h-full flex flex-col justify-between font-serif text-slate-700">
                  <div>
                    {/* Header layout */}
                    <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-100 pb-8 mb-8">
                      <div>
                        <h2 className="text-xl font-bold font-sans text-slate-900 tracking-tight">R.A Climatização</h2>
                        <p className="text-[10px] text-slate-400 font-sans tracking-widest uppercase mt-0.5">Minimalist Air Comfort Solutions</p>
                        <p className="text-xs text-slate-400 font-sans mt-3">Reg. Proposta: #{numeroOrcamento}</p>
                      </div>
                      <div className="text-right text-xs font-sans text-slate-400 space-y-1 pt-4 sm:pt-0">
                        <p>Data Proposta: {dataEmissao.split('-').reverse().join('/')}</p>
                        <p>Validade: {validadeDias} dias</p>
                      </div>
                    </div>

                    {/* Destination details */}
                    <div className="grid grid-cols-2 gap-8 mb-8 text-xs font-sans text-slate-500">
                      <div className="space-y-1 border-l border-slate-100 pl-4">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">PRESTADOR</span>
                        <p className="font-semibold text-slate-800">{empresaConfig.nome_empresa}</p>
                        <p>CNPJ {empresaConfig.cnpj}</p>
                        <p>{empresaConfig.whatsapp}</p>
                      </div>
                      <div className="space-y-1 border-l border-slate-100 pl-4">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">DESTINATÁRIO</span>
                        <p className="font-semibold text-slate-800">{customClienteNome || '[Nome do Cliente]'}</p>
                        <p>{customClienteEnd || 'Não informado'}</p>
                        {customClienteTel && <p>Tel: {customClienteTel}</p>}
                        {customEquipMarca && <p className="font-semibold text-slate-600 mt-1">Aparelho: {customEquipMarca} {customEquipModelo}</p>}
                      </div>
                    </div>

                    {/* Items table */}
                    <div className="mb-8">
                      <table className="w-full text-left text-xs font-sans">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 uppercase text-[9px] font-semibold tracking-wider pb-2">
                            <th className="py-2 font-medium">Especificação do Serviço</th>
                            <th className="py-2 text-center font-medium">Qtd</th>
                            <th className="py-2 text-right font-medium">Valor Unitário</th>
                            <th className="py-2 text-right font-medium">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600">
                          {items.map((item) => (
                            <tr key={item.id}>
                              <td className="py-3 pr-4">{item.descricao}</td>
                              <td className="py-3 text-center">{item.quantidade}</td>
                              <td className="py-3 text-right">R$ {item.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              <td className="py-3 text-right font-semibold text-slate-800">R$ {(item.quantidade * item.valor_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end mb-8 text-xs font-sans">
                      <div className="w-64 space-y-2 border-t border-slate-100 pt-4">
                        <div className="flex justify-between text-slate-400">
                          <span>Subtotal Proposta:</span>
                          <span>R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        {descontoPercent > 0 && (
                          <div className="flex justify-between text-emerald-600">
                            <span>Desconto Especial ({descontoPercent}%):</span>
                            <span>- R$ {valorDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-100 pt-2">
                          <span>Valor Total Final:</span>
                          <span className="text-base font-bold text-slate-900">R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Terms */}
                    <div className="text-[11px] leading-relaxed border-t border-slate-100 pt-6 space-y-2 text-slate-400 font-sans">
                      <p><span className="font-semibold text-slate-600">Pagamento:</span> {formaPagamento}</p>
                      <p><span className="font-semibold text-slate-600">Prazo Estimado:</span> {prazoExecucao}</p>
                      <p><span className="font-semibold text-slate-600">Período Garantia:</span> {garantiaMeses} meses</p>
                      {observacoes && <p className="italic"><span className="font-semibold text-slate-600">Observações:</span> {observacoes}</p>}
                    </div>
                  </div>

                  {/* Signature */}
                  <div className="pt-12 text-xs font-sans text-slate-400">
                    <div className="grid grid-cols-2 gap-12 text-center">
                      <div className="space-y-1">
                        <div className="h-8 border-b border-slate-100"></div>
                        <p>Por R.A Climatização</p>
                      </div>
                      <div className="space-y-1">
                        <div className="h-8 border-b border-slate-100"></div>
                        <p>Por {customClienteNome || 'Cliente destinatário'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
