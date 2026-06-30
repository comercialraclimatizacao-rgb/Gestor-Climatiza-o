import { Cliente, Equipamento, Tecnico, Agendamento, OrdemServico, Peca, Notificacao, EmpresaConfig, SavedOrcamento } from './types';

export const initialEmpresaConfig: EmpresaConfig = {
  nome_empresa: 'R.A Climatização',
  cnpj: '12.345.678/0001-90',
  telefone: '(11) 4002-8922',
  whatsapp: '(11) 98888-7777',
  email: 'contato@raclimatizacao.com.br',
  endereco: 'Rua das Palmeiras, 450 - Bairro Alto',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01310-100',
  texto_padrao_os: 'A manutenção preventiva periódica prolonga a vida útil do seu aparelho, reduz o consumo de energia elétrica em até 30% e evita a proliferação de fungos e bactérias. Garantia de 90 dias nos serviços prestados.',
  logo_url: '🌬️'
};

export const initialClientes: Cliente[] = [
  {
    id: 'c1',
    nome: 'Supermercado Compre Bem',
    tipo_cliente: 'comercial',
    cpf_cnpj: '45.192.381/0001-22',
    telefone: '(11) 3214-5500',
    whatsapp: '(11) 97777-1111',
    email: 'manutencao@comprebem.com.br',
    endereco: 'Rua das Flores, 550 - Jardim Paulista',
    cidade: 'São Paulo',
    estado: 'SP',
    status: 'ativo',
    observacoes: 'Falar com Rogério do setor de compras. Atendimento prioritariamente antes das 08:00 ou após as 21:00.',
    criado_em: '2026-01-15T09:00:00Z'
  },
  {
    id: 'c2',
    nome: 'Clínica Odonto Riso',
    tipo_cliente: 'comercial',
    cpf_cnpj: '23.881.002/0001-88',
    telefone: '(11) 3456-7890',
    whatsapp: '(11) 96666-2222',
    email: 'financeiro@odontoriso.com.br',
    endereco: 'Av. Brigadeiro Luís Antônio, 2200 - Conj. 41',
    cidade: 'São Paulo',
    estado: 'SP',
    status: 'ativo',
    observacoes: 'Consultórios necessitam de higienização trimestral rigorosa por normas da vigilância sanitária.',
    criado_em: '2026-02-10T14:30:00Z'
  },
  {
    id: 'c3',
    nome: 'Carlos Eduardo Santos',
    tipo_cliente: 'residencial',
    cpf_cnpj: '344.221.998-00',
    telefone: '(11) 2234-9988',
    whatsapp: '(11) 95555-3333',
    email: 'carlos.edu@gmail.com',
    endereco: 'Rua Bela Cintra, 1420 - Ap. 82',
    cidade: 'São Paulo',
    estado: 'SP',
    status: 'ativo',
    observacoes: 'Cliente residencial antigo. Sempre avisa antes de agendar para garantir que o zelador libere o acesso à cobertura.',
    criado_em: '2026-03-01T11:15:00Z'
  },
  {
    id: 'c4',
    nome: 'Indústria Metalúrgica ForjaForte',
    tipo_cliente: 'industrial',
    cpf_cnpj: '10.203.405/0001-09',
    telefone: '(11) 4123-4567',
    whatsapp: '(11) 94444-4444',
    email: 'infra@forjaforte.com.br',
    endereco: 'Via de Acesso Industrial, Galpão B - Distrito Industrial',
    cidade: 'Guarulhos',
    estado: 'SP',
    status: 'ativo',
    observacoes: 'Necessário uso de EPI completo para o técnico (capacete, bota com biqueira de aço, óculos de proteção).',
    criado_em: '2026-04-18T08:00:00Z'
  }
];

