import React, { useState } from 'react';
import { Settings, Save, RefreshCw, Download, Upload, ShieldAlert, FileText, CheckCircle } from 'lucide-react';
import { EmpresaConfig } from '../types';

interface ConfiguracoesProps {
  empresaConfig: EmpresaConfig;
  updateEmpresaConfig: (config: EmpresaConfig) => void;
  resetDatabase: () => void;
  exportDatabase: () => string;
  importDatabase: (jsonStr: string) => boolean;
}

export default function Configuracoes({
  empresaConfig,
  updateEmpresaConfig,
  resetDatabase,
  exportDatabase,
  importDatabase
}: ConfiguracoesProps) {
  // Form States using official EmpresaConfig keys
  const [nomeEmpresa, setNomeEmpresa] = useState(empresaConfig.nome_empresa);
  const [cnpj, setCnpj] = useState(empresaConfig.cnpj);
  const [telefone, setTelefone] = useState(empresaConfig.telefone);
  const [whatsapp, setWhatsapp] = useState(empresaConfig.whatsapp);
  const [email, setEmail] = useState(empresaConfig.email);
  const [endereco, setEndereco] = useState(empresaConfig.endereco);
  const [cidade, setCidade] = useState(empresaConfig.cidade);
  const [estado, setEstado] = useState(empresaConfig.estado);
  const [cep, setCep] = useState(empresaConfig.cep);
  const [textoPadraoOs, setTextoPadraoOs] = useState(empresaConfig.texto_padrao_os || '');
  const [logoUrl, setLogoUrl] = useState(empresaConfig.logo_url || '❄️');

  // Operation States
  const [importText, setImportText] = useState('');
  const [showSavedMsg, setShowSavedMsg] = useState(false);
  const [showResetMsg, setShowResetMsg] = useState(false);
  const [showImportMsg, setShowImportMsg] = useState<string | null>(null);

  // Submit Company Profile
  const handleSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmpresaConfig({
      nome_empresa: nomeEmpresa,
      cnpj,
      telefone,
      whatsapp,
      email,
      endereco,
      cidade,
      estado,
      cep,
      texto_padrao_os: textoPadraoOs,
      logo_url: logoUrl
    });

    setShowSavedMsg(true);
    setTimeout(() => setShowSavedMsg(false), 3000);
  };

  // Trigger Reset
  const handleResetDb = () => {
    if (confirm('ATENÇÃO: Isso apagará TODOS os dados cadastrados, clientes, ordens de serviço, e restaurará o estado inicial padrão de demonstração. Deseja prosseguir?')) {
      resetDatabase();
      setShowResetMsg(true);
      setTimeout(() => {
        setShowResetMsg(false);
        window.location.reload(); // Refresh to clean forms
      }, 1500);
    }
  };

  // Download state file
  const handleExportDb = () => {
    try {
      const dataStr = exportDatabase();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_aircontrol_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Erro ao exportar dados!');
    }
  };

  // Import State file
  const handleImportDb = () => {
    if (!importText.trim()) return alert('Insira o código JSON do backup para prosseguir.');

    if (confirm('Deseja realmente restaurar esse backup? O estado atual do sistema será completamente sobrescrito.')) {
      const success = importDatabase(importText);
      if (success) {
        setShowImportMsg('success');
        setImportText('');
        setTimeout(() => {
          setShowImportMsg(null);
          window.location.reload(); // Hard reset memory
        }, 1500);
      } else {
        setShowImportMsg('error');
        setTimeout(() => setShowImportMsg(null), 4000);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Configurações Gerais</h1>
        <p className="text-slate-500 text-xs mt-0.5">Configure os dados impressos nas ordens de serviço e administre backups locais.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Company Settings Form */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <FileText className="w-4.5 h-4.5 text-blue-700" /> Perfil da Empresa (Cabeçalho de OS)
            </h2>

            <form onSubmit={handleSubmitProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome fantasia */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome da Empresa / Fantasia *</label>
                  <input
                    type="text"
                    required
                    value={nomeEmpresa}
                    onChange={(e) => setNomeEmpresa(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                  />
                </div>

                {/* CNPJ */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">CNPJ *</label>
                  <input
                    type="text"
                    required
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition font-mono"
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Telefone Principal</label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                  />
                </div>

                {/* Whatsapp */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">WhatsApp de Suporte</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">E-mail Comercial</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                  />
                </div>

                {/* Logo Emoji Icon */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Ícone / Logo Representativo</label>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="Ex: ❄️ ou 🌀"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                  />
                </div>
              </div>

              {/* Endereco */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Endereço Comercial / Sede</label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Av. Paulista, 1000 - Cj 50 - Bela Vista"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                />
              </div>

              {/* Cidade, Estado, CEP */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cidade</label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    maxLength={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">CEP</label>
                  <input
                    type="text"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition font-mono"
                  />
                </div>
              </div>

              {/* Termo Garantia padrão impressa no pe da OS */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cláusulas de Garantia Padrão (Rodapé da OS)</label>
                <textarea
                  value={textoPadraoOs}
                  onChange={(e) => setTextoPadraoOs(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-600 transition font-sans text-slate-600 leading-relaxed"
                />
              </div>

              {showSavedMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Alterações de cabeçalho salvas com sucesso!
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Save className="w-4 h-4" /> Salvar Perfil da Empresa
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Database backups & Technical actions */}
        <div className="space-y-6">
          {/* Backup Database */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Backup & Migração</h3>
            <p className="text-slate-500 text-[11px]">Salve todos os dados de clientes, visitas e OS para um arquivo local ou transfira para outro navegador.</p>
            
            <button
              onClick={handleExportDb}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Download className="w-4 h-4" /> Baixar Backup (.JSON)
            </button>
          </div>

          {/* Import Database */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Restaurar Backup</h3>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Cole o código JSON de backup gerado aqui..."
              rows={3}
              className="w-full p-2 border border-slate-200 rounded-lg text-[10px] outline-hidden focus:border-blue-600 font-mono"
            />
            
            {showImportMsg === 'success' && (
              <p className="text-[10px] text-emerald-700 font-bold">✓ Backup importado! Recarregando sistema...</p>
            )}
            {showImportMsg === 'error' && (
              <p className="text-[10px] text-rose-700 font-bold">✗ Código de backup inválido. Verifique o arquivo.</p>
            )}

            <button
              onClick={handleImportDb}
              className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Upload className="w-4 h-4" /> Aplicar Backup JSON
            </button>
          </div>

          {/* Factory Reset Database */}
          <div className="bg-rose-50/40 p-5 rounded-xl border border-rose-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-rose-800 uppercase tracking-wide flex items-center gap-1">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" /> Zona de Perigo
            </h3>
            <p className="text-slate-500 text-[11px]">Reseta o banco de dados do navegador de volta para as informações de demonstração.</p>
            
            {showResetMsg && (
              <p className="text-[10px] text-rose-700 font-bold animate-pulse">Limpando base de dados local...</p>
            )}

            <button
              onClick={handleResetDb}
              className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <RefreshCw className="w-4 h-4" /> Restaurar Banco de Demonstração
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
