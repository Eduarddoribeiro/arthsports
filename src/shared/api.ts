// Formatos de resposta da API (contrato entre servidor e front-end).
import type { Etapa, Grade, TipoCliente } from "./dominio";

export interface Cliente {
  id: number;
  nome: string;
  tipo: TipoCliente;
  responsavel: string;
  telefone: string;
  ativo: boolean;
  criadoEm: string;
}

export interface Peca {
  id: number;
  nome: string;
  prazoMinDias: number;
  prazoMaxDias: number;
  ativa: boolean;
}

export interface ItemPedido {
  id: number;
  pecaId: number;
  pecaNome: string;
  grade: Grade;
  quantidade: number;
}

export interface RegistroEtapa {
  etapa: Etapa;
  em: string; // ISO timestamp
}

export interface Pagamento {
  id: number;
  tipo: "sinal" | "saldo";
  valorCentavos: number;
  data: string;
}

/** Linha de lista: o necessário para Hoje, Pedidos e histórico do cliente. */
export interface PedidoResumo {
  id: number;
  clienteId: number;
  clienteNome: string;
  status: "ativo" | "cancelado";
  etapaAtual: Etapa;
  etapaDesde: string; // ISO timestamp
  dataSinal: string;
  entregaCalculada: string;
  entregueEm: string | null;
  totalPecas: number;
  pecasNomes: string[];
  valorTotalCentavos: number;
  pagoCentavos: number;
  criadoEm: string;
}

export interface PedidoDetalhe extends PedidoResumo {
  sinalCentavos: number;
  itens: ItemPedido[];
  etapas: RegistroEtapa[];
  pagamentos: Pagamento[];
  cliente: Cliente & { totalPedidos: number };
  pecaMaiorPrazo: string | null;
}

export interface ClienteDetalhe extends Cliente {
  pedidos: PedidoResumo[];
}
