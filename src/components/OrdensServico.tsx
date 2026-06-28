import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, Search, Plus, CheckSquare, Wrench, Image as ImageIcon, 
  PenTool, Printer, CheckCircle, Clock, AlertTriangle, X, Play, Trash2, 
  MessageSquare, ChevronLeft, Calendar, FileCheck, Landmark, DollarSign
} from 'lucide-react';
import { 
  Cliente, Equipamento, Tecnico, OrdemServico, Peca, ChecklistOS, FotoServico, PecaUsada 
} from '../types';

interface OrdensServicoProps {
  clientes: Cliente[];
  equipamentos: Equipamento[];
  tecnicos: Tecnico[];
  ordensServico: OrdemServico[];
  pecas: Peca[];
  addOrdemServico: (os: any) => OrdemServico;
  updateOrdemServico: (os: OrdemServico) => void;
  deleteOrdemServico: (id: string) => void;
  adjustStock: (id: string, amount: number) => void;
  selectedOSId: string | null;
  setSelectedOSId: (id: string | null) => void;
  empresaConfig: any;
}

export default function OrdensServico({
  clientes,
  equipamentos,
  tecnicos,
  ordensServico,
  pecas,
  addOrdemServico,
  updateOrdemServico,
  deleteOrdemServico,
  adjustStock,
  selectedOSId,
  setSelectedOSId,
  empresaConfig
}: OrdensServicoProps) {
  // Master states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todas');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditingPrimary, setIsEditingPrimary] = useState(false);

  // Form Fields (For creating OS directly)
  const [clienteId, setClienteId] = useState('');
  const [equipamentoId, setEquipamentoId] = useState('');
  const [tecnicoId, setTecnicoId] = useState('');
  const [tipoServico, setTipoServico] = useState<OrdemServico['tipo_servico']>('manutencao_preventiva');
  const [problemaInformado, setProblemaInformado] = useState('');
  const [valorMaoObra, setValorMaoObra] = useState<number>(150);

  // Detail execution states
  const [activeSubTab, setActiveSubTab] = useState<'checklist' | 'pecas' | 'fotos' | 'assinatura'>('checklist');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Signature drawing states
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Mock Photo input states
  const [photoCategory, setPhotoCategory] = useState<FotoServico['categoria']>('antes');
  const [photoLegenda, setPhotoLegenda] = useState('');
  const [photoMockUrl, setPhotoMockUrl] = useState('');

  // Parts adding state
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQty, setPartQty] = useState(1);

  // Select first client initially
  useEffect(() => {
    if (clientes.length > 0 && !clienteId) {
      setClienteId(clientes[0].id);
      const firstEq = equipamentos.find(e => e.cliente_id === clientes[0].id);
      setEquipamentoId(firstEq ? firstEq.id : '');
    }
  }, [clientes, equipamentos]);

  // Current OS selected
  const activeOS = ordensServico.find(o => o.id === selectedOSId);

  // Draw signature handlers
  useEffect(() => {
    if (activeSubTab === 'assinatura' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1e3a8a'; // Dark blue signature
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
      }
    }
  }, [activeSubTab, selectedOSId]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const pos = getEventCoords(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Prevent scrolling when drawing on mobile
    if (e.cancelable) e.preventDefault();

    const pos = getEventCoords(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getEventCoords = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveSignature = () => {
    if (!canvasRef.current || !activeOS) return;
    const canvas = canvasRef.current;
    const signatureUrl = canvas.toDataURL('image/png');
    
    updateOrdemServico({
      ...activeOS,
      assinatura_cliente: signatureUrl
    });
    alert('Assinatura salva com sucesso nesta Ordem de Serviço!');
  };

  // Checklist updates
  const handleChecklistChange = (key: keyof ChecklistOS) => {
    if (!activeOS) return;
    const updatedChecklist = {
      ...activeOS.checklist,
      [key]: !activeOS.checklist[key]
    };

    updateOrdemServico({
      ...activeOS,
      checklist: updatedChecklist
    });
  };

  // Add Part to OS
  const handleAddPartToOS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOS || !selectedPartId) return;

    const part = pecas.find(p => p.id === selectedPartId);
    if (!part) return;

    if (part.quantidade_estoque < partQty) {
      return alert(`Estoque insuficiente! Disponível: ${part.quantidade_estoque}`);
    }

    // Adjust inventory
    adjustStock(part.id, -partQty);

    // Add to parts list of OS
    const lineTotal = part.valor_venda * partQty;
    const newPartUsada: PecaUsada = {
      peca_id: part.id,
      nome: part.nome,
      quantidade: partQty,
      valor_unitario: part.valor_venda,
      valor_total: lineTotal
    };

    const existingParts = activeOS.pecas_usadas || [];
    const updatedParts = [...existingParts, newPartUsada];
    const totalPartsCost = updatedParts.reduce((sum, p) => sum + p.valor_total, 0);

    const updatedOS: OrdemServico = {
      ...activeOS,
      pecas_usadas: updatedParts,
      valor_pecas: totalPartsCost,
      valor_total: activeOS.valor_mao_obra + totalPartsCost - activeOS.desconto
    };

    updateOrdemServico(updatedOS);
    setSelectedPartId('');
    setPartQty(1);
    alert('Peça adicionada à Ordem de Serviço e baixada do estoque!');
  };

  // Add mock photo attachment
  const handleAddMockPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOS) return;

    const mockImages = [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?w=600&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=600&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1621905252507-b354bc25edac?w=600&auto=format&fit=crop&q=60'
    ];

    const randomUrl = photoMockUrl || mockImages[Math.floor(Math.random() * mockImages.length)];

    const newPhoto: FotoServico = {
      id: `f_${Date.now()}`,
      url_foto: randomUrl,
      categoria: photoCategory,
      legenda: photoLegenda || `Foto da categoria ${photoCategory}`,
      criado_em: new Date().toISOString()
    };

    const updatedPhotos = [...(activeOS.fotos || []), newPhoto];
    updateOrdemServico({
      ...activeOS,
      fotos: updatedPhotos
    });

    setPhotoLegenda('');
    setPhotoMockUrl('');
    alert('Foto anexada com sucesso!');
  };

  // Mark as Finalized
  const handleFinalizeOS = () => {
    if (!activeOS) return;
    if (confirm('Deseja realmente finalizar esta Ordem de Serviço? Isso irá registrar a data de finalização e atualizar as datas periódicas no aparelho.')) {
      updateOrdemServico({
        ...activeOS,
        status: 'finalizada',
        data_finalizacao: new Date().toISOString()
      });
      alert('Ordem de Serviço finalizada com sucesso!');
    }
  };

  // direct OS creation submit
  const handleDirectCreateOSSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !equipamentoId || !tecnicoId) {
      return alert('Preencha os campos obrigatórios!');
    }

    const created = addOrdemServico({
      cliente_id: clienteId,
      equipamento_id: equipamentoId,
      tecnico_id: tecnicoId,
      tipo_servico: tipoServico,
      problema_informado: problemaInformado || 'Abertura direta de OS sem agendamento prévio.',
      valor_mao_obra: Number(valorMaoObra),
      valor_pecas: 0,
      desconto: 0,
      valor_total: Number(valorMaoObra),
      status: 'aberta',
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

    setSelectedOSId(created.id);
    setIsFormOpen(false);
  };

  // Filter list
  const filteredOS = ordensServico.filter(o => {
    const client = clientes.find(c => c.id === o.cliente_id);
    const clientName = client ? client.nome : '';
    const tech = tecnicos.find(t => t.id === o.tecnico_id);
    const techName = tech ? tech.nome : '';

    const matchesSearch = 
      o.numero_os.toString().includes(search) ||
      clientName.toLowerCase().includes(search.toLowerCase()) ||
      techName.toLowerCase().includes(search.toLowerCase()) ||
      o.tipo_servico.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'todas' || o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {!selectedOSId ? (
        // LIST VIEW
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800">Ordens de Serviço</h1>
              <p className="text-slate-500 text-xs mt-0.5">Preencha checklists, fature peças e colete assinaturas de conclusão.</p>
            </div>
            <button
              onClick={() => {
                setClienteId(clientes[0]?.id || '');
                setEquipamentoId(equipamentos.find(e => e.cliente_id === clientes[0]?.id)?.id || '');
                setTecnicoId(tecnicos[0]?.id || '');
                setTipoServico('manutencao_preventiva');
                setProblemaInformado('');
                setValorMaoObra(150);
                setIsFormOpen(true);
              }}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
            >
              <Plus className="w-4 h-4" /> Emitir OS Direta
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col md:flex-row gap-4 shadow-xs">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por Nº da OS, cliente, técnico, tipo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg text-xs transition outline-hidden"
              />
            </div>

            {/* Status filtering */}
            <div className="flex flex-wrap gap-1">
              {([
                { id: 'todas', label: 'Todas' },
                { id: 'aberta', label: 'Aberta' },
                { id: 'em_andamento', label: 'Em Execução' },
                { id: 'aguardando_peca', label: 'Sem Peça' },
                { id: 'finalizada', label: 'Finalizada' }
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    statusFilter === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table / Cards */}
          {filteredOS.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-100 text-slate-400 space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold">Nenhuma Ordem de Serviço encontrada</p>
              <p className="text-xs">Inicie um atendimento pela Agenda ou crie uma OS Direta no botão.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredOS.map(os => {
                const client = clientes.find(c => c.id === os.cliente_id);
                const equip = equipamentos.find(e => e.id === os.equipamento_id);
                const tech = tecnicos.find(t => t.id === os.tecnico_id);

                return (
                  <div
                    key={os.id}
                    onClick={() => setSelectedOSId(os.id)}
                    className="p-5 bg-white border border-slate-100 hover:border-blue-300 rounded-xl cursor-pointer shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                          OS #{os.numero_os}
                        </span>
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="text-xs font-semibold text-slate-500 capitalize">{os.tipo_servico.replace('_', ' ')}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-sm uppercase font-mono ${
                          os.status === 'finalizada'
                            ? 'bg-emerald-100 text-emerald-800'
                            : os.status === 'em_andamento'
                            ? 'bg-blue-100 text-blue-800'
                            : os.status === 'aguardando_peca'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {os.status}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-800 text-base">{client?.nome}</h3>
                      <p className="text-xs text-slate-500">
                        ❄️ Aparelho: <strong className="text-slate-700">{equip ? `${equip.marca} ${equip.modelo} (${equip.local_instalado})` : 'Não especificado'}</strong>
                      </p>
                      <p className="text-xs text-slate-400">
                        🛠️ Técnico responsável: {tech?.nome}
                      </p>
                    </div>

                    <div className="flex md:flex-col items-end justify-between md:justify-center shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6 text-right">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 block font-medium uppercase">Valor Total</span>
                        <span className="text-base font-bold font-mono text-blue-800 block">
                          R$ {os.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block mt-1">
                        Abertura: {os.data_abertura.split('T')[0]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        // ACTIVE OS EXECUTION LAYOUT
        <div className="space-y-6">
          {/* Back button and status bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <button
              onClick={() => setSelectedOSId(null)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition self-start"
            >
              <ChevronLeft className="w-4 h-4" /> Voltar para a lista
            </button>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="font-mono text-sm font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-md">
                OS #{activeOS?.numero_os}
              </span>
              <button
                onClick={() => setIsEditingPrimary(!isEditingPrimary)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition ${
                  isEditingPrimary 
                    ? 'bg-amber-600 border-amber-600 text-white hover:bg-amber-700 font-bold' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold'
                }`}
              >
                {isEditingPrimary ? 'Concluir Edição 💾' : '✏️ Editar Campos'}
              </button>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-semibold text-slate-500 uppercase">Mudar Status:</span>
              {(['em_andamento', 'aguardando_peca', 'aguardando_aprovacao', 'finalizada', 'cancelada'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => {
                    if (!activeOS) return;
                    if (st === 'finalizada') {
                      handleFinalizeOS();
                    } else {
                      updateOrdemServico({
                        ...activeOS,
                        status: st
                      });
                      alert(`Status atualizado para: ${st}`);
                    }
                  }}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-sm border transition ${
                    activeOS?.status === st
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Quick summary header of the job */}
          <div className="bg-slate-900 text-white p-6 rounded-xl shadow-xs grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Cliente</span>
              {isEditingPrimary && activeOS ? (
                <select
                  value={activeOS.cliente_id}
                  onChange={(e) => {
                    const newClientId = e.target.value;
                    const firstEq = equipamentos.find(eq => eq.cliente_id === newClientId);
                    updateOrdemServico({
                      ...activeOS,
                      cliente_id: newClientId,
                      equipamento_id: firstEq ? firstEq.id : ''
                    });
                  }}
                  className="bg-slate-850 text-white text-xs p-1.5 rounded-md border border-slate-700 w-full font-sans"
                >
                  {clientes.map(c => (
                    <option key={c.id} value={c.id} className="text-slate-900">{c.nome}</option>
                  ))}
                </select>
              ) : (
                <>
                  <strong className="text-base font-bold block">{clientes.find(c => c.id === activeOS?.cliente_id)?.nome}</strong>
                  <span className="text-xs text-slate-300 block">{clientes.find(c => c.id === activeOS?.cliente_id)?.endereco}</span>
                </>
              )}
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Aparelho</span>
              {isEditingPrimary && activeOS ? (
                <select
                  value={activeOS.equipamento_id}
                  onChange={(e) => {
                    updateOrdemServico({
                      ...activeOS,
                      equipamento_id: e.target.value
                    });
                  }}
                  className="bg-slate-850 text-white text-xs p-1.5 rounded-md border border-slate-700 w-full font-sans"
                >
                  <option value="" disabled className="text-slate-900">Selecione o aparelho...</option>
                  {equipamentos.filter(eq => eq.cliente_id === activeOS.cliente_id).map(eq => (
                    <option key={eq.id} value={eq.id} className="text-slate-900">
                      {eq.marca} - {eq.modelo} ({eq.local_instalado || eq.tipo_equipamento})
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <strong className="text-base font-bold block">
                    {equipamentos.find(e => e.id === activeOS?.equipamento_id)?.marca} (
                    {equipamentos.find(e => e.id === activeOS?.equipamento_id)?.capacidade_btu} BTUs)
                  </strong>
                  <span className="text-xs text-slate-300 block">Setor: {equipamentos.find(e => e.id === activeOS?.equipamento_id)?.local_instalado}</span>
                </>
              )}
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Técnico Encarregado</span>
              {isEditingPrimary && activeOS ? (
                <select
                  value={activeOS.tecnico_id}
                  onChange={(e) => {
                    updateOrdemServico({
                      ...activeOS,
                      tecnico_id: e.target.value
                    });
                  }}
                  className="bg-slate-850 text-white text-xs p-1.5 rounded-md border border-slate-700 w-full font-sans"
                >
                  {tecnicos.map(t => (
                    <option key={t.id} value={t.id} className="text-slate-900">{t.nome}</option>
                  ))}
                </select>
              ) : (
                <>
                  <strong className="text-base font-bold block">{tecnicos.find(t => t.id === activeOS?.tecnico_id)?.nome}</strong>
                  <span className="text-xs text-slate-300 block">Especialista R.A Climatização</span>
                </>
              )}
            </div>
            <div className="space-y-1 md:text-right md:border-l md:border-slate-800 md:pl-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Faturamento Técnico</span>
              <span className="text-xl font-extrabold font-mono text-blue-400 block">
                R$ {activeOS?.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold rounded-md transition inline-flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir Recibo / PDF
              </button>
            </div>
          </div>

          {/* Execution Tabs Nav */}
          <div className="border-b border-slate-100 flex gap-2">
            {[
              { id: 'checklist', label: 'Checklist de Manutenção', icon: CheckSquare },
              { id: 'pecas', label: 'Faturar Peças', icon: Wrench },
              { id: 'fotos', label: 'Fotos do Atendimento', icon: ImageIcon },
              { id: 'assinatura', label: 'Assinatura Digital', icon: PenTool }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`px-4 py-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
                    activeSubTab === tab.id
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT PANELS */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs">
            {/* 1. CHECKLIST TAB */}
            {activeSubTab === 'checklist' && activeOS && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">Checklist Técnico Padrão</h3>
                  <p className="text-slate-500 text-xs">Assinale todas as verificações efetuadas durante o atendimento preventivo ou corretivo.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { key: 'verificar_filtros', label: 'Verificar filtros de ar' },
                    { key: 'limpar_filtros', label: 'Limpar filtros de nylon/carvão' },
                    { key: 'limpar_evaporadora', label: 'Higienizar serpentina evaporadora' },
                    { key: 'limpar_condensadora', label: 'Limpar condensadora externa' },
                    { key: 'verificar_serpentina', label: 'Avaliar integridade das serpentinas' },
                    { key: 'verificar_turbina', label: 'Verificar ruído da turbina de ventilação' },
                    { key: 'verificar_dreno', label: 'Testar vazão do dreno de condensado' },
                    { key: 'verificar_pressao_gas', label: 'Medir pressão de gás refrigerante' },
                    { key: 'verificar_corrente_eletrica', label: 'Aferir corrente elétrica de consumo (A)' },
                    { key: 'verificar_tensao', label: 'Aferir tensão de alimentação (V)' },
                    { key: 'verificar_ruidos', label: 'Verificar ruídos anômalos ou vibração' },
                    { key: 'verificar_vazamentos', label: 'Rastrear vazamento na tubulação' },
                    { key: 'testar_controle_remoto', label: 'Testar funcionamento do controle' },
                    { key: 'testar_temperatura', label: 'Medir diferencial de temperatura (Ar)' },
                    { key: 'higienizar_equipamento', label: 'Aplicar bactericida / sanitizante' }
                  ].map(item => (
                    <label 
                      key={item.key}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer text-xs font-semibold text-slate-700 select-none"
                    >
                      <input
                        type="checkbox"
                        checked={activeOS.checklist[item.key as keyof ChecklistOS] as boolean || false}
                        onChange={() => handleChecklistChange(item.key as keyof ChecklistOS)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>

                {/* Checklist notes */}
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Observações e Diagnósticos Técnicos</label>
                  <textarea
                    rows={3}
                    value={activeOS.diagnostico_tecnico || ''}
                    onChange={(e) => {
                      updateOrdemServico({
                        ...activeOS,
                        diagnostico_tecnico: e.target.value
                      });
                    }}
                    placeholder="Registre o diagnóstico, anormalidades corrigidas e observações de garantia..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                  />
                </div>
              </div>
            )}

            {/* 2. PARTS INVOICING TAB */}
            {activeSubTab === 'pecas' && activeOS && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">Faturamento de Peças e Peças de Reposição</h3>
                  <p className="text-slate-500 text-xs">Vincule peças do almoxarifado a esta Ordem de Serviço. O estoque é reduzido automaticamente.</p>
                </div>

                {/* Form to add parts */}
                <form onSubmit={handleAddPartToOS} className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-1.5 w-full">
                    <label className="block text-xs font-semibold text-slate-500 uppercase">Escolher Peça do Estoque</label>
                    <select
                      value={selectedPartId}
                      onChange={(e) => setSelectedPartId(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                    >
                      <option value="" disabled>Selecione a peça para adicionar...</option>
                      {pecas.filter(p => p.status === 'ativo').map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nome} (Código: {p.codigo}) — R$ {p.valor_venda.toFixed(2)} [Estoque: {p.quantidade_estoque}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24 space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-500 uppercase">Quantidade</label>
                    <input
                      type="number"
                      min={1}
                      value={partQty}
                      onChange={(e) => setPartQty(Math.max(1, Number(e.target.value)))}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs text-right bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedPartId}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition shrink-0"
                  >
                    Adicionar à OS
                  </button>
                </form>

                {/* List parts faturadas */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Peças e Insumos adicionados a esta OS</h4>
                  {(!activeOS.pecas_usadas || activeOS.pecas_usadas.length === 0) ? (
                    <p className="text-xs text-slate-400 italic py-4">Nenhuma peça faturada nesta Ordem de Serviço.</p>
                  ) : (
                    <div className="border border-slate-100 rounded-lg overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                          <tr>
                            <th className="p-3">Item</th>
                            <th className="p-3 text-center">Quantidade</th>
                            <th className="p-3 text-right">Unitário</th>
                            <th className="p-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {activeOS.pecas_usadas.map((pu, i) => (
                            <tr key={i}>
                              <td className="p-3 font-medium text-slate-800">{pu.nome}</td>
                              <td className="p-3 text-center font-semibold font-mono">{pu.quantidade}</td>
                              <td className="p-3 text-right font-mono">R$ {pu.valor_unitario.toFixed(2)}</td>
                              <td className="p-3 text-right font-mono font-bold text-slate-700">R$ {pu.valor_total.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Direct financial modification inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-500 uppercase">Valor da Mão de Obra (R$)</label>
                    <input
                      type="number"
                      value={activeOS.valor_mao_obra}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        updateOrdemServico({
                          ...activeOS,
                          valor_mao_obra: val,
                          valor_total: val + activeOS.valor_pecas - activeOS.desconto
                        });
                      }}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-500 uppercase">Custo de Peças (R$ - Auto)</label>
                    <input
                      type="number"
                      readOnly
                      disabled
                      value={activeOS.valor_pecas}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-400 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-500 uppercase">Desconto Especial (R$)</label>
                    <input
                      type="number"
                      value={activeOS.desconto}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        updateOrdemServico({
                          ...activeOS,
                          desconto: val,
                          valor_total: activeOS.valor_mao_obra + activeOS.valor_pecas - val
                        });
                      }}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. MOCK ATTACHMENT PHOTOS TAB */}
            {activeSubTab === 'fotos' && activeOS && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">Fotos do Equipamento e do Serviço</h3>
                  <p className="text-slate-500 text-xs">Anexe fotos de antes/depois da higienização, de vazamentos detectados ou peças substituídas.</p>
                </div>

                {/* Form mock photo upload */}
                <form onSubmit={handleAddMockPhoto} className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 flex flex-col md:flex-row gap-4 items-end">
                  <div className="space-y-1.5 w-full md:w-44 shrink-0">
                    <label className="block text-xs font-semibold text-slate-500 uppercase">Etapa / Categoria</label>
                    <select
                      value={photoCategory}
                      onChange={(e) => setPhotoCategory(e.target.value as any)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                    >
                      <option value="antes">Antes do Serviço</option>
                      <option value="depois">Depois do Serviço</option>
                      <option value="vazamento">Vazamento / Problema</option>
                      <option value="peca_danificada">Peça Danificada</option>
                      <option value="outros">Outros</option>
                    </select>
                  </div>

                  <div className="flex-1 space-y-1.5 w-full">
                    <label className="block text-xs font-semibold text-slate-500 uppercase">Legenda Descritiva</label>
                    <input
                      type="text"
                      required
                      value={photoLegenda}
                      onChange={(e) => setPhotoLegenda(e.target.value)}
                      placeholder="Ex: Serpentina higienizada com sanitizante"
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shrink-0"
                  >
                    Simular Upload de Foto
                  </button>
                </form>

                {/* List photos */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Galeria do Atendimento</h4>
                  {(!activeOS.fotos || activeOS.fotos.length === 0) ? (
                    <p className="text-xs text-slate-400 italic py-4">Nenhuma foto anexada a este atendimento.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {activeOS.fotos.map(ph => (
                        <div key={ph.id} className="border border-slate-200 rounded-lg overflow-hidden group relative bg-slate-50">
                          <img 
                            src={ph.url_foto} 
                            alt={ph.legenda} 
                            className="w-full h-36 object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="p-2 space-y-0.5">
                            <span className="text-[9px] font-bold uppercase text-blue-700 bg-blue-50 px-1 rounded-sm">{ph.categoria}</span>
                            <p className="text-[11px] text-slate-600 font-medium leading-tight truncate">{ph.legenda}</p>
                          </div>
                          
                          {/* Remove button */}
                          <button
                            onClick={() => {
                              const updatedPhotos = activeOS.fotos.filter(p => p.id !== ph.id);
                              updateOrdemServico({ ...activeOS, fotos: updatedPhotos });
                              alert('Foto removida!');
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition shadow-md"
                            title="Remover foto"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. CANVAS SIGNATURE TAB */}
            {activeSubTab === 'assinatura' && activeOS && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">Assinatura Digital do Cliente</h3>
                  <p className="text-slate-500 text-xs">Colete a assinatura do cliente diretamente na tela para comprovação e encerramento do chamado.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Signature pad canvas */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Assine no Quadro Abaixo:</label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-slate-50/50 relative">
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={180}
                        className="w-full h-44 bg-transparent cursor-crosshair touch-none block"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="px-3 py-1.5 text-xs border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-100 transition"
                      >
                        Limpar Desenho
                      </button>
                      <button
                        type="button"
                        onClick={saveSignature}
                        className="px-3 py-1.5 text-xs bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                      >
                        Salvar Assinatura
                      </button>
                    </div>
                  </div>

                  {/* Saved Signature View */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-3 flex flex-col justify-center">
                    <h4 className="text-xs font-bold text-slate-500 uppercase">Assinatura Ativa na OS</h4>
                    {activeOS.assinatura_cliente ? (
                      <div className="space-y-2">
                        {activeOS.assinatura_cliente.startsWith('data:image') ? (
                          <div className="bg-white p-2 border border-slate-100 rounded-lg max-w-[280px]">
                            <img 
                              src={activeOS.assinatura_cliente} 
                              alt="Assinatura do Cliente" 
                              className="max-h-24 w-auto object-contain mx-auto"
                            />
                          </div>
                        ) : (
                          <p className="text-sm font-semibold text-slate-700 bg-white p-3 border border-slate-100 rounded-lg">
                            📝 {activeOS.assinatura_cliente}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            updateOrdemServico({ ...activeOS, assinatura_cliente: undefined });
                          }}
                          className="text-xs text-rose-600 hover:underline font-semibold"
                        >
                          Remover assinatura da OS
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Nenhuma assinatura registrada para esta Ordem de Serviço ainda.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Direct OS emission modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50 animate-fade-in">
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-800">Emitir Ordem de Serviço Direta</h2>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleDirectCreateOSSubmit} className="space-y-4 mt-4">
                {/* Cliente */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cliente *</label>
                  <select
                    required
                    value={clienteId}
                    onChange={(e) => {
                      setClienteId(e.target.value);
                      const firstEq = equipamentos.find(eq => eq.cliente_id === e.target.value);
                      setEquipamentoId(firstEq ? firstEq.id : '');
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition bg-white"
                  >
                    <option value="" disabled>Selecione o cliente...</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Equipamento */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Aparelho Vinculado *</label>
                  <select
                    required
                    value={equipamentoId}
                    onChange={(e) => setEquipamentoId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition bg-white"
                  >
                    <option value="" disabled>Selecione o aparelho...</option>
                    {equipamentos.filter(e => e.cliente_id === clienteId).map(eq => (
                      <option key={eq.id} value={eq.id}>
                        {eq.marca} {eq.modelo} ({eq.local_instalado || eq.tipo_equipamento}) - {eq.capacidade_btu} BTUs
                      </option>
                    ))}
                  </select>
                </div>

                {/* Técnico */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Técnico Designado *</label>
                  <select
                    required
                    value={tecnicoId}
                    onChange={(e) => setTecnicoId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition bg-white"
                  >
                    <option value="" disabled>Selecione o técnico responsável...</option>
                    {tecnicos.map(t => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Tipo de Atendimento */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo de Serviço</label>
                  <select
                    value={tipoServico}
                    onChange={(e) => setTipoServico(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition bg-white capitalize"
                  >
                    <option value="manutencao_preventiva">Manutenção Preventiva</option>
                    <option value="manutencao_corretiva">Manutenção Corretiva (Reparo)</option>
                    <option value="instalacao">Instalação de Novo Aparelho</option>
                    <option value="limpeza">Limpeza de Filtros</option>
                    <option value="higienizacao">Higienização Química Completa</option>
                    <option value="recarga_gas">Recarga de Gás Fluido</option>
                    <option value="visita_tecnica">Visita Técnica de Diagnóstico</option>
                  </select>
                </div>

                {/* Valor Inicial Mão de Obra */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Valor Unitário Mão de Obra (R$) *</label>
                  <input
                    type="number"
                    required
                    value={valorMaoObra}
                    onChange={(e) => setValorMaoObra(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition font-mono"
                  />
                </div>

                {/* Problema Informado */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Problema Informado / Descrição do Serviço</label>
                  <textarea
                    value={problemaInformado}
                    onChange={(e) => setProblemaInformado(e.target.value)}
                    rows={3}
                    placeholder="Descrição do defeito relatado ou do plano de trabalho..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                  />
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
                onClick={handleDirectCreateOSSubmit}
                className="flex-1 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Abrir Ordem de Serviço
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GORGEOUS PRINTABLE MODAL FOR REPORT PDF */}
      {isPrintModalOpen && activeOS && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col justify-between shadow-2xl animate-scale-up">
            
            {/* Modal header with immediate print action */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between no-print shrink-0">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-700" />
                <span className="text-sm font-bold text-slate-800">Recibo / Ordem de Serviço Impressa</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-4 h-4" /> Enviar para Impressora / PDF
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-lg transition"
                >
                  Fechar
                </button>
              </div>
            </div>

            {/* PRINT BODY ELEMENT */}
            <div id="print-area" className="p-8 space-y-6 overflow-y-auto bg-white text-slate-800 font-sans print:p-0">
              {/* Report Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-200 pb-5 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">❄️</span>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">{empresaConfig.nome_empresa}</h1>
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-sm">
                    CNPJ: {empresaConfig.cnpj} | {empresaConfig.endereco}, {empresaConfig.cidade} - {empresaConfig.estado}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Fone: {empresaConfig.telefone} | WhatsApp: {empresaConfig.whatsapp} | {empresaConfig.email}
                  </p>
                </div>
                
                <div className="sm:text-right space-y-1 shrink-0 bg-slate-100/60 p-4 rounded-xl border border-slate-200 w-full sm:w-auto">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Ordem de Serviço</h2>
                  <p className="text-xl font-black font-mono text-blue-900">Nº {activeOS.numero_os}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Status: <span className="font-bold uppercase text-slate-800">{activeOS.status}</span></p>
                  <p className="text-[11px] text-slate-400">Emissão: {activeOS.data_abertura.split('T')[0]}</p>
                </div>
              </div>

              {/* Clients and AC Unit Ledger info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100 pb-5">
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider">Dados do Cliente</h3>
                  {(() => {
                    const client = clientes.find(c => c.id === activeOS.cliente_id);
                    return (
                      <div className="text-xs space-y-1">
                        <p className="font-bold text-slate-900 text-sm">{client?.nome}</p>
                        <p className="text-slate-600">CPF/CNPJ: {client?.cpf_cnpj}</p>
                        <p className="text-slate-600">Tel/WhatsApp: {client?.telefone} {client?.whatsapp ? ` / ${client?.whatsapp}` : ''}</p>
                        <p className="text-slate-500">Endereço: {client?.endereco}, {client?.cidade} - {client?.estado}</p>
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-2 md:border-l md:border-slate-100 md:pl-6">
                  <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider">Identificação do Equipamento</h3>
                  {(() => {
                    const eq = equipamentos.find(e => e.id === activeOS.equipamento_id);
                    return (
                      <div className="text-xs space-y-1">
                        <p className="font-bold text-slate-900 text-sm">{eq?.marca} — {eq?.modelo}</p>
                        <p className="text-slate-600">Tipo: <span className="font-medium capitalize">{eq?.tipo_equipamento.replace('_', ' ')}</span></p>
                        <p className="text-slate-600">Capacidade: <span className="font-semibold">{eq?.capacidade_btu.toLocaleString('pt-BR')} BTUs</span></p>
                        <p className="text-slate-600">Número de Série: <span className="font-mono">{eq?.numero_serie}</span></p>
                        <p className="text-slate-500">Local de Instalação: <span className="font-medium">{eq?.local_instalado}</span></p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Service Details Description */}
              <div className="space-y-2 border-b border-slate-100 pb-5 text-xs">
                <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider">Descrição dos Serviços Executados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-500 uppercase text-[10px]">Defeito / Problema Relatado:</span>
                    <p className="text-slate-700 mt-1 font-medium">{activeOS.problema_informado}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-500 uppercase text-[10px]">Parecer / Diagnóstico Técnico:</span>
                    <p className="text-slate-700 mt-1 font-medium">{activeOS.diagnostico_tecnico || 'Nenhum parecer técnico detalhado adicionado.'}</p>
                  </div>
                </div>
              </div>

              {/* Technical checklist table */}
              <div className="space-y-3 border-b border-slate-100 pb-5">
                <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider">Laudo do Checklist de Manutenção</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-1.5 gap-x-4 text-[10px]">
                  {[
                    { key: 'verificar_filtros', label: 'Verificar filtros de ar' },
                    { key: 'limpar_filtros', label: 'Limpar filtros de nylon/carvão' },
                    { key: 'limpar_evaporadora', label: 'Higienizar serpentina evaporadora' },
                    { key: 'limpar_condensadora', label: 'Limpar condensadora externa' },
                    { key: 'verificar_serpentina', label: 'Avaliar integridade serpentinas' },
                    { key: 'verificar_turbina', label: 'Verificar ruído turbina de vento' },
                    { key: 'verificar_dreno', label: 'Testar vazão do dreno condensado' },
                    { key: 'verificar_pressao_gas', label: 'Medir pressão de gás refrigerante' },
                    { key: 'verificar_corrente_eletrica', label: 'Aferir corrente elétrica (A)' },
                    { key: 'verificar_tensao', label: 'Aferir tensão de alimentação (V)' },
                    { key: 'verificar_ruidos', label: 'Verificar ruídos ou vibrações' },
                    { key: 'verificar_vazamentos', label: 'Rastrear vazamentos tubulação' },
                    { key: 'testar_controle_remoto', label: 'Testar controle remoto' },
                    { key: 'testar_temperatura', label: 'Medir diferencial de temperatura' },
                    { key: 'higienizar_equipamento', label: 'Aplicar bactericida sanitizante' }
                  ].map(item => {
                    const checked = activeOS.checklist[item.key as keyof ChecklistOS];
                    return (
                      <div key={item.key} className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold leading-none ${checked ? 'text-emerald-600' : 'text-slate-300'}`}>
                          {checked ? '☑' : '☐'}
                        </span>
                        <span className={checked ? 'text-slate-800 font-medium' : 'text-slate-400'}>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Table of Parts faturadas inside report */}
              {activeOS.pecas_usadas && activeOS.pecas_usadas.length > 0 && (
                <div className="space-y-2 border-b border-slate-100 pb-5">
                  <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider">Peças de Reposição e Componentes Substituídos</h3>
                  <table className="w-full text-left text-xs border border-slate-100 rounded-lg overflow-hidden">
                    <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="p-2.5 pl-3">Peça / Insumo</th>
                        <th className="p-2.5 text-center">Quantidade</th>
                        <th className="p-2.5 text-right">Preço Unitário</th>
                        <th className="p-2.5 text-right pr-3">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {activeOS.pecas_usadas.map((pu, i) => (
                        <tr key={i}>
                          <td className="p-2.5 pl-3 font-medium text-slate-800">{pu.nome}</td>
                          <td className="p-2.5 text-center font-mono font-bold">{pu.quantidade}</td>
                          <td className="p-2.5 text-right font-mono">R$ {pu.valor_unitario.toFixed(2)}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-700 pr-3">R$ {pu.valor_total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Photos inside invoice */}
              {activeOS.fotos && activeOS.fotos.length > 0 && (
                <div className="space-y-2 border-b border-slate-100 pb-5 no-print">
                  <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider">Registro Fotográfico de Conformidade</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {activeOS.fotos.map((ph, i) => (
                      <div key={i} className="border border-slate-100 rounded-lg overflow-hidden text-center bg-slate-50 p-1">
                        <img 
                          src={ph.url_foto} 
                          alt="Conformidade" 
                          className="h-24 w-full object-cover rounded-sm"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[9px] font-bold uppercase text-blue-700 block mt-1">{ph.categoria}</span>
                        <p className="text-[10px] text-slate-600 font-medium leading-none truncate mt-0.5 px-1">{ph.legenda}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Financial values overview */}
              <div className="flex justify-between items-end bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div className="space-y-1 text-[11px] text-slate-500 max-w-md italic pr-6 leading-relaxed">
                  <p className="font-semibold text-slate-700 not-italic">Observações de Cobrança:</p>
                  <p>{empresaConfig.texto_padrao_os}</p>
                </div>

                <div className="space-y-1.5 text-xs text-right shrink-0 min-w-[200px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Serviços / Mão de obra:</span>
                    <span className="font-mono font-semibold text-slate-700">R$ {activeOS.valor_mao_obra.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Peças e Componentes:</span>
                    <span className="font-mono font-semibold text-slate-700">R$ {activeOS.valor_pecas.toFixed(2)}</span>
                  </div>
                  {activeOS.desconto > 0 && (
                    <div className="flex justify-between text-rose-600 font-medium">
                      <span>Desconto Aplicado:</span>
                      <span className="font-mono">- R$ {activeOS.desconto.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                    <span className="font-black text-slate-800 uppercase">Valor Total:</span>
                    <span className="font-mono font-extrabold text-blue-900 text-base">R$ {activeOS.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Signature section */}
              <div className="grid grid-cols-2 gap-12 pt-10 text-center">
                <div className="space-y-1">
                  <div className="h-16 flex items-end justify-center">
                    <span className="text-xs font-mono text-slate-400">__________________________________________</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">{tecnicos.find(t => t.id === activeOS.tecnico_id)?.nome}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Técnico R.A Climatização</p>
                </div>

                <div className="space-y-1">
                  <div className="h-16 flex items-end justify-center">
                    {activeOS.assinatura_cliente ? (
                      activeOS.assinatura_cliente.startsWith('data:image') ? (
                        <img 
                          src={activeOS.assinatura_cliente} 
                          alt="Signature" 
                          className="max-h-12 w-auto object-contain mx-auto"
                        />
                      ) : (
                        <span className="text-xs font-bold font-mono text-slate-700 underline">{activeOS.assinatura_cliente}</span>
                      )
                    ) : (
                      <span className="text-xs font-mono text-slate-400">__________________________________________</span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    {clientes.find(c => c.id === activeOS.cliente_id)?.nome}
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Assinatura do Cliente / Responsável</p>
                </div>
              </div>
            </div>

            {/* Print specific CSS helper stylesheet to render perfectly formatted documents */}
            <style>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #print-area, #print-area * {
                  visibility: visible;
                }
                #print-area {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  box-shadow: none !important;
                  border: none !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  background: white !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}
