import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, Calendar, 
  Wind, Info, X, Users, Settings, Hammer,
  Sparkles, MessageSquare, Copy, Check, Loader2
} from 'lucide-react';
import { Cliente, Equipamento } from '../types';

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max_width = 400; // Perfect thumbnail size
        const scale = max_width / img.width;
        canvas.width = max_width;
        canvas.height = img.height * scale;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // compress to 70% quality JPEG
          resolve(dataUrl);
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => reject(new Error('Imagem inválida'));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

interface EquipamentosProps {
  clientes: Cliente[];
  equipamentos: Equipamento[];
  addEquipamento: (eq: Omit<Equipamento, 'id'>) => Equipamento;
  updateEquipamento: (eq: Equipamento) => void;
  deleteEquipamento: (id: string) => void;
  setActiveTab: (tab: string) => void;
}

export default function Equipamentos({
  clientes,
  equipamentos,
  addEquipamento,
  updateEquipamento,
  deleteEquipamento,
  setActiveTab
}: EquipamentosProps) {
  // States
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [clientFilter, setClientFilter] = useState<string>('todos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEq, setEditingEq] = useState<Equipamento | null>(null);

  // Form Fields
  const [clienteId, setClienteId] = useState('');
  const [tipoEquipamento, setTipoEquipamento] = useState<Equipamento['tipo_equipamento']>('split');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [capacidadeBtu, setCapacidadeBtu] = useState<number>(12000);
  const [numeroSerie, setNumeroSerie] = useState('');
  const [localInstalado, setLocalInstalado] = useState('');
  const [dataInstalacao, setDataInstalacao] = useState('');
  const [dataUltimaManutencao, setDataUltimaManutencao] = useState('');
  const [dataProximaManutencao, setDataProximaManutencao] = useState('');
  const [frequenciaManutencao, setFrequenciaManutencao] = useState<Equipamento['frequencia_manutencao']>('trimestral');
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [observacoes, setObservacoes] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form Fields Options Helper States
  const marcasPredefinidas = ['Carrier', 'Consul', 'Philco', 'Agratto', 'Hisense', 'LG', 'Samsung', 'TCL', 'Gree', 'Fujitsu', 'Daikin', 'Elgin', 'Electrolux'];
  const modelosPredefinidos = ['WindFree', 'Dual Inverter', 'Eco Inverter', 'Full Inverter', 'Airstage', 'T-Pro 2.0', 'G-Top Auto Inverter', 'Color Adapt', 'Linha Zen Inverter', 'ConnectLife'];
  const capacidadesPredefinidas = [9000, 12000, 18000, 24000, 30000, 36000, 48000, 60000];
  const locaisPredefinidos = ['Recepção', 'Sala de Reunião', 'Sala de TI', 'Quarto', 'Sala', 'Quarto Suíte'];

  const [marcaOption, setMarcaOption] = useState<string>('');
  const [modeloOption, setModeloOption] = useState<string>('');
  const [capacidadeOption, setCapacidadeOption] = useState<string>('');
  const [localOption, setLocalOption] = useState<string>('');

  // Gemini Reminder States
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [selectedEqForReminder, setSelectedEqForReminder] = useState<Equipamento | null>(null);
  const [selectedClientForReminder, setSelectedClientForReminder] = useState<Cliente | null>(null);
  const [aiReminderModels, setAiReminderModels] = useState<Array<{ id: string, titulo: string, mensagem: string }>>([]);
  const [loadingReminder, setLoadingReminder] = useState(false);
  const [activeModelTab, setActiveModelTab] = useState<string>('saude');
  const [editableMessages, setEditableMessages] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Check if there's a routing filter from Clientes page
  useEffect(() => {
    const routeFilter = localStorage.getItem('climatech_equipment_client_filter');
    if (routeFilter) {
      setClientFilter(routeFilter);
      localStorage.removeItem('climatech_equipment_client_filter'); // Clear
    }
  }, []);

  // Open Form
  const handleOpenCreate = () => {
    setEditingEq(null);
    setClienteId(clientes[0]?.id || '');
    setTipoEquipamento('split');
    
    // Default to first pre-defined values
    setMarca('Carrier');
    setMarcaOption('Carrier');
    setModelo('WindFree');
    setModeloOption('WindFree');
    setCapacidadeBtu(12000);
    setCapacidadeOption('12000');
    setLocalInstalado('Recepção');
    setLocalOption('Recepção');

    setNumeroSerie('');
    setDataInstalacao(new Date().toISOString().split('T')[0]);
    setDataUltimaManutencao('');
    setDataProximaManutencao('');
    setFrequenciaManutencao('trimestral');
    setStatus('ativo');
    setObservacoes('');
    setFotoUrl('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (eq: Equipamento) => {
    setEditingEq(eq);
    setClienteId(eq.cliente_id);
    setTipoEquipamento(eq.tipo_equipamento);
    
    // Check if values match predefined arrays, otherwise set to 'outro'
    const matchMarca = marcasPredefinidas.find(m => m.toLowerCase() === eq.marca.toLowerCase());
    if (matchMarca) {
      setMarca(matchMarca);
      setMarcaOption(matchMarca);
    } else {
      setMarca(eq.marca);
      setMarcaOption('outro');
    }

    const matchModelo = modelosPredefinidos.find(m => m.toLowerCase() === eq.modelo.toLowerCase());
    if (matchModelo) {
      setModelo(matchModelo);
      setModeloOption(matchModelo);
    } else {
      setModelo(eq.modelo);
      setModeloOption('outro');
    }

    const isCapacidadePredef = capacidadesPredefinidas.includes(eq.capacidade_btu);
    if (isCapacidadePredef) {
      setCapacidadeBtu(eq.capacidade_btu);
      setCapacidadeOption(eq.capacidade_btu.toString());
    } else {
      setCapacidadeBtu(eq.capacidade_btu);
      setCapacidadeOption('outro');
    }

    const matchLocal = locaisPredefinidos.find(l => l.toLowerCase() === eq.local_instalado.toLowerCase());
    if (matchLocal) {
      setLocalInstalado(matchLocal);
      setLocalOption(matchLocal);
    } else {
      setLocalInstalado(eq.local_instalado);
      setLocalOption('outro');
    }

    setNumeroSerie(eq.numero_serie);
    setDataInstalacao(eq.data_instalacao);
    setDataUltimaManutencao(eq.data_ultima_manutencao || '');
    setDataProximaManutencao(eq.data_proxima_manutencao || '');
    setFrequenciaManutencao(eq.frequencia_manutencao);
    setStatus(eq.status);
    setObservacoes(eq.observacoes || '');
    setFotoUrl(eq.foto_url || '');
    setIsFormOpen(true);
  };

  // Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId) return alert('Selecione um cliente para vincular o aparelho!');
    if (!marca || !modelo) return alert('Marca e modelo são obrigatórios!');

    const eqData = {
      cliente_id: clienteId,
      tipo_equipamento: tipoEquipamento,
      marca,
      modelo,
      capacidade_btu: Number(capacidadeBtu),
      numero_serie: numeroSerie,
      local_instalado: localInstalado,
      data_instalacao: dataInstalacao,
      data_ultima_manutencao: dataUltimaManutencao || undefined,
      data_proxima_manutencao: dataProximaManutencao || undefined,
      frequencia_manutencao: frequenciaManutencao,
      status,
      observacoes: observacoes || undefined,
      foto_url: fotoUrl || undefined
    };

    if (editingEq) {
      updateEquipamento({
        ...editingEq,
        ...eqData
      });
    } else {
      addEquipamento(eqData);
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Deseja realmente excluir o aparelho "${name}"? O histórico de visitas vinculados a ele também será removido.`)) {
      deleteEquipamento(id);
    }
  };

  // Open Gemini AI Generator
  const handleOpenReminderGenerator = async (eq: Equipamento) => {
    const client = clientes.find(c => c.id === eq.cliente_id);
    if (!client) return alert('Cliente não localizado para este equipamento.');
    
    setSelectedEqForReminder(eq);
    setSelectedClientForReminder(client);
    setIsReminderModalOpen(true);
    setLoadingReminder(true);
    setAiReminderModels([]);
    
    try {
      const response = await fetch('/api/gemini/lembrete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cliente: client,
          equipamento: eq
        })
      });
      
      const data = await response.json();
      if (data.success && data.modelos) {
        setAiReminderModels(data.modelos);
        // Pre-fill editable messages
        const initialEditable: Record<string, string> = {};
        data.modelos.forEach((m: any) => {
          initialEditable[m.id] = m.mensagem;
        });
        setEditableMessages(initialEditable);
        if (data.modelos.length > 0) {
          setActiveModelTab(data.modelos[0].id);
        }
      } else {
        alert(data.error || 'Erro ao gerar modelos do lembrete.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao se conectar com a Inteligência Artificial. Verifique se o servidor está ativo.');
    } finally {
      setLoadingReminder(false);
    }
  };

  const handleSendWhatsApp = (mensagem: string) => {
    if (!selectedClientForReminder) return;
    const phone = selectedClientForReminder.whatsapp || selectedClientForReminder.telefone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    
    let targetPhone = cleanPhone;
    if (!targetPhone) {
      const inputPhone = prompt('O cliente não possui telefone cadastrado. Insira o WhatsApp com DDD (apenas números):', '11999998888');
      if (inputPhone) {
        targetPhone = inputPhone.replace(/\D/g, '');
      } else {
        return;
      }
    }
    
    if (targetPhone.length === 10 || targetPhone.length === 11) {
      targetPhone = `55${targetPhone}`;
    }
    
    const url = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter List
  const filteredEquipamentos = equipamentos.filter(eq => {
    const client = clientes.find(c => c.id === eq.cliente_id);
    const clientName = client ? client.nome : '';

    const matchesSearch = 
      eq.marca.toLowerCase().includes(search.toLowerCase()) ||
      eq.modelo.toLowerCase().includes(search.toLowerCase()) ||
      eq.numero_serie.toLowerCase().includes(search.toLowerCase()) ||
      eq.local_instalado.toLowerCase().includes(search.toLowerCase()) ||
      clientName.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'todos' || eq.tipo_equipamento === typeFilter;
    const matchesClient = clientFilter === 'todos' || eq.cliente_id === clientFilter;

    return matchesSearch && matchesType && matchesClient;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Equipamentos</h1>
          <p className="text-slate-500 text-xs mt-0.5">Gestão de aparelhos de ar-condicionado instalados por cliente.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
        >
          <Plus className="w-4 h-4" /> Cadastrar Aparelho
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3 shadow-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por marca, modelo, série, setor, cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg text-xs transition outline-hidden"
          />
        </div>

        {/* Client Filter */}
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs outline-hidden focus:bg-white"
          >
            <option value="todos">Todos os Clientes</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs outline-hidden focus:bg-white capitalize"
          >
            <option value="todos">Todos os Tipos</option>
            <option value="split">Split Wall</option>
            <option value="janela">Janela</option>
            <option value="cassete">Cassete</option>
            <option value="piso_teto">Piso-Teto</option>
            <option value="portatil">Portátil</option>
            <option value="vrf">Sistema VRF</option>
          </select>
        </div>
      </div>

      {/* Equipment List */}
      {filteredEquipamentos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-100 text-slate-400 space-y-2">
          <Wind className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold">Nenhum equipamento localizado</p>
          <p className="text-xs">Tente ajustar seus termos de busca ou vincule um novo aparelho ao cliente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipamentos.map((eq) => {
            const client = clientes.find(c => c.id === eq.cliente_id);
            const today = new Date().toISOString().split('T')[0];
            const isOverdue = eq.data_proxima_manutencao && eq.data_proxima_manutencao < today && eq.status === 'ativo';

            return (
              <div 
                key={eq.id}
                className={`bg-white rounded-xl border p-5 shadow-xs transition flex flex-col justify-between space-y-4 ${
                  isOverdue ? 'border-red-200 hover:border-red-300 bg-red-50/10' : 'border-slate-100 hover:border-blue-200'
                }`}
              >
                <div className="space-y-3">
                  {/* Photo or Placeholder at top */}
                  {eq.foto_url ? (
                    <div className="w-full h-32 rounded-lg overflow-hidden relative border border-slate-100">
                      <img 
                        src={eq.foto_url} 
                        alt={`${eq.marca} ${eq.modelo}`} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-10 bg-slate-50 border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 gap-1.5">
                      <Wind className="w-4 h-4 text-slate-300 animate-pulse" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Sem foto do aparelho</span>
                    </div>
                  )}

                  {/* Top: Type badge & Capacity */}
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-sm uppercase tracking-wider">
                      {eq.tipo_equipamento.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-sm">
                      {eq.capacidade_btu.toLocaleString('pt-BR')} BTUs
                    </span>
                  </div>

                  {/* Brand & Model */}
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{eq.marca}</h3>
                    <p className="text-xs text-slate-500 font-medium truncate">{eq.modelo}</p>
                    <p className="text-[11px] text-slate-400 mt-1 font-mono">Série: {eq.numero_serie || 'Não Informado'}</p>
                  </div>

                  {/* Sector / Location and Client */}
                  <div className="text-xs space-y-1 py-2 border-y border-slate-50">
                    <p className="text-slate-600 font-medium">
                      🏢 <span className="text-slate-800">{client?.nome}</span>
                    </p>
                    <p className="text-slate-500">
                      📍 Setor: <span className="text-slate-700 font-medium">{eq.local_instalado}</span>
                    </p>
                  </div>

                  {/* Maintenance dates & frequency */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Próxima Preventiva:</span>
                      <span className={`font-semibold font-mono ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-700'}`}>
                        {eq.data_proxima_manutencao || 'Não definida'} 
                        {isOverdue && ' (ATRASADA)'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Última Visita:</span>
                      <span className="text-slate-600 font-mono">{eq.data_ultima_manutencao || 'Nenhuma registrada'}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Frequência Exigida:</span>
                      <span className="text-blue-700 font-semibold capitalize bg-blue-50/50 px-1 rounded-sm">{eq.frequencia_manutencao}</span>
                    </div>
                  </div>

                  {eq.observacoes && (
                    <div className="text-[10px] bg-slate-50 p-2 rounded-lg text-slate-500 flex gap-1 items-start">
                      <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <p className="italic">{eq.observacoes}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-3 border-t border-slate-50">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // Pre-fill agendamento with client and equipment information
                        localStorage.setItem('climatech_agenda_preset_client', eq.cliente_id);
                        localStorage.setItem('climatech_agenda_preset_equip', eq.id);
                        setActiveTab('agenda');
                      }}
                      className="flex-1 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <Hammer className="w-3.5 h-3.5" /> Agendar Visita
                    </button>
                    <button
                      onClick={() => handleOpenReminderGenerator(eq)}
                      className="flex-1 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                      title="Lembrar Cliente via WhatsApp com IA"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-100" /> Lembrar com IA
                    </button>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => handleOpenEdit(eq)}
                      className="flex-1 py-1 px-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-md border border-slate-200 text-[11px] font-medium flex items-center justify-center gap-1 transition"
                      title="Editar Aparelho"
                    >
                      <Edit2 className="w-3 h-3" /> Editar
                    </button>
                    <button
                      onClick={() => handleDelete(eq.id, `${eq.marca} - ${eq.local_instalado}`)}
                      className="py-1 px-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md border border-rose-200 text-[11px] font-medium flex items-center justify-center gap-1 transition"
                      title="Excluir Aparelho"
                    >
                      <Trash2 className="w-3 h-3" /> Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Equipment Slide-over Drawer */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50 animate-fade-in">
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-800">
                  {editingEq ? 'Editar Equipamento' : 'Cadastrar Novo Equipamento'}
                </h2>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Form fields */}
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {/* Cliente Vinculado */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cliente Responsável *</label>
                  <select
                    required
                    disabled={!!editingEq}
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition bg-white"
                  >
                    <option value="" disabled>Selecione o cliente...</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Tipo Equipamento */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo do Equipamento</label>
                  <select
                    value={tipoEquipamento}
                    onChange={(e) => setTipoEquipamento(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition bg-white capitalize"
                  >
                    <option value="split">Split Wall</option>
                    <option value="janela">Janela</option>
                    <option value="cassete">Cassete</option>
                    <option value="piso_teto">Piso-Teto</option>
                    <option value="portatil">Portátil</option>
                    <option value="vrf">Sistema VRF</option>
                  </select>
                </div>

                {/* Marca & Modelo */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Marca *</label>
                    <select
                      value={marcaOption}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMarcaOption(val);
                        if (val !== 'outro') {
                          setMarca(val);
                        } else {
                          setMarca('');
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition bg-white"
                    >
                      {marcasPredefinidas.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                      <option value="outro">Outra (Digitar)...</option>
                    </select>
                    {marcaOption === 'outro' && (
                      <input
                        type="text"
                        required
                        value={marca}
                        onChange={(e) => setMarca(e.target.value)}
                        placeholder="Digite a marca..."
                        className="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Modelo *</label>
                    <select
                      value={modeloOption}
                      onChange={(e) => {
                        const val = e.target.value;
                        setModeloOption(val);
                        if (val !== 'outro') {
                          setModelo(val);
                        } else {
                          setModelo('');
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition bg-white"
                    >
                      {modelosPredefinidos.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                      <option value="outro">Outro (Digitar)...</option>
                    </select>
                    {modeloOption === 'outro' && (
                      <input
                        type="text"
                        required
                        value={modelo}
                        onChange={(e) => setModelo(e.target.value)}
                        placeholder="Digite o modelo..."
                        className="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                      />
                    )}
                  </div>
                </div>

                {/* Capacidade (BTUs) & Número de Série */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Capacidade (BTUs) *</label>
                    <select
                      value={capacidadeOption}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCapacidadeOption(val);
                        if (val !== 'outro') {
                          setCapacidadeBtu(Number(val));
                        } else {
                          setCapacidadeBtu(12000);
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition bg-white"
                    >
                      {capacidadesPredefinidas.map(c => (
                        <option key={c} value={c}>{c.toLocaleString('pt-BR')} BTUs</option>
                      ))}
                      <option value="outro">Outra (Digitar)...</option>
                    </select>
                    {capacidadeOption === 'outro' && (
                      <input
                        type="number"
                        required
                        value={capacidadeBtu}
                        onChange={(e) => setCapacidadeBtu(Number(e.target.value))}
                        placeholder="Ex: 12000"
                        className="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition text-right"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nº de Série</label>
                    <input
                      type="text"
                      value={numeroSerie}
                      onChange={(e) => setNumeroSerie(e.target.value)}
                      placeholder="Ex: SN-88223908X"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition font-mono"
                    />
                  </div>
                </div>

                {/* Local Instalado / Setor */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Local de Instalação (Setor/Ambiente)</label>
                  <select
                    value={localOption}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLocalOption(val);
                      if (val !== 'outro') {
                        setLocalInstalado(val);
                      } else {
                        setLocalInstalado('');
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition bg-white"
                  >
                    {locaisPredefinidos.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                    <option value="outro">Outros (Digitar)...</option>
                  </select>
                  {localOption === 'outro' && (
                    <input
                      type="text"
                      required
                      value={localInstalado}
                      onChange={(e) => setLocalInstalado(e.target.value)}
                      placeholder="Ex: Recepção, Sala de Reunião, Sala de TI"
                      className="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                    />
                  )}
                </div>

                {/* Data Instalação */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Data de Instalação</label>
                  <input
                    type="date"
                    value={dataInstalacao}
                    onChange={(e) => setDataInstalacao(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                  />
                </div>

                {/* Manutenções: Última, Próxima e Frequência */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Última Visita</label>
                    <input
                      type="date"
                      value={dataUltimaManutencao}
                      onChange={(e) => setDataUltimaManutencao(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Próxima Visita</label>
                    <input
                      type="date"
                      value={dataProximaManutencao}
                      onChange={(e) => setDataProximaManutencao(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Frequência</label>
                    <select
                      value={frequenciaManutencao}
                      onChange={(e) => setFrequenciaManutencao(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition bg-white"
                    >
                      <option value="mensal">Mensal</option>
                      <option value="bimestral">Bimestral</option>
                      <option value="trimestral">Trimestral</option>
                      <option value="semestral">Semestral</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Observações do Aparelho</label>
                  <textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={2}
                    placeholder="Ex: Altura elevada, necessita de escada longa, dreno com histórico de entupimento..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                  />
                </div>

                {/* Status */}
                {editingEq && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status do Aparelho</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition bg-white"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo / Desinstalado</option>
                    </select>
                  </div>
                )}

                {/* Foto do Equipamento */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">📷 Foto do Ar Condicionado</label>
                  {fotoUrl ? (
                    <div className="relative w-full h-36 rounded-lg overflow-hidden border border-slate-200 mb-2">
                      <img 
                        src={fotoUrl} 
                        alt="Previsão" 
                        className="w-full h-full object-cover" 
                      />
                      <button
                        type="button"
                        onClick={() => setFotoUrl('')}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md transition"
                        title="Remover Foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-4 bg-white hover:bg-slate-50 transition cursor-pointer relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadingImage(true);
                            try {
                              const compressed = await compressImage(file);
                              setFotoUrl(compressed);
                            } catch (err) {
                              console.error(err);
                              alert('Falha ao processar imagem.');
                            } finally {
                              setUploadingImage(false);
                            }
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Plus className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs font-medium text-slate-600">Fazer Upload de Imagem</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Clique ou arraste a foto do aparelho (máx 5MB)</span>
                    </div>
                  )}
                  {uploadingImage && (
                    <p className="text-[10px] text-blue-600 animate-pulse mt-1">Processando e otimizando imagem...</p>
                  )}
                </div>
              </form>
            </div>

            {/* Bottom Actions */}
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
                Salvar Aparelho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gemini AI Reminder Modal */}
      {isReminderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Lembrete Inteligente (Gemini IA)</h3>
                  <p className="text-[11px] text-slate-500">Gere lembretes de manutenção preventiva personalizados em segundos.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsReminderModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {loadingReminder ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  <p className="text-xs text-slate-500 font-medium animate-pulse">
                    Conectando ao Gemini 3.5 Flash e analisando dados do cliente...
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Gerando 4 modelos persuasivos de lembretes com base nos benefícios da higienização.
                  </p>
                </div>
              ) : (
                <>
                  {/* Context Info */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60 text-xs grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 font-medium">Cliente:</span>
                      <p className="font-semibold text-slate-700">{selectedClientForReminder?.nome}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Aparelho:</span>
                      <p className="font-semibold text-slate-700">
                        {selectedEqForReminder?.marca} ({selectedEqForReminder?.local_instalado})
                      </p>
                    </div>
                  </div>

                  {/* Tabs Selector for the 4 Models */}
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                    {aiReminderModels.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setActiveModelTab(m.id)}
                        className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition text-center ${
                          activeModelTab === m.id
                            ? 'bg-white text-emerald-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {m.titulo}
                      </button>
                    ))}
                  </div>

                  {/* Selected Model Editor & Description */}
                  {aiReminderModels.map((m) => {
                    if (m.id !== activeModelTab) return null;
                    return (
                      <div key={m.id} className="space-y-3 animate-fade-in">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                            🎯 {m.titulo}
                          </span>
                          <span className="text-[10px] text-slate-400">Edite a mensagem abaixo se desejar antes de enviar:</span>
                        </div>
                        
                        {/* Interactive Textarea */}
                        <textarea
                          value={editableMessages[m.id] || ''}
                          onChange={(e) => {
                            setEditableMessages(prev => ({
                              ...prev,
                              [m.id]: e.target.value
                            }));
                          }}
                          rows={8}
                          className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-xs font-mono outline-hidden leading-relaxed shadow-inner"
                        />

                        {/* Practical benefits list simplified */}
                        <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-lg text-[11px] text-slate-600 space-y-1">
                          <p className="font-bold text-blue-800">💡 Benefícios de manter o aparelho limpo:</p>
                          <ul className="list-disc pl-4 space-y-0.5">
                            <li><strong>Saúde:</strong> Elimina 99.9% de fungos, bactérias e ácaros causadores de rinite e asma.</li>
                            <li><strong>Consumo:</strong> Ar desobstruído reduz em até 30% a conta de energia elétrica.</li>
                            <li><strong>Vida Útil:</strong> Evita superaquecimento do compressor, prevenindo quebras caras.</li>
                          </ul>
                        </div>

                        {/* Action Bar */}
                        <div className="flex gap-2 justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(m.id, editableMessages[m.id])}
                            className="px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-600 flex items-center gap-1.5 transition"
                          >
                            {copiedId === m.id ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-600" /> Copiado!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" /> Copiar Mensagem
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendWhatsApp(editableMessages[m.id])}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                          >
                            <MessageSquare className="w-4 h-4 text-emerald-100" /> Enviar via WhatsApp
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
              <span>Tecnologia de IA fornecida pelo Google Gemini</span>
              <button
                type="button"
                onClick={() => setIsReminderModalOpen(false)}
                className="px-3 py-1 border border-slate-200 hover:bg-slate-50 rounded-md font-semibold text-slate-500 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
