// Uso: npm run senha -- "nova senha"
import { gerarHash } from "../auth";
import { conectar } from "../db";
import { sessoes, usuarios } from "../db/schema";

const senha = process.argv[2];
if (!senha || senha.length < 8) {
  console.error('Informe a nova senha com pelo menos 8 caracteres: npm run senha -- "nova senha"');
  process.exit(1);
}
const db = await conectar();
const senhaHash = await gerarHash(senha);
const [existente] = await db.select().from(usuarios).limit(1);
if (existente) await db.update(usuarios).set({ senhaHash });
else await db.insert(usuarios).values({ nome: "Eduardo", senhaHash });
await db.delete(sessoes); // derruba as sessões abertas
console.log("Senha atualizada. Faça login de novo.");
process.exit(0);
