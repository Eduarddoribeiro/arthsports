import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { Grade } from "../../shared/dominio";

export const etapaEnum = pgEnum("etapa", ["arte", "costura", "acabamento", "entregue"]);
export const statusPedidoEnum = pgEnum("status_pedido", ["ativo", "cancelado"]);
export const tipoClienteEnum = pgEnum("tipo_cliente", ["time", "escola", "empresa"]);
export const tipoPagamentoEnum = pgEnum("tipo_pagamento", ["sinal", "saldo"]);
// Fase 2 (F2): o papel "confeccao" entra aqui. No MVP só existe "admin".
export const papelEnum = pgEnum("papel", ["admin"]);

const criadoEm = () => timestamp("criado_em", { withTimezone: true, mode: "string" }).notNull().defaultNow();

export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  papel: papelEnum("papel").notNull().default("admin"),
  senhaHash: text("senha_hash").notNull(),
  criadoEm: criadoEm(),
});

export const sessoes = pgTable("sessoes", {
  // SHA-256 do token do cookie; o token em si nunca é guardado.
  id: text("id").primaryKey(),
  usuarioId: integer("usuario_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  expiraEm: timestamp("expira_em", { withTimezone: true, mode: "date" }).notNull(),
  criadoEm: criadoEm(),
});

export const clientes = pgTable("clientes", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  tipo: tipoClienteEnum("tipo").notNull(),
  responsavel: text("responsavel").notNull().default(""),
  telefone: text("telefone").notNull().default(""),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: criadoEm(),
});

export const pecas = pgTable("pecas", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  prazoMinDias: integer("prazo_min_dias").notNull(),
  prazoMaxDias: integer("prazo_max_dias").notNull(),
  ativa: boolean("ativa").notNull().default(true),
  criadoEm: criadoEm(),
});

export const pedidos = pgTable(
  "pedidos",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity({ startWith: 1001 }),
    clienteId: integer("cliente_id")
      .notNull()
      .references(() => clientes.id),
    status: statusPedidoEnum("status").notNull().default("ativo"),
    etapaAtual: etapaEnum("etapa_atual").notNull().default("arte"),
    valorTotalCentavos: integer("valor_total_centavos").notNull(),
    sinalCentavos: integer("sinal_centavos").notNull(),
    dataSinal: date("data_sinal", { mode: "string" }).notNull(),
    // Data calculada (RN-03). A Fase 2 (F4) adiciona uma data definitiva separada.
    entregaCalculada: date("entrega_calculada", { mode: "string" }).notNull(),
    criadoEm: criadoEm(),
  },
  (t) => [index("pedidos_cliente_idx").on(t.clienteId), index("pedidos_status_idx").on(t.status, t.etapaAtual)],
);

export const itensPedido = pgTable(
  "itens_pedido",
  {
    id: serial("id").primaryKey(),
    pedidoId: integer("pedido_id")
      .notNull()
      .references(() => pedidos.id, { onDelete: "cascade" }),
    pecaId: integer("peca_id")
      .notNull()
      .references(() => pecas.id),
    grade: jsonb("grade").$type<Grade>().notNull(),
    quantidade: integer("quantidade").notNull(),
  },
  (t) => [index("itens_pedido_idx").on(t.pedidoId)],
);

export const etapasPedido = pgTable(
  "etapas_pedido",
  {
    id: serial("id").primaryKey(),
    pedidoId: integer("pedido_id")
      .notNull()
      .references(() => pedidos.id, { onDelete: "cascade" }),
    etapa: etapaEnum("etapa").notNull(),
    em: timestamp("em", { withTimezone: true, mode: "string" }).notNull().default(sql`now()`),
  },
  (t) => [index("etapas_pedido_idx").on(t.pedidoId)],
);

export const pagamentos = pgTable(
  "pagamentos",
  {
    id: serial("id").primaryKey(),
    pedidoId: integer("pedido_id")
      .notNull()
      .references(() => pedidos.id, { onDelete: "cascade" }),
    tipo: tipoPagamentoEnum("tipo").notNull(),
    valorCentavos: integer("valor_centavos").notNull(),
    data: date("data", { mode: "string" }).notNull(),
    criadoEm: criadoEm(),
  },
  (t) => [index("pagamentos_pedido_idx").on(t.pedidoId)],
);
