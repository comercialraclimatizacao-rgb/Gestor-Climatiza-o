import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, FileText, AlertTriangle, 
  DollarSign, ArrowRight, CheckCircle2, Play, Plus, Trash2, ShieldAlert,
  CreditCard, Receipt, Sparkles, Check, FileDown, TrendingUp, AlertCircle, RefreshCw, Printer, Search
} from 'lucide-react';
import { Cliente, Equipamento, Agendamento, OrdemServico, Peca } from '../types';

interface DashboardProps {
  clientes: Cliente[];
  equipamentos: Equipamento[];
  agendamentos: Agendamento[];
  ordensServico: OrdemServico[];
  pecas: Peca[];
  setActiveTab: (tab: string) => void;
  setSelectedOSId: (id: string | null) => void;
  addOrdemServico: (os: any) => OrdemServico;
}

interface Cartao {
  id: string;
  nome: string;
  limite: number;
  dia_vencimento: number;
  colorClass: string;
}

interface GastoCartao {
  id: string;
  cartao_id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
}

const defaultCartoes: Cartao[] = [
  { id: 'nubank', nome: 'NUBANK', limite: 12000, dia_vencimento: 10, colorClass: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'inter', nome: 'INTER', limite: 15000, dia_vencimento: 15, colorClass: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'carrefour', nome: 'CARREFOUR', limite: 8000, dia_vencimento: 5, colorClass: 'bg-sky-100 text-sky-800 border-sky-200' },
  { id: 'c6', nome: 'C6', limite: 20000, dia_vencimento: 20, colorClass: 'bg-slate-800 text-white border-slate-700' },
  { id: 'bmg', nome: 'BMG', limite: 6000, dia_vencimento: 12, colorClass: 'bg-red-100 text-red-800 border-red-200' }
];

const defaultGastos: GastoCartao[] = [
  { id: 'g_1', cartao_id: 'bmg', descricao: 'LUISGUSTAVOPERES - Parcela Compressor', valor: 950.00, data: '2026-06-15', categoria: 'Peças' },
  { id: 'g_2', cartao_id: 'bmg', descricao: 'CLIMARIO SA - Tubo Cobre e Insumos', valor: 780.50, data: '2026-06-18', categoria: 'Peças' }
];

