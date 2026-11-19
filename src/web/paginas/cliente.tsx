import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseISO } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { NOME_TIPO_CLIENTE } from "@shared/dominio";
import { FormCliente } from "@/componentes/form-cliente";
import { AcaoRodape, Carregando, ErroTela } from "@/componentes/layout";
import { situacao } from "@/componentes/pedido";
import { Botao } from "@/componentes/ui/botao";
import { Dialogo } from "@/componentes/ui/dialogo";
import { api } from "@/lib/api";
import { useCliente } from "@/lib/consultas";
import { dinheiroCompacto, listaNatural, mesAno, numeroPedido, plural } from "@/lib/formato";
import { cn } from "@/lib/utils";

export function PaginaCliente() {
  const id = Number(useParams().id);
  const consulta = useCliente(Number.isFinite(id) ? id : null);
  const navegar = useNavigate();
  const qc = useQueryClient();
  const [editando, setEditando] = useState(false);

  const alternarAtivo = useMutation({
    mutationFn: (ativo: boolean) => api.post(`/clientes/${id}/ativo`, { ativo }),
    onSuccess: (_, ativo) => {
      toast(ativo ? "Cliente reativado" : "Cliente inativado. O histórico continua salvo.");
      qc.invalidateQueries({ queryKey: ["clientes"] });
      setEditando(false);
    },
    onError: (e) => toast.error(e.message),
  });

  if (consulta.isPending) return <Carregando />;
  if (consulta.isError) return <ErroTela mensagem={consulta.error.message} aoTentar={() => consulta.refetch()} />;
  const c = consulta.data;
  const hoje = new Date();
  const validos = c.pedidos.filter((p) => p.status === "ativo");
  const ultimo = validos[0];
  const pecasFeitas = validos.reduce((s, p) => s + p.totalPecas, 0);
  const total = validos.reduce((s, p) => s + p.valorTotalCentavos, 0);
  const desde = Math.min(parseISO(c.criadoEm).getFullYear(), ...c.pedidos.map((p) => parseISO(p.dataSinal).getFullYear()));
  const telefone = c.telefone.replace(/[^\d+]/g, "");

  return (
    <div>
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => navegar(-1)} className="-ml-2 grid size-11 place-items-center" aria-label="Voltar">
          <ArrowLeft className="size-7" strokeWidth={1.5} />
        </button>
        <p className="tracking-[0.12em] text-cinza uppercase lg:hidden">Cliente</p>
        <button type="button" onClick={() => setEditando(true)} className="-mr-2 min-h-11 px-2 text-[17px] font-semibold hover:underline">
          Editar
        </button>
      </div>

      <div className="mt-4 flex items-end justify-between gap-6">
        <div className="min-w-0">
          <h1 className="titulo text-[60px] break-words lg:text-[88px]">{c.nome}</h1>
          <p className="mt-3 text-[17px] text-cinza-medio lg:text-[19px]">
            {NOME_TIPO_CLIENTE[c.tipo]}
            {c.responsavel && ` · ${c.responsavel}`} · desde {desde}
            {!c.ativo && " · inativo"}
          </p>
        </div>
        <div className="hidden shrink-0 gap-4 lg:flex">
          {telefone && (
            <Botao variante="secundario" tamanho="grande" asChild>
              <a href={`tel:${telefone}`}>Ligar · {c.telefone}</a>
            </Botao>
          )}
          {c.ativo && (
            <Botao tamanho="grande" asChild>
              <Link to={`/pedidos/novo?cliente=${c.id}`}>Novo pedido</Link>
            </Botao>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 divide-x divide-white rounded-[4px] border border-white text-center lg:max-w-[720px]">
        {[
          [String(validos.length), validos.length === 1 ? "pedido" : "pedidos"],
          [String(pecasFeitas), "peças feitas"],
          [dinheiroCompacto(total), "total"],
        ].map(([n, r]) => (
          <div key={r} className="px-2 py-5">
            <p className="titulo text-[36px] lg:text-[44px]">{n}</p>
            <p className="mt-1 text-cinza-medio">{r}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[440px_1fr]">
        {ultimo && c.ativo && (
          <section aria-labelledby="t-ultimo" className="self-start rounded-[4px] bg-white p-7 text-black">
            <h2 id="t-ultimo" className="text-[14px] font-semibold tracking-[0.14em] text-[#444] uppercase">
              Último pedido · {mesAno(ultimo.dataSinal)}
            </h2>
            <p className="titulo mt-2 text-[40px]">{plural(ultimo.totalPecas, "peça", "peças")}</p>
            <p className="mt-2 text-[17px] text-[#333]">{listaNatural(ultimo.pecasNomes)}</p>
            <Botao variante="escuro" tamanho="grande" className="mt-6 w-full" asChild>
              <Link to={`/pedidos/novo?repetir=${ultimo.id}`}>Repetir este pedido</Link>
            </Botao>
          </section>
        )}

        <section aria-labelledby="t-historico">
          <h2 id="t-historico" className="rotulo mb-5 text-[14px]">
            Histórico
          </h2>
          {c.pedidos.length === 0 ? (
            <p className="text-cinza-medio">Nenhum pedido ainda.</p>
          ) : (
            <ol className="relative ml-[10px] border-l border-white">
              {c.pedidos.map((p) => {
                const s = situacao(p, hoje);
                const emProducao = s.tipo === "atrasado" || s.tipo === "prazo";
                const status = s.tipo === "cancelado" ? "cancelado" : s.tipo === "entregue" ? "entregue" : "em produção";
                const noPrazo = p.entregueEm ? p.entregueEm.slice(0, 10) <= p.entregaCalculada : null;
                return (
                  <li key={p.id} className="relative pb-7 pl-8 last:pb-0">
                    <span
                      aria-hidden
                      className={cn(
                        "absolute top-1.5 -left-[11px] size-5 rounded-full",
                        emProducao ? "bg-atraso" : s.tipo === "entregue" ? "bg-white" : "bg-divisoria",
                      )}
                    />
                    <Link to={`/pedidos/${p.id}`} className="group block">
                      <p className="text-cinza">
                        {mesAno(p.dataSinal)} · {status}
                      </p>
                      <p className="mt-1 text-[19px] font-semibold group-hover:underline">
                        Pedido {numeroPedido(p.id)} · {plural(p.totalPecas, "peça", "peças")}
                      </p>
                      {s.tipo === "atrasado" && <p className="mt-1 font-semibold text-atraso">Atrasado {plural(s.atraso, "dia", "dias")}</p>}
                      {s.tipo === "entregue" && noPrazo !== null && (
                        <p className="mt-1 font-semibold text-ok">{noPrazo ? "No prazo" : "Entregue com atraso"}</p>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>

      <AcaoRodape>
        {telefone ? (
          <Botao variante="secundario" tamanho="grande" asChild>
            <a href={`tel:${telefone}`}>Ligar</a>
          </Botao>
        ) : null}
        {c.ativo && (
          <Botao tamanho="grande" asChild>
            <Link to={`/pedidos/novo?cliente=${c.id}`}>Novo pedido</Link>
          </Botao>
        )}
      </AcaoRodape>

      <Dialogo aberto={editando} aoMudar={setEditando} titulo="Editar cliente">
        <FormCliente
          cliente={c}
          aoSalvar={() => {
            toast("Cliente atualizado");
            setEditando(false);
          }}
        />
        <button
          type="button"
          disabled={alternarAtivo.isPending}
          onClick={() => alternarAtivo.mutate(!c.ativo)}
          className="mt-4 min-h-11 w-full text-cinza-medio underline underline-offset-4 hover:text-white"
        >
          {c.ativo ? "Inativar cliente (o histórico é mantido)" : "Reativar cliente"}
        </button>
      </Dialogo>
    </div>
  );
}
