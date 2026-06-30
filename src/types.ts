export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  tipo_usuario: 'admin' | 'tecnico' | 'cliente';
  status: 'ativo' | 'inativo';
}

export interface Cliente {
  id: string;
  nome: string;
  tipo_cliente: 'residencial' | 'comercial' | 'industrial';
  cpf_cnpj: string;
  telefone: string;
  whatsapp: string;
  email: string;
  endereco: string;
  cidade: string;
  estado: string;
  observacoes?: string;
  status: 'ativo' | 'inativo';
  criado_em: string;
}

export interface Equipamento {
  id: string;
  cliente_id: string;
  tipo_equipamento: 'split' | 'janela' | 'cassete' | 'piso_teto' | 'portatil' | 'vrf';
  marca: string;
  modelo: string;
  capacidade_btu: number;
  numero_serie: string;
  local_instalado: string;
  data_instalacao: string;
  data_ultima_manutencao?: string;
  data_proxima_manutencao?: string;
  frequencia_manutencao: 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';
  status: 'ativo' | 'inativo';
  observacoes?: string;
  foto_url?: string;
}

export interface Tecnico {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  whatsapp: string;
  email: string;
  especialidade: string;
  status: 'ativo' | 'inativo';
}

export interface Agendamento {
  id: string;
  cliente_id: string;
  equipamento_id: string;
  tecnico_id: string;
  data_agendamento: string;
  hora_inicio: string;
  tipo_servico: 'instalacao' | 'manutencao_preventiva' | 'manutencao_corretiva' | 'limpeza' | 'higienizacao' | 'recarga_gas' | 'visita_tecnica';
  status: 'agendado' | 'em_andamento' | 'finalizado' | 'cancelado';
  observacoes?: string;
}

export interface ChecklistOS {
  verificar_filtros: boolean;
  limpar_filtros: boolean;
  limpar_evaporadora: boolean;
  limpar_condensadora: boolean;
  verificar_serpentina: boolean;
  verificar_turbina: boolean;
  verificar_dreno: boolean;
  verificar_pressao_gas: boolean;
  verificar_corrente_eletrica: boolean;
  verificar_tensao: boolean;
  verificar_ruidos: boolean;
  verificar_vazamentos: boolean;
  testar_controle_remoto: boolean;
  testar_temperatura: boolean;
  higienizar_equipamento: boolean;
  observacoes?: string;
}

export interface FotoServico {
  id: string;
  url_foto: string;
  categoria: 'antes' | 'durante' | 'depois' | 'peca_danificada' | 'vazamento' | 'outros';
  legenda?: string;
  criado_em: string;
}

export interface PecaUsada {
  peca_id: string;
  nome: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

export interface OrdemServico {
  id: string;
  numero_os: number;
  agendamento_id?: string;
  cliente_id: string;
  equipamento_id: string;
  tecnico_id: string;
  tipo_servico: 'instalacao' | 'manutencao_preventiva' | 'manutencao_corretiva' | 'limpeza' | 'higienizacao' | 'recarga_gas' | 'visita_tecnica';
  problema_informado: string;
  diagnostico_tecnico?: string;
  servico_realizado?: string;
  valor_mao_obra: number;
  valor_pecas: number;
  desconto: number;
  valor_total: number;
  status: 'aberta' | 'em_andamento' | 'aguardando_peca' | 'aguardando_aprovacao' | 'finalizada' | 'cancelada';
  data_abertura: string;
  data_finalizacao?: string;
  checklist: ChecklistOS;
  fotos: FotoServico[];
  pecas_usadas: PecaUsada[];
  assinatura_cliente?: string; // Base64 data-url signature
  observacoes?: string;
}

export interface Peca {
  id: string;
  nome: string;
  codigo: string;
  descricao?: string;
  quantidade_estoque: number;
  estoque_minimo: number;
  valor_custo: number;
  valor_venda: number;
  status: 'ativo' | 'inativo';
}

export interface Pagamento {
  id: string;
  ordem_servico_id: string;
  valor: number;
  forma_pagamento: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'transferencia';
  status: 'pendente' | 'pago' | 'cancelado';
  data_pagamento?: string;
  observacoes?: string;
}

export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'manutencao_proxima' | 'manutencao_vencida' | 'os_aberta' | 'pagamento_pendente' | 'estoque_baixo' | 'agendamento_hoje';
  lida: boolean;
  data_envio: string;
}

export interface EmpresaConfig {
  nome_empresa: string;
  cnpj: string;
  telefone: string;
  whatsapp: string;
  email: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  texto_padrao_os?: string;
  logo_url?: string;
}

export interface ItemOrcamento {
  id: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
}

export interface SavedOrcamento {
  id: string;
  numero: string;
  clienteId: string;
  clienteNome: string;
  clienteTel: string;
  clienteEnd: string;
  equipamentoId: string;
  equipMarca: string;
  equipModelo: string;
  equipCapacidade: string;
  dataEmissao: string;
  validadeDias: number;
  formaPagamento: string;
  prazoExecucao: string;
  garantiaMeses: number;
  observacoes: string;
  items: ItemOrcamento[];
  descontoPercent: number;
  subtotal: number;
  valorDesconto: number;
  valorTotal: number;
  activeLayout: 'timbrado' | 'moderno' | 'tecnico' | 'minimalista';
  status: 'pendente' | 'aprovado' | 'rejeitado';
}

