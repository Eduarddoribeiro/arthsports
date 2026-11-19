// Validação compartilhada entre front-end (formulários) e API (entrada das rotas).
import { z } from "zod";
import { ETAPAS, TAMANHOS, TIPOS_CLIENTE } from "./dominio";

const dataISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida");
const centavos = z.number().int("Valor inválido").min(0, "Valor não pode ser negativo");
const qtd = z.number().int().min(0).max(9999);

export const gradeSchema = z.object(
  Object.fromEntries(TAMANHOS.map((t) => [t, qtd])) as Record<(typeof TAMANHOS)[number], typeof qtd>,
);

export const loginSchema = z.object({
  senha: z.string().min(1, "Digite a senha"),
});

export const clienteSchema = z.object({
  nome: z.string().trim().min(2, "Nome muito curto").max(120),
  tipo: z.enum(TIPOS_CLIENTE),
  responsavel: z.string().trim().max(120),
  telefone: z.string().trim().max(40),
});
export type ClienteEntrada = z.infer<typeof clienteSchema>;

export const pecaSchema = z
  .object({
    nome: z.string().trim().min(2, "Nome muito curto").max(80),
    prazoMinDias: z.number().int().min(1, "Mínimo de 1 dia").max(365),
    prazoMaxDias: z.number().int().min(1, "Mínimo de 1 dia").max(365),
  })
  .refine((p) => p.prazoMaxDias >= p.prazoMinDias, {
    message: "O prazo máximo precisa ser maior ou igual ao mínimo",
    path: ["prazoMaxDias"],
  });
export type PecaEntrada = z.infer<typeof pecaSchema>;

export const itemPedidoSchema = z.object({
  pecaId: z.number().int().positive(),
  grade: gradeSchema,
});

export const pedidoSchema = z
  .object({
    clienteId: z.number().int().positive({ message: "Escolha o cliente" }),
    itens: z.array(itemPedidoSchema).min(1, "Adicione ao menos uma peça"),
    valorTotalCentavos: centavos.min(1, "Informe o valor total"),
    sinalCentavos: centavos,
    dataSinal: dataISO,
  })
  .refine((p) => p.sinalCentavos <= p.valorTotalCentavos, {
    message: "O sinal não pode ser maior que o total",
    path: ["sinalCentavos"],
  })
  .refine((p) => p.itens.every((i) => Object.values(i.grade).some((n) => n > 0)), {
    message: "Toda peça precisa de ao menos um tamanho",
    path: ["itens"],
  });
export type PedidoEntrada = z.infer<typeof pedidoSchema>;

export const pagamentoSchema = z.object({
  valorCentavos: centavos.min(1, "Informe o valor"),
  data: dataISO,
});
export type PagamentoEntrada = z.infer<typeof pagamentoSchema>;

export const etapaSchema = z.enum(ETAPAS);
