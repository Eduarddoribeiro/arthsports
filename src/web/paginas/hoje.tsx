import { endOfWeek, isSameMonth, isWithinInterval, parseISO, startOfDay } from "date-fns";
import { Link } from "react-router";
import type { PedidoResumo } from "@shared/api";
import { diasDeAtraso, type Etapa } from "@shared/dominio";
import { Carregando, ErroTela } from "@/componentes/layout";
import { CartaoPedido } from "@/componentes/pedido";
import { Botao } from "@/componentes/ui/botao";
import { usePedidos } from "@/lib/consultas";
import { diaMes, diaSemana } from "@/lib/formato";
import { cn } from "@/lib/utils";

function painel(pedidos: PedidoResumo[], hoje: Date) {
  const emProducao = pedidos.filter((p) => p.status === "ativo" && p.etapaAtual !== "entregue");
  const atrasados = emProducao
    .map((p) => ({ p, dias: diasDeAtraso(p, hoje) }))
    .filter((x) => x.dias > 0)
    .sort((a, b) => b.dias - a.dias)
    .map((x) => x.p);
  const noPrazo = emProducao
    .filter((p) => !atrasados.includes(p))
    .sort((a, b) => a.entregaCalculada.localeCompare(b.entregaCalculada));
  const semana = { start: startOfDay(hoje), end: endOfWeek(hoje, { weekStartsOn: 1 }) };
  const entregasSemana = noPrazo.filter((p) => isWithinInterval(parseISO(p.entregaCalculada), semana)).length;
  const pecasPor = (e: Etapa) => emProducao.filter((p) => p.etapaAtual === e).reduce((s, p) => s + p.totalPecas, 0);
  const entreguesMes = pedidos
    .filter((p) => p.status === "ativo" && p.entregueEm && isSameMonth(parseISO(p.entregueEm), hoje))
    .reduce((s, p) => s + p.totalPecas, 0);

  return {
    pecasNaRua: emProducao.reduce((s, p) => s + p.totalPecas, 0),
    atrasados,
    noPrazo,
    entregasSemana,
    porEtapa: [
      { nome: "Arte", total: pecasPor("arte") },
      { nome: "Costura", total: pecasPor("costura") },
      { nome: "Acabamento", total: pecasPor("acabamento") },
      { nome: "Entregue no mês", total: entreguesMes, concluido: true },
    ],
  };
}

function Numero({ valor, rotulo, destaque }: { valor: number; rotulo: string; destaque?: boolean }) {
  return (
    <div className="px-7 py-6 lg:px-9 lg:py-8">
      <p className={cn("titulo text-[44px] lg:text-[56px]", destaque && valor > 0 ? "text-atraso" : "text-white")}>{valor}</p>
      <p className="mt-1 text-cinza-medio lg:text-[17px]">{rotulo}</p>
    </div>
  );
}

export function PaginaHoje() {
  const consulta = usePedidos();
  const hoje = new Date();

  if (consulta.isPending) return <Carregando />;
  if (consulta.isError) return <ErroTela mensagem={consulta.error.message} aoTentar={() => consulta.refetch()} />;

  const d = painel(consulta.data, hoje);
  const maxEtapa = Math.max(1, ...d.porEtapa.map((e) => e.total));
  const vazio = d.atrasados.length + d.noPrazo.length === 0;

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="rotulo text-[14px] lg:text-[15px]">
            {diaSemana(hoje)} · {diaMes(hoje)}
            <span className="hidden lg:inline">/{hoje.getFullYear()}</span>
          </p>
          <h1 className="titulo mt-1 text-[88px] lg:text-[110px]">Hoje</h1>
        </div>
        <div className="text-right lg:hidden">
          <p className="titulo text-[64px]">{d.pecasNaRua}</p>
          <p className="text-cinza-medio">peças na rua</p>
        </div>
        <div className="hidden gap-4 pb-2 lg:flex">
          <Botao variante="secundario" tamanho="grande" asChild>
            <Link to="/clientes">Buscar cliente</Link>
          </Botao>
          <Botao tamanho="grande" asChild>
            <Link to="/pedidos/novo">+ Novo pedido</Link>
          </Botao>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 divide-x divide-white rounded-[4px] border border-white lg:mt-10 lg:grid-cols-3">
        <div className="hidden lg:block">
          <Numero valor={d.pecasNaRua} rotulo="peças na rua" />
        </div>
        <Numero valor={d.atrasados.length} rotulo={d.atrasados.length === 1 ? "atrasado" : "atrasados"} destaque />
        <Numero valor={d.entregasSemana} rotulo="entregas esta semana" />
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_440px] lg:gap-10">
        <div className="flex flex-col gap-12">
          {vazio ? (
            <section className="rounded-[4px] border border-divisoria bg-card p-7">
              <p className="titulo text-[32px]">Nada em produção</p>
              <p className="mt-2 text-cinza-medio">Crie o primeiro pedido para acompanhar as etapas e o prazo aqui.</p>
              <Botao className="mt-6" tamanho="grande" asChild>
                <Link to="/pedidos/novo">+ Novo pedido</Link>
              </Botao>
            </section>
          ) : (
            <>
              <section aria-labelledby="t-precisa">
                <h2 id="t-precisa" className="rotulo mb-4 text-[14px]">
                  Precisa de você
                </h2>
                {d.atrasados.length ? (
                  <div className="flex flex-col gap-5">
                    {d.atrasados.map((p) => (
                      <CartaoPedido key={p.id} pedido={p} hoje={hoje} />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-[4px] border border-divisoria p-5 text-cinza-medio">
                    Nenhum pedido atrasado. Tudo dentro do prazo.
                  </p>
                )}
              </section>

              {d.noPrazo.length > 0 && (
                <section aria-labelledby="t-prazo">
                  <h2 id="t-prazo" className="rotulo mb-4 text-[14px]">
                    No prazo
                  </h2>
                  <div className="flex flex-col gap-5">
                    {d.noPrazo.map((p) => (
                      <CartaoPedido key={p.id} pedido={p} hoje={hoje} acaoNoCelular={false} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        <aside className="flex flex-col gap-12">
          <section aria-labelledby="t-etapas">
            <h2 id="t-etapas" className="rotulo mb-4 text-[14px]">
              Peças por etapa
            </h2>
            <dl className="flex flex-col gap-6 rounded-[4px] border border-divisoria bg-card p-7">
              {d.porEtapa.map((e) => (
                <div key={e.nome}>
                  <div className="flex justify-between text-[17px]">
                    <dt>{e.nome}</dt>
                    <dd className="font-semibold">{e.total}</dd>
                  </div>
                  <div className="mt-2 h-2.5 bg-divisoria">
                    <div
                      className={cn("h-full", e.concluido ? "bg-ok" : "bg-white")}
                      style={{ width: `${(e.total / maxEtapa) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </dl>
          </section>

          {d.noPrazo.length > 0 && (
            <section aria-labelledby="t-proximas" className="hidden lg:block">
              <h2 id="t-proximas" className="rotulo mb-4 text-[14px]">
                Próximas entregas
              </h2>
              <ul className="flex flex-col gap-3 rounded-[4px] border border-divisoria bg-card p-7 text-[17px]">
                {d.noPrazo.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex justify-between gap-4">
                    <Link to={`/pedidos/${p.id}`} className="truncate hover:underline">
                      {p.clienteNome}
                    </Link>
                    <span className="font-semibold">{diaMes(p.entregaCalculada)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
