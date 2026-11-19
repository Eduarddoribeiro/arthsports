import { useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import type { PedidoDetalhe } from "@shared/api";
import { ETAPAS, hojeISO, NOME_ETAPA, TAMANHOS, totalGrade, type Grade } from "@shared/dominio";
import { pagamentoSchema } from "@shared/esquemas";
import { AcaoRodape, Carregando, ErroTela } from "@/componentes/layout";
import { BarraEtapas, BotaoAvancar, situacao } from "@/componentes/pedido";
import { Botao } from "@/componentes/ui/botao";
import { Campo, Entrada, EntradaDinheiro } from "@/componentes/ui/campo";
import { Dialogo } from "@/componentes/ui/dialogo";
import { ItemMenu, Menu } from "@/componentes/ui/menu";
import { api } from "@/lib/api";
import { usePedido } from "@/lib/consultas";
import { dataCompleta, diaMes, dinheiro, listaNatural, numeroPedido, plural } from "@/lib/formato";
import { cn } from "@/lib/utils";

function FaixaSituacao({ p }: { p: PedidoDetalhe }) {
  const hoje = new Date();
  const s = situacao(p, hoje);
  const faltam = differenceInCalendarDays(parseISO(p.entregaCalculada), hoje);

  const [rotulo, grande, lado] =
    s.tipo === "atrasado"
      ? ["Atrasado", plural(s.atraso, "dia", "dias"), `previsto ${diaMes(p.entregaCalculada)}`]
      : s.tipo === "entregue"
        ? ["Entregue", p.entregueEm ? diaMes(p.entregueEm) : "", `previsto ${diaMes(p.entregaCalculada)}`]
        : s.tipo === "cancelado"
          ? ["Pedido", "Cancelado", ""]
          : ["Entrega prevista", diaMes(p.entregaCalculada), faltam === 0 ? "é hoje" : `faltam ${plural(faltam, "dia", "dias")}`];

  return (
    <div
      className={cn(
        "flex items-end justify-between gap-4 rounded-[4px] bg-elevado px-7 py-5",
        s.tipo === "atrasado" ? "border-2 border-white" : "border border-divisoria",
      )}
    >
      <div>
        <p className="rotulo text-[15px] text-white">{rotulo}</p>
        <p className="titulo mt-1 text-[52px] lg:text-[44px]">{grande}</p>
      </div>
      {lado && <p className="pb-2 text-right text-[17px] text-cinza-medio lg:text-[19px]">{lado}</p>}
    </div>
  );
}

function Etapas({ p }: { p: PedidoDetalhe }) {
  const atual = ETAPAS.indexOf(p.etapaAtual);
  const entregue = p.etapaAtual === "entregue";
  const quando = (i: number) => p.etapas.findLast((r) => r.etapa === ETAPAS[i])?.em;
  return (
    <section aria-labelledby="t-etapas">
      <h2 id="t-etapas" className="rotulo mb-4 text-[14px]">
        {entregue || p.status === "cancelado" ? "Etapas" : "Etapa atual"}
      </h2>
      <BarraEtapas etapa={p.etapaAtual} grossa />
      <ol className="mt-3 grid grid-cols-4 gap-2 text-[15px] lg:text-[17px]">
        {ETAPAS.map((e, i) => {
          const feita = i < atual || entregue;
          const ehAtual = i === atual && !entregue;
          // A etapa i termina quando a etapa i+1 começa.
          const fim = quando(i + 1);
          const inicio = quando(i);
          return (
            <li key={e} aria-current={ehAtual ? "step" : undefined}>
              <span className={cn(ehAtual ? "font-semibold text-white" : feita ? "text-cinza-medio" : "text-cinza")}>
                {NOME_ETAPA[e]}
                {feita && " ✓"}
              </span>
              <span className="mt-0.5 hidden text-sm text-cinza lg:block">
                {e === "entregue" && entregue && inicio
                  ? `em ${diaMes(inicio)}`
                  : feita && fim
                    ? `concluída em ${diaMes(fim)}`
                    : ehAtual && inicio
                      ? `desde ${diaMes(inicio)}`
                      : "pendente"}
              </span>
            </li>
          );
        })}
      </ol>
      {!entregue && p.status === "ativo" && (
        <p className="mt-3 text-cinza-medio lg:hidden">Desde {diaMes(p.etapaDesde)} nesta etapa</p>
      )}
    </section>
  );
}

function Grade({ p }: { p: PedidoDetalhe }) {
  const soma = TAMANHOS.reduce((g, t) => ({ ...g, [t]: p.itens.reduce((s, i) => s + (i.grade[t] ?? 0), 0) }), {} as Grade);
  const tamanhos = TAMANHOS.filter((t) => soma[t] > 0);
  return (
    <section aria-labelledby="t-grade">
      <h2 id="t-grade" className="rotulo mb-4 text-[14px]">
        <span className="lg:hidden">Grade</span>
        <span className="hidden lg:inline">Peças e grade</span>
      </h2>

      {/* Celular: totais por tamanho + lista por peça */}
      <div className="lg:hidden">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.max(tamanhos.length, 1)}, minmax(0, 1fr))` }}>
          {tamanhos.map((t) => (
            <div key={t} className="rounded-[4px] border border-white py-4 text-center">
              <p className="text-cinza-medio">{t}</p>
              <p className="titulo mt-1 text-[36px]">{soma[t]}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-cinza-medio">
          {listaNatural(p.itens.map((i) => i.pecaNome).filter((n, i, a) => a.indexOf(n) === i))} ·{" "}
          {plural(p.totalPecas, "peça", "peças")} no total
        </p>
        <ul className="mt-4 divide-y divide-fina border-y border-fina">
          {p.itens.map((i) => (
            <li key={i.id} className="flex items-baseline justify-between gap-4 py-3">
              <span>
                {i.pecaNome}
                <span className="block text-sm text-cinza">
                  {TAMANHOS.filter((t) => i.grade[t] > 0)
                    .map((t) => `${t} ${i.grade[t]}`)
                    .join(" · ")}
                </span>
              </span>
              <span className="titulo text-[24px]">{i.quantidade}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* PC: tabela */}
      <div className="hidden rounded-[4px] border border-divisoria bg-card p-7 lg:block">
        <table className="w-full text-[17px]">
          <thead>
            <tr className="border-b border-divisoria text-left text-cinza">
              <th className="pb-3 font-normal">Peça</th>
              {TAMANHOS.map((t) => (
                <th key={t} className="pb-3 text-center font-normal">
                  {t}
                </th>
              ))}
              <th className="pb-3 text-right font-normal">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fina">
            {p.itens.map((i) => (
              <tr key={i.id}>
                <td className="py-4">{i.pecaNome}</td>
                {TAMANHOS.map((t) => (
                  <td key={t} className={cn("titulo py-4 text-center text-[26px]", !i.grade[t] && "text-divisoria")}>
                    {i.grade[t] ?? 0}
                  </td>
                ))}
                <td className="titulo py-4 text-right text-[26px]">{totalGrade(i.grade)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DialogoPagamento({ p, aberto, aoMudar }: { p: PedidoDetalhe; aberto: boolean; aoMudar: (v: boolean) => void }) {
  const qc = useQueryClient();
  const saldo = p.valorTotalCentavos - p.pagoCentavos;
  const [valor, setValor] = useState(saldo);
  const [data, setData] = useState(hojeISO());
  const [erro, setErro] = useState<string>();

  const registrar = useMutation({
    mutationFn: () => api.post(`/pedidos/${p.id}/pagamentos`, pagamentoSchema.parse({ valorCentavos: valor, data })),
    onSuccess: () => {
      toast(`Pagamento de ${dinheiro(valor)} registrado`);
      qc.invalidateQueries();
      aoMudar(false);
    },
    onError: (e) => setErro(e instanceof Error ? e.message : "Confira o valor"),
  });

  return (
    <Dialogo
      aberto={aberto}
      aoMudar={(v) => {
        if (v) {
          setValor(saldo);
          setData(hojeISO());
          setErro(undefined);
        }
        aoMudar(v);
      }}
      titulo="Registrar pagamento"
      descricao={`Saldo a receber: ${dinheiro(saldo)}`}
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          setErro(undefined);
          if (valor <= 0) return setErro("Informe o valor");
          if (valor > saldo) return setErro("O valor é maior que o saldo a receber");
          registrar.mutate();
        }}
      >
        <Campo rotulo="Valor recebido" erro={erro}>
          {(id, desc) => <EntradaDinheiro id={id} aria-describedby={desc} valor={valor} aoMudar={setValor} />}
        </Campo>
        <Campo rotulo="Data">
          {(id) => <Entrada id={id} type="date" value={data} max={hojeISO()} onChange={(e) => setData(e.target.value)} />}
        </Campo>
        <Botao type="submit" tamanho="grande" disabled={registrar.isPending}>
          Registrar
        </Botao>
      </form>
    </Dialogo>
  );
}

export function PaginaPedido() {
  const id = Number(useParams().id);
  const consulta = usePedido(Number.isFinite(id) ? id : null);
  const navegar = useNavigate();
  const qc = useQueryClient();
  const [pagando, setPagando] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  const cancelar = useMutation({
    mutationFn: () => api.post(`/pedidos/${id}/cancelar`),
    onSuccess: () => {
      toast("Pedido cancelado. O registro continua no histórico.");
      qc.invalidateQueries();
      setCancelando(false);
    },
    onError: (e) => toast.error(e.message),
  });

  if (consulta.isPending) return <Carregando />;
  if (consulta.isError) return <ErroTela mensagem={consulta.error.message} aoTentar={() => consulta.refetch()} />;
  const p = consulta.data;
  const saldo = p.valorTotalCentavos - p.pagoCentavos;
  const ativo = p.status === "ativo";
  const emProducao = ativo && p.etapaAtual !== "entregue";

  const botaoPagamento = saldo > 0 && ativo && (
    <Botao variante="secundario" tamanho="grande" onClick={() => setPagando(true)}>
      Registrar pagamento
    </Botao>
  );

  return (
    <div>
      {/* Topo celular */}
      <div className="flex items-center justify-between lg:hidden">
        <button type="button" onClick={() => navegar(-1)} className="-ml-2 grid size-11 place-items-center" aria-label="Voltar">
          <ArrowLeft className="size-7" strokeWidth={1.5} />
        </button>
        <p className="tracking-[0.12em] text-cinza uppercase">Pedido {numeroPedido(p.id)}</p>
        <MenuPedido p={p} aoCancelar={() => setCancelando(true)} />
      </div>
      <nav aria-label="Trilha" className="hidden text-[17px] text-cinza-medio lg:block">
        <Link to="/pedidos" className="hover:text-white">
          Pedidos
        </Link>{" "}
        / Pedido {numeroPedido(p.id)}
      </nav>

      <div className="mt-6 flex items-end justify-between gap-6">
        <div className="min-w-0">
          <h1 className="titulo text-[60px] break-words lg:text-[88px]">{p.clienteNome}</h1>
          <p className="mt-3 text-[17px] text-cinza-medio lg:text-[19px]">
            {plural(p.totalPecas, "peça", "peças")} · sinal pago em {diaMes(p.dataSinal)}
            <span className="hidden lg:inline"> · entrega prevista {diaMes(p.entregaCalculada)}</span>
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-4 lg:flex">
          {botaoPagamento}
          <BotaoAvancar pedido={p} tamanho="grande" className="min-w-[260px]" />
          <MenuPedido p={p} aoCancelar={() => setCancelando(true)} />
        </div>
      </div>

      <div className="mt-8">
        <FaixaSituacao p={p} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_440px]">
        <div className="flex flex-col gap-10">
          <div className="lg:rounded-[4px] lg:border lg:border-divisoria lg:bg-card lg:p-7">
            <Etapas p={p} />
          </div>
          <Grade p={p} />
        </div>

        <div className="flex flex-col gap-10">
          <section aria-labelledby="t-pagamento" className="border-t border-fina pt-8 lg:rounded-[4px] lg:border lg:border-divisoria lg:bg-card lg:p-7">
            <h2 id="t-pagamento" className="rotulo mb-4 hidden text-[14px] lg:block">
              Pagamento
            </h2>
            <dl className="hidden flex-col gap-3 border-b border-divisoria pb-5 text-[17px] lg:flex">
              <div className="flex justify-between">
                <dt className="text-cinza-medio">Valor total</dt>
                <dd className="font-semibold">{dinheiro(p.valorTotalCentavos)}</dd>
              </div>
              {p.pagamentos.map((pg) => (
                <div key={pg.id} className="flex justify-between">
                  <dt className="text-cinza-medio">
                    {pg.tipo === "sinal" ? "Sinal" : "Pagamento"} em {diaMes(pg.data)}
                  </dt>
                  <dd className="font-semibold">{dinheiro(pg.valorCentavos)}</dd>
                </div>
              ))}
            </dl>
            <div className="flex items-end justify-between gap-4 lg:pt-5">
              <div>
                <p className="text-[19px] text-cinza-medio">{saldo > 0 ? "Saldo a receber" : "Pago"}</p>
                <p className="titulo mt-1 text-[44px] lg:hidden">{dinheiro(saldo > 0 ? saldo : p.valorTotalCentavos)}</p>
              </div>
              <p className="titulo hidden text-[52px] lg:block">{dinheiro(saldo > 0 ? saldo : p.valorTotalCentavos)}</p>
              <div className="lg:hidden">{botaoPagamento}</div>
            </div>
            <ul className="mt-5 flex flex-col gap-1 text-sm text-cinza lg:hidden">
              <li>Total {dinheiro(p.valorTotalCentavos)}</li>
              {p.pagamentos.map((pg) => (
                <li key={pg.id}>
                  {pg.tipo === "sinal" ? "Sinal" : "Pagamento"} de {dinheiro(pg.valorCentavos)} em {dataCompleta(pg.data)}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="t-cliente" className="rounded-[4px] border border-divisoria bg-card p-7">
            <h2 id="t-cliente" className="rotulo mb-4 text-[14px]">
              Cliente
            </h2>
            <p className="text-[21px] font-semibold">{p.cliente.nome}</p>
            <p className="mt-2 text-cinza-medio">
              {plural(p.cliente.totalPedidos, "pedido", "pedidos")}
              {p.cliente.telefone && ` · ${p.cliente.telefone}`}
            </p>
            <Botao variante="secundario" tamanho="grande" className="mt-5 w-full" asChild>
              <Link to={`/clientes/${p.clienteId}`}>Ver histórico do cliente</Link>
            </Botao>
          </section>
        </div>
      </div>

      {emProducao && (
        <AcaoRodape nota="Um toque. Desfazer disponível por 10 segundos.">
          <BotaoAvancar pedido={p} tamanho="grande" />
        </AcaoRodape>
      )}

      <DialogoPagamento p={p} aberto={pagando} aoMudar={setPagando} />
      <Dialogo
        aberto={cancelando}
        aoMudar={setCancelando}
        titulo="Cancelar pedido?"
        descricao={`O pedido ${numeroPedido(p.id)} de ${p.clienteNome} sai da produção. O registro continua na ficha do cliente.`}
      >
        <div className="flex flex-col gap-3">
          <Botao tamanho="grande" disabled={cancelar.isPending} onClick={() => cancelar.mutate()}>
            Sim, cancelar pedido
          </Botao>
          <Botao variante="secundario" tamanho="grande" onClick={() => setCancelando(false)}>
            Manter pedido
          </Botao>
        </div>
      </Dialogo>
    </div>
  );
}

function MenuPedido({ p, aoCancelar }: { p: PedidoDetalhe; aoCancelar: () => void }) {
  const navegar = useNavigate();
  return (
    <Menu
      gatilho={
        <button type="button" className="-mr-2 grid size-11 place-items-center rounded-[4px] hover:bg-white/10" aria-label="Mais ações do pedido">
          <MoreHorizontal className="size-7" />
        </button>
      }
    >
      <ItemMenu onSelect={() => navegar(`/pedidos/novo?repetir=${p.id}`)}>Repetir este pedido</ItemMenu>
      <ItemMenu onSelect={() => navegar(`/clientes/${p.clienteId}`)}>Abrir ficha do cliente</ItemMenu>
      {p.status === "ativo" && p.etapaAtual !== "entregue" && <ItemMenu onSelect={aoCancelar}>Cancelar pedido</ItemMenu>}
    </Menu>
  );
}
