import React, { useState } from 'react';
import { 
  Plus, Search, Edit2, Trash2, MapPin, Phone, 
  Mail, MessageSquare, Briefcase, Home, ShieldAlert, X, Eye
} from 'lucide-react';
import { Cliente, Equipamento, OrdemServico } from '../types';

interface ClientesProps {
  clientes: Cliente[];
  equipamentos: Equipamento[];
  ordensServico: OrdemServico[];
  addCliente: (client: Omit<Cliente, 'id' | 'criado_em'>) => Cliente;
  updateCliente: (client: Cliente) => void;
  deleteCliente: (id: string) => void;
  setActiveTab: (tab: string) => void;
}

export default function Clientes({
  clientes,
  equipamentos,
  ordensServico,
  addCliente,
  updateCliente,
  deleteCliente,
  setActiveTab
}: ClientesProps) {
  // States
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'todos' | 'residencial' | 'comercial' | 'industrial'>('todos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);

  // Form Fields
  const [nome, setNome] = useState('');
  const [tipoCliente, setTipoCliente] = useState<'residencial' | 'comercial' | 'industrial'>('residencial');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('SP');
  const [observacoes, setObservacoes] = useState('');
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');

  const alert = (msg: string) => {
    try {
      window.alert(msg);
    } catch (e) {
      console.warn("Alert blocked by sandbox, logged message:", msg, e);
    }
  };

  const confirm = (msg: string): boolean => {
    try {
      return window.confirm(msg);
    } catch (e) {
      console.warn("Confirm blocked by sandbox, defaulting to true:", msg, e);
      return true;
    }
  };

  // Open form for creating
  const handleOpenCreate = () => {
    setEditingClient(null);
    setNome('');
    setTipoCliente('residencial');
    setCpfCnpj('');
    setTelefone('');
    setWhatsapp('');
    setEmail('');
    setEndereco('');
    setCidade('');
    setEstado('SP');
    setObservacoes('');
    setStatus('ativo');
    setIsFormOpen(true);
  };

  // Open form for editing
  const handleOpenEdit = (client: Cliente) => {
    setEditingClient(client);
    setNome(client.nome);
    setTipoCliente(client.tipo_cliente);
    setCpfCnpj(client.cpf_cnpj);
    setTelefone(client.telefone);
    setWhatsapp(client.whatsapp);
    setEmail(client.email);
    setEndereco(client.endereco);
    setCidade(client.cidade);
    setEstado(client.estado);
    setObservacoes(client.observacoes || '');
    setStatus(client.status);
    setIsFormOpen(true);
  };

  // Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return alert('O nome é obrigatório!');

    const clientData = {
      nome,
      tipo_cliente: tipoCliente,
      cpf_cnpj: cpfCnpj,
      telefone,
      whatsapp,
      email,
      endereco,
      cidade,
      estado,
      observacoes,
      status
    };

    if (editingClient) {
      updateCliente({
        ...editingClient,
        ...clientData
      });
    } else {
      addCliente(clientData);
    }
    setIsFormOpen(false);
  };

  // Delete handler with verification
  const handleDelete = (client: Cliente) => {
    const linkedEqs = equipamentos.filter(e => e.cliente_id === client.id);
    const linkedOS = ordensServico.filter(o => o.cliente_id === client.id);

    let message = `Deseja realmente excluir o cliente "${client.nome}"?`;
    if (linkedEqs.length > 0 || linkedOS.length > 0) {
      message += `\nATENÇÃO: Esse cliente possui ${linkedEqs.length} equipamentos cadastrados e ${linkedOS.length} ordens de serviço. TUDO será excluído permanentemente!`;
    }

    if (confirm(message)) {
      deleteCliente(client.id);
    }
  };

  // Filter clients
  const filteredClientes = clientes.filter(c => {
    const matchesSearch = 
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.cpf_cnpj.includes(search) ||
      c.telefone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.cidade.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = typeFilter === 'todos' || c.tipo_cliente === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Clientes</h1>
          <p className="text-slate-500 text-xs mt-0.5">Gerenciamento completo do portfólio de clientes atendidos.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
        >
          <Plus className="w-4 h-4" /> Cadastrar Cliente
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col md:flex-row gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone, e-mail, CNPJ/CPF, cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg text-xs transition outline-hidden"
          />
        </div>
        
        <div className="flex gap-2">
          {(['todos', 'residencial', 'comercial', 'industrial'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border capitalize transition ${
                typeFilter === type
                  ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {type === 'todos' ? 'Todos os Tipos' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClientes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-100 text-slate-400 space-y-2">
          <Search className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold">Nenhum cliente encontrado</p>
          <p className="text-xs">Tente ajustar seus termos de busca ou crie um novo cadastro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClientes.map((client) => {
            const clientEqs = equipamentos.filter(e => e.cliente_id === client.id);
            const clientOS = ordensServico.filter(o => o.cliente_id === client.id);

            return (
              <div 
                key={client.id}
                className="bg-white rounded-xl border border-slate-100 hover:border-blue-200 p-5 shadow-xs transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top line with Client Type and status */}
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-sm uppercase tracking-wider ${
                      client.tipo_cliente === 'residencial' 
                        ? 'bg-teal-50 text-teal-700' 
                        : client.tipo_cliente === 'comercial'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-purple-50 text-purple-700'
                    }`}>
                      {client.tipo_cliente === 'residencial' && <Home className="w-3 h-3 inline mr-1 mb-0.5" />}
                      {client.tipo_cliente !== 'residencial' && <Briefcase className="w-3 h-3 inline mr-1 mb-0.5" />}
                      {client.tipo_cliente}
                    </span>

                    <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded-sm font-mono uppercase ${
                      client.status === 'ativo' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      ● {client.status}
                    </span>
                  </div>

                  {/* Client Info */}
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{client.nome}</h3>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">CNPJ/CPF: {client.cpf_cnpj || 'Não Informado'}</p>
                  </div>

                  {/* Contact details */}
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2 group">
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${client.endereco}, ${client.cidade} - ${client.estado}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-start gap-1.5 hover:text-blue-600 transition"
                        title="Traçar rota no Google Maps"
                      >
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5 group-hover:scale-110 transition" />
                        <span className="underline decoration-dotted decoration-blue-300 group-hover:decoration-blue-600">
                          {client.endereco}, {client.cidade} - {client.estado}
                        </span>
                        <span className="text-[9px] bg-blue-50 text-blue-700 px-1 rounded-sm font-semibold whitespace-nowrap shrink-0 mt-0.5 self-start">Traçar Rota 🗺️</span>
                      </a>
                    </div>
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{client.telefone}</span>
                      {client.whatsapp && (
                        <a 
                          href={`https://wa.me/${client.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-sm ml-1 flex items-center"
                          title="Enviar WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3 fill-emerald-600" />
                        </a>
                      )}
                    </p>
                    {client.email && (
                      <p className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </p>
                    )}
                  </div>

                  {/* Stats Counter & Notes */}
                  <div className="pt-2 border-t border-slate-50 flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span>❄️ <strong>{clientEqs.length}</strong> Aparelhos</span>
                    <span>•</span>
                    <span>📑 <strong>{clientOS.length}</strong> OS Emitidas</span>
                  </div>

                  {client.observacoes && (
                    <p className="text-[11px] bg-slate-50 p-2 rounded-lg text-slate-500 italic border-l-2 border-blue-400">
                      Obs: {client.observacoes}
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex gap-2 pt-3 border-t border-slate-50">
                  <button
                    onClick={() => {
                      // Navigate to equipment page pre-filtered for this client
                      localStorage.setItem('climatech_equipment_client_filter', client.id);
                      setActiveTab('equipamentos');
                    }}
                    className="flex-1 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                  >
                    <Eye className="w-3.5 h-3.5" /> Equipamentos
                  </button>
                  <button
                    onClick={() => handleOpenEdit(client)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg border border-slate-200 transition"
                    title="Editar Cliente"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(client)}
                    className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg border border-rose-200 transition"
                    title="Excluir Cliente"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-over Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50 animate-fade-in">
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-800">
                  {editingClient ? 'Editar Cadastro de Cliente' : 'Novo Cadastro de Cliente'}
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
                {/* Tipo Cliente */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo de Cliente</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['residencial', 'comercial', 'industrial'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setTipoCliente(type)}
                        className={`py-2 text-xs font-semibold rounded-lg border capitalize transition ${
                          tipoCliente === type
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nome */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome Completo / Razão Social *</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: João da Silva ou Supermercado S.A."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                  />
                </div>

                {/* CPF/CNPJ */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">CPF ou CNPJ</label>
                  <input
                    type="text"
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(e.target.value)}
                    placeholder="Ex: 000.000.000-00 ou 00.000.000/0001-00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                  />
                </div>

                {/* Telefone & Whatsapp */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Telefone Fixo</label>
                    <input
                      type="text"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="(11) 4002-8922"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">WhatsApp</label>
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="(11) 98888-7777"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                    />
                  </div>
                </div>

                {/* E-mail */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                  />
                </div>

                {/* Endereço */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Endereço Completo</label>
                  <input
                    type="text"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Rua, número, complemento, bairro"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                  />
                </div>

                {/* Cidade & Estado */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cidade</label>
                    <input
                      type="text"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      placeholder="Ex: São Paulo"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Estado</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={estado}
                      onChange={(e) => setEstado(e.target.value.toUpperCase())}
                      placeholder="SP"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition text-center"
                    />
                  </div>
                </div>

                {/* Observacoes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Observações Técnicas / Comerciais</label>
                  <textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={3}
                    placeholder="Ex: Restrições de horários, EPI obrigatório, falar com responsável X..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                  />
                </div>

                {/* Status */}
                {editingClient && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition bg-white"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                )}
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
                Salvar Cadastro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
