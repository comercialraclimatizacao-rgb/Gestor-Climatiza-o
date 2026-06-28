import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, Search, Filter, Clock, Users, 
  Hammer, AlertTriangle, CheckCircle, Play, X, Trash2
} from 'lucide-react';
import { Cliente, Equipamento, Tecnico, Agendamento, OrdemServico } from '../types';

interface AgendaProps {
  clientes: Cliente[];
  equipamentos: Equipamento[];
  tecnicos: Tecnico[];
  agendamentos: Agendamento[];
  ordensServico: OrdemServico[];
  addAgendamento: (sched: Omit<Agendamento, 'id'>) => Agendamento;
  updateAgendamentoStatus: (id: string, status: Agendamento['status']) => void;
  updateAgendamento: (sched: Agendamento) => void;
  deleteAgendamento: (id: string) => void;
  addOrdemServico: (os: any) => OrdemServico;
  setActiveTab: (tab: string) => void;
  setSelectedOSId: (id: string | null) => void;
}

export default function Agenda({
  clientes,
  equipamentos,
  tecnicos,
  agendamentos,
  ordensServico,
  addAgendamento,
  updateAgendamentoStatus,
  updateAgendamento,
  deleteAgendamento,
  addOrdemServico,
  setActiveTab,
  setSelectedOSId
}: AgendaProps) {
  // States
  const [filterDateRange, setFilterDateRange] = useState<'hoje' | 'amanha' | 'proximos' | 'passados' | 'todos'>('todos');
  const [techFilter, setTechFilter] = useState<string>('todos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSched, setEditingSched] = useState<Agendamento | null>(null);

  // Form Fields
  const [clienteId, setClienteId] = useState('');
  const [equipamentoId, setEquipamentoId] = useState('');
  const [tecnicoId, setTecnicoId] = useState('');
  const [dataAgendamento, setDataAgendamento] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [tipoServico, setTipoServico] = useState<Agendamento['tipo_servico']>('manutencao_preventiva');
  const [observacoes, setObservacoes] = useState('');

  // Check if presets are passed from Equipamentos page
  useEffect(() => {
    const presetClient = localStorage.getItem('climatech_agenda_preset_client');
    const presetEquip = localStorage.getItem('climatech_agenda_preset_equip');

    if (presetClient && presetEquip) {
      setEditingSched(null);
      setClienteId(presetClient);
      setEquipamentoId(presetEquip);
      setTecnicoId(tecnicos[0]?.id || '');
      setDataAgendamento(new Date().toISOString().split('T')[0]);
      setHoraInicio('09:00');
      setTipoServico('manutencao_preventiva');
      setObservacoes('');
      setIsFormOpen(true);

      // Clear presets
      localStorage.removeItem('climatech_agenda_preset_client');
      localStorage.removeItem('climatech_agenda_preset_equip');
    }
  }, [tecnicos]);

  const handleOpenCreate = () => {
    setEditingSched(null);
    const firstClient = clientes[0]?.id || '';
    setClienteId(firstClient);
    const firstEq = equipamentos.find(e => e.cliente_id === firstClient);
    setEquipamentoId(firstEq ? firstEq.id : '');
    setTecnicoId(tecnicos[0]?.id || '');
    setDataAgendamento(new Date().toISOString().split('T')[0]);
    setHoraInicio('09:00');
    setTipoServico('manutencao_preventiva');
    setObservacoes('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (sched: Agendamento) => {
    setEditingSched(sched);
    setClienteId(sched.cliente_id);
    setEquipamentoId(sched.equipamento_id);
    setTecnicoId(sched.tecnico_id);
    setDataAgendamento(sched.data_agendamento);
    setHoraInicio(sched.hora_inicio);
    setTipoServico(sched.tipo_servico);
    setObservacoes(sched.observacoes || '');
    setIsFormOpen(true);
  };

  // Handle client selection inside the form to auto-select/filter equipment
  const handleClientChange = (cId: string) => {
    setClienteId(cId);
    // Auto select first equipment found for this client
    const firstEq = equipamentos.find(e => e.cliente_id === cId);
    setEquipamentoId(firstEq ? firstEq.id : '');
  };

  // Get equipment of chosen client (allow selected equipment even if inactive)
  const availableEquipments = equipamentos.filter(e => e.cliente_id === clienteId && (e.status === 'ativo' || e.id === equipamentoId));

  // Submit Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !equipamentoId || !tecnicoId || !dataAgendamento || !horaInicio) {
      return alert('Por favor, preencha todos os campos obrigatórios!');
    }

    if (editingSched) {
      updateAgendamento({
        ...editingSched,
        cliente_id: clienteId,
        equipamento_id: equipamentoId,
        tecnico_id: tecnicoId,
        data_agendamento: dataAgendamento,
        hora_inicio: horaInicio,
        tipo_servico: tipoServico,
        observacoes: observacoes || undefined
      });
    } else {
      addAgendamento({
        cliente_id: clienteId,
        equipamento_id: equipamentoId,
        tecnico_id: tecnicoId,
        data_agendamento: dataAgendamento,
        hora_inicio: horaInicio,
        tipo_servico: tipoServico,
        status: 'agendado',
        observacoes: observacoes || undefined
      });
    }

    setIsFormOpen(false);
  };

  // Spawn OS from appointment
  const handleSpawnOS = (app: Agendamento) => {
    const existingOS = ordensServico.find(o => o.agendamento_id === app.id);
    if (existingOS) {
      setSelectedOSId(existingOS.id);
      setActiveTab('os');
    } else {
      // Create new OS
      const newOS = addOrdemServico({
        agendamento_id: app.id,
        cliente_id: app.cliente_id,
        equipamento_id: app.equipamento_id,
        tecnico_id: app.tecnico_id,
        tipo_servico: app.tipo_servico,
        problema_informado: app.observacoes || `Agendamento técnico para ${app.tipo_servico.replace('_', ' ')}.`,
        valor_mao_obra: app.tipo_servico === 'instalacao' ? 350 : 150,
        valor_pecas: 0,
        desconto: 0,
        valor_total: app.tipo_servico === 'instalacao' ? 350 : 150,
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

      // Update agenda status
      updateAgendamentoStatus(app.id, 'em_andamento');

      setSelectedOSId(newOS.id);
      setActiveTab('os');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente cancelar e excluir este agendamento?')) {
      deleteAgendamento(id);
    }
  };

  // Filter Agendamentos
  const filteredAgendamentos = agendamentos.filter(app => {
    const matchesTech = techFilter === 'todos' || app.tecnico_id === techFilter;

    // Date Filters
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    let matchesDate = true;
    if (filterDateRange === 'hoje') {
      matchesDate = app.data_agendamento === todayStr;
    } else if (filterDateRange === 'amanha') {
      matchesDate = app.data_agendamento === tomorrowStr;
    } else if (filterDateRange === 'proximos') {
      matchesDate = app.data_agendamento >= todayStr;
    } else if (filterDateRange === 'passados') {
      matchesDate = app.data_agendamento < todayStr;
    }

    return matchesTech && matchesDate;
  }).sort((a, b) => {
    // Sort chronologically (date, then time)
    if (a.data_agendamento !== b.data_agendamento) {
      return a.data_agendamento.localeCompare(b.data_agendamento);
    }
    return a.hora_inicio.localeCompare(b.hora_inicio);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Agenda de Visitas</h1>
          <p className="text-slate-500 text-xs mt-0.5">Organize atendimentos, instalações e limpezas preventivas semanais.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
        >
          <Plus className="w-4 h-4" /> Novo Agendamento
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        {/* Date Ranges tabs */}
        <div className="flex flex-wrap gap-1">
          {([
            { id: 'todos', label: 'Todos' },
            { id: 'hoje', label: 'Hoje' },
            { id: 'amanha', label: 'Amanhã' },
            { id: 'proximos', label: 'Próximos' },
            { id: 'passados', label: 'Histórico' }
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterDateRange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterDateRange === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tech Selector Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs p-2 rounded-lg outline-hidden focus:bg-white w-full md:w-56"
          >
            <option value="todos">Todos os Técnicos</option>
            {tecnicos.map(t => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List agendamentos */}
      {filteredAgendamentos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-100 text-slate-400 space-y-2">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold">Nenhum agendamento encontrado</p>
          <p className="text-xs">Clique no botão superior para agendar um novo atendimento na agenda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAgendamentos.map(app => {
            const client = clientes.find(c => c.id === app.cliente_id);
            const equip = equipamentos.find(e => e.id === app.equipamento_id);
            const tech = tecnicos.find(t => t.id === app.tecnico_id);
            const connectedOS = ordensServico.find(o => o.agendamento_id === app.id);

            return (
              <div 
                key={app.id}
                className={`bg-white rounded-xl border p-5 shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                  app.status === 'finalizado' 
                    ? 'border-slate-100 bg-slate-50/20 opacity-90' 
                    : app.status === 'em_andamento'
                    ? 'border-blue-200 bg-blue-50/10'
                    : 'border-slate-100 hover:border-blue-200'
                }`}
              >
                {/* Left: Date & Time, Info */}
                <div className="flex items-start gap-4 flex-1">
                  {/* Date Badge */}
                  <div className="px-3 py-2 bg-slate-100 text-slate-800 rounded-lg text-center shrink-0 w-16 font-mono">
                    <span className="text-xs font-bold block leading-none">
                      {app.data_agendamento.split('-')[2]}
                    </span>
                    <span className="text-[10px] uppercase text-slate-500 font-bold block leading-none mt-1">
                      {new Date(app.data_agendamento + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).substring(0, 3)}
                    </span>
                  </div>

                  {/* Body Info */}
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 font-mono">
                        <Clock className="w-3.5 h-3.5 text-blue-600" /> {app.hora_inicio}
                      </span>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-sm uppercase tracking-wider ${
                        app.tipo_servico === 'instalacao' 
                          ? 'bg-blue-50 text-blue-700' 
                          : app.tipo_servico === 'manutencao_corretiva'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {app.tipo_servico.replace('_', ' ')}
                      </span>
                      <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded-sm uppercase font-mono ${
                        app.status === 'finalizado' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : app.status === 'em_andamento'
                          ? 'bg-blue-100 text-blue-800'
                          : app.status === 'cancelado'
                          ? 'bg-slate-200 text-slate-600'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-800 text-base">{client?.nome}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      🛠️ Aparelho: {equip ? `${equip.marca} ${equip.modelo} (${equip.local_instalado})` : 'Não especificado'}
                    </p>
                    <p className="text-xs text-slate-400">
                      📍 Endereço: {client?.endereco}, {client?.cidade}
                    </p>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg italic">
                      Técnico: <strong className="text-slate-800">{tech?.nome || 'Não definido'}</strong>
                    </p>
                    {app.observacoes && (
                      <p className="text-[11px] text-slate-400">Obs: {app.observacoes}</p>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex md:flex-col items-stretch gap-2 shrink-0">
                  {app.status !== 'finalizado' && app.status !== 'cancelado' && (
                    <button
                      onClick={() => handleSpawnOS(app)}
                      className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" /> {connectedOS ? 'Retornar à OS' : 'Iniciar OS'}
                    </button>
                  )}
                  {connectedOS && (
                    <button
                      onClick={() => {
                        setSelectedOSId(connectedOS.id);
                        setActiveTab('os');
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition text-center"
                    >
                      Abrir OS #{connectedOS.numero_os}
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenEdit(app)}
                    className="px-4 py-2 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-semibold transition text-center"
                  >
                    ✏️ Editar Agendamento
                  </button>
                  <button
                    onClick={() => handleDelete(app.id)}
                    className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-100 rounded-lg transition flex items-center justify-center"
                    title="Excluir Agendamento"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Appointment Creation Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50 animate-fade-in">
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-800">
                  {editingSched ? 'Editar Agendamento de Visita' : 'Agendar Nova Visita Técnica'}
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
                {/* Cliente */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cliente *</label>
                  <select
                    required
                    value={clienteId}
                    onChange={(e) => handleClientChange(e.target.value)}
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
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Aparelho de Ar-Condicionado *</label>
                  <select
                    required
                    value={equipamentoId}
                    onChange={(e) => setEquipamentoId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition bg-white"
                  >
                    <option value="" disabled>Selecione o aparelho...</option>
                    {availableEquipments.map(eq => (
                      <option key={eq.id} value={eq.id}>
                        {eq.marca} - {eq.modelo} [{eq.local_instalado || eq.tipo_equipamento}] ({eq.capacidade_btu} BTUs)
                      </option>
                    ))}
                    {clienteId && availableEquipments.length === 0 && (
                      <option value="" disabled className="text-rose-500">
                        Nenhum aparelho ativo cadastrado para este cliente!
                      </option>
                    )}
                  </select>
                  {clienteId && availableEquipments.length === 0 && (
                    <p className="text-[10px] text-red-500 mt-1 font-semibold">
                      ⚠️ Você precisa cadastrar um ar-condicionado na aba de Equipamentos antes de prosseguir!
                    </p>
                  )}
                </div>

                {/* Técnico */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Técnico Responsável *</label>
                  <select
                    required
                    value={tecnicoId}
                    onChange={(e) => setTecnicoId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition bg-white"
                  >
                    <option value="" disabled>Selecione o técnico responsável...</option>
                    {tecnicos.map(t => (
                      <option key={t.id} value={t.id}>{t.nome} - ({t.especialidade})</option>
                    ))}
                  </select>
                </div>

                {/* Data e Horário */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Data da Visita *</label>
                    <input
                      type="date"
                      required
                      value={dataAgendamento}
                      onChange={(e) => setDataAgendamento(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Horário de Início *</label>
                    <input
                      type="time"
                      required
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition font-mono"
                    />
                  </div>
                </div>

                {/* Tipo de Atendimento */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo de Atendimento / Serviço</label>
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

                {/* Observações */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Observações do Agendamento</label>
                  <textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={3}
                    placeholder="Ex: Cliente relatou que ar desliga sozinho após 10 min..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                  />
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
                disabled={availableEquipments.length === 0}
                onClick={handleSubmit}
                className="flex-1 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingSched ? 'Salvar Alterações' : 'Agendar Atendimento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
