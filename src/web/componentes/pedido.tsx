import { Link } from "react-router";
import type { PedidoResumo } from "@shared/api";
import { diasDeAtraso, ETAPAS, NOME_ETAPA, NOME_ETAPA_LONGO, proximaEtapa, SITUACAO_ETAPA, type Etapa } from "@shared/dominio";
import { textoAvancar, useAvancarEtapa } from "@/lib/consultas";
import { diaMes, numeroPedido, plural } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { Botao } from "./ui/botao";

/** Quatro segmentos inclinados: branco = concluído, cinza claro = atual, #333 = restante. */
export function BarraEtapas({
  etapa,
  className,
  grossa,
  rotulos,
}: {
  etapa: Etapa;
  className?: string;
  grossa?: boolean;
  rotulos?: boolean;
}) {
  const atual = ETAPAS.indexOf(etapa);
  const entregue = etapa === "entregue";
  return (
    <div className={className}>
      <div role="img" aria-label={`Etapa ${atual + 1} de 4: ${NOME_ETAPA_LONGO[etapa]}`} className="grid grid-cols-4 gap-1.5 px-1">
        {ETAPAS.map((e, i) => (
          <span
            key={e}
            className={cn(
              "block -skew-x-[24deg]",
              grossa ? "h-5" : "h-3",
              i < atual || entregue ? "bg-white" : i === atual ? "bg-atraso" : "bg-divisoria",
            )}
          />
        ))}
      </div>
      {rotulos && (
        <div aria-hidden className="mt-2 grid grid-cols-4 gap-1.5 text-[13px]">
          {ETAPAS.map((e, i) => (
            <span
              key={e}
              className={cn(
                i === atual && !entregue ? "font-semibold text-white" : i < atual || entregue ? "text-cinza-medio" : "text-cinza",
              )}
            >
              {NOME_ETAPA[e]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function situacao(p: PedidoResumo, hoje: Date) {
  const atraso = diasDeAtraso(p, hoje);
  if (p.status === "cancelado") return { tipo: "cancelado" as const, texto: "Cancelado", atraso };
  if (p.etapaAtual === "entregue")
    return { tipo: "entregue" as const, texto: `Entregue ${p.entregueEm ? diaMes(p.entregueEm) : ""}`, atraso };
  if (atraso > 0) return { tipo: "atrasado" as const, texto: `${plural(atraso, "dia", "dias")} de atraso`, atraso };
  return { tipo: "prazo" as const, texto: `Entrega ${diaMes(p.entregaCalculada)}`, atraso };
}

/** "42 peças · parado em acabamento desde 04/11" */
export function linhaDetalhe(p: PedidoResumo, atrasado: boolean) {
  const etapa = SITUACAO_ETAPA[p.etapaAtual];
  const parado = atrasado ? `parado ${etapa} desde ${diaMes(p.etapaDesde)}` : etapa;
  return `${plural(p.totalPecas, "peça", "peças")} · ${parado}`;
}

export function BotaoAvancar({
  pedido,
  className,
  tamanho,
}: {
  pedido: Pick<PedidoResumo, "id" | "etapaAtual" | "clienteNome" | "status">;
  className?: string;
  tamanho?: "normal" | "grande";
}) {
  const avancar = useAvancarEtapa();
  const texto = textoAvancar(pedido.etapaAtual);
  if (!texto || pedido.status !== "ativo") return null;
  const final = proximaEtapa(pedido.etapaAtual) === "entregue";
  return (
    <Botao
      variante={final ? "primario" : "secundario"}
      tamanho={tamanho}
      className={className}
      disabled={avancar.isPending}
      onClick={(e) => {
        e.preventDefault();
        avancar.mutate({ id: pedido.id, de: pedido.etapaAtual, clienteNome: pedido.clienteNome });
      }}
    >
      {texto}
    </Botao>
  );
}

/** Linha de pedido: número, cliente, prazo em destaque, etapas e ação. */
export function CartaoPedido({
  pedido,
  hoje,
  acaoNoCelular = true,
  mostrarNumero = true,
}: {
  pedido: PedidoResumo;
  hoje: Date;
  acaoNoCelular?: boolean;
  mostrarNumero?: boolean;
}) {
  const s = situacao(pedido, hoje);
  const atrasado = s.tipo === "atrasado";
  const apagado = s.tipo === "cancelado";
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[4px] bg-card transition-colors",
        atrasado ? "border border-white" : "border border-divisoria hover:border-cinza",
        apagado && "opacity-60",
      )}
    >
      {atrasado && <span aria-hidden className="listras absolute inset-y-0 left-0 w-3 text-atraso" />}
      <div className={cn("grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:gap-x-10 lg:p-7", atrasado && "pl-8 lg:pl-10")}>
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {mostrarNumero && (
                <p className="titulo text-[20px] tracking-[0.04em] text-cinza" aria-label={`Pedido ${numeroPedido(pedido.id)}`}>
                  #{numeroPedido(pedido.id)}
                </p>
              )}
              <h3 className="titulo mt-1 text-[30px] lg:text-[36px]">
                <Link to={`/pedidos/${pedido.id}`} className="after:absolute after:inset-0 group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
                  {pedido.clienteNome}
                </Link>
              </h3>
            </div>
            <PrazoDestaque texto={s.texto} atrasado={atrasado} className="pt-1 text-right lg:hidden" />
          </div>
          <p className="mt-2 text-[16px] text-cinza-medio">{linhaDetalhe(pedido, atrasado)}</p>
          <BarraEtapas etapa={pedido.etapaAtual} rotulos className="mt-5 lg:max-w-[520px]" />
        </div>

        <div className="flex flex-col justify-between gap-5 lg:items-end">
          <PrazoDestaque texto={s.texto} atrasado={atrasado} className="hidden text-right lg:block" />
          <div className={cn("relative z-10", !acaoNoCelular && "hidden lg:block")}>
            <BotaoAvancar pedido={pedido} className="w-full lg:w-auto lg:min-w-[250px]" tamanho="grande" />
          </div>
        </div>
      </div>
    </article>
  );
}

/** "4 DIAS / DE ATRASO" ou "ENTREGA / 02/12", em duas linhas de placar. */
function PrazoDestaque({ texto, atrasado, className }: { texto: string; atrasado: boolean; className?: string }) {
  const m = texto.match(/^(\d+ dias?) (de atraso)$/) ?? texto.match(/^(Entrega|Entregue) ?(.*)$/);
  const [topo, base] = m ? [m[1], m[2]] : [texto, ""];
  return (
    <p className={cn("shrink-0", className)}>
      <span className={cn("titulo block text-[30px] lg:text-[40px]", atrasado ? "text-white" : "text-ok")}>{atrasado ? topo : base || topo}</span>
      <span className={cn("rotulo mt-1 block", atrasado && "text-atraso")}>{atrasado ? base : base ? topo : ""}</span>
    </p>
  );
}
