import { and, asc, desc, eq, ilike, inArray } from "drizzle-orm";
import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import type { ClienteDetalhe, Peca } from "../../shared/api";
import { calcularEntrega, etapaAnterior, proximaEtapa, totalGrade } from "../../shared/dominio";
import { clienteSchema, etapaSchema, loginSchema, pagamentoSchema, pecaSchema, pedidoSchema } from "../../shared/esquemas";
import { entrar, gravarCookie, lerCookie, sair, COOKIE_SESSAO } from "../auth";
import type { Db } from "../db";
import { clientes, etapasPedido, itensPedido, pagamentos, pecas, pedidos } from "../db/schema";
import { buscarDetalhe, clienteParaApi, listarResumos } from "../pedidos";

const idParam = z.object({ id: z.coerce.number().int().positive() });
const naoEncontrado = (reply: FastifyReply, oque: string) => reply.code(404).send({ erro: `${oque} não encontrado` });
const conflito = (reply: FastifyReply, erro: string) => reply.code(409).send({ erro });

/** Janela do servidor para desfazer um avanço (o app mostra 10 segundos). */
const JANELA_DESFAZER_MS = 60_000;

const pecaParaApi = (p: typeof pecas.$inferSelect): Peca => ({
  id: p.id,
  nome: p.nome,
  prazoMinDias: p.prazoMinDias,
  prazoMaxDias: p.prazoMaxDias,
  ativa: p.ativa,
});

export async function rotasPublicas(app: FastifyInstance, db: Db) {
  app.post("/api/auth/login", { config: { rateLimit: { max: 10, timeWindow: "15 minutes" } } }, async (req, reply) => {
    const { senha } = loginSchema.parse(req.body);
    const sessao = await entrar(db, senha);
    if (!sessao) return reply.code(401).send({ erro: "Senha incorreta" });
    gravarCookie(reply, sessao.token, sessao.expira);
    return { ok: true };
  });

  app.post("/api/auth/logout", async (req, reply) => {
    await sair(db, lerCookie(req));
    reply.clearCookie(COOKIE_SESSAO, { path: "/" });
    return { ok: true };
  });
}

