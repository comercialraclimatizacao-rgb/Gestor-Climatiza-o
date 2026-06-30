import { useState, useEffect } from 'react';
import { 
  Cliente, Equipamento, Tecnico, Agendamento, 
  OrdemServico, Peca, Notificacao, EmpresaConfig, Pagamento, SavedOrcamento 
} from './types';
import { 
  initialClientes, initialEquipamentos, initialTecnicos, 
  initialAgendamentos, initialOrdensServico, initialPecas, 
  initialNotificacoes, initialEmpresaConfig, initialOrcamentos 
} from './initialData';
import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  setDoc as firestoreSetDoc, 
  doc, 
  deleteDoc, 
  getDoc 
} from 'firebase/firestore';

function cleanForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanForFirestore) as unknown as T;
  }
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key of Object.keys(obj)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        newObj[key] = cleanForFirestore(val);
      }
    }
    return newObj as T;
  }
  return obj;
}

const setDoc = (documentRef: any, data: any, options?: any) => {
  return firestoreSetDoc(documentRef, cleanForFirestore(data), options);
};

export function useAppState() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([]);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [empresaConfig, setEmpresaConfig] = useState<EmpresaConfig>(initialEmpresaConfig);
  const [savedOrcamentos, setSavedOrcamentos] = useState<SavedOrcamento[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('climatech_active_tab') || 'dashboard';
  });

  const [selectedOSId, setSelectedOSId] = useState<string | null>(null);

  // Load state from Firestore on mount
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        // Check if the database has any documents (using 'clientes' as indicator)
        const clientesSnapshot = await getDocs(collection(db, 'clientes'));
        
        if (clientesSnapshot.empty) {
          console.log('Cloud Firestore is empty. Seeding database with initial demo data...');
          
          // Seed Clientes
          for (const item of initialClientes) {
            await setDoc(doc(db, 'clientes', item.id), item);
          }
          // Seed Equipamentos
          for (const item of initialEquipamentos) {
            await setDoc(doc(db, 'equipamentos', item.id), item);
          }
          // Seed Tecnicos
          for (const item of initialTecnicos) {
            await setDoc(doc(db, 'tecnicos', item.id), item);
          }
          // Seed Pecas
          for (const item of initialPecas) {
            await setDoc(doc(db, 'pecas', item.id), item);
          }
          // Seed Agendamentos
          for (const item of initialAgendamentos) {
            await setDoc(doc(db, 'agendamentos', item.id), item);
          }
          // Seed Ordens Servico
          for (const item of initialOrdensServico) {
            await setDoc(doc(db, 'ordens_servico', item.id), item);
          }
          // Seed Notificacoes
          for (const item of initialNotificacoes) {
            await setDoc(doc(db, 'notificacoes', item.id), item);
          }
          // Seed Config Empresa
          await setDoc(doc(db, 'config', 'empresa'), initialEmpresaConfig);
          // Seed Orcamentos
          for (const item of initialOrcamentos) {
            await setDoc(doc(db, 'orcamentos', item.id), item);
          }

          // Update local React state with initial seed data
          setClientes(initialClientes);
          setEquipamentos(initialEquipamentos);
          setTecnicos(initialTecnicos);
          setPecas(initialPecas);
          setAgendamentos(initialAgendamentos);
          setOrdensServico(initialOrdensServico);
          setNotificacoes(initialNotificacoes);
          setEmpresaConfig(initialEmpresaConfig);
          setSavedOrcamentos(initialOrcamentos);
        } else {
          console.log('Loading existing data from Cloud Firestore...');
          
          // Load Clientes
          const clientesList: Cliente[] = [];
          clientesSnapshot.forEach(doc => {
            clientesList.push(doc.data() as Cliente);
          });
          clientesList.sort((a, b) => b.criado_em.localeCompare(a.criado_em));
          setClientes(clientesList);

          // Load Equipamentos
          const eqSnapshot = await getDocs(collection(db, 'equipamentos'));
          const eqList: Equipamento[] = [];
          eqSnapshot.forEach(doc => eqList.push(doc.data() as Equipamento));
          setEquipamentos(eqList);

          // Load Tecnicos
          const techSnapshot = await getDocs(collection(db, 'tecnicos'));
          const techList: Tecnico[] = [];
          techSnapshot.forEach(doc => techList.push(doc.data() as Tecnico));
          setTecnicos(techList);

          // Load Pecas
          const pecasSnapshot = await getDocs(collection(db, 'pecas'));
          const pecasList: Peca[] = [];
          pecasSnapshot.forEach(doc => pecasList.push(doc.data() as Peca));
          setPecas(pecasList);

          // Load Agendamentos
          const agSnapshot = await getDocs(collection(db, 'agendamentos'));
          const agList: Agendamento[] = [];
          agSnapshot.forEach(doc => agList.push(doc.data() as Agendamento));
          setAgendamentos(agList);

          // Load Ordens Servico
          const osSnapshot = await getDocs(collection(db, 'ordens_servico'));
          const osList: OrdemServico[] = [];
          osSnapshot.forEach(doc => osList.push(doc.data() as OrdemServico));
          osList.sort((a, b) => b.data_abertura.localeCompare(a.data_abertura));
          setOrdensServico(osList);

          // Load Notificacoes
          const notifSnapshot = await getDocs(collection(db, 'notificacoes'));
          const notifList: Notificacao[] = [];
          notifSnapshot.forEach(doc => notifList.push(doc.data() as Notificacao));
          notifList.sort((a, b) => b.data_envio.localeCompare(a.data_envio));
          setNotificacoes(notifList);

          // Load Empresa Config
          const configDoc = await getDoc(doc(db, 'config', 'empresa'));
          if (configDoc.exists()) {
            setEmpresaConfig(configDoc.data() as EmpresaConfig);
          } else {
            setEmpresaConfig(initialEmpresaConfig);
          }

          // Load Orcamentos
          const orcSnapshot = await getDocs(collection(db, 'orcamentos'));
          const orcList: SavedOrcamento[] = [];
          orcSnapshot.forEach(doc => orcList.push(doc.data() as SavedOrcamento));
          orcList.sort((a, b) => b.dataEmissao.localeCompare(a.dataEmissao));
          setSavedOrcamentos(orcList);
        }
      } catch (err) {
        console.error("Error connecting to Firestore or loading data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Sync tab navigation to local storage
  useEffect(() => {
    localStorage.setItem('climatech_active_tab', activeTab);
  }, [activeTab]);

  // Real-time automatic alarm generator based on next maintenance dates
  useEffect(() => {
    if (isLoading) return; // Wait until initial data is loaded
    
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
            const newNotif: Notificacao = {
              id: notificationId,
              titulo: 'Manutenção Preventiva Próxima',
              mensagem: `O equipamento ${eq.marca} (${eq.local_installed || eq.tipo_equipamento}) do cliente "${client.nome}" precisa de manutenção preventiva em ${daysDiff} dias (${eq.data_proxima_manutencao}).`,
              tipo: 'manutencao_proxima',
              lida: false,
              data_envio: new Date().toISOString()
            };
            newNotifications.unshift(newNotif);
            setDoc(doc(db, 'notificacoes', notificationId), newNotif).catch(e => console.error(e));
            updated = true;
          }
        } else if (daysDiff <= 0) {
          const notificationId = `notif_overdue_${eq.id}`;
          const alreadyExists = notificacoes.some(n => n.id === notificationId);
          if (!alreadyExists && client) {
            const newNotif: Notificacao = {
              id: notificationId,
              titulo: 'Manutenção VENCIDA',
              mensagem: `Atenção: A manutenção preventiva do equipamento ${eq.marca} de "${client.nome}" está VENCIDA desde ${eq.data_proxima_manutencao}.`,
              tipo: 'manutencao_vencida',
              lida: false,
              data_envio: new Date().toISOString()
            };
            newNotifications.unshift(newNotif);
            setDoc(doc(db, 'notificacoes', notificationId), newNotif).catch(e => console.error(e));
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
          const newNotif: Notificacao = {
            id: notificationId,
            titulo: `Estoque Baixo: ${p.nome}`,
            mensagem: `O item "${p.nome}" atingiu a quantidade de ${p.quantidade_estoque} no estoque (mínimo de ${p.estoque_minimo}).`,
            tipo: 'estoque_baixo',
            lida: false,
            data_envio: new Date().toISOString()
          };
          newNotifications.unshift(newNotif);
          setDoc(doc(db, 'notificacoes', notificationId), newNotif).catch(e => console.error(e));
          updated = true;
        }
      }
    });

    if (updated) {
      setNotificacoes(newNotifications.slice(0, 50)); // Keep last 50
    }
  }, [equipamentos, pecas, clientes, isLoading, notificacoes]);

  // Operations - Clientes
  const addCliente = (client: Omit<Cliente, 'id' | 'criado_em'>) => {
    const newId = `c_${Date.now()}`;
    const newClient: Cliente = {
      ...client,
      id: newId,
      criado_em: new Date().toISOString()
    };
    setClientes(prev => [newClient, ...prev]);
    setDoc(doc(db, 'clientes', newId), newClient).catch(err => console.error(err));
    return newClient;
  };

  const updateCliente = (updated: Cliente) => {
    setClientes(prev => prev.map(c => c.id === updated.id ? updated : c));
    setDoc(doc(db, 'clientes', updated.id), updated).catch(err => console.error(err));
  };

  const deleteCliente = (id: string) => {
    setClientes(prev => prev.filter(c => c.id !== id));
    // Cascade delete equipment, schedulings
    setEquipamentos(prev => prev.filter(e => e.cliente_id !== id));
    setAgendamentos(prev => prev.filter(a => a.cliente_id !== id));

    deleteDoc(doc(db, 'clientes', id)).catch(err => console.error(err));
    
    // Cascade delete associated docs in Firestore
    getDocs(collection(db, 'equipamentos')).then(snapshot => {
      snapshot.forEach(async (document) => {
        const eq = document.data() as Equipamento;
        if (eq.cliente_id === id) {
          await deleteDoc(doc(db, 'equipamentos', eq.id));
        }
      });
    }).catch(err => console.error(err));

    getDocs(collection(db, 'agendamentos')).then(snapshot => {
      snapshot.forEach(async (document) => {
        const a = document.data() as Agendamento;
        if (a.cliente_id === id) {
          await deleteDoc(doc(db, 'agendamentos', a.id));
        }
      });
    }).catch(err => console.error(err));
  };

  // Operations - Equipamentos
  const addEquipamento = (eq: Omit<Equipamento, 'id'>) => {
    const newId = `e_${Date.now()}`;
    const newEq: Equipamento = {
      ...eq,
      id: newId
    };
    setEquipamentos(prev => [newEq, ...prev]);
    setDoc(doc(db, 'equipamentos', newId), newEq).catch(err => console.error(err));
    return newEq;
  };

  const updateEquipamento = (updated: Equipamento) => {
    setEquipamentos(prev => prev.map(e => e.id === updated.id ? updated : e));
    setDoc(doc(db, 'equipamentos', updated.id), updated).catch(err => console.error(err));
  };

  const deleteEquipamento = (id: string) => {
    setEquipamentos(prev => prev.filter(e => e.id !== id));
    setAgendamentos(prev => prev.filter(a => a.equipamento_id !== id));

    deleteDoc(doc(db, 'equipamentos', id)).catch(err => console.error(err));

    getDocs(collection(db, 'agendamentos')).then(snapshot => {
      snapshot.forEach(async (document) => {
        const a = document.data() as Agendamento;
        if (a.equipamento_id === id) {
          await deleteDoc(doc(db, 'agendamentos', a.id));
        }
      });
    }).catch(err => console.error(err));
  };

  // Operations - Tecnicos
  const addTecnico = (tech: Omit<Tecnico, 'id'>) => {
    const newId = `t_${Date.now()}`;
    const newTech: Tecnico = {
      ...tech,
      id: newId
    };
    setTecnicos(prev => [newTech, ...prev]);
    setDoc(doc(db, 'tecnicos', newId), newTech).catch(err => console.error(err));
    return newTech;
  };

  const updateTecnico = (updated: Tecnico) => {
    setTecnicos(prev => prev.map(t => t.id === updated.id ? updated : t));
    setDoc(doc(db, 'tecnicos', updated.id), updated).catch(err => console.error(err));
  };

  const deleteTecnico = (id: string) => {
    setTecnicos(prev => prev.filter(t => t.id !== id));
    deleteDoc(doc(db, 'tecnicos', id)).catch(err => console.error(err));
  };

  // Operations - Pecas (Estoque)
  const addPeca = (part: Omit<Peca, 'id'>) => {
    const newId = `p_${Date.now()}`;
    const newPart: Peca = {
      ...part,
      id: newId
    };
    setPecas(prev => [newPart, ...prev]);
    setDoc(doc(db, 'pecas', newId), newPart).catch(err => console.error(err));
    return newPart;
  };

  const updatePeca = (updated: Peca) => {
    setPecas(prev => prev.map(p => p.id === updated.id ? updated : p));
    setDoc(doc(db, 'pecas', updated.id), updated).catch(err => console.error(err));
  };

  const adjustStock = (id: string, amount: number) => {
    setPecas(prev => prev.map(p => {
      if (p.id === id) {
        const newQty = Math.max(0, p.quantidade_estoque + amount);
        const updated = { ...p, quantidade_estoque: newQty };
        setDoc(doc(db, 'pecas', id), updated).catch(err => console.error(err));
        return updated;
      }
      return p;
    }));
  };

  const deletePeca = (id: string) => {
    setPecas(prev => prev.filter(p => p.id !== id));
    deleteDoc(doc(db, 'pecas', id)).catch(err => console.error(err));
  };

  // Operations - Agendamentos
  const addAgendamento = (sched: Omit<Agendamento, 'id'>) => {
    const newId = `a_${Date.now()}`;
    const newSched: Agendamento = {
      ...sched,
      id: newId
    };
    setAgendamentos(prev => [newSched, ...prev]);
    setDoc(doc(db, 'agendamentos', newId), newSched).catch(err => console.error(err));
    return newSched;
  };

  const updateAgendamentoStatus = (id: string, status: Agendamento['status']) => {
    setAgendamentos(prev => prev.map(a => {
      if (a.id === id) {
        const updated = { ...a, status };
        setDoc(doc(db, 'agendamentos', id), updated).catch(err => console.error(err));
        return updated;
      }
      return a;
    }));
  };

  const updateAgendamento = (updated: Agendamento) => {
    setOrdensServico(prevOS => prevOS.map(os => {
      if (os.agendamento_id === updated.id) {
        const updatedOS = {
          ...os,
          cliente_id: updated.cliente_id,
          equipamento_id: updated.equipamento_id,
          tecnico_id: updated.tecnico_id,
          tipo_servico: updated.tipo_servico,
        };
        setDoc(doc(db, 'ordens_servico', os.id), updatedOS).catch(err => console.error(err));
        return updatedOS;
      }
      return os;
    }));
    setAgendamentos(prev => prev.map(a => a.id === updated.id ? updated : a));
    setDoc(doc(db, 'agendamentos', updated.id), updated).catch(err => console.error(err));
  };

  const deleteAgendamento = (id: string) => {
    setAgendamentos(prev => prev.filter(a => a.id !== id));
    deleteDoc(doc(db, 'agendamentos', id)).catch(err => console.error(err));
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
    setDoc(doc(db, 'ordens_servico', newId), newOS).catch(err => console.error(err));

    // Create system notification for new OS
    const client = clientes.find(c => c.id === os.cliente_id);
    const clientName = client ? client.nome : 'Cliente';
    const notifId = `notif_os_${newId}`;
    const newNotif: Notificacao = {
      id: notifId,
      titulo: `Nova OS Gerada: #${nextNum}`,
      mensagem: `A Ordem de Serviço #${nextNum} foi criada para o cliente "${clientName}" (${os.tipo_servico}).`,
      tipo: 'os_aberta',
      lida: false,
      data_envio: new Date().toISOString()
    };
    
    setNotificacoes(prev => [newNotif, ...prev]);
    setDoc(doc(db, 'notificacoes', notifId), newNotif).catch(err => console.error(err));

    return newOS;
  };

  const updateOrdemServico = (updated: OrdemServico) => {
    setOrdensServico(prev => prev.map(o => o.id === updated.id ? updated : o));
    setDoc(doc(db, 'ordens_servico', updated.id), updated).catch(err => console.error(err));
    
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
    deleteDoc(doc(db, 'ordens_servico', id)).catch(err => console.error(err));
  };

  // Operations - Notifications
  const clearNotification = (id: string) => {
    setNotificacoes(prev => prev.map(n => {
      if (n.id === id) {
        const updated = { ...n, lida: true };
        setDoc(doc(db, 'notificacoes', id), updated).catch(err => console.error(err));
        return updated;
      }
      return n;
    }));
  };

  const clearAllNotifications = () => {
    setNotificacoes(prev => prev.map(n => {
      const updated = { ...n, lida: true };
      setDoc(doc(db, 'notificacoes', n.id), updated).catch(err => console.error(err));
      return updated;
    }));
  };

  // Operations - EmpresaConfig wrapper
  const updateEmpresaConfig = (config: EmpresaConfig) => {
    setEmpresaConfig(config);
    setDoc(doc(db, 'config', 'empresa'), config).catch(err => console.error(err));
  };

  // Operations - Orcamentos sync to Firestore
  const saveOrcamentos = async (list: SavedOrcamento[]) => {
    setSavedOrcamentos(list);
    try {
      // Find IDs that are deleted
      const currentSnapshot = await getDocs(collection(db, 'orcamentos'));
      const existingIds = new Set<string>();
      currentSnapshot.forEach(doc => existingIds.add(doc.id));

      const listIds = new Set(list.map(o => o.id));

      // Delete removed budgets
      for (const id of existingIds) {
        if (!listIds.has(id)) {
          await deleteDoc(doc(db, 'orcamentos', id));
        }
      }

      // Save or update current list in Firestore
      for (const orc of list) {
        await setDoc(doc(db, 'orcamentos', orc.id), orc);
      }
    } catch (err) {
      console.error("Error saving budgets to Firestore:", err);
    }
  };

  // Reset demo data
  const resetData = async () => {
    if (confirm('ATENÇÃO: Isso apagará TODOS os dados cadastrados no Cloud Firestore e restaurará o estado inicial padrão de demonstração. Deseja prosseguir?')) {
      setIsLoading(true);
      try {
        // Delete all existing documents in Firestore
        const collections = ['clientes', 'equipamentos', 'tecnicos', 'pecas', 'agendamentos', 'ordens_servico', 'notificacoes', 'orcamentos'];
        for (const colName of collections) {
          const snapshot = await getDocs(collection(db, colName));
          for (const docItem of snapshot.docs) {
            await deleteDoc(doc(db, colName, docItem.id));
          }
        }
        await deleteDoc(doc(db, 'config', 'empresa'));

        // Seed default data
        for (const c of initialClientes) {
          await setDoc(doc(db, 'clientes', c.id), c);
        }
        for (const eq of initialEquipamentos) {
          await setDoc(doc(db, 'equipamentos', eq.id), eq);
        }
        for (const t of initialTecnicos) {
          await setDoc(doc(db, 'tecnicos', t.id), t);
        }
        for (const p of initialPecas) {
          await setDoc(doc(db, 'pecas', p.id), p);
        }
        for (const a of initialAgendamentos) {
          await setDoc(doc(db, 'agendamentos', a.id), a);
        }
        for (const os of initialOrdensServico) {
          await setDoc(doc(db, 'ordens_servico', os.id), os);
        }
        for (const n of initialNotificacoes) {
          await setDoc(doc(db, 'notificacoes', n.id), n);
        }
        await setDoc(doc(db, 'config', 'empresa'), initialEmpresaConfig);
        for (const o of initialOrcamentos) {
          await setDoc(doc(db, 'orcamentos', o.id), o);
        }

        // Set React States
        setClientes(initialClientes);
        setEquipamentos(initialEquipamentos);
        setTecnicos(initialTecnicos);
        setPecas(initialPecas);
        setAgendamentos(initialAgendamentos);
        setOrdensServico(initialOrdensServico);
        setNotificacoes(initialNotificacoes);
        setEmpresaConfig(initialEmpresaConfig);
        setSavedOrcamentos(initialOrcamentos);
        
        setActiveTab('dashboard');
        setSelectedOSId(null);
        alert('Dados redefinidos com sucesso no Cloud Firestore!');
      } catch (err) {
        console.error("Error resetting Firestore data:", err);
        alert('Erro ao redefinir dados.');
      } finally {
        setIsLoading(false);
      }
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
    setEmpresaConfig: updateEmpresaConfig,
    saveOrcamentos,
    resetData
  };
}
