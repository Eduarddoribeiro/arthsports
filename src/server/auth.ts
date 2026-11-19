import { createHash, randomBytes } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import { eq, lt } from "drizzle-orm";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { Db } from "./db";
import { sessoes, usuarios } from "./db/schema";

export const COOKIE_SESSAO = "arth_sessao";
const DURACAO_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

export const gerarHash = (senha: string) => hash(senha);

/** Cria o usuário único na primeira execução, com a senha de ADMIN_PASSWORD. */
export async function garantirUsuario(db: Db) {
  const [existente] = await db.select({ id: usuarios.id }).from(usuarios).limit(1);
  if (existente) return;
  const senha = process.env.ADMIN_PASSWORD;
  if (!senha || senha.length < 8) {
    throw new Error("Nenhum usuário cadastrado. Defina ADMIN_PASSWORD (mínimo 8 caracteres) para criar o acesso.");
  }
  await db.insert(usuarios).values({ nome: "Eduardo", senhaHash: await gerarHash(senha) });
  console.log("Usuário inicial criado a partir de ADMIN_PASSWORD.");
}

export async function entrar(db: Db, senha: string): Promise<{ token: string; expira: Date } | null> {
  const [usuario] = await db.select().from(usuarios).limit(1);
  if (!usuario || !(await verify(usuario.senhaHash, senha))) return null;
  const token = randomBytes(32).toString("base64url");
  const expira = new Date(Date.now() + DURACAO_MS);
  await db.delete(sessoes).where(lt(sessoes.expiraEm, new Date()));
  await db.insert(sessoes).values({ id: sha256(token), usuarioId: usuario.id, expiraEm: expira });
  return { token, expira };
}

export async function sair(db: Db, token: string | undefined) {
  if (token) await db.delete(sessoes).where(eq(sessoes.id, sha256(token)));
}

export async function usuarioDaSessao(db: Db, token: string | undefined) {
  if (!token) return null;
  const [linha] = await db
    .select({ id: usuarios.id, nome: usuarios.nome, papel: usuarios.papel, expiraEm: sessoes.expiraEm })
    .from(sessoes)
    .innerJoin(usuarios, eq(usuarios.id, sessoes.usuarioId))
    .where(eq(sessoes.id, sha256(token)));
  if (!linha || linha.expiraEm < new Date()) return null;
  return { id: linha.id, nome: linha.nome, papel: linha.papel };
}

export function gravarCookie(reply: FastifyReply, token: string, expira: Date) {
  reply.setCookie(COOKIE_SESSAO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expira,
  });
}

export function lerCookie(request: FastifyRequest) {
  return request.cookies[COOKIE_SESSAO];
}