export const initialEquipamentos: Equipamento[] = [
  {
    id: 'e1',
    cliente_id: 'c1',
    tipo_equipamento: 'piso_teto',
    marca: 'Carrier',
    modelo: 'Space Silver 60.000',
    capacidade_btu: 60000,
    numero_serie: 'CR60TS2025-992A',
    local_instalado: 'Área de Hortifruti (Frente)',
    data_instalacao: '2025-05-10',
    data_ultima_manutencao: '2026-05-20',
    data_proxima_manutencao: '2026-06-20', // Vencida
    frequencia_manutencao: 'mensal',
    status: 'ativo',
    observacoes: 'Aparelho trabalha em regime contínuo 18h por dia.'
  },
  {
    id: 'e2',
    cliente_id: 'c1',
    tipo_equipamento: 'piso_teto',
    marca: 'Carrier',
    modelo: 'Space Silver 60.000',
    capacidade_btu: 60000,
    numero_serie: 'CR60TS2025-994B',
    local_instalado: 'Corredor de Laticínios',
    data_instalacao: '2025-05-10',
    data_ultima_manutencao: '2026-05-20',
    data_proxima_manutencao: '2026-06-20', // Vencida
    frequencia_manutencao: 'mensal',
    status: 'ativo'
  },
  {
    id: 'e3',
    cliente_id: 'c2',
    tipo_equipamento: 'cassete',
    marca: 'Daikin',
    modelo: 'Inverter Eco 24.000',
    capacidade_btu: 24000,
    numero_serie: 'DK24CS99088-C',
    local_instalado: 'Consultório Principal 1',
    data_instalacao: '2026-02-12',
    data_ultima_manutencao: '2026-05-15',
    data_proxima_manutencao: '2026-08-15',
    frequencia_manutencao: 'trimestral',
    status: 'ativo',
    observacoes: 'Utiliza dreno automático. Verificar ruído sutil relatado pela Dra. Patrícia.'
  },
  {
    id: 'e4',
    cliente_id: 'c2',
    tipo_equipamento: 'split',
    marca: 'LG',
    modelo: 'Dual Inverter Voice 12.000',
    capacidade_btu: 12000,
    numero_serie: 'LG12SP00192-A',
    local_instalado: 'Recepção / Espera',
    data_instalacao: '2026-02-15',
    data_ultima_manutencao: '2026-05-15',
    data_proxima_manutencao: '2026-08-15',
    frequencia_manutencao: 'trimestral',
    status: 'ativo'
  },
  {
    id: 'e5',
    cliente_id: 'c3',
    tipo_equipamento: 'split',
    marca: 'Samsung',
    modelo: 'WindFree Inverter 9.000',
    capacidade_btu: 9000,
    numero_serie: 'SS09WF77123-X',
    local_instalado: 'Quarto Suíte',
    data_instalacao: '2026-03-05',
    data_ultima_manutencao: '2026-03-05',
    data_proxima_manutencao: '2027-03-05',
    frequencia_manutencao: 'anual',
    status: 'ativo',
    observacoes: 'Cliente extremamente exigente com poeira e barulho na limpeza.'
  },
  {
    id: 'e6',
    cliente_id: 'c4',
    tipo_equipamento: 'vrf',
    marca: 'Midea',
    modelo: 'V6 Heat Pump 10HP',
    capacidade_btu: 96000,
    numero_serie: 'MD96VRF-HP100',
    local_instalado: 'Sala de Servidores e TI',
    data_instalacao: '2026-04-20',
    data_ultima_manutencao: '2026-05-20',
    data_proxima_manutencao: '2026-06-20', // Vencida hoje ou prestes a vencer
    frequencia_manutencao: 'mensal',
    status: 'ativo',
    observacoes: 'Equipamento crítico. Se parar de funcionar, os servidores superaquecem rapidamente.'
  }
];