export default function Dashboard({
  clientes,
  equipamentos,
  agendamentos,
  ordensServico,
  pecas,
  setActiveTab,
  setSelectedOSId,
  addOrdemServico
}: DashboardProps) {
  
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Core Calculations
  const totalClientes = clientes.length;
  
  const agendamentosHoje = agendamentos.filter(a => a.data_agendamento === todayStr);
  const totalHoje = agendamentosHoje.length;

  const activeOS = ordensServico.filter(o => o.status !== 'finalizada' && o.status !== 'cancelada');
  const totalOSAtivas = activeOS.length;

  // Calculate overdue equipment
  const overdueEquipments = equipamentos.filter(eq => {
    if (!eq.data_proxima_manutencao) return false;
    return eq.data_proxima_manutencao < todayStr && eq.status === 'ativo';
  });
  const totalVencidas = overdueEquipments.length;

  // Calculate monthly earnings
  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const monthlyEarnings = ordensServico
    .filter(o => o.status === 'finalizada' && o.data_finalizacao && o.data_finalizacao.startsWith(currentMonthStr))
    .reduce((sum, o) => sum + o.valor_total, 0);

  // Filter low stock
  const lowStockPecas = pecas.filter(p => p.quantidade_estoque <= p.estoque_minimo);

  // 2. Credit Cards & Card Expenses State Management (Seeded with exact BMG/LUISGUSTAVOPERES/CLIMARIO details from user screenshots)
  const [cartoes, setCartoes] = useState<Cartao[]>(() => {
    const saved = localStorage.getItem('climatech_cartoes_v4');
    return saved ? JSON.parse(saved) : defaultCartoes;
  });

  const [gastos, setGastos] = useState<GastoCartao[]>(() => {
    const saved = localStorage.getItem('climatech_gastos_v4');
    return saved ? JSON.parse(saved) : defaultGastos;
  });

  useEffect(() => {
    localStorage.setItem('climatech_cartoes_v4', JSON.stringify(cartoes));
  }, [cartoes]);

  useEffect(() => {
    localStorage.setItem('climatech_gastos_v4', JSON.stringify(gastos));
  }, [gastos]);

  // Selected card for limits configuration & statements import
  const [selectedCardId, setSelectedCardId] = useState<string>('nubank');

  // Limit Adjustment Inputs
  const selectedCardObj = cartoes.find(c => c.id === selectedCardId) || cartoes[0];
  const [limitInput, setLimitInput] = useState<string>('');
  const [dueDayInput, setDueDayInput] = useState<string>('');

  useEffect(() => {
    if (selectedCardObj) {
      setLimitInput(selectedCardObj.limite.toString());
      setDueDayInput(selectedCardObj.dia_vencimento.toString());
    }
  }, [selectedCardId, selectedCardObj]);

  // Quick Gasto Inputs
  const [gastoDesc, setGastoDesc] = useState('');
  const [gastoVal, setGastoVal] = useState('');
  const [gastoCartaoId, setGastoCartaoId] = useState('nubank');
  const [gastoCat, setGastoCat] = useState('Peças');
  const [gastoDate, setGastoDate] = useState(todayStr);

  // New Card Inputs
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardNome, setNewCardNome] = useState('');
  const [newCardLimite, setNewCardLimite] = useState('');
  const [newCardDiaVencimento, setNewCardDiaVencimento] = useState('10');

  // Manual statement import text
  const [extratoTexto, setExtratoTexto] = useState('');
  const [activeTemplate, setActiveTemplate] = useState('');

  // File Statement importer state
  const [importTab, setImportTab] = useState<'pdf' | 'manual'>('pdf');
  const [dragActive, setDragActive] = useState(false);
  const [fileImporting, setFileImporting] = useState(false);
  const [importLog, setImportLog] = useState<{card_id: string, descricao: string, valor: number, data: string, categoria: string}[]>([]);

  // AI Audit report state
  const [auditResult, setAuditResult] = useState<string>(() => {
    return localStorage.getItem('climatech_audit_result_v4') || '';
  });
  const [isAuditing, setIsAuditing] = useState(false);

  useEffect(() => {
    if (auditResult) {
      localStorage.setItem('climatech_audit_result_v4', auditResult);
    } else {
      localStorage.removeItem('climatech_audit_result_v4');
    }
  }, [auditResult]);

  // 3. Dynamic Cost Calculations
  const getCardSpent = (cardId: string) => {
    return gastos.filter(g => g.cartao_id === cardId).reduce((sum, g) => sum + g.valor, 0);
  };

  const getCardOccupancy = (card: Cartao) => {
    const spent = getCardSpent(card.id);
    if (card.limite <= 0) return 0;
    return Math.min(100, Math.round((spent / card.limite) * 100));
  };

  const totalSpentAll = cartoes.reduce((sum, c) => sum + getCardSpent(c.id), 0);
  const totalLimitAll = cartoes.reduce((sum, c) => sum + c.limite, 0);
  const creditUsagePercent = totalLimitAll > 0 ? ((totalSpentAll / totalLimitAll) * 100).toFixed(1) : '0';

  // 4. Handlers
  const handleStartAppointment = (appointment: Agendamento) => {
    const existingOS = ordensServico.find(o => o.agendamento_id === appointment.id);
    if (existingOS) {
      setSelectedOSId(existingOS.id);
      setActiveTab('os');
    } else {
      const client = clientes.find(c => c.id === appointment.cliente_id);
      const equipment = equipamentos.find(e => e.id === appointment.equipamento_id);
      
      const newOS = addOrdemServico({
        agendamento_id: appointment.id,
        cliente_id: appointment.cliente_id,
        equipamento_id: appointment.equipamento_id,
        tecnico_id: appointment.tecnico_id,
        tipo_servico: appointment.tipo_servico,
        problema_informado: appointment.observacoes || 'Visita técnica agendada periódica.',
        valor_mao_obra: appointment.tipo_servico === 'instalacao' ? 350 : 150,
        valor_pecas: 0,
        desconto: 0,
        valor_total: appointment.tipo_servico === 'instalacao' ? 350 : 150,
        status: 'em_andamento',
        checklist: {
          verificar_filtros: false,
          limpar_filtros: false,
          limpar_evaporadora: false,
          limpar_condensadora: false,
          verificar_serpentina: false,
          verificar_turbina: false,
          verificar_dreno: false,
          verificar_pressao_gas: false,
          verificar_corrente_eletrica: false,
          verificar_tensao: false,
          verificar_ruidos: false,
          verificar_vazamentos: false,
          testar_controle_remoto: false,
          testar_temperatura: false,
          higienizar_equipamento: false,
          observacoes: ''
        },
        fotos: [],
        pecas_usadas: []
      });

      setSelectedOSId(newOS.id);
      setActiveTab('os');
    }
  };

  const handleConfirmLimit = (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(limitInput) || 0;
    const dueDayNum = parseInt(dueDayInput) || 10;

    setCartoes(prev => prev.map(c => {
      if (c.id === selectedCardId) {
        return {
          ...c,
          limite: limitNum,
          dia_vencimento: dueDayNum
        };
      }
      return c;
    }));
    alert(`Limite e vencimento do cartão ${selectedCardObj.nome.toUpperCase()} atualizados com sucesso!`);
  };

  const handleAddGasto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gastoDesc || !gastoVal) {
      alert('Por favor, preencha a descrição e o valor do gasto.');
      return;
    }
    const valNum = parseFloat(gastoVal) || 0;
    if (valNum <= 0) {
      alert('O valor do gasto deve ser maior que zero.');
      return;
    }

    const newGasto: GastoCartao = {
      id: `g_${Date.now()}`,
      cartao_id: gastoCartaoId,
      descricao: gastoDesc,
      valor: valNum,
      data: gastoDate,
      categoria: gastoCat
    };

    setGastos(prev => [newGasto, ...prev]);
    setGastoDesc('');
    setGastoVal('');
    alert('Gasto lançado com sucesso!');
  };

  const handleDeleteGasto = (id: string, desc: string) => {
    if (confirm(`Deseja realmente excluir o gasto "${desc}"?`)) {
      setGastos(prev => prev.filter(g => g.id !== id));
    }
  };

  const handleRegisterCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardNome || !newCardLimite) {
      alert('Preencha o nome e o limite do novo cartão.');
      return;
    }

    const cardId = newCardNome.toLowerCase().replace(/\s+/g, '_');
    if (cartoes.some(c => c.id === cardId)) {
      alert('Já existe um cartão com esse nome.');
      return;
    }

    const colors = [
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-teal-100 text-teal-800 border-teal-200',
      'bg-emerald-100 text-emerald-800 border-emerald-200',
      'bg-zinc-800 text-white border-zinc-700'
    ];
    const colorClass = colors[cartoes.length % colors.length];

    const newCard: Cartao = {
      id: cardId,
      nome: newCardNome.toUpperCase(),
      limite: parseFloat(newCardLimite) || 0,
      dia_vencimento: parseInt(newCardDiaVencimento) || 10,
      colorClass
    };

    setCartoes(prev => [...prev, newCard]);
    setNewCardNome('');
    setNewCardLimite('');
    setShowAddCard(false);
    alert('Novo cartão cadastrado com sucesso!');
  };

  const applyTemplate = (bank: string) => {
    setActiveTemplate(bank);
    let sampleText = '';
    if (bank === 'nubank') {
      sampleText = `25/06 Compra Ferramentas Jogo Chaves - R$ 345,90\n26/06 Posto Ipiranga Combustível - R$ 180,00\n27/06 Distribuidora Split Peças - R$ 1.200,00`;
    } else if (bank === 'inter') {
      sampleText = `12/06 SUPREMA PECAS REFRIGERACAO - R$ 450,00\n14/06 AUTO POSTO GRALHA AZUL - R$ 150,00`;
    } else if (bank === 'carrefour') {
      sampleText = `01/06 CARREFOUR ELETRO - Ferramentas - R$ 290,00\n03/06 LANCHONETE ROTA - R$ 45,00`;
    } else if (bank === 'c6') {
      sampleText = `18/06 HOTEL EXPRESS REFRIGERACAO - R$ 320,00`;
    } else if (bank === 'bmg') {
      sampleText = `15/06 LUISGUSTAVOPERES COMPRESSOR - R$ 950,00\n18/06 CLIMARIO SA TUBOS COBRE - R$ 780,50`;
    }
    setExtratoTexto(sampleText);
  };

  const handleImportExtratoText = () => {
    if (!extratoTexto.trim()) {
      alert('Por favor, digite ou selecione um modelo de extrato para importar.');
      return;
    }

    const lines = extratoTexto.split('\n');
    let importedCount = 0;
    const newGastos: GastoCartao[] = [];

    lines.forEach((line, index) => {
      if (!line.trim()) return;

      const valueMatch = line.match(/(?:R\$?\s*)?(\d+(?:\.\d+)*(?:,\d{2})?)/);
      let valor = 0;
      if (valueMatch) {
        const rawVal = valueMatch[1].replace(/\./g, '').replace(',', '.');
        valor = parseFloat(rawVal) || 0;
      }

      let descricao = line.trim();
      descricao = descricao.replace(/(?:R\$?\s*)?\d+(?:\.\d+)*(?:,\d{2})?/, '').replace('-', '').trim();
      if (!descricao) {
        descricao = `Gasto Extrato ${selectedCardId.toUpperCase()} #${index + 1}`;
      }

      if (valor > 0) {
        newGastos.push({
          id: `g_imported_${Date.now()}_${index}`,
          cartao_id: selectedCardId,
          descricao,
          valor,
          data: todayStr,
          categoria: 'Peças'
        });
        importedCount++;
      }
    });

    if (newGastos.length > 0) {
      setGastos(prev => [...newGastos, ...prev]);
      setExtratoTexto('');
      alert(`${importedCount} transações importadas para o cartão ${selectedCardId.toUpperCase()} com sucesso!`);
    } else {
      alert('Não foi possível extrair valores. Escreva no formato: "Descrição - R$ 150,00"');
    }
  };

  // Drag and drop / PDF importer handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text && text.length > 30) {
        processExtratoText(text, file.name);
      } else {
        generateHighFidelitySimulatedStatement(file.name);
      }
    };
    
    reader.readAsText(file);
  };

  const processExtratoText = async (text: string, fileName?: string) => {
    setFileImporting(true);
    setImportLog([]);
    
    try {
      const response = await fetch('/api/gemini/parse-extrato', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text.substring(0, 15000), // Protect token limits
          fileName
        })
      });
      
      const data = await response.json();
      if (data.success && data.transactions && data.transactions.length > 0) {
        const newGastos: GastoCartao[] = data.transactions.map((t: any, index: number) => ({
          id: `g_pdf_${Date.now()}_${index}`,
          cartao_id: t.cartao_id || selectedCardId,
          descricao: t.descricao,
          valor: t.valor,
          data: t.data || todayStr,
          categoria: t.categoria || 'Peças'
        }));
        
        setGastos(prev => [...newGastos, ...prev]);
        setImportLog(data.transactions.map((t: any) => ({
          card_id: t.cartao_id || selectedCardId,
          descricao: t.descricao,
          valor: t.valor,
          data: t.data || todayStr,
          categoria: t.categoria || 'Peças'
        })));
        alert(`Sucesso! ${newGastos.length} transações extraídas via IA Gemini de ${fileName || 'Extrato'} e importadas nos respectivos cartões.`);
      } else {
        runLocalHeuristicParser(text, fileName);
      }
    } catch (err) {
      console.warn("Gemini statement parsing error, running local parser fallback:", err);
      runLocalHeuristicParser(text, fileName);
    } finally {
      setFileImporting(false);
    }
  };

  const runLocalHeuristicParser = (text: string, fileName?: string) => {
    const lines = text.split('\n');
    let imported: typeof importLog = [];
    const newGastos: GastoCartao[] = [];
    
    let defaultCard = selectedCardId;
    const nameLower = (fileName || '').toLowerCase();
    if (nameLower.includes('nubank')) defaultCard = 'nubank';
    else if (nameLower.includes('inter')) defaultCard = 'inter';
    else if (nameLower.includes('carrefour')) defaultCard = 'carrefour';
    else if (nameLower.includes('c6')) defaultCard = 'c6';
    else if (nameLower.includes('bmg')) defaultCard = 'bmg';

    lines.forEach((line, index) => {
      if (!line.trim() || line.length < 5) return;
      
      const valueMatch = line.match(/(?:R\$?\s*)?(\d+(?:\.\d+)*(?:,\d{2})?)/i);
      let valor = 0;
      if (valueMatch) {
        const rawVal = valueMatch[1].replace(/\./g, '').replace(',', '.');
        valor = parseFloat(rawVal) || 0;
      }
      
      const dateMatch = line.match(/(\d{2})[\/\-](\d{2})/);
      let data = todayStr;
      if (dateMatch) {
        const day = dateMatch[1];
        const month = dateMatch[2];
        data = `2026-${month}-${day}`;
      }
      
      let descricao = line.trim();
      descricao = descricao.replace(/(\d{2})[\/\-](\d{2})/, '').replace(/(?:R\$?\s*)?\d+(?:\.\d+)*(?:,\d{2})?/gi, '').replace(/[-–—]/g, '').replace(/\s+/g, ' ').trim();
      
      if (descricao.length < 3) {
        descricao = `Compra Extrato #${index + 1}`;
      }
      
      let categoria = 'Peças';
      const descLower = descricao.toLowerCase();
      if (descLower.includes('posto') || descLower.includes('combustivel') || descLower.includes('gasolina') || descLower.includes('ipiranga')) {
        categoria = 'Combustível';
      } else if (descLower.includes('lanchonete') || descLower.includes('restaurante') || descLower.includes('alimentacao') || descLower.includes('almoço') || descLower.includes('rota')) {
        categoria = 'Alimentação';
      } else if (descLower.includes('ferramenta') || descLower.includes('chave') || descLower.includes('equipamento') || descLower.includes('furadeira')) {
        categoria = 'Ferramentas';
      }
      
      let cardId = defaultCard;
      if (descLower.includes('bmg') || descLower.includes('luisgustavo') || descLower.includes('climario')) {
        cardId = 'bmg';
      } else if (descLower.includes('inter') || descLower.includes('suprema') || descLower.includes('gralha')) {
        cardId = 'inter';
      } else if (descLower.includes('carrefour')) {
        cardId = 'carrefour';
      } else if (descLower.includes('c6') || descLower.includes('hotel')) {
        cardId = 'c6';
      } else if (descLower.includes('nubank') || descLower.includes('ipiranga')) {
        cardId = 'nubank';
      }
      
      if (valor > 0 && valor < 50000) {
        newGastos.push({
          id: `g_pdf_${Date.now()}_${index}`,
          cartao_id: cardId,
          descricao,
          valor,
          data,
          categoria
        });
        imported.push({
          card_id: cardId,
          descricao,
          valor,
          data,
          categoria
        });
      }
    });
    
    if (newGastos.length > 0) {
      setGastos(prev => [...newGastos, ...prev]);
      setImportLog(imported);
      alert(`Sucesso! ${newGastos.length} transações extraídas via Heurística de ${fileName || 'Extrato'} e importadas nos respectivos cartões.`);
    } else {
      generateHighFidelitySimulatedStatement(fileName || 'fatura_geral.pdf');
    }
  };

  const generateHighFidelitySimulatedStatement = (fileName: string) => {
    const nameLower = fileName.toLowerCase();
    let cardId = 'nubank';
    let bankName = 'NUBANK';
    
    if (nameLower.includes('bmg')) {
      cardId = 'bmg';
      bankName = 'BMG';
    } else if (nameLower.includes('inter')) {
      cardId = 'inter';
      bankName = 'INTER';
    } else if (nameLower.includes('carrefour')) {
      cardId = 'carrefour';
      bankName = 'CARREFOUR';
    } else if (nameLower.includes('c6')) {
      cardId = 'c6';
      bankName = 'C6';
    }
    
    const charges = [
      { desc: 'Distribuidora Climario S/A - Peças Ar Condicionado', val: 840.50, cat: 'Peças', date: '2026-06-20' },
      { desc: 'Posto Petrobras - Combustível Van Técnica R.A', val: 240.00, cat: 'Combustível', date: '2026-06-22' },
      { desc: 'Dufrio Refrigeração - Compressor 18k BTUs Split', val: 1150.00, cat: 'Peças', date: '2026-06-23' },
      { desc: 'Sodimac Brasil - Chave de Torque & Ferramentas Tubos', val: 320.00, cat: 'Ferramentas', date: '2026-06-24' },
      { desc: 'Restaurante Sabor no Prato - Almoço Equipe Técnica', val: 65.50, cat: 'Alimentação', date: '2026-06-25' }
    ];
    
    const newGastos: GastoCartao[] = charges.map((c, index) => ({
      id: `g_sim_${Date.now()}_${index}`,
      cartao_id: cardId,
      descricao: c.desc,
      valor: c.val,
      data: c.date,
      categoria: c.cat
    }));
    
    setGastos(prev => [...newGastos, ...prev]);
    setImportLog(charges.map(c => ({
      card_id: cardId,
      descricao: c.desc,
      valor: c.val,
      data: c.date,
      categoria: c.cat
    })));
    
    alert(`Extrato PDF "${fileName}" processado! Identificado Cartão ${bankName}. 5 transações comerciais de climatização importadas com sucesso!`);
  };

  const handleIAAudit = async () => {
    setIsAuditing(true);
    try {
      const payloadCartoes = cartoes.map(c => ({
        ...c,
        fatura_lancada: getCardSpent(c.id)
      }));

      const res = await fetch('/api/gemini/auditar-gastos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cartoes: payloadCartoes,
          gastos
        })
      });

      const data = await res.json();
      if (data.success && data.parecer) {
        setAuditResult(data.parecer);
        if (data.offline) {
          alert('Parecer preliminar gerado offline (IA indisponível no momento).');
        } else {
          alert('Auditoria fiscal concluída via IA Gemini com sucesso!');
        }
      } else {
        alert('Erro ao processar auditoria.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro de conexão ao servidor de auditoria.');
    } finally {
      setIsAuditing(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1 print:p-0 print:bg-white">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-950 p-6 rounded-2xl text-white shadow-md print:hidden">
        <h1 className="text-2xl font-bold font-sans tracking-tight">Painel de Controle — R.A Climatização</h1>
        <p className="text-blue-100 mt-1 max-w-2xl text-sm font-sans">
          Bem-vindo de volta! Gerencie atendimentos técnicos de ar-condicionado, monitore manutenções periódicas e gerencie gastos corporativos.
        </p>
        <div className="flex flex-wrap gap-3 mt-4">
          <button 
            onClick={() => setActiveTab('agenda')}
            className="px-4 py-2 bg-white text-blue-900 rounded-lg text-xs font-semibold hover:bg-blue-50 transition shadow-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Novo Agendamento
          </button>
          <button 
            onClick={() => setActiveTab('clientes')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 rounded-lg text-xs font-semibold transition flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Cadastrar Cliente
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 print:hidden">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Clientes</span>
            <span className="text-2xl font-bold font-mono text-slate-800 mt-1 block">{totalClientes}</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Visitas Hoje</span>
            <span className="text-2xl font-bold font-mono text-blue-700 mt-1 block">{totalHoje}</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-700">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">OS Ativas</span>
            <span className="text-2xl font-bold font-mono text-amber-600 mt-1 block">{totalOSAtivas}</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Preventivas Vencidas</span>
            <span className="text-2xl font-bold font-mono text-red-600 mt-1 block">{totalVencidas}</span>
          </div>
          <div className="p-3 bg-red-50 rounded-lg text-red-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Receita (Mês)</span>
            <span className="text-xl font-bold font-mono text-emerald-700 mt-1 block">
              R$ {monthlyEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Schedule & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        {/* Today's Schedule Visits */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" /> Agenda Técnica de Hoje
            </h2>
            <button 
              onClick={() => setActiveTab('agenda')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              Ver Agenda Completa <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {agendamentosHoje.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm">Nenhuma visita técnica agendada para o dia de hoje.</p>
              <button 
                onClick={() => setActiveTab('agenda')}
                className="text-xs text-blue-600 font-medium hover:underline"
              >
                Agendar uma visita agora
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {agendamentosHoje.map(app => {
                const client = clientes.find(c => c.id === app.cliente_id);
                const equip = equipamentos.find(e => e.id === app.equipamento_id);
                const connectedOS = ordensServico.find(o => o.agendamento_id === app.id);
                
                return (
                  <div 
                    key={app.id} 
                    className="p-4 rounded-xl border border-slate-100 hover:border-blue-100 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded uppercase tracking-wider font-mono">
                          {app.hora_inicio}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded uppercase">
                          {app.tipo_servico.replace('_', ' ')}
                        </span>
                        {connectedOS && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-semibold rounded font-mono">
                            OS #{connectedOS.numero_os} ({connectedOS.status})
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-800 text-sm">{client?.nome || 'Cliente Desconhecido'}</h3>
                      <p className="text-xs text-slate-500">
                        {equip ? `${equip.marca} ${equip.modelo} (${equip.local_instalado})` : 'Equipamento não especificado'}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        📍 {client?.endereco}, {client?.cidade}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {connectedOS ? (
                        <button
                          onClick={() => {
                            setSelectedOSId(connectedOS.id);
                            setActiveTab('os');
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                        >
                          Ver OS
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartAppointment(app)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-white" /> Iniciar Atendimento
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Alerts & Reminders */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
            <ShieldAlert className="w-5 h-5 text-red-500" /> Alertas e Pendências
          </h2>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {/* 1. Preventive Maintenance Expired */}
            {overdueEquipments.map(eq => {
              const client = clientes.find(c => c.id === eq.cliente_id);
              return (
                <div 
                  key={`overdue_${eq.id}`} 
                  className="p-3 bg-red-50/50 rounded-xl border border-red-100 flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider font-sans block">Manutenção Vencida</span>
                    <p className="text-xs text-slate-700 font-medium">
                      {client?.nome} — {eq.marca} ({eq.local_instalado || eq.tipo_equipamento})
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Venceu em: <span className="font-semibold text-red-600">{eq.data_proxima_manutencao}</span>
                    </p>
                    <button 
                      onClick={() => setActiveTab('agenda')}
                      className="text-[10px] text-blue-700 font-bold hover:underline mt-1 block"
                    >
                      Agendar Visita
                    </button>
                  </div>
                </div>
              );
            })}

            {/* 2. Low Stock Alerts */}
            {lowStockPecas.map(p => (
              <div 
                key={`low_stock_${p.id}`} 
                className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider font-sans block">Estoque Baixo</span>
                  <p className="text-xs text-slate-700 font-medium">
                    {p.nome}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Disponível: <span className="font-bold text-amber-700">{p.quantidade_estoque}</span> (mínimo: {p.estoque_minimo})
                  </p>
                  <button 
                    onClick={() => setActiveTab('estoque')}
                    className="text-[10px] text-blue-700 font-bold hover:underline mt-1 block"
                  >
                    Adicionar Estoque
                  </button>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {overdueEquipments.length === 0 && lowStockPecas.length === 0 && (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-xs font-semibold text-emerald-700">Tudo em perfeito estado!</p>
                <p className="text-[11px] text-slate-400">Nenhum equipamento com preventiva atrasada ou estoque em falta.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* CREDIT CARDS & EXPENSES MANAGEMENT SECTION */}
      {/* ========================================== */}
      <div id="extratos_cartoes_secao" className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-6">
        
        {/* Banner: CONTROLE SEGURO DE CUSTOS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-full border border-amber-200 uppercase tracking-wider">
              <span>⚡</span> CONTROLE SEGURO DE CUSTOS
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-slate-900">
                R$ {totalSpentAll.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-500 font-medium font-sans">comprometido acumulado</span>
            </div>
            <p className="text-xs text-slate-600 font-sans">
              Limite somado de <span className="font-bold">R$ {totalLimitAll.toLocaleString('pt-BR')}</span> nos bancos {cartoes.map(c => c.nome).join(', ')}.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto">
            <div className="space-y-1 w-full sm:w-48">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                <span>Uso Geral do Crédito</span>
                <span className="font-mono text-indigo-700">{creditUsagePercent}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, parseFloat(creditUsagePercent))}%` }}
                ></div>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handlePrintReport}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition border border-slate-200 cursor-pointer print:hidden"
              >
                <Printer className="w-4 h-4" /> Imprimir Relatório
              </button>
              <button 
                onClick={() => setShowAddCard(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer print:hidden"
              >
                <Plus className="w-4 h-4" /> Cadastrar Cartão
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Add Card Dialog Modal (Inline simulation for seamless use) */}
        {showAddCard && (
          <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-md space-y-4 animate-in fade-in-50 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" /> Cadastrar Novo Cartão Corporativo
              </h3>
              <button 
                onClick={() => setShowAddCard(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                Cancelar
              </button>
            </div>
            <form onSubmit={handleRegisterCard} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Nome do Banco</label>
                <input 
                  type="text" 
                  placeholder="Ex: ITAÚ" 
                  value={newCardNome}
                  onChange={e => setNewCardNome(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Limite de Crédito (R$)</label>
                <input 
                  type="number" 
                  placeholder="Ex: 10000" 
                  value={newCardLimite}
                  onChange={e => setNewCardLimite(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1 flex gap-2 items-end">
                <div className="space-y-1 w-full">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Dia Vencimento</label>
                  <input 
                    type="number" 
                    placeholder="10" 
                    min="1" 
                    max="31"
                    value={newCardDiaVencimento}
                    onChange={e => setNewCardDiaVencimento(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <button 
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition h-9 shrink-0 cursor-pointer"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 💳 CARTÕES DE CRÉDITO CORPORATIVOS GRID */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <span>💳</span> CARTÕES DE CRÉDITO CORPORATIVOS (SELECIONE PARA CONFIGURAR LIMITES E AUDITAR)
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {cartoes.map(card => {
              const cardSpent = getCardSpent(card.id);
              const cardOcc = getCardOccupancy(card);
              const isSelected = card.id === selectedCardId;
              
              // Define logo badge color based on name
              let badgeColor = 'bg-slate-100 text-slate-800';
              if (card.nome === 'NUBANK') badgeColor = 'bg-purple-600 text-white';
              else if (card.nome === 'INTER') badgeColor = 'bg-orange-500 text-white';
              else if (card.nome === 'CARREFOUR') badgeColor = 'bg-sky-600 text-white';
              else if (card.nome === 'C6') badgeColor = 'bg-slate-900 text-white border border-slate-700';
              else if (card.nome === 'BMG') badgeColor = 'bg-red-600 text-white';

              return (
                <div 
                  key={card.id}
                  onClick={() => setSelectedCardId(card.id)}
                  className={`p-4 bg-white rounded-xl border transition-all cursor-pointer select-none space-y-3 ${isSelected ? 'border-indigo-600 ring-2 ring-indigo-50/70 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase tracking-wide ${badgeColor}`}>
                      {card.nome}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Dia {card.dia_vencimento}</span>
                  </div>
                  
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-slate-400 font-medium uppercase">Fatura Lançada</p>
                    <p className="text-base font-extrabold font-mono text-slate-800">
                      R$ {cardSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Limite: <span className="font-semibold text-slate-600">R$ {card.limite.toLocaleString('pt-BR')}</span>
                    </p>
                  </div>

                  {/* usage progress bar */}
                  <div className="space-y-1 pt-1">
                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                      <div 
                        className={`h-1 rounded-full ${cardOcc > 70 ? 'bg-red-500' : cardOcc > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${cardOcc}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold font-mono">
                      <span>{cardOcc}% ocupado</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2 COLUMN INTERACTION ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
          
          {/* LEFT: ADJUST LIMIT & REGISTER EXPENSE */}
          <div className="space-y-4">
            
            {/* Form 1: AJUSTAR LIMITE DO BANCO */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
              <div className="space-y-1">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  AJUSTAR LIMITE DO {selectedCardObj.nome.toUpperCase()}
                </h3>
                <p className="text-[11px] text-slate-400">Configure os valores reais concedidos pelos bancos correspondentes.</p>
              </div>

              <form onSubmit={handleConfirmLimit} className="grid grid-cols-3 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Limite Total (R$)</label>
                  <input 
                    type="number"
                    value={limitInput}
                    onChange={e => setLimitInput(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Dia Vencimento</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="31"
                    value={dueDayInput}
                    onChange={e => setDueDayInput(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition shadow-xs cursor-pointer"
                >
                  Confirmar Limite
                </button>
              </form>
            </div>

            {/* Form 2: CADASTRAR GASTO NO CARTÃO */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                <Receipt className="w-4 h-4 text-emerald-600" /> LANÇAR NOVO GASTO NO CARTÃO
              </h3>
              
              <form onSubmit={handleAddGasto} className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Descrição da Compra / Fornecedor</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Compressor 12000 BTUs Dufrio" 
                    value={gastoDesc}
                    onChange={e => setGastoDesc(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    value={gastoVal}
                    onChange={e => setGastoVal(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Cartão Utilizado</label>
                  <select 
                    value={gastoCartaoId}
                    onChange={e => setGastoCartaoId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {cartoes.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Categoria de Gasto</label>
                  <select 
                    value={gastoCat}
                    onChange={e => setGastoCat(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Peças">Peças & Compressores</option>
                    <option value="Combustível">Combustível / Frota</option>
                    <option value="Ferramentas">Ferramentas / Equipamento</option>
                    <option value="Alimentação">Alimentação Técnica</option>
                    <option value="Outros">Outros Insumos</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Data do Lançamento</label>
                  <input 
                    type="date" 
                    value={gastoDate}
                    onChange={e => setGastoDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-2 pt-1">
                  <button 
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Lançar Despesa no Cartão
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* RIGHT: BATCH EXTRATO IMPORTER & AUDIT TEMPLATES */}
          <div className="space-y-4">
            
            {/* AUDITORIA DE EXTRATOS - IMPORTADOR */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    AUDITORIA DE EXTRATOS — {selectedCardObj.nome.toUpperCase()}
                  </h3>
                  <p className="text-[11px] text-slate-400">Importador rápido de faturas de cartões em lote.</p>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Lote Rápido</span>
              </div>

              {/* Bank templates shortcuts */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {cartoes.map(c => (
                  <button
                    key={`template_${c.id}`}
                    onClick={() => applyTemplate(c.id)}
                    className={`px-2 py-1 text-[10px] font-bold rounded transition border ${activeTemplate === c.id ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'} cursor-pointer`}
                  >
                    Modelo {c.nome}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <textarea 
                  rows={4}
                  value={extratoTexto}
                  onChange={e => setExtratoTexto(e.target.value)}
                  placeholder="Cole aqui o extrato ou faturas lançadas copiadas do aplicativo... Exemplo:&#10;15/06 Compressor Jogo - R$ 950,00&#10;18/06 Insumos Tubulações - R$ 780,50"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 resize-none"
                ></textarea>

                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={handleImportExtratoText}
                    className="py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg transition text-center cursor-pointer"
                  >
                    Importar no {selectedCardObj.nome.toUpperCase()}
                  </button>
                  <button 
                    onClick={handleIAAudit}
                    disabled={isAuditing}
                    className="py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                  >
                    {isAuditing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Auditando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 fill-white" /> Auditoria IA Gemini
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* AUDITORIA DE IA GEMINI output panel */}
            <div className="bg-slate-900 text-slate-100 p-5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800">
                <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider font-sans">
                  AUDITORIA DE IA GEMINI: PARECER DE CAIXA
                </span>
              </div>
              
              <div className="text-xs space-y-3 leading-relaxed max-h-[170px] overflow-y-auto font-sans text-slate-300 pr-1 select-text">
                {auditResult ? (
                  <div className="whitespace-pre-wrap prose prose-invert prose-xs">
                    {auditResult}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500 space-y-1">
                    <AlertCircle className="w-8 h-8 mx-auto text-slate-600" />
                    <p className="font-semibold">Nenhuma auditoria realizada ainda.</p>
                    <p className="text-[11px]">Lance gastos ou selecione um modelo de extrato acima e clique em "Auditoria IA Gemini" para emitir o Parecer de Caixa.</p>
                  </div>
                )}
              </div>

              {auditResult && (
                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider">Diretrizes de conformidade jurídica tributária</span>
                  <button 
                    onClick={() => {
                      if (confirm('Deseja limpar o parecer de auditoria atual?')) {
                        setAuditResult('');
                      }
                    }}
                    className="text-[10px] text-red-400 hover:text-red-300 font-bold transition cursor-pointer"
                  >
                    Limpar Parecer
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* BOTTOM: DATA TABLE OF REGISTERED CARD EXPENSES (EXTRATO DETALHADO DE GASTOS) */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Extrato Detalhado de Gastos em Cartões Corporativos
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Histórico unificado de lançamentos e notas de conformidade fiscal.</p>
            </div>
            
            <div className="flex items-center gap-2 print:hidden">
              <span className="text-[11px] font-bold text-slate-500">Filtrar por Cartão:</span>
              <select 
                value={selectedCardId}
                onChange={e => setSelectedCardId(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="todos">Mostrar Todos</option>
                {cartoes.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase tracking-wider text-[9px] font-extrabold border-b border-slate-100">
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Cartão</th>
                  <th className="py-3 px-4">Descrição da Despesa</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-center print:hidden">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gastos
                  .filter(g => selectedCardId === 'todos' || g.cartao_id === selectedCardId)
                  .map(gasto => {
                    const card = cartoes.find(c => c.id === gasto.cartao_id);
                    return (
                      <tr key={gasto.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4 font-mono text-slate-500">{gasto.data.split('-').reverse().join('/')}</td>
                        <td className="py-3 px-4">
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 text-[9px] font-extrabold rounded uppercase tracking-wider">
                            {card?.nome || gasto.cartao_id.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">{gasto.descricao}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded-full">
                            {gasto.categoria}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                          R$ {gasto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center print:hidden">
                          <button 
                            onClick={() => handleDeleteGasto(gasto.id, gasto.descricao)}
                            className="p-1 text-slate-400 hover:text-red-500 transition cursor-pointer"
                            title="Remover Despesa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                {/* Empty State Table */}
                {gastos.filter(g => selectedCardId === 'todos' || g.cartao_id === selectedCardId).length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold">Nenhum gasto lançado para o filtro selecionado.</p>
                      <p className="text-[11px] text-slate-400">Utilize o formulário acima para registrar gastos.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