export async function rotasProtegidas(app: FastifyInstance, db: Db) {
  app.get("/api/auth/sessao", async (req) => ({ nome: req.usuario!.nome }));

  // ---------- Clientes (M1, M7) ----------
  app.get("/api/clientes", async (req) => {
    const q = z.object({ busca: z.string().optional(), inativos: z.coerce.boolean().optional() }).parse(req.query);
    const condicoes = [];
    if (!q.inativos) condicoes.push(eq(clientes.ativo, true));
    if (q.busca?.trim()) condicoes.push(ilike(clientes.nome, `%${q.busca.trim()}%`));
    const linhas = await db
      .select()
      .from(clientes)
      .where(condicoes.length ? and(...condicoes) : undefined)
      .orderBy(asc(clientes.nome));
    return linhas.map(clienteParaApi);
  });

  app.get("/api/clientes/:id", async (req, reply): Promise<ClienteDetalhe | void> => {
    const { id } = idParam.parse(req.params);
    const [c] = await db.select().from(clientes).where(eq(clientes.id, id));
    if (!c) return naoEncontrado(reply, "Cliente");
    return { ...clienteParaApi(c), pedidos: await listarResumos(db, { clienteId: id }) };
  });

  app.post("/api/clientes", async (req, reply) => {
    const dados = clienteSchema.parse(req.body);
    const [c] = await db.insert(clientes).values(dados).returning();
    return reply.code(201).send(clienteParaApi(c));
  });

  app.put("/api/clientes/:id", async (req, reply) => {
    const { id } = idParam.parse(req.params);
    const dados = clienteSchema.parse(req.body);
    const [c] = await db.update(clientes).set(dados).where(eq(clientes.id, id)).returning();
    return c ? clienteParaApi(c) : naoEncontrado(reply, "Cliente");
  });

  app.post("/api/clientes/:id/ativo", async (req, reply) => {
    const { id } = idParam.parse(req.params);
    const { ativo } = z.object({ ativo: z.boolean() }).parse(req.body);
    const [c] = await db.update(clientes).set({ ativo }).where(eq(clientes.id, id)).returning();
    return c ? clienteParaApi(c) : naoEncontrado(reply, "Cliente");
  });

  // ---------- Peças e prazos (M2) ----------
  app.get("/api/pecas", async () => {
    const linhas = await db.select().from(pecas).orderBy(desc(pecas.ativa), asc(pecas.nome));
    return linhas.map(pecaParaApi);
  });

  app.post("/api/pecas", async (req, reply) => {
    const [p] = await db.insert(pecas).values(pecaSchema.parse(req.body)).returning();
    return reply.code(201).send(pecaParaApi(p));
  });

  app.put("/api/pecas/:id", async (req, reply) => {
    const { id } = idParam.parse(req.params);
    const [p] = await db.update(pecas).set(pecaSchema.parse(req.body)).where(eq(pecas.id, id)).returning();
    return p ? pecaParaApi(p) : naoEncontrado(reply, "Peça");
  });

  app.post("/api/pecas/:id/ativa", async (req, reply) => {
    const { id } = idParam.parse(req.params);
    const { ativa } = z.object({ ativa: z.boolean() }).parse(req.body);
    const [p] = await db.update(pecas).set({ ativa }).where(eq(pecas.id, id)).returning();
    return p ? pecaParaApi(p) : naoEncontrado(reply, "Peça");
  });

  // ---------- Pedidos (M3 a M6) ----------
  app.get("/api/pedidos", async () => listarResumos(db));

  app.get("/api/pedidos/:id", async (req, reply) => {
    const { id } = idParam.parse(req.params);
    return (await buscarDetalhe(db, id)) ?? naoEncontrado(reply, "Pedido");
  });

  app.post("/api/pedidos", async (req, reply) => {
    const dados = pedidoSchema.parse(req.body);
    const [cliente] = await db.select().from(clientes).where(eq(clientes.id, dados.clienteId));
    if (!cliente) return naoEncontrado(reply, "Cliente");

    const pecaIds = [...new Set(dados.itens.map((i) => i.pecaId))];
    const catalogo = await db.select().from(pecas).where(inArray(pecas.id, pecaIds));
    if (catalogo.length !== pecaIds.length) return reply.code(400).send({ erro: "Peça inválida no pedido" });

    const entregaCalculada = calcularEntrega(
      dados.dataSinal,
      catalogo.map((p) => p.prazoMaxDias),
    );

    const id = await db.transaction(async (tx) => {
      const [pedido] = await tx
        .insert(pedidos)
        .values({
          clienteId: dados.clienteId,
          valorTotalCentavos: dados.valorTotalCentavos,
          sinalCentavos: dados.sinalCentavos,
          dataSinal: dados.dataSinal,
          entregaCalculada,
        })
        .returning({ id: pedidos.id });
      await tx.insert(itensPedido).values(
        dados.itens.map((i) => ({ pedidoId: pedido.id, pecaId: i.pecaId, grade: i.grade, quantidade: totalGrade(i.grade) })),
      );
      await tx.insert(etapasPedido).values({ pedidoId: pedido.id, etapa: "arte" });
      if (dados.sinalCentavos > 0) {
        await tx
          .insert(pagamentos)
          .values({ pedidoId: pedido.id, tipo: "sinal", valorCentavos: dados.sinalCentavos, data: dados.dataSinal });
      }
      return pedido.id;
    });

    return reply.code(201).send(await buscarDetalhe(db, id));
  });

  // Avança uma etapa. "de" evita avanço duplo se o botão for tocado duas vezes.
  app.post("/api/pedidos/:id/avancar", async (req, reply) => {
    const { id } = idParam.parse(req.params);
    const { de } = z.object({ de: etapaSchema }).parse(req.body);
    const [pedido] = await db.select().from(pedidos).where(eq(pedidos.id, id));
    if (!pedido) return naoEncontrado(reply, "Pedido");
    if (pedido.status === "cancelado") return conflito(reply, "Pedido cancelado não muda de etapa");
    if (pedido.etapaAtual !== de) return conflito(reply, "O pedido já mudou de etapa. Atualize a tela.");
    const para = proximaEtapa(de);
    if (!para) return conflito(reply, "O pedido já foi entregue");

    await db.transaction(async (tx) => {
      await tx.update(pedidos).set({ etapaAtual: para }).where(eq(pedidos.id, id));
      await tx.insert(etapasPedido).values({ pedidoId: id, etapa: para });
    });
    return { etapaAtual: para };
  });

  app.post("/api/pedidos/:id/desfazer", async (req, reply) => {
    const { id } = idParam.parse(req.params);
    const { de } = z.object({ de: etapaSchema }).parse(req.body);
    const [pedido] = await db.select().from(pedidos).where(eq(pedidos.id, id));
    if (!pedido) return naoEncontrado(reply, "Pedido");
    const volta = etapaAnterior(de);
    if (pedido.etapaAtual !== de || !volta) return conflito(reply, "Não há avanço para desfazer");

    const [ultimo] = await db
      .select()
      .from(etapasPedido)
      .where(eq(etapasPedido.pedidoId, id))
      .orderBy(desc(etapasPedido.id))
      .limit(1);
    if (!ultimo || ultimo.etapa !== de || Date.now() - new Date(ultimo.em).getTime() > JANELA_DESFAZER_MS) {
      return conflito(reply, "O tempo para desfazer acabou");
    }
    await db.transaction(async (tx) => {
      await tx.delete(etapasPedido).where(eq(etapasPedido.id, ultimo.id));
      await tx.update(pedidos).set({ etapaAtual: volta }).where(eq(pedidos.id, id));
    });
    return { etapaAtual: volta };
  });

  app.post("/api/pedidos/:id/cancelar", async (req, reply) => {
    const { id } = idParam.parse(req.params);
    const [pedido] = await db.select().from(pedidos).where(eq(pedidos.id, id));
    if (!pedido) return naoEncontrado(reply, "Pedido");
    if (pedido.etapaAtual === "entregue") return conflito(reply, "Pedido entregue não pode ser cancelado");
    await db.update(pedidos).set({ status: "cancelado" }).where(eq(pedidos.id, id));
    return { ok: true };
  });

  app.post("/api/pedidos/:id/pagamentos", async (req, reply) => {
    const { id } = idParam.parse(req.params);
    const dados = pagamentoSchema.parse(req.body);
    const detalhe = await buscarDetalhe(db, id);
    if (!detalhe) return naoEncontrado(reply, "Pedido");
    const saldo = detalhe.valorTotalCentavos - detalhe.pagoCentavos;
    if (dados.valorCentavos > saldo) return reply.code(400).send({ erro: "O valor é maior que o saldo a receber" });
    await db.insert(pagamentos).values({ pedidoId: id, tipo: "saldo", ...dados });
    return reply.code(201).send({ ok: true });
  });
}