export const initialTecnicos: Tecnico[] = [
  {
    id: 't1',
    nome: 'Bruno Souza Lima',
    cpf: '228.910.455-12',
    telefone: '(11) 98111-2222',
    whatsapp: '(11) 98111-2222',
    email: 'bruno.souza@climatech.com',
    especialidade: 'Especialista em VRF e Cassetes Comerciais, Elétrica Integrada',
    status: 'ativo'
  },
  {
    id: 't2',
    nome: 'Carlos Eduardo Vieira',
    cpf: '119.332.887-44',
    telefone: '(11) 98222-3333',
    whatsapp: '(11) 98222-3333',
    email: 'carlos.vieira@climatech.com',
    especialidade: 'Instalação e Higienização de Splits Residencias e Piso-Teto',
    status: 'ativo'
  }
];

export const initialPecas: Peca[] = [
  {
    id: 'p1',
    nome: 'Capacitor de Partida 35 uF / 450V',
    codigo: 'CAP-35UF',
    descricao: 'Capacitor de alumínio ideal para motores de ventilador e compressores de ar-condicionado de 9.000 a 18.000 BTUs.',
    quantidade_estoque: 18,
    estoque_minimo: 5,
    valor_custo: 18.50,
    valor_venda: 45.00,
    status: 'ativo'
  },
  {
    id: 'p2',
    nome: 'Fluido Refrigerante R410A (Botija 11.3 kg)',
    codigo: 'GAS-R410A',
    descricao: 'Gás refrigerante ecológico de alta performance para condicionadores de ar modernos Inverter.',
    quantidade_estoque: 3, // Estoque baixo!
    estoque_minimo: 4,
    valor_custo: 320.00,
    valor_venda: 550.00,
    status: 'ativo'
  },
  {
    id: 'p3',
    nome: 'Placa Universal Ar Split com Controle',
    codigo: 'PLA-UNIV',
    descricao: 'Placa de comando eletrônica universal com sensor e display para reposição em equipamentos de ciclo frio.',
    quantidade_estoque: 8,
    estoque_minimo: 2,
    valor_custo: 75.00,
    valor_venda: 180.00,
    status: 'ativo'
  },
  {
    id: 'p4',
    nome: 'Sensor de Temperatura Universal 10K',
    codigo: 'SEN-10K',
    descricao: 'Sensor de degelo e temperatura de tubulação 10K ohms de latão e plástico para ar-condicionado split.',
    quantidade_estoque: 25,
    estoque_minimo: 10,
    valor_custo: 5.20,
    valor_venda: 25.00,
    status: 'ativo'
  },
  {
    id: 'p5',
    nome: 'Bomba de Dreno Gallant 15 l/h',
    codigo: 'BOM-DRENO',
    descricao: 'Bomba de remoção de condensado silenciosa para aparelhos de ar split e cassetes instalados sem caimento natural.',
    quantidade_estoque: 5,
    estoque_minimo: 2,
    valor_custo: 145.00,
    valor_venda: 320.00,
    status: 'ativo'
  }
];

export const initialAgendamentos: Agendamento[] = [
  {
    id: 'a1',
    cliente_id: 'c1',
    equipamento_id: 'e1',
    tecnico_id: 't1',
    data_agendamento: '2026-06-20', // Passado
    hora_inicio: '07:30',
    tipo_servico: 'manutencao_preventiva',
    status: 'finalizado',
    observacoes: 'Manutenção periódica de contrato mensal do Compre Bem.'
  },
  {
    id: 'a2',
    cliente_id: 'c4',
    equipamento_id: 'e6',
    tecnico_id: 't1',
    data_agendamento: '2026-06-28', // Hoje
    hora_inicio: '09:00',
    tipo_servico: 'manutencao_preventiva',
    status: 'em_andamento',
    observacoes: 'Aparelho crítico da sala de TI. Bruno deve realizar a higienização e medição de pressão do gás.'
  },
  {
    id: 'a3',
    cliente_id: 'c2',
    equipamento_id: 'e3',
    tecnico_id: 't2',
    data_agendamento: '2026-06-29', // Amanhã
    hora_inicio: '14:00',
    tipo_servico: 'higienizacao',
    status: 'agendado',
    observacoes: 'Atendimento no consultório odontológico. Exige esterilização cuidadosa do ambiente ao terminar.'
  },
  {
    id: 'a4',
    cliente_id: 'c3',
    equipamento_id: 'e5',
    tecnico_id: 't2',
    data_agendamento: '2026-07-02', // Futuro
    hora_inicio: '10:30',
    tipo_servico: 'manutencao_preventiva',
    status: 'agendado',
    observacoes: 'Limpeza anual periódica do Samsung WindFree.'
  }
];

