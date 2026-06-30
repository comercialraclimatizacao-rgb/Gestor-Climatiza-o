import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, Wind, Calendar, FileSpreadsheet, 
  Package, Wrench, BarChart3, Settings2, Bell, Menu, X, 
  Volume2, ShieldAlert, CheckSquare, LogOut, Check, Sparkles, FileText
} from 'lucide-react';
import { useAppState } from './useAppState';

// Import Views
import Dashboard from './components/Dashboard';
import Clientes from './components/Clientes';
import Equipamentos from './components/Equipamentos';
import Agenda from './components/Agenda';
import OrdensServico from './components/OrdensServico';
import Estoque from './components/Estoque';
import Tecnicos from './components/Tecnicos';
import Relatorios from './components/Relatorios';
import Configuracoes from './components/Configuracoes';
import AgenteIA from './components/AgenteIA';
import Orcamentos from './components/Orcamentos';

export default function App() {
  const {
    clientes,
    equipamentos,
    tecnicos,
    pecas,
    agendamentos,
    ordensServico,
    notificacoes,
    empresaConfig,
    savedOrcamentos,
    isLoading,
    activeTab,
    selectedOSId,
    setActiveTab,
    setSelectedOSId,
    addCliente,
    updateCliente,
    deleteCliente,
    addEquipamento,
    updateEquipamento,
    deleteEquipamento,
    addTecnico,
    updateTecnico,
    deleteTecnico,
    addPeca,
    updatePeca,
    adjustStock,
    deletePeca,
    addAgendamento,
    updateAgendamentoStatus,
    updateAgendamento,
    deleteAgendamento,
    addOrdemServico,
    updateOrdemServico,
    deleteOrdemServico,
    clearNotification,
    clearAllNotifications,
    setEmpresaConfig,
    saveOrcamentos,
    resetData
  } = useAppState();

  // Navigation sidebar toggle on mobile
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Notification center popup toggle
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium tracking-wide text-slate-300">Conectando ao Cloud Firestore...</p>
        </div>
      </div>
    );
  }

  // Unread notification count
  const unreadNotifs = notificacoes.filter(n => !n.lida);

  // Export DB as JSON string
  const exportDatabase = (): string => {
    const data = {
      clientes,
      equipamentos,
      tecnicos,
      pecas,
      agendamentos,
      ordensServico,
      notificacoes,
      empresaConfig
    };
    return JSON.stringify(data, null, 2);
  };

  // Import DB from JSON string
  const importDatabase = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (
        data.clientes && 
        data.equipamentos && 
        data.tecnicos && 
        data.pecas && 
        data.agendamentos && 
        data.ordensServico
      ) {
        localStorage.setItem('climatech_clientes', JSON.stringify(data.clientes));
        localStorage.setItem('climatech_equipamentos', JSON.stringify(data.equipamentos));
        localStorage.setItem('climatech_tecnicos', JSON.stringify(data.tecnicos));
        localStorage.setItem('climatech_pecas', JSON.stringify(data.pecas));
        localStorage.setItem('climatech_agendamentos', JSON.stringify(data.agendamentos));
        localStorage.setItem('climatech_ordens_servico', JSON.stringify(data.ordensServico));
        if (data.notificacoes) localStorage.setItem('climatech_notificacoes', JSON.stringify(data.notificacoes));
        if (data.empresaConfig) localStorage.setItem('climatech_empresa_config', JSON.stringify(data.empresaConfig));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  // Sidebar Menu Entries
  const menuItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'equipamentos', label: 'Ar Condicionados', icon: Wind },
    { id: 'agenda', label: 'Agenda Técnica', icon: Calendar },
    { id: 'ordens_servico', label: 'Ordens de Serviço', icon: FileSpreadsheet },
    { id: 'orcamentos', label: 'Orçamentos', icon: FileText },
    { id: 'estoque', label: 'Almoxarifado', icon: Package },
    { id: 'tecnicos', label: 'Técnicos', icon: Wrench },
    { id: 'agente_ia', label: 'Agente IA de Manutenção', icon: Sparkles },
    { id: 'relatorios', label: 'Estatísticas', icon: BarChart3 },
    { id: 'configuracoes', label: 'Configurações', icon: Settings2 },
  ];

  const handleNavigate = (tabId: string) => {
    setActiveTab(tabId);
    setSelectedOSId(null); // Clear active OS detail focus
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased font-sans" id="app-root">
      
      {/* SIDEBAR (Desktop) */}
      <aside className="hidden md:flex md:w-64 bg-slate-900 text-white flex-col justify-between shrink-0 shadow-lg select-none print:hidden">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
              <Wind className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight truncate max-w-[150px]" title={empresaConfig.nome_empresa}>
                {empresaConfig.nome_empresa}
              </h1>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wide">Gestor Climatização</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                    isActive 
                      ? 'bg-blue-700 text-white shadow-xs' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info inside sidebar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-center text-[10px] text-slate-500 font-medium">
          <p className="truncate">{empresaConfig.nome_empresa}</p>
          <p className="mt-0.5 font-mono">CNPJ: {empresaConfig.cnpj || '00.000.000/0001-00'}</p>
        </div>
      </aside>

      {/* MOBILE HEADER BAR */}
      <header className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0 print:hidden">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm truncate max-w-[150px]">{empresaConfig.nome_empresa}</span>
        </div>

        {/* Action icons on Mobile */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            className="p-2 text-slate-300 hover:text-white relative rounded-lg"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-bounce"></span>
            )}
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER MENU */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-fade-in">
          {/* Backdrop */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />
          {/* Drawer Body */}
          <div className="relative w-64 max-w-xs bg-slate-900 text-white h-full flex flex-col justify-between shadow-2xl p-5">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Navegação</span>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <nav className="mt-4 space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                        isActive 
                          ? 'bg-blue-600 text-white' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="text-[10px] text-slate-500 text-center border-t border-slate-800 pt-3">
              <p className="truncate">{empresaConfig.nome_empresa}</p>
            </div>
          </div>
        </div>
      )}

      {/* VIEWPORT AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* DESKTOP HEADER BAR */}
        <header className="hidden md:flex bg-white h-16 border-b border-slate-100 items-center justify-between px-8 shrink-0 print:hidden">
          <div>
            <span className="text-slate-400 text-xs font-medium uppercase font-mono">
              Dashboard de Controle • {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification trigger */}
            <div className="relative">
              <button 
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition relative"
                title="Notificações e Alertas"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-rose-600 text-white text-[9px] font-bold rounded-full min-w-4 text-center">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {/* Notification dropdown overlay */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-40 p-4 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="font-bold text-xs text-slate-800">Alertas do Sistema ({unreadNotifs.length})</span>
                    {unreadNotifs.length > 0 && (
                      <button 
                        onClick={clearAllNotifications}
                        className="text-[10px] font-bold text-blue-700 hover:underline"
                      >
                        Limpar tudo
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2 divide-y divide-slate-50 pr-1">
                    {notificacoes.length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-4 italic">Nenhum alerta recente.</p>
                    ) : (
                      notificacoes.map((n) => (
                        <div key={n.id} className={`pt-2 flex flex-col gap-1 text-left ${n.lida ? 'opacity-50' : ''}`}>
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-slate-800 text-[11px]">{n.titulo}</span>
                            {!n.lida && (
                              <button 
                                onClick={() => clearNotification(n.id)}
                                className="p-0.5 text-blue-600 hover:bg-blue-50 rounded-md"
                                title="Marcar como lido"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 leading-tight">{n.mensagem}</p>
                          <span className="text-[9px] font-mono text-slate-400">{new Date(n.data_envio).toLocaleTimeString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile display */}
            <div className="border-l border-slate-150 pl-4 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-150 flex items-center justify-center font-bold text-xs text-blue-800 border border-slate-200 uppercase">
                {empresaConfig.nome_empresa.slice(0, 2)}
              </div>
              <div>
                <span className="font-bold text-xs text-slate-850 block leading-tight truncate max-w-[150px]">{empresaConfig.nome_empresa}</span>
                <span className="text-[10px] text-slate-400 block font-semibold">Técnico Administrador</span>
              </div>
            </div>
          </div>
        </header>

        {/* NOTIFICATION FLOATING PANEL ALERTS IN APP VIEW */}
        {unreadNotifs.length > 0 && (
          <div className="px-8 pt-4 pb-0 hidden md:block">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Atenção: Existem <strong>{unreadNotifs.length} alertas pendentes</strong> no sistema (máquinas necessitando de manutenção ou estoque baixo).
                </span>
              </div>
              <button 
                onClick={() => setNotifDropdownOpen(true)} 
                className="font-bold text-amber-800 hover:underline underline-offset-2 shrink-0 ml-4"
              >
                Visualizar Alertas →
              </button>
            </div>
          </div>
        )}

        {/* CONTAINER VIEWPORT CONTENT */}
        <div className="p-4 md:p-8 flex-1">
          {/* Active Work Order detail view takes priority */}
          {selectedOSId ? (
            <OrdensServico
              ordensServico={ordensServico}
              clientes={clientes}
              equipamentos={equipamentos}
              tecnicos={tecnicos}
              pecas={pecas}
              addOrdemServico={addOrdemServico}
              updateOrdemServico={updateOrdemServico}
              deleteOrdemServico={deleteOrdemServico}
              adjustStock={adjustStock}
              empresaConfig={empresaConfig}
              selectedOSId={selectedOSId}
              setSelectedOSId={setSelectedOSId}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard
                  clientes={clientes}
                  equipamentos={equipamentos}
                  ordensServico={ordensServico}
                  agendamentos={agendamentos}
                  pecas={pecas}
                  setActiveTab={handleNavigate}
                  setSelectedOSId={setSelectedOSId}
                  addOrdemServico={addOrdemServico}
                />
              )}

              {activeTab === 'clientes' && (
                <Clientes
                  clientes={clientes}
                  equipamentos={equipamentos}
                  ordensServico={ordensServico}
                  addCliente={addCliente}
                  updateCliente={updateCliente}
                  deleteCliente={deleteCliente}
                  setActiveTab={handleNavigate}
                />
              )}

              {activeTab === 'equipamentos' && (
                <Equipamentos
                  equipamentos={equipamentos}
                  clientes={clientes}
                  addEquipamento={addEquipamento}
                  updateEquipamento={updateEquipamento}
                  deleteEquipamento={deleteEquipamento}
                  setActiveTab={handleNavigate}
                />
              )}

              {activeTab === 'agenda' && (
                <Agenda
                  agendamentos={agendamentos}
                  clientes={clientes}
                  equipamentos={equipamentos}
                  tecnicos={tecnicos}
                  ordensServico={ordensServico}
                  addAgendamento={addAgendamento}
                  updateAgendamentoStatus={updateAgendamentoStatus}
                  updateAgendamento={updateAgendamento}
                  deleteAgendamento={deleteAgendamento}
                  addOrdemServico={addOrdemServico}
                  setActiveTab={handleNavigate}
                  setSelectedOSId={setSelectedOSId}
                />
              )}

              {activeTab === 'ordens_servico' && (
                <OrdensServico
                  ordensServico={ordensServico}
                  clientes={clientes}
                  equipamentos={equipamentos}
                  tecnicos={tecnicos}
                  pecas={pecas}
                  addOrdemServico={addOrdemServico}
                  updateOrdemServico={updateOrdemServico}
                  deleteOrdemServico={deleteOrdemServico}
                  adjustStock={adjustStock}
                  empresaConfig={empresaConfig}
                  selectedOSId={null}
                  setSelectedOSId={setSelectedOSId}
                />
              )}

              {activeTab === 'orcamentos' && (
                <Orcamentos
                  clientes={clientes}
                  equipamentos={equipamentos}
                  ordensServico={ordensServico}
                  empresaConfig={empresaConfig}
                  savedOrcamentos={savedOrcamentos}
                  onSaveOrcamentos={saveOrcamentos}
                />
              )}

              {activeTab === 'estoque' && (
                <Estoque
                  pecas={pecas}
                  addPeca={addPeca}
                  updatePeca={updatePeca}
                  deletePeca={deletePeca}
                  adjustStock={adjustStock}
                />
              )}

              {activeTab === 'tecnicos' && (
                <Tecnicos
                  tecnicos={tecnicos}
                  ordensServico={ordensServico}
                  agendamentos={agendamentos}
                  addTecnico={addTecnico}
                  updateTecnico={updateTecnico}
                  deleteTecnico={deleteTecnico}
                />
              )}

              {activeTab === 'relatorios' && (
                <Relatorios
                  ordensServico={ordensServico}
                  clientes={clientes}
                  equipamentos={equipamentos}
                  tecnicos={tecnicos}
                />
              )}

              {activeTab === 'agente_ia' && (
                <AgenteIA
                  clientes={clientes}
                  equipamentos={equipamentos}
                />
              )}

              {activeTab === 'configuracoes' && (
                <Configuracoes
                  empresaConfig={empresaConfig}
                  updateEmpresaConfig={setEmpresaConfig}
                  resetDatabase={resetData}
                  exportDatabase={exportDatabase}
                  importDatabase={importDatabase}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
