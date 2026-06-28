import React, { useState, useEffect } from 'react';
import { 
  Sparkles, MessageSquare, Send, Heart, Zap, RefreshCw, 
  AlertCircle, Calendar, Gift, Copy, Check, FileText, 
  Instagram, Share2, Settings, Clock, CheckCircle2, ArrowRight
} from 'lucide-react';
import { Cliente, Equipamento } from '../types';

interface AgenteIAProps {
  clientes: Cliente[];
  equipamentos: Equipamento[];
}

interface ModeloMensagem {
  id: string;
  titulo: string;
  mensagem: string;
}

export default function AgenteIA({ clientes, equipamentos }: AgenteIAProps) {
  // Client & Equipment Selection State
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [selectedEquipamentoId, setSelectedEquipamentoId] = useState('');
  
  // Custom Variables for Persuasion Engine
  const [schedulingLink, setSchedulingLink] = useState(() => {
    const saved = localStorage.getItem('clima_ia_scheduling_link');
    return saved || 'https://agendar.climatech.com.br/visita';
  });
  
  const [recurrenceMonths, setRecurrenceMonths] = useState<number>(() => {
    const saved = localStorage.getItem('clima_ia_recurrence');
    return saved ? Number(saved) : 6;
  });

  const [incluirCupom, setIncluirCupom] = useState(() => {
    const saved = localStorage.getItem('clima_ia_use_coupon');
    return saved === 'true';
  });

  const [couponCode, setCouponCode] = useState(() => {
    const saved = localStorage.getItem('clima_ia_coupon_code');
    return saved || 'CLIMA10';
  });

  // UI state
  const [activeFoco, setActiveFoco] = useState<'saude' | 'energia' | 'direto' | 'beneficios'>('saude');
  const [isLoading, setIsLoading] = useState(false);
  const [warning, setWarning] = useState('');
  const [modelos, setModelos] = useState<ModeloMensagem[]>([]);
  const [editedMessage, setEditedMessage] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Kit do Consultor de Vendas Tabs
  const [activeKitTab, setActiveKitTab] = useState<'desconto' | 'sequencia' | 'redes'>('desconto');
  const [copiedKit, setCopiedKit] = useState(false);

  // Save config changes to localStorage
  useEffect(() => {
    localStorage.setItem('clima_ia_scheduling_link', schedulingLink);
  }, [schedulingLink]);

  useEffect(() => {
    localStorage.setItem('clima_ia_recurrence', recurrenceMonths.toString());
  }, [recurrenceMonths]);

  useEffect(() => {
    localStorage.setItem('clima_ia_use_coupon', incluirCupom.toString());
  }, [incluirCupom]);

  useEffect(() => {
    localStorage.setItem('clima_ia_coupon_code', couponCode);
  }, [couponCode]);

  // Get active client & equipment objects
  const activeCliente = clientes.find(c => c.id === selectedClienteId);
  const clientEquips = equipamentos.filter(e => e.cliente_id === selectedClienteId);
  const activeEquipamento = clientEquips.find(e => e.id === selectedEquipamentoId);

  // Set first equipment when client changes
  useEffect(() => {
    if (clientEquips.length > 0) {
      setSelectedEquipamentoId(clientEquips[0].id);
    } else {
      setSelectedEquipamentoId('');
    }
  }, [selectedClienteId]);

  // Load default fallback templates locally first matching user requests exactly
  const loadFallbackTemplates = (name: string, brand: string, loc: string) => {
    const couponSuffix = incluirCupom ? `\n\n🎁 *BÔNUS EXCLUSIVO:* Use o cupom *${couponCode}* para ganhar um desconto especial na higienização do seu aparelho!` : "";
    
    return [
      {
        id: 'saude',
        titulo: 'Opção 1: Foco na Saúde 🍃',
        mensagem: `Olá, *${name}*! Faz tempo que seu ar-condicionado *${brand}* no(a) *${loc}* não passa por uma limpeza. Garanta um ar puro e saudável para sua família hoje mesmo. Vamos agendar a manutenção preventiva? 🍃${couponSuffix}\n\n👉 Agende diretamente pelo nosso link: ${schedulingLink}`
      },
      {
        id: 'energia',
        titulo: 'Opção 2: Foco na Economia ⚡',
        mensagem: `Oi, *${name}*! Sabia que ar-condicionado sujo gasta até 30% mais energia? Evite surpresas na conta de luz e quebras repentinas do seu *${brand}* no(a) *${loc}*. Que tal agendar sua revisão para esta semana? ⚡${couponSuffix}\n\n👉 Escolha seu melhor horário: ${schedulingLink}`
      },
      {
        id: 'direto',
        titulo: 'Opção 3: Lembrete Rápido 📅',
        mensagem: `Hora da revisão! *${name}*, já se passaram *${recurrenceMonths}* meses desde a sua última manutenção de ar-condicionado no seu *${brand}* no(a) *${loc}*. Proteja seu aparelho e agende seu horário pelo link: ${schedulingLink} 📅${couponSuffix}`
      },
      {
        id: 'beneficios',
        titulo: 'Opção 4: Benefícios Claros ✨',
        mensagem: `Olá, *${name}*! Sabia que a higienização regular do seu ar-condicionado traz benefícios claros para a sua saúde e economia? Reduz poeira, ácaros, bactérias e o consumo de energia em até 30%. Que tal agendarmos? 🌬️${couponSuffix}\n\n👉 Agende rápido por aqui: ${schedulingLink}`
      }
    ];
  };

  // Populate models when client/equipment/variables change
  useEffect(() => {
    if (activeCliente) {
      const name = activeCliente.nome;
      const brand = activeEquipamento ? `${activeEquipamento.marca} ${activeEquipamento.modelo}` : 'Ar Condicionado';
      const loc = activeEquipamento ? activeEquipamento.local_instalado : 'Ambiente';
      const defaults = loadFallbackTemplates(name, brand, loc);
      setModelos(defaults);
      
      // Update selected message preview
      const activeModel = defaults.find(m => m.id === activeFoco);
      if (activeModel) {
        setEditedMessage(activeModel.mensagem);
      }
    } else {
      setModelos([]);
      setEditedMessage('');
    }
  }, [selectedClienteId, selectedEquipamentoId, activeFoco, schedulingLink, recurrenceMonths, incluirCupom, couponCode]);

  // Handle message generation calling Gemini API
  const handleGenerateWithAI = async () => {
    if (!selectedClienteId || !selectedEquipamentoId) {
      alert('Por favor, selecione o cliente e o equipamento primeiro.');
      return;
    }

    setIsLoading(true);
    setWarning('');
    try {
      const response = await fetch('/api/gemini/lembrete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cliente: activeCliente,
          equipamento: activeEquipamento,
          link: schedulingLink,
          meses: recurrenceMonths,
          cupom: couponCode,
          incluirCupom: incluirCupom
        }),
      });

      const data = await response.json();
      if (data.success && data.modelos && data.modelos.length > 0) {
        setModelos(data.modelos);
        if (data.warning) {
          setWarning(data.warning);
        }
        const activeModel = data.modelos.find((m: any) => m.id === activeFoco);
        if (activeModel) {
          setEditedMessage(activeModel.mensagem);
        } else {
          setEditedMessage(data.modelos[0].mensagem);
        }
      } else {
        throw new Error(data.error || 'Erro na resposta do servidor.');
      }
    } catch (err: any) {
      console.warn('Erro ao chamar Gemini, mantendo fallbacks inteligentes de alta conversão:', err);
      setWarning('A IA do Gemini está com alta demanda momentânea. Ativamos nossos modelos otimizados offline de alta conversão.');
    } finally {
      setIsLoading(false);
    }
  };

  // Send message via WhatsApp
  const handleSendWhatsApp = () => {
    if (!activeCliente) return;
    const whatsappNum = activeCliente.whatsapp || activeCliente.telefone || '';
    if (!whatsappNum) {
      alert('Este cliente não possui um número de WhatsApp cadastrado!');
      return;
    }

    // Clean phone number (leave only digits)
    const cleanPhone = whatsappNum.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    const url = `https://api.whatsapp.com/send?phone=${encodeURIComponent(formattedPhone)}&text=${encodeURIComponent(editedMessage)}`;
    window.open(url, '_blank');
  };

  // Copy Message to clipboard helper
  const handleCopyText = (text: string, setCopyState: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopyState(true);
    setTimeout(() => setCopyState(false), 2000);
  };

  // Pre-configured templates for closing tools
  const getKitText = () => {
    const clientName = activeCliente?.nome || "[Nome do Cliente]";
    const brandName = activeEquipamento ? `${activeEquipamento.marca} ${activeEquipamento.modelo}` : "Ar Condicionado";
    const local = activeEquipamento?.local_instalado || "Ambiente";

    switch(activeKitTab) {
      case 'desconto':
        return `🎉 *CONDIÇÃO EXCLUSIVA R.A CLIMATIZAÇÃO* 🎉\n\nOlá, *${clientName}*! Tudo bem?\n\nAnalisamos nossos registros e vimos que seu ar-condicionado *${brandName}* no(a) *${local}* está no período de manutenção preventiva de *${recurrenceMonths} meses*.\n\nPara te ajudar a manter o ar puro e economizar até 30% na luz, liberamos um cupom de desconto de *10% OFF* válido apenas para agendamentos fechados esta semana!\n\n🎟️ Cupom: *${couponCode}*\n⏱️ Validade: Até sexta-feira\n\n👉 Escolha seu horário e agende com desconto agora: ${schedulingLink}\n\nGaranta a saúde da sua família e durabilidade do seu aparelho!`;
      
      case 'sequencia':
        return `⚠️ *FLUXO DE REATIVAÇÃO EM 2 ETAPAS* ⚠️\n\n--- [LEMBRETE 1 - ENVIAR HOJE] ---\nOlá, *${clientName}*! Notamos que já fazem *${recurrenceMonths} meses* desde a última higienização preventiva do seu ar-condicionado *${brandName} (${local})*.\n\nA sujeira oculta no filtro força o motor e reduz a qualidade do ar da sua casa. Vamos deixar agendada uma limpeza rápida para esta semana?\n👉 Link de agendamento: ${schedulingLink}\n\n--- [LEMBRETE 2 - ENVIAR SE NÃO RESPONDER EM 48H] ---\nOi, *${clientName}*! Passando apenas para lembrar que a agenda de manutenção técnica preventiva da R.A Climatização para esta semana está quase esgotada. 🌬️\n\nNão deixe seu aparelho trabalhar forçado e gastar mais energia à toa. Queremos resguardar seu horário técnico com prioridade!\n👉 Garanta sua vaga agora pelo link: ${schedulingLink}`;
      
      case 'redes':
        return `🌬️ *VOCÊ SABIA? O PERIGO OCULTO NO SEU AR-CONDICIONADO!* 🌬️\n\nMuitas pessoas esperam o ar-condicionado quebrar ou parar de esfriar para chamar um técnico. Mas você sabia que a falta de higienização regular traz riscos graves e silenciosos?\n\n📌 *1. Riscos à Saúde:* Filtros sujos acumulam ácaros, fungos, poeira e bactérias, sendo um gatilho para rinites, asma e alergias severas.\n\n📌 *2. Bolso Apertado:* Um aparelho sujo precisa trabalhar o dobro para resfriar, o que aumenta em até *30% o consumo de energia elétrica* na sua conta!\n\n📌 *3. Prejuízo Grande:* A poeira obstrui as saídas e força o compressor, podendo queimar a peça mais cara do aparelho. Cuidar preventivamente evita gastos urgentes e caros.\n\n💡 *Dica de Ouro R.A Climatização:* Faça a higienização a cada 6 ou 12 meses. É rápido, limpo e protege sua saúde e seu bolso.\n\n👉 Precisa higienizar seu aparelho? Agende em segundos com nossos especialistas no link da bio ou acesse: ${schedulingLink}\n\n#RAClimatizacao #ArCondicionado #ArPuro #ManutencaoPreventiva #EconomiaDeEnergia #BemEstar #Higienizacao`;
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-6 opacity-10 pointer-events-none">
          <Sparkles className="w-64 h-64" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-600/50 border border-blue-500 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 animate-pulse" /> Inteligência Artificial Conversacional
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Agente IA R.A Climatização</h1>
            <p className="text-blue-100 text-xs font-medium">
              Dispare lembretes altamente persuasivos baseados no tempo desde a última limpeza. Economize energia, previna crises alérgicas e aumente a conversão da sua carteira de clientes.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15 shrink-0 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider block text-blue-200">Clientes Reativados</span>
            <span className="text-xl font-mono font-extrabold text-white">R$ +12.450,00</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Customer and Custom Variables Configuration (Span 4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Target Client selection */}
          <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
              <span>1. Selecionar Cliente</span>
            </h2>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Destinatário</label>
                <select
                  value={selectedClienteId}
                  onChange={(e) => setSelectedClienteId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-hidden transition"
                >
                  <option value="">-- Escolher Cliente --</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.tipo_cliente === 'comercial' ? '🏢 PJ' : '🏠 PF'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Equipamento Vinculado</label>
                <select
                  value={selectedEquipamentoId}
                  onChange={(e) => setSelectedEquipamentoId(e.target.value)}
                  disabled={!selectedClienteId}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-hidden transition disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">-- Selecionar Aparelho --</option>
                  {clientEquips.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.marca} - {eq.modelo} ({eq.local_instalado || eq.tipo_equipamento})
                    </option>
                  ))}
                </select>
                {selectedClienteId && clientEquips.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1 bg-amber-50 p-2 rounded-md font-medium border border-amber-100">
                    ⚠️ Este cliente não possui nenhum ar-condicionado cadastrado!
                  </p>
                )}
              </div>

              {activeCliente && (
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 space-y-1.5">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Detalhes de Contato</span>
                  <p className="text-xs font-bold text-slate-800">{activeCliente.nome}</p>
                  <p className="text-xs font-mono text-slate-600">{activeCliente.whatsapp || activeCliente.telefone || 'Sem telefone'}</p>
                  {activeEquipamento && (
                    <div className="pt-2 border-t border-slate-200 mt-2 text-[11px] text-slate-500 space-y-0.5">
                      <span className="font-bold text-slate-600 uppercase block text-[9px] tracking-wider">Aparelho</span>
                      <p>Marca/Modelo: <strong className="text-slate-700">{activeEquipamento.marca} {activeEquipamento.modelo}</strong></p>
                      <p>Btu/Tipo: <strong className="text-slate-700">{activeEquipamento.capacidade_btu} BTUs - {activeEquipamento.tipo_equipamento}</strong></p>
                      <p>Localização: <strong className="text-slate-700">{activeEquipamento.local_instalado || 'Sala Principal'}</strong></p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Engine Variable Configuration */}
          <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Configurações das Mensagens</span>
            </h2>

            <div className="space-y-4 text-xs">
              {/* Scheduling Link Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center justify-between">
                  <span>Link de Agendamento (Calendário)</span>
                  <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md font-semibold">Facilitador</span>
                </label>
                <input
                  type="text"
                  value={schedulingLink}
                  onChange={(e) => setSchedulingLink(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 font-mono text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-hidden transition"
                  placeholder="Link do calendário"
                />
              </div>

              {/* Recurrence Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center justify-between">
                  <span>Período de Recorrência Recomendada</span>
                  <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md font-semibold">Fidelização</span>
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setRecurrenceMonths(6)}
                    className={`p-2 rounded-lg text-center font-bold border transition ${
                      recurrenceMonths === 6
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    6 Meses 🔄
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecurrenceMonths(12)}
                    className={`p-2 rounded-lg text-center font-bold border transition ${
                      recurrenceMonths === 12
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    12 Meses 📅
                  </button>
                </div>
              </div>

              {/* Coupon Option */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600">Oferecer Cupom Especial?</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={incluirCupom}
                      onChange={(e) => setIncluirCupom(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {incluirCupom && (
                  <div className="bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-emerald-600 shrink-0" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="w-full text-xs font-bold uppercase tracking-wider p-1 rounded-md border border-emerald-200 bg-white text-emerald-800 text-center focus:ring-1 focus:ring-emerald-300 focus:outline-hidden"
                      placeholder="CÓDIGO CUPOM"
                    />
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>

        {/* Right Column: Templates Selection, Message Preview, and Sales Kit Toolbox (Span 8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Step 2: Choose Approach Template */}
          <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>2. Escolha o Gatilho / Abordagem</span>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Atualiza Automaticamente</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Option 1: Saúde */}
              <button
                onClick={() => setActiveFoco('saude')}
                disabled={!selectedClienteId}
                className={`p-3.5 rounded-xl border text-left transition relative flex gap-3 ${
                  activeFoco === 'saude'
                    ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 shadow-xs'
                    : 'border-slate-150 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                } disabled:opacity-50`}
              >
                <div className={`p-2 rounded-lg ${activeFoco === 'saude' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  <Heart className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold">Opção 1: Foco na Saúde 🍃</h3>
                  <p className="text-[10px] text-slate-500 leading-normal">Evite crises alérgicas, vírus e poeira acumulada garantindo ar puro.</p>
                </div>
              </button>

              {/* Option 2: Economia */}
              <button
                onClick={() => setActiveFoco('energia')}
                disabled={!selectedClienteId}
                className={`p-3.5 rounded-xl border text-left transition relative flex gap-3 ${
                  activeFoco === 'energia'
                    ? 'border-amber-500 bg-amber-50/40 text-amber-900 shadow-xs'
                    : 'border-slate-150 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                } disabled:opacity-50`}
              >
                <div className={`p-2 rounded-lg ${activeFoco === 'energia' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                  <Zap className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold">Opção 2: Economia de Energia ⚡</h3>
                  <p className="text-[10px] text-slate-500 leading-normal">Gatilho de custos: sujeira aumenta o consumo de energia em até 30%.</p>
                </div>
              </button>

              {/* Option 3: Direto ao ponto */}
              <button
                onClick={() => setActiveFoco('direto')}
                disabled={!selectedClienteId}
                className={`p-3.5 rounded-xl border text-left transition relative flex gap-3 ${
                  activeFoco === 'direto'
                    ? 'border-indigo-500 bg-indigo-50/40 text-indigo-900 shadow-xs'
                    : 'border-slate-150 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                } disabled:opacity-50`}
              >
                <div className={`p-2 rounded-lg ${activeFoco === 'direto' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold">Opção 3: Lembrete Rápido 📅</h3>
                  <p className="text-[10px] text-slate-500 leading-normal">Direto ao ponto informando a recorrência de {recurrenceMonths} meses.</p>
                </div>
              </button>

              {/* Option 4: Benefícios Claros */}
              <button
                onClick={() => setActiveFoco('beneficios')}
                disabled={!selectedClienteId}
                className={`p-3.5 rounded-xl border text-left transition relative flex gap-3 ${
                  activeFoco === 'beneficios'
                    ? 'border-blue-500 bg-blue-50/40 text-blue-900 shadow-xs'
                    : 'border-slate-150 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                } disabled:opacity-50`}
              >
                <div className={`p-2 rounded-lg ${activeFoco === 'beneficios' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold">Opção 4: Benefícios Claros ✨</h3>
                  <p className="text-[10px] text-slate-500 leading-normal">Lista concisa unindo redução de bactérias e economia do aparelho.</p>
                </div>
              </button>
            </div>
          </div>

          {/* Active Message Viewer & Personalizer */}
          <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Mensagem Formatada para WhatsApp</span>
              </h2>

              <button
                onClick={handleGenerateWithAI}
                disabled={!selectedClienteId || isLoading}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 px-3.5 py-1.5 rounded-lg transition"
              >
                {isLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                )}
                {isLoading ? 'Consultando Gemini...' : 'Enriquecer com IA ✨'}
              </button>
            </div>

            {warning && (
              <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-xs font-medium flex items-start gap-2 border border-amber-100">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{warning}</span>
              </div>
            )}

            {!selectedClienteId ? (
              <div className="p-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <p className="text-slate-400 italic text-xs">Por favor, selecione um cliente no menu esquerdo para visualizar a simulação e disparar.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <textarea
                    rows={8}
                    value={editedMessage}
                    onChange={(e) => setEditedMessage(e.target.value)}
                    className="w-full text-xs font-mono p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-hidden transition resize-none leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-400 font-sans italic text-right">Dica: Edite o texto acima diretamente se quiser fazer ajustes manuais de última hora.</p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Os campos mudam em tempo real com as alterações.</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyText(editedMessage, setCopied)}
                      className={`px-4 py-2 text-xs font-bold rounded-lg border transition flex items-center gap-1.5 ${
                        copied 
                          ? 'bg-slate-800 text-white border-slate-850'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copiar Texto
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={handleSendWhatsApp}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" /> Disparar WhatsApp 💬
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Kits do Consultor de Vendas R.A Climatização (Closer Tools Section) */}
          <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">Aumente seus fechamentos</span>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-emerald-400" />
                  <span>Kit do Consultor de Vendas R.A Climatização</span>
                </h3>
              </div>
              
              {/* Kit Navigation Tabs */}
              <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-[11px] font-bold">
                <button
                  onClick={() => setActiveKitTab('desconto')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    activeKitTab === 'desconto' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Cupom %
                </button>
                <button
                  onClick={() => setActiveKitTab('sequencia')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    activeKitTab === 'sequencia' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Sequência 2x ⏳
                </button>
                <button
                  onClick={() => setActiveKitTab('redes')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    activeKitTab === 'redes' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Post Redes Sociais 📲
                </button>
              </div>
            </div>

            <div className="space-y-3.5">
              <p className="text-slate-300 text-xs">
                {activeKitTab === 'desconto' && 'Condição imperdível com escassez de tempo para incentivar o cliente a fechar o serviço imediatamente.'}
                {activeKitTab === 'sequencia' && 'Fluxo composto por dois disparos integrados. Use o Lembrete 2 caso o cliente não responda ao primeiro lembrete.'}
                {activeKitTab === 'redes' && 'Uma publicação rica em benefícios e formatação impecável com emojis para postar no Instagram, Status do WhatsApp ou redes sociais.'}
              </p>

              <div className="relative bg-slate-850 p-4 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-200 overflow-x-auto max-h-64 leading-relaxed whitespace-pre-wrap">
                {getKitText()}
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">
                  {activeKitTab === 'redes' ? '💡 Copie e publique nas redes para atrair clientes de forma passiva.' : '💡 use para abordagens agressivas e reativações cirúrgicas.'}
                </span>

                <button
                  onClick={() => handleCopyText(getKitText(), setCopiedKit)}
                  className={`px-4 py-2 font-bold rounded-lg border text-xs transition flex items-center gap-1.5 ${
                    copiedKit
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750'
                  }`}
                >
                  {copiedKit ? (
                    <>
                      <Check className="w-4 h-4 text-white" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copiar Copiar do Kit
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
