import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Mail, Phone, Wrench, X, Shield, Star } from 'lucide-react';
import { Tecnico, OrdemServico, Agendamento } from '../types';

interface TecnicosProps {
  tecnicos: Tecnico[];
  ordensServico: OrdemServico[];
  agendamentos: Agendamento[];
  addTecnico: (tech: Omit<Tecnico, 'id'>) => Tecnico;
  updateTecnico: (tech: Tecnico) => void;
  deleteTecnico: (id: string) => void;
}

export default function Tecnicos({
  tecnicos,
  ordensServico,
  agendamentos,
  addTecnico,
  updateTecnico,
  deleteTecnico
}: TecnicosProps) {
  // States
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<Tecnico | null>(null);

  // Form Fields
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');

  // Open Form
  const handleOpenCreate = () => {
    setEditingTech(null);
    setNome('');
    setCpf('');
    setTelefone('');
    setWhatsapp('');
    setEmail('');
    setEspecialidade('');
    setStatus('ativo');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (tech: Tecnico) => {
    setEditingTech(tech);
    setNome(tech.nome);
    setCpf(tech.cpf);
    setTelefone(tech.telefone);
    setWhatsapp(tech.whatsapp);
    setEmail(tech.email);
    setEspecialidade(tech.especialidade);
    setStatus(tech.status);
    setIsFormOpen(true);
  };

  // Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) return alert('Nome e e-mail são obrigatórios!');

    const techData = {
      nome,
      cpf,
      telefone,
      whatsapp,
      email,
      especialidade,
      status
    };

    if (editingTech) {
      updateTecnico({
        ...editingTech,
        ...techData
      });
    } else {
      addTecnico(techData);
    }
    setIsFormOpen(false);
  };

  const handleDelete = (tech: Tecnico) => {
    const activeJobs = agendamentos.filter(a => a.tecnico_id === tech.id && a.status !== 'finalizado' && a.status !== 'cancelado');
    let message = `Deseja realmente remover o cadastro de "${tech.nome}"?`;
    if (activeJobs.length > 0) {
      message += `\nAVENÇÃO: Este técnico possui ${activeJobs.length} visitas técnicas pendentes na agenda! Desvincule-o antes ou reatribua os chamados.`;
    }

    if (confirm(message)) {
      deleteTecnico(tech.id);
    }
  };

  // Filter list
  const filteredTecnicos = tecnicos.filter(t => {
    return (
      t.nome.toLowerCase().includes(search.toLowerCase()) ||
      t.especialidade.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Técnicos Credenciados</h1>
          <p className="text-slate-500 text-xs mt-0.5">Gerenciamento da equipe de mecânicos de campo e instaladores.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
        >
          <Plus className="w-4 h-4" /> Cadastrar Técnico
        </button>
      </div>

      {/* Filter search */}
      <div className="relative bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
        <Search className="w-4 h-4 text-slate-400 absolute left-7 top-7" />
        <input
          type="text"
          placeholder="Buscar por nome do técnico, especialidade ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg text-xs transition outline-hidden"
        />
      </div>

      {/* Team Grid */}
      {filteredTecnicos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-100 text-slate-400 space-y-2">
          <Wrench className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold">Nenhum técnico localizado</p>
          <p className="text-xs">Crie um novo registro no botão para compor a equipe técnica.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTecnicos.map((tech) => {
            const techOS = ordensServico.filter(o => o.tecnico_id === tech.id);
            const pendingVisits = agendamentos.filter(a => a.tecnico_id === tech.id && a.status === 'agendado');

            return (
              <div 
                key={tech.id}
                className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs transition hover:border-blue-100 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Status & Specialty tag */}
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-800 text-[10px] font-bold rounded flex items-center gap-1 uppercase">
                      <Star className="w-3.5 h-3.5 text-blue-600 fill-blue-600" /> Técnico de Campo
                    </span>

                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-sm uppercase font-mono ${
                      tech.status === 'ativo' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      ● {tech.status}
                    </span>
                  </div>

                  {/* Main Header Info */}
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{tech.nome}</h3>
                    <p className="text-xs text-blue-700 font-semibold mt-0.5">{tech.especialidade || 'Instalador Geral'}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">CPF: {tech.cpf || 'Não Informado'}</p>
                  </div>

                  {/* Contact Channels */}
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{tech.telefone}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{tech.email}</span>
                    </p>
                  </div>

                  {/* Team performance numbers */}
                  <div className="pt-2 border-t border-slate-50 flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span>📋 <strong>{techOS.length}</strong> OS Concluídas</span>
                    <span>•</span>
                    <span>⏰ <strong>{pendingVisits.length}</strong> Visitas em Aberto</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex gap-2 pt-3 border-t border-slate-50">
                  <button
                    onClick={() => handleOpenEdit(tech)}
                    className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Editar Cadastro
                  </button>
                  <button
                    onClick={() => handleDelete(tech)}
                    className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-lg transition"
                    title="Excluir Técnico"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slide Drawer modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50 animate-fade-in">
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-800">
                  {editingTech ? 'Editar Cadastro de Técnico' : 'Cadastrar Novo Técnico'}
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
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome Completo do Técnico *</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Carlos Eduardo Vieira"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                  />
                </div>

                {/* CPF */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">CPF</label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="Ex: 000.000.000-00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition font-mono"
                  />
                </div>

                {/* Telefone e Whatsapp */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Telefone Fixo</label>
                    <input
                      type="text"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="(11) 98222-3333"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">WhatsApp de Contato</label>
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="(11) 98222-3333"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                    />
                  </div>
                </div>

                {/* E-mail */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">E-mail Corporativo *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tecnico@climatech.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                  />
                </div>

                {/* Especialidade */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Especialidade / Foco Técnico</label>
                  <input
                    type="text"
                    value={especialidade}
                    onChange={(e) => setEspecialidade(e.target.value)}
                    placeholder="Ex: Especialista em VRF, Cassetes Comerciais, Elétrica Integrada"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                  />
                </div>

                {/* Status */}
                {editingTech && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status do Técnico</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition bg-white"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo / Desligado</option>
                    </select>
                  </div>
                )}
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
                Salvar Técnico
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
