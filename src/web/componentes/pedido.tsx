import { Link } from "react-router";
import type { PedidoResumo } from "@shared/api";
import { diasDeAtraso, ETAPAS, NOME_ETAPA_LONGO, proximaEtapa, SITUACAO_ETAPA, type Etapa } from "@shared/dominio";
import { textoAvancar, useAvancarEtapa } from "@/lib/consultas";
import { diaMes, numeroPedido, plural } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { Botao } from "./ui/botao";

/** Quatro segmentos: branco = concluído, cinza claro = atual, #333 = restante. */
export function BarraEtapas({ etapa, className, grossa }: { etapa: Etapa; className?: string; grossa?: boolean }) {
  const atual = ETAPAS.indexOf(etapa);
  const entregue = etapa === "entregue";
  return (
    <div
      role="img"
      aria-label={`Etapa ${atual + 1} de 4: ${NOME_ETAPA_LONGO[etapa]}`}
      className={cn("grid grid-cols-4 gap-2", className)}
    >
      {ETAPAS.map((e, i) => (
        <span
          key={e}
          className={cn(
            "block",
            grossa ? "h-5" : "h-2.5",
            i < atual || entregue ? "bg-white" : i === atual ? "bg-atraso" : "bg-divisoria",
          )}
        />
      ))}
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

/** Linha de pedido: cliente, peças, prazo em destaque e barra de etapas. */
export function CartaoPedido({
  pedido,
  hoje,
  acaoNoCelular = true,
  mostrarNumero = false,
}: {
  pedido: PedidoResumo;
  hoje: Date;
  acaoNoCelular?: boolean;
  mostrarNumero?: boolean;
}) {
  const s = situacao(pedido, hoje);
  const atrasado = s.tipo === "atrasado";
  return (
    <article
      className={cn(
        "relative rounded-[4px] bg-card",
        atrasado ? "border border-white border-l-[10px] border-l-atraso" : "border border-divisoria",
      )}
    >
      <div className="flex flex-col gap-4 p-5 pl-6 lg:grid lg:grid-cols-[1fr_200px_auto] lg:items-center lg:gap-8 lg:p-7">
        <div className="flex items-start justify-between gap-4 lg:block">
          <div className="min-w-0">
            <h3 className="text-[19px] font-semibold lg:text-[21px]">
              <Link to={`/pedidos/${pedido.id}`} className="after:absolute after:inset-0 hover:underline">
                {pedido.clienteNome}
              </Link>
            </h3>
            <p className="mt-1 text-cinza-medio">
              {mostrarNumero && <span>#{numeroPedido(pedido.id)} · </span>}
              {linhaDetalhe(pedido, atrasado)}
            </p>
          </div>
          <p className={cn("titulo shrink-0 text-right text-[24px] lg:hidden", atrasado ? "text-atraso" : "text-ok")}>
            {s.texto}
          </p>
          <BarraEtapas etapa={pedido.etapaAtual} className="mt-4 hidden lg:grid" />
        </div>
        <BarraEtapas etapa={pedido.etapaAtual} className="lg:hidden" />
        <p className={cn("titulo hidden text-[30px] lg:block", atrasado ? "text-atraso" : "text-ok")}>{s.texto}</p>
        <div className={cn("relative z-10", !acaoNoCelular && "hidden lg:block")}>
          <BotaoAvancar pedido={pedido} className="w-full lg:min-w-[240px]" tamanho="grande" />
        </div>
      </div>
    </article>
  );
}
