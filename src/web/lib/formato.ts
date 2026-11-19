import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brlInteiro = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/** R$ 2.100 quando não há centavos; R$ 2.100,50 quando há. */
export function dinheiro(centavos: number) {
  return centavos % 100 === 0 ? brlInteiro.format(centavos / 100) : brl.format(centavos / 100);
}

/** R$ 9,8K para números grandes em destaque. */
export function dinheiroCompacto(centavos: number) {
  const reais = centavos / 100;
  if (reais < 10_000) return brlInteiro.format(reais);
  const mil = reais / 1000;
  return `R$ ${mil.toLocaleString("pt-BR", { maximumFractionDigits: mil < 100 ? 1 : 0 })}K`;
}

const comoData = (d: string | Date) => (typeof d === "string" ? parseISO(d) : d);

export const diaMes = (d: string | Date) => format(comoData(d), "dd/MM");
export const dataCompleta = (d: string | Date) => format(comoData(d), "dd/MM/yyyy");
export const mesAno = (d: string | Date) => format(comoData(d), "MMM/yyyy", { locale: ptBR }).toUpperCase();
export const diaSemana = (d: Date) => format(d, "EEEE", { locale: ptBR }).replace("-feira", "");

export function numeroPedido(id: number) {
  return String(id).padStart(4, "0");
}

export function plural(n: number, um: string, varios: string) {
  return `${n} ${n === 1 ? um : varios}`;
}

/** "camisa, calção e agasalho" */
export function listaNatural(itens: string[]) {
  const nomes = itens.map((n, i) => (i === 0 ? n : n.toLowerCase()));
  if (nomes.length <= 1) return nomes.join("");
  return `${nomes.slice(0, -1).join(", ")} e ${nomes.at(-1)}`;
}
