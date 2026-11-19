// Consultas de pedidos montadas no formato do contrato (src/shared/api.ts).
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { Cliente, PedidoDetalhe, PedidoResumo } from "../shared/api";
import type { Db } from "./db";
import { clientes, etapasPedido, itensPedido, pagamentos, pecas, pedidos } from "./db/schema";

/** Timestamps sempre em ISO 8601 (o PGlite e o pg devolvem formatos diferentes). */
export const iso = (v: string) => new Date(v).toISOString();

export function clienteParaApi(c: typeof clientes.$inferSelect): Cliente {
  return {
    id: c.id,
    nome: c.nome,
    tipo: c.tipo,
    responsavel: c.responsavel,
    telefone: c.telefone,
    ativo: c.ativo,
    criadoEm: iso(c.criadoEm),
  };
}

export async function listarResumos(db: Db, filtro?: { clienteId?: number; ids?: number[] }): Promise<PedidoResumo[]> {
  const condicoes = [];
  if (filtro?.clienteId) condicoes.push(eq(pedidos.clienteId, filtro.clienteId));
  if (filtro?.ids) condicoes.push(inArray(pedidos.id, filtro.ids));

  const linhas = await db
    .select({ pedido: pedidos, clienteNome: clientes.nome })
    .from(pedidos)
    .innerJoin(clientes, eq(clientes.id, pedidos.clienteId))
    .where(condicoes.length ? and(...condicoes) : undefined)
    .orderBy(desc(pedidos.id));
  if (!linhas.length) return [];

  const ids = linhas.map((l) => l.pedido.id);
  const [itens, pagos, etapas] = await Promise.all([
    db
      .select({ pedidoId: itensPedido.pedidoId, quantidade: itensPedido.quantidade, nome: pecas.nome })
      .from(itensPedido)
      .innerJoin(pecas, eq(pecas.id, itensPedido.pecaId))
      .where(inArray(itensPedido.pedidoId, ids))
      .orderBy(itensPedido.id),
    db
      .select({ pedidoId: pagamentos.pedidoId, total: sql<string>`sum(${pagamentos.valorCentavos})` })
      .from(pagamentos)
      .where(inArray(pagamentos.pedidoId, ids))
      .groupBy(pagamentos.pedidoId),
    db
      .select({ pedidoId: etapasPedido.pedidoId, etapa: etapasPedido.etapa, em: etapasPedido.em })
      .from(etapasPedido)
      .where(inArray(etapasPedido.pedidoId, ids))
      .orderBy(etapasPedido.id),
  ]);

  return linhas.map(({ pedido, clienteNome }) => {
    const meus = itens.filter((i) => i.pedidoId === pedido.id);
    const minhasEtapas = etapas.filter((e) => e.pedidoId === pedido.id);
    const atual = minhasEtapas.findLast((e) => e.etapa === pedido.etapaAtual);
    return {
      id: pedido.id,
      clienteId: pedido.clienteId,
      clienteNome,
      status: pedido.status,
      etapaAtual: pedido.etapaAtual,
      etapaDesde: iso(atual?.em ?? pedido.criadoEm),
      dataSinal: pedido.dataSinal,
      entregaCalculada: pedido.entregaCalculada,
      entregueEm: pedido.etapaAtual === "entregue" && atual ? iso(atual.em) : null,
      totalPecas: meus.reduce((s, i) => s + i.quantidade, 0),
      pecasNomes: [...new Set(meus.map((i) => i.nome))],
      valorTotalCentavos: pedido.valorTotalCentavos,
      pagoCentavos: Number(pagos.find((p) => p.pedidoId === pedido.id)?.total ?? 0),
      criadoEm: iso(pedido.criadoEm),
    };
  });
}

export async function buscarDetalhe(db: Db, id: number): Promise<PedidoDetalhe | null> {
  const [resumo] = await listarResumos(db, { ids: [id] });
  if (!resumo) return null;

  const [[pedido], [cliente], itens, etapas, pags, [{ total }]] = await Promise.all([
    db.select().from(pedidos).where(eq(pedidos.id, id)),
    db.select().from(clientes).where(eq(clientes.id, resumo.clienteId)),
    db
      .select({ item: itensPedido, pecaNome: pecas.nome, prazoMax: pecas.prazoMaxDias })
      .from(itensPedido)
      .innerJoin(pecas, eq(pecas.id, itensPedido.pecaId))
      .where(eq(itensPedido.pedidoId, id))
      .orderBy(itensPedido.id),
    db.select().from(etapasPedido).where(eq(etapasPedido.pedidoId, id)).orderBy(etapasPedido.id),
    db.select().from(pagamentos).where(eq(pagamentos.pedidoId, id)).orderBy(pagamentos.data, pagamentos.id),
    db.select({ total: sql<string>`count(*)` }).from(pedidos).where(eq(pedidos.clienteId, resumo.clienteId)),
  ]);

  const maior = itens.reduce<(typeof itens)[number] | null>((m, i) => (!m || i.prazoMax > m.prazoMax ? i : m), null);

  return {
    ...resumo,
    sinalCentavos: pedido.sinalCentavos,
    itens: itens.map(({ item, pecaNome }) => ({
      id: item.id,
      pecaId: item.pecaId,
      pecaNome,
      grade: item.grade,
      quantidade: item.quantidade,
    })),
    etapas: etapas.map((e) => ({ etapa: e.etapa, em: iso(e.em) })),
    pagamentos: pags.map((p) => ({ id: p.id, tipo: p.tipo, valorCentavos: p.valorCentavos, data: p.data })),
    cliente: { ...clienteParaApi(cliente), totalPedidos: Number(total) },
    pecaMaiorPrazo: maior?.pecaNome ?? null,
  };
}
