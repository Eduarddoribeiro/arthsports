// Regras de negócio puras, usadas pela API e pelo front-end.
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";

export const ETAPAS = ["arte", "costura", "acabamento", "entregue"] as const;
export type Etapa = (typeof ETAPAS)[number];

export const NOME_ETAPA: Record<Etapa, string> = {
  arte: "Arte",
  costura: "Costura",
  acabamento: "Acabamento",
  entregue: "Entrega",
};

/** Nome completo, como no escopo. */
export const NOME_ETAPA_LONGO: Record<Etapa, string> = {
  arte: "Aprovação da arte",
  costura: "Corte e costura na terceirizada",
  acabamento: "Acabamento e estampa",
  entregue: "Entregue ao cliente",
};

/** Texto curto de situação, ex.: "em costura". */
export const SITUACAO_ETAPA: Record<Etapa, string> = {
  arte: "em arte",
  costura: "em costura",
  acabamento: "em acabamento",
  entregue: "entregue",
};

export const TAMANHOS = ["PP", "P", "M", "G", "GG"] as const;
export type Tamanho = (typeof TAMANHOS)[number];
export type Grade = Record<Tamanho, number>;

export const TIPOS_CLIENTE = ["time", "escola", "empresa"] as const;
export type TipoCliente = (typeof TIPOS_CLIENTE)[number];
export const NOME_TIPO_CLIENTE: Record<TipoCliente, string> = {
  time: "Time",
  escola: "Escola",
  empresa: "Empresa",
};

export function gradeVazia(): Grade {
  return { PP: 0, P: 0, M: 0, G: 0, GG: 0 };
}

export function totalGrade(grade: Partial<Grade>): number {
  return TAMANHOS.reduce((soma, t) => soma + (grade[t] ?? 0), 0);
}

/** "P 4 · M 10 · G 10 · GG 6" (omite tamanhos zerados). */
export function resumoGrade(grade: Partial<Grade>): string {
  const partes = TAMANHOS.filter((t) => (grade[t] ?? 0) > 0).map((t) => `${t} ${grade[t]}`);
  return partes.length ? partes.join(" · ") : "sem tamanhos";
}

export function proximaEtapa(etapa: Etapa): Etapa | null {
  const i = ETAPAS.indexOf(etapa);
  return i >= 0 && i < ETAPAS.length - 1 ? ETAPAS[i + 1] : null;
}

export function etapaAnterior(etapa: Etapa): Etapa | null {
  const i = ETAPAS.indexOf(etapa);
  return i > 0 ? ETAPAS[i - 1] : null;
}

/**
 * RN-02 e RN-03: entrega = data do sinal + maior prazo máximo entre as peças.
 * Datas no formato ISO "aaaa-mm-dd".
 */
export function calcularEntrega(dataSinal: string, prazosMaximos: number[]): string {
  const maior = prazosMaximos.length ? Math.max(...prazosMaximos) : 0;
  return format(addDays(parseISO(dataSinal), maior), "yyyy-MM-dd");
}

/** RN-04: dias de atraso (0 quando no prazo, entregue ou cancelado). */
export function diasDeAtraso(
  pedido: { entregaCalculada: string; etapaAtual: Etapa; status: "ativo" | "cancelado" },
  hoje: Date,
): number {
  if (pedido.status !== "ativo" || pedido.etapaAtual === "entregue") return 0;
  const dias = differenceInCalendarDays(hoje, parseISO(pedido.entregaCalculada));
  return Math.max(0, dias);
}

export function hojeISO(agora = new Date()): string {
  return format(agora, "yyyy-MM-dd");
}
