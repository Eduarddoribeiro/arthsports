import { existsSync } from "node:fs";
import path from "node:path";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { ZodError } from "zod";
import { garantirUsuario, lerCookie, usuarioDaSessao } from "./auth";
import { conectar } from "./db";
import { pecas } from "./db/schema";
import { rotasProtegidas, rotasPublicas } from "./rotas";

declare module "fastify" {
  interface FastifyRequest {
    usuario?: { id: number; nome: string; papel: string };
  }
}

const db = await conectar();
await garantirUsuario(db);

// Catálogo inicial (RN-01). Só roda com o catálogo vazio; depois o Eduardo ajusta na tela Peças e prazos.
const [algumaPeca] = await db.select({ id: pecas.id }).from(pecas).limit(1);
if (!algumaPeca) {
  await db.insert(pecas).values([
    { nome: "Camisa", prazoMinDias: 15, prazoMaxDias: 30 },
    { nome: "Calção", prazoMinDias: 30, prazoMaxDias: 45 },
    { nome: "Agasalho", prazoMinDias: 30, prazoMaxDias: 45 },
  ]);
}

const app = Fastify({ logger: { level: process.env.NODE_ENV === "production" ? "info" : "warn" }, trustProxy: true });

await app.register(cookie);
await app.register(rateLimit, { global: false });

app.setErrorHandler((erro, _req, reply) => {
  if (erro instanceof ZodError) {
    return reply.code(400).send({ erro: erro.issues[0]?.message ?? "Dados inválidos" });
  }
  if ((erro as { statusCode?: number }).statusCode === 429) {
    return reply.code(429).send({ erro: "Muitas tentativas. Espere alguns minutos." });
  }
  app.log.error(erro);
  return reply.code(500).send({ erro: "Erro inesperado no servidor" });
});

await app.register(async (publicas) => rotasPublicas(publicas, db));
await app.register(async (protegidas) => {
  protegidas.addHook("preHandler", async (req, reply) => {
    const usuario = await usuarioDaSessao(db, lerCookie(req));
    if (!usuario) return reply.code(401).send({ erro: "Faça login para continuar" });
    req.usuario = usuario;
  });
  await rotasProtegidas(protegidas, db);
});

// Front-end compilado (produção). Em desenvolvimento quem serve é o Vite.
const pastaWeb = path.join(process.cwd(), "dist", "web");
if (existsSync(pastaWeb)) {
  await app.register(fastifyStatic, { root: pastaWeb, wildcard: false });
  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith("/api/")) return reply.code(404).send({ erro: "Rota não encontrada" });
    return reply.sendFile("index.html");
  });
}

const porta = Number(process.env.PORT ?? 3000);
await app.listen({ port: porta, host: "0.0.0.0" });
console.log(`API ouvindo em http://localhost:${porta}`);
