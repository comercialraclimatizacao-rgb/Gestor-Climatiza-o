import { useState, useEffect } from 'react';
import { 
  Cliente, Equipamento, Tecnico, Agendamento, 
  OrdemServico, Peca, Notificacao, EmpresaConfig, Pagamento 
} from './types';
import { 
  initialClientes, initialEquipamentos, initialTecnicos, 
  initialAgendamentos, initialOrdensServico, initialPecas, 
  initialNotificacoes, initialEmpresaConfig 
} from './initialData';

export function useAppState() {
  // Load state from local storage or fallback to initial data
  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const saved = localStorage.getItem('climatech_clientes');
    return saved ? JSON.parse(saved) : initialClientes;
  });

  const [equipamentos, setEquipamentos] = useState<Equipamento[]>(() => {
    const saved = localStorage.getItem('climatech_equipamentos');
    return saved ? JSON.parse(saved) : initialEquipamentos;
  });

  const [tecnicos, setTecnicos] = useState<Tecnico[]>(() => {
    const saved = localStorage.getItem('climatech_tecnicos');
    return saved ? JSON.parse(saved) : initialTecnicos;
  });

  const [pecas, setPecas] = useState<Peca[]>(() => {
    const saved = localStorage.getItem('climatech_pecas');
    return saved ? JSON.parse(saved) : initialPecas;
  });

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>(() => {
    const saved = localStorage.getItem('climatech_agendamentos');
    return saved ? JSON.parse(saved) : initialAgendamentos;
  });

  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>(() => {
    const saved = localStorage.getItem('climatech_ordens_servico');
    return saved ? JSON.parse(saved) : initialOrdensServico;
  });

  const [notificacoes, setNotificacoes] = useState<Notificacao[]>(() => {
    const saved = localStorage.getItem('climatech_notificacoes');
    return saved ? JSON.parse(saved) : initialNotificacoes;
  });

  const [empresaConfig, setEmpresaConfig] = useState<EmpresaConfig>(() => {
    const saved = localStorage.getItem('climatech_empresa_config');
    return saved ? JSON.parse(saved) : initialEmpresaConfig;
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('climatech_active_tab') || 'dashboard';
  });

  const [selectedOSId, setSelectedOSId] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('climatech_clientes', JSON.stringify(clientes));
  }, [clientes]);

  useEffect(() => {
    localStorage.setItem('climatech_equipamentos', JSON.stringify(equipamentos));
  }, [equipamentos]);

  useEffect(() => {
    localStorage.setItem('climatech_tecnicos', JSON.stringify(tecnicos));
  }, [tecnicos]);

  useEffect(() => {
    localStorage.setItem('climatech_pecas', JSON.stringify(pecas));
  }, [pecas]);

  useEffect(() => {
    localStorage.setItem('climatech_agendamentos', JSON.stringify(agendamentos));
  }, [agendamentos]);

  useEffect(() => {
    localStorage.setItem('climatech_ordens_servico', JSON.stringify(ordensServico));
  }, [ordensServico]);

  useEffect(() => {
    localStorage.setItem('climatech_notificacoes', JSON.stringify(notificacoes));
  }, [notificacoes]);

  useEffect(() => {
    localStorage.setItem('climatech_empresa_config', JSON.stringify(empresaConfig));
  }, [empresaConfig]);

  useEffect(() => {
    localStorage.setItem('climatech_active_tab', activeTab);
  }, [activeTab]);

  // Real-time automatic alarm generator based on next maintenance dates
  useEffect(() => {
    const today = new Date();
    const newNotifications: Notificacao[] = [...notificacoes];
    let updated = false;

    equipamentos.forEach(eq => {
      if (eq.data_proxima_manutencao) {
        const nextDate = new Date(eq.data_proxima_manutencao);
        const timeDiff = nextDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        const client = clientes.find(c => c.id === eq.cliente_id);

        if (daysDiff <= 7 && daysDiff > 0) {
          const notificationId = `notif_preventive_${eq.id}`;
          const alreadyExists = notificacoes.some(n => n.id === notificationId);
          if (!alreadyExists && client) {
            newNotifications.unshift({
              id: notificationId,
              titulo: 'Manutenção Preventiva Próxima',
              mensagem: `O equipamento ${eq.marca} (${eq.local_installed || eq.tipo_equipamento}) do cliente "${client.nome}" precisa de manutenção preventiva em ${daysDiff} dias (${eq.data_proxima_manutencao}).`,
              tipo: 'manutencao_proxima',
              lida: false,
              data_envio: new Date().toISOString()
            });
            updated = true;
          }
        } else if (daysDiff <= 0) {
          const notificationId = `notif_overdue_${eq.id}`;
          const alreadyExists = notificacoes.some(n => n.id === notificationId);
          if (!alreadyExists && client) {
            newNotifications.unshift({
              id: notificationId,
              titulo: 'Manutenção VENCIDA',
              mensagem: `Atenção: A manutenção preventiva do equipamento ${eq.marca} de "${client.nome}" está VENCIDA desde ${eq.data_proxima_manutencao}.`,
              tipo: 'manutencao_vencida',
              lida: false,
              data_envio: new Date().toISOString()
            });
            updated = true;
          }
        }
      }
    });

    // Low stock notifications
    pecas.forEach(p => {
      if (p.quantidade_estoque <= p.estoque_minimo) {
        const notificationId = `notif_low_stock_${p.id}`;
        const alreadyExists = notificacoes.some(n => n.id === notificationId);
        if (!alreadyExists) {
          newNotifications.unshift({
            id: notificationId,
            titulo: `Estoque Baixo: ${p.nome}`,
            mensagem: `O item "${p.nome}" atingiu a quantidade de ${p.quantidade_estoque} no estoque (mínimo de ${p.estoque_minimo}).`,
            tipo: 'estoque_baixo',
            lida: false,
            data_envio: new Date().toISOString()
          });
          updated = true;
        }
      }
    });

    if (updated) {
      setNotificacoes(newNotifications.slice(0, 50)); // Keep last 50
    }
  }, [equipamentos, pecas, clientes]);

  // Operations - Clientes
  const addCliente = (client: Omit<Cliente, 'id' | 'criado_em'>) => {
    const newId = `c_${Date.now()}`;
    const newClient: Cliente = {
      ...client,
      id: newId,
      criado_em: new Date().toISOString()
    };
    setClientes(prev => [newClient, ...prev]);
    return newClient;
  };

  const updateCliente = (updated: Cliente) => {
    setClientes(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const deleteCliente = (id: string) => {
    setClientes(prev => prev.filter(c => c.id !== id));
    // Cascade delete equipment, schedulings
    setEquipamentos(prev => prev.filter(e => e.cliente_id !== id));
    setAgendamentos(prev => prev.filter(a => a.cliente_id !== id));
  };

  // Operations - Equipamentos
  const addEquipamento = (eq: Omit<Equipamento, 'id'>) => {
    const newId = `e_${Date.now()}`;
    const newEq: Equipamento = {
      ...eq,
      id: newId
    };
    setEquipamentos(prev => [newEq, ...prev]);
    return newEq;
  };

  const updateEquipamento = (updated: Equipamento) => {
    setEquipamentos(prev => prev.map(e => e.id === updated.id ? updated : e));
  };

  const deleteEquipamento = (id: string) => {
    setEquipamentos(prev => prev.filter(e => e.id !== id));
    setAgendamentos(prev => prev.filter(a => a.equipamento_id !== id));
  };

  // Operations - Tecnicos
  const addTecnico = (tech: Omit<Tecnico, 'id'>) => {
    const newId = `t_${Date.now()}`;
    const newTech: Tecnico = {
      ...tech,
      id: newId
    };
    setTecnicos(prev => [newTech, ...prev]);
    return newTech;
  };

  const updateTecnico = (updated: Tecnico) => {
    setTecnicos(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const deleteTecnico = (id: string) => {
    setTecnicos(prev => prev.filter(t => t.id !== id));
  };

  // Operations - Pecas (Estoque)
  const addPeca = (part: Omit<Peca, 'id'>) => {
    const newId = `p_${Date.now()}`;
    const newPart: Peca = {
      ...part,
      id: newId
    };
    setPecas(prev => [newPart, ...prev]);
    return newPart;
  };

  const updatePeca = (updated: Peca) => {
    setPecas(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const adjustStock = (id: string, amount: number) => {
    setPecas(prev => prev.map(p => {
      if (p.id === id) {
        const newQty = Math.max(0, p.quantidade_estoque + amount);
        return { ...p, quantidade_estoque: newQty };
      }
      return p;
    }));
  };

  const deletePeca = (id: string) => {
    setPecas(prev => prev.filter(p => p.id !== id));
  };

  // Operations - Agendamentos
  const addAgendamento = (sched: Omit<Agendamento, 'id'>) => {
    const newId = `a_${Date.now()}`;
    const newSched: Agendamento = {
      ...sched,
      id: newId
    };
    setAgendamentos(prev => [newSched, ...prev]);
    return newSched;
  };

  const updateAgendamentoStatus = (id: string, status: Agendamento['status']) => {
    setAgendamentos(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const updateAgendamento = (updated: Agendamento) => {
    setOrdensServico(prevOS => prevOS.map(os => {
      if (os.agendamento_id === updated.id) {
        return {
          ...os,
          cliente_id: updated.cliente_id,
          equipamento_id: updated.equipamento_id,
          tecnico_id: updated.tecnico_id,
          tipo_servico: updated.tipo_servico,
        };
      }
      return os;
    }));
    setAgendamentos(prev => prev.map(a => a.id === updated.id ? updated : a));
  };

  const deleteAgendamento = (id: string) => {
    setAgendamentos(prev => prev.filter(a => a.id !== id));
  };

  // Operations - Ordens de Serviço
  const addOrdemServico = (os: Omit<OrdemServico, 'id' | 'numero_os' | 'data_abertura'>) => {
    const newId = `os_${Date.now()}`;
    const nextNum = ordensServico.length > 0 
      ? Math.max(...ordensServico.map(o => o.numero_os)) + 1 
      : 1001;
    
    const newOS: OrdemServico = {
      ...os,
      id: newId,
      numero_os: nextNum,
      data_abertura: new Date().toISOString()
    };

    setOrdensServico(prev => [newOS, ...prev]);

    // Create system notification for new OS
    const client = clientes.find(c => c.id === os.cliente_id);
    const clientName = client ? client.nome : 'Cliente';
    setNotificacoes(prev => [
      {
        id: `notif_os_${newId}`,
        titulo: `Nova OS Gerada: #${nextNum}`,
        mensagem: `A Ordem de Serviço #${nextNum} foi criada para o cliente "${clientName}" (${os.tipo_servico}).`,
        tipo: 'os_aberta',
        lida: false,
        data_envio: new Date().toISOString()
      },
      ...prev
    ]);

    return newOS;
  };

  const updateOrdemServico = (updated: OrdemServico) => {
    setOrdensServico(prev => prev.map(o => o.id === updated.id ? updated : o));
    
    // If OS is finalized, update the connected equipment's last and next maintenance dates
    if (updated.status === 'finalizada' && updated.data_finalizacao) {
      const eq = equipamentos.find(e => e.id === updated.equipamento_id);
      if (eq) {
        const lastDateStr = updated.data_finalizacao.split('T')[0];
        const lastDate = new Date(lastDateStr);
        
        // Calculate next date based on frequency
        const nextDate = new Date(lastDate);
        switch (eq.frequencia_manutencao) {
          case 'mensal': nextDate.setMonth(nextDate.getMonth() + 1); break;
          case 'bimestral': nextDate.setMonth(nextDate.getMonth() + 2); break;
          case 'trimestral': nextDate.setMonth(nextDate.getMonth() + 3); break;
          case 'semestral': nextDate.setMonth(nextDate.getMonth() + 6); break;
          case 'anual': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
        }

        const nextDateStr = nextDate.toISOString().split('T')[0];
        
        updateEquipamento({
          ...eq,
          data_ultima_manutencao: lastDateStr,
          data_proxima_manutencao: nextDateStr
        });
      }

      // Automatically update the scheduling if exists
      if (updated.agendamento_id) {
        updateAgendamentoStatus(updated.agendamento_id, 'finalizado');
      }
    }
  };

  const deleteOrdemServico = (id: string) => {
    setOrdensServico(prev => prev.filter(o => o.id !== id));
  };

  const clearNotification = (id: string) => {
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  };

  const clearAllNotifications = () => {
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
  };

  // Reset demo data
  const resetData = () => {
    if (confirm('Deseja realmente redefinir todos os dados para o padrão de demonstração?')) {
      setClientes(initialClientes);
      setEquipamentos(initialEquipamentos);
      setTecnicos(initialTecnicos);
      setPecas(initialPecas);
      setAgendamentos(initialAgendamentos);
      setOrdensServico(initialOrdensServico);
      setNotificacoes(initialNotificacoes);
      setEmpresaConfig(initialEmpresaConfig);
      setActiveTab('dashboard');
      setSelectedOSId(null);
      alert('Dados redefinidos com sucesso!');
    }
  };

  return {
    clientes,
    equipamentos,
    tecnicos,
    pecas,
    agendamentos,
    ordensServico,
    notificacoes,
    empresaConfig,
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
    resetData
  };
}