export const initialOrdensServico: OrdemServico[] = [
  {
    id: 'os1',
    numero_os: 1001,
    agendamento_id: 'a1',
    cliente_id: 'c1',
    equipamento_id: 'e1',
    tecnico_id: 't1',
    tipo_servico: 'manutencao_preventiva',
    problema_informado: 'Manutenção mensal de contrato do supermercado.',
    diagnostico_tecnico: 'Filtros com alto acúmulo de poeira e gordura devido à proximidade com a padaria. Pressão do refrigerante normal. Corrente elétrica do compressor estável.',
    servico_realizado: 'Limpeza completa dos filtros, serpentina evaporadora e gabinete. Aplicação de bactericida. Ajuste de parafusos da condensadora.',
    valor_mao_obra: 180.00,
    valor_pecas: 0,
    desconto: 20.00,
    valor_total: 160.00,
    status: 'finalizada',
    data_abertura: '2026-06-20T07:30:00Z',
    data_finalizacao: '2026-06-20T09:15:00Z',
    checklist: {
      verificar_filtros: true,
      limpar_filtros: true,
      limpar_evaporadora: true,
      limpar_condensadora: true,
      verificar_serpentina: true,
      verificar_turbina: true,
      verificar_dreno: true,
      verificar_pressao_gas: true,
      verificar_corrente_eletrica: true,
      verificar_tensao: true,
      verificar_ruidos: true,
      verificar_vazamentos: true,
      testar_controle_remoto: true,
      testar_temperatura: true,
      higienizar_equipamento: true,
      observacoes: 'Tudo OK. Próxima preventiva recomendada para julho.'
    },
    fotos: [
      {
        id: 'f1',
        url_foto: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?w=600&auto=format&fit=crop&q=60',
        categoria: 'antes',
        legenda: 'Filtros da evaporadora antes de lavar (gordura acumulada)',
        criado_em: '2026-06-20T07:45:00Z'
      },
      {
        id: 'f2',
        url_foto: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=60',
        categoria: 'depois',
        legenda: 'Filtros limpos e higienizados reinstalados',
        criado_em: '2026-06-20T08:50:00Z'
      }
    ],
    pecas_usadas: [],
    assinatura_cliente: 'Supermercado Compre Bem - Setor de Hortifruti (Assinado Digitalmente)'
  },
  {
    id: 'os2',
    numero_os: 1002,
    agendamento_id: 'a2',
    cliente_id: 'c4',
    equipamento_id: 'e6',
    tecnico_id: 't1',
    tipo_servico: 'manutencao_preventiva',
    problema_informado: 'Manutenção mensal periódica na Sala de Servidores.',
    diagnostico_tecnico: 'Vazamento sutil na flange da tubulação de cobre da condensadora externa, gerando perda leve de refrigerante e queda de rendimento térmico do VRF.',
    servico_realizado: 'Reexecução da flange, teste de estanqueidade com nitrogênio, vácuo no sistema e recarga parcial de gás R410A (cerca de 1.5 kg).',
    valor_mao_obra: 350.00,
    valor_pecas: 165.00,
    desconto: 0,
    valor_total: 515.00,
    status: 'em_andamento',
    data_abertura: '2026-06-28T09:00:00Z',
    checklist: {
      verificar_filtros: true,
      limpar_filtros: true,
      limpar_evaporadora: true,
      limpar_condensadora: false,
      verificar_serpentina: true,
      verificar_turbina: true,
      verificar_dreno: true,
      verificar_pressao_gas: true,
      verificar_corrente_eletrica: true,
      verificar_tensao: true,
      verificar_ruidos: true,
      verificar_vazamentos: true,
      testar_controle_remoto: true,
      testar_temperatura: false,
      higienizar_equipamento: false,
      observacoes: 'Vazamento localizado e corrigido. Aguardando a estabilização térmica do ambiente para finalizar.'
    },
    fotos: [
      {
        id: 'f3',
        url_foto: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=60',
        categoria: 'vazamento',
        legenda: 'Ponto de vazamento de gás detectado com sabão na tubulação de cobre',
        criado_em: '2026-06-28T09:20:00Z'
      }
    ],
    pecas_usadas: [
      {
        peca_id: 'p2',
        nome: 'Fluido Refrigerante R410A (Recarga Parcial)',
        quantidade: 1,
        valor_unitario: 165.00,
        valor_total: 165.00
      }
    ]
  },
  {
    id: 'os3',
    numero_os: 1003,
    cliente_id: 'c2',
    equipamento_id: 'e4',
    tecnico_id: 't2',
    tipo_servico: 'manutencao_corretiva',
    problema_informado: 'Aparelho da recepção liga, acende as luzes, porém o ventilador interno não gira e não sopra vento frio de forma alguma.',
    diagnostico_tecnico: 'Capacitor de partida do motor do ventilador da evaporadora está queimado/estufado. Placa mãe e compressor em perfeito estado.',
    servico_realizado: 'Substituição do capacitor defeituoso na placa da evaporadora e testes de velocidade.',
    valor_mao_obra: 120.00,
    valor_pecas: 45.00,
    desconto: 15.00,
    valor_total: 150.00,
    status: 'finalizada',
    data_abertura: '2026-06-25T14:00:00Z',
    data_finalizacao: '2026-06-25T15:30:00Z',
    checklist: {
      verificar_filtros: true,
      limpar_filtros: true,
      limpar_evaporadora: false,
      limpar_condensadora: false,
      verificar_serpentina: true,
      verificar_turbina: true,
      verificar_dreno: true,
      verificar_pressao_gas: true,
      verificar_corrente_eletrica: true,
      verificar_tensao: true,
      verificar_ruidos: true,
      verificar_vazamentos: false,
      testar_controle_remoto: true,
      testar_temperatura: true,
      higienizar_equipamento: true,
      observacoes: 'Substituição da peça resolveu o problema completamente.'
    },
    fotos: [
      {
        id: 'f4',
        url_foto: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=600&auto=format&fit=crop&q=60',
        categoria: 'peca_danificada',
        legenda: 'Capacitor de 35uF estufado que foi retirado do equipamento',
        criado_em: '2026-06-25T14:15:00Z'
      }
    ],
    pecas_usadas: [
      {
        peca_id: 'p1',
        nome: 'Capacitor de Partida 35 uF / 450V',
        quantidade: 1,
        valor_unitario: 45.00,
        valor_total: 45.00
      }
    ],
    assinatura_cliente: 'Dra. Patrícia Odonto Riso (Assinado)'
  }
];

export const initialNotificacoes: Notificacao[] = [
  {
    id: 'n1',
    titulo: 'Manutenção Vencida (Supermercado)',
    mensagem: 'A manutenção mensal periódica do Carrier 60.000 BTUs do Supermercado Compre Bem venceu em 20/06/2026.',
    tipo: 'manutencao_vencida',
    lida: false,
    data_envio: '2026-06-21T08:00:00Z'
  },
  {
    id: 'n2',
    titulo: 'Agendamento Crítico de Hoje',
    mensagem: 'Visita agendada para hoje às 09:00 na ForjaForte para manutenção do VRF crítico da Sala de Servidores.',
    tipo: 'agendamento_hoje',
    lida: false,
    data_envio: '2026-06-28T07:00:00Z'
  },
  {
    id: 'n3',
    titulo: 'Estoque Baixo: Gás R410A',
    mensagem: 'A botija de fluido refrigerante R410A atingiu 3 unidades, que é menor que o estoque mínimo ideal de 4 unidades.',
    tipo: 'estoque_baixo',
    lida: false,
    data_envio: '2026-06-27T16:45:00Z'
  }
];

export const initialOrcamentos: SavedOrcamento[] = [
  {
    id: 'orc_1',
    numero: 'ORC-7320',
    clienteId: 'custom',
    clienteNome: 'Condomínio Spazio Di Napoli',
    clienteTel: '(11) 98765-4321',
    clienteEnd: 'Rua Augusta, 1200 - Consolação - SP',
    equipamentoId: 'custom',
    equipMarca: 'Daikin',
    equipModelo: 'Inverter Hi-Wall',
    equipCapacidade: '18000 BTUs',
    dataEmissao: '2026-06-25',
    validadeDias: 15,
    formaPagamento: 'À vista com 5% de desconto via PIX, ou em até 3x no cartão sem juros',
    prazoExecucao: '3 a 4 dias úteis',
    garantiaMeses: 12,
    observacoes: 'Instalação com tubulação de cobre de alta qualidade de 1/4 e 1/2 polegadas, suporte de fixação externo reforçado e amortecedores inclusos. Não inclui furação em vigas de concreto armado.',
    items: [
      { id: 'item_1_1', descricao: 'Instalação técnica completa de Ar Condicionado Daikin 18.000 BTUs', quantidade: 1, valor_unitario: 850.00 },
      { id: 'item_1_2', descricao: 'Kit infraestrutura de cobre extra (por metro excedente aos 3m inclusos)', quantidade: 2, valor_unitario: 120.00 },
      { id: 'item_1_3', descricao: 'Suporte de fixação externo de aço carbono com pintura epóxi anti-ferrugem', quantidade: 1, valor_unitario: 110.00 }
    ],
    descontoPercent: 5,
    subtotal: 1200.00,
    valorDesconto: 60.00,
    valorTotal: 1140.00,
    activeLayout: 'timbrado',
    status: 'aprovado'
  },
  {
    id: 'orc_2',
    numero: 'ORC-4451',
    clienteId: 'custom',
    clienteNome: 'Clínica Odontológica Sorriso',
    clienteTel: '(11) 99999-7777',
    clienteEnd: 'Av. Paulista, 1500 - Bela Vista - SP',
    equipamentoId: 'custom',
    equipMarca: 'Fujitsu',
    equipModelo: 'Cassete Inverter',
    equipCapacidade: '36000 BTUs',
    dataEmissao: '2026-06-28',
    validadeDias: 10,
    formaPagamento: 'Entrada de 40% + 2 parcelas no boleto faturado para PJ',
    prazoExecucao: '1 dia (execução em final de semana / fora de horário comercial)',
    garantiaMeses: 24,
    observacoes: 'Higienização profunda periódica preventiva recomendada para ambientes de saúde, incluindo remoção de carenagem, aplicação de bactericida biodegradável registrado na ANVISA e limpeza de bandeja de condensado.',
    items: [
      { id: 'item_2_1', descricao: 'Higienização e sanitização química profunda de Ar Condicionado Cassete 36k BTUs', quantidade: 2, valor_unitario: 350.00 },
      { id: 'item_2_2', descricao: 'Substituição de capacitor de partida da condensadora externa', quantidade: 1, valor_unitario: 180.00 }
    ],
    descontoPercent: 0,
    subtotal: 880.00,
    valorDesconto: 0,
    valorTotal: 880.00,
    activeLayout: 'tecnico',
    status: 'pendente'
  }
];

