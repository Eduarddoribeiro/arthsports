import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import type { PedidoResumo } from "@shared/api";
import { diasDeAtraso } from "@shared/dominio";
import { Carregando, ErroTela } from "@/componentes/layout";
import { CartaoPedido } from "@/componentes/pedido";
import { Botao } from "@/componentes/ui/botao";
import { Entrada } from "@/componentes/ui/campo";
import { usePedidos } from "@/lib/consultas";
import { cn } from "@/lib/utils";

const FILTROS: { id: string; nome: string; testa: (p: PedidoResumo, hoje: Date) => boolean }[] = [
  { id: "producao", nome: "Em produção", testa: (p) => p.status === "ativo" && p.etapaAtual !== "entregue" },
  { id: "atrasados", nome: "Atrasados", testa: (p, h) => diasDeAtraso(p, h) > 0 },
  { id: "arte", nome: "Arte", testa: (p) => p.status === "ativo" && p.etapaAtual === "arte" },
  { id: "costura", nome: "Costura", testa: (p) => p.status === "ativo" && p.etapaAtual === "costura" },
  { id: "acabamento", nome: "Acabamento", testa: (p) => p.status === "ativo" && p.etapaAtual === "acabamento" },
  { id: "entregues", nome: "Entregues", testa: (p) => p.status === "ativo" && p.etapaAtual === "entregue" },
  { id: "cancelados", nome: "Cancelados", testa: (p) => p.status === "cancelado" },
  { id: "todos", nome: "Todos", testa: () => true },
];

export function PaginaPedidos() {
  const consulta = usePedidos();
  const [params, setParams] = useSearchParams();
  const [busca, setBusca] = useState("");
  const filtro = FILTROS.find((f) => f.id === params.get("filtro")) ?? FILTROS[0];
  const hoje = new Date();

  const lista = (consulta.data ?? [])
    .filter((p) => filtro.testa(p, hoje))
    .filter((p) => {
      const termo = busca.trim().toLowerCase();
      return !termo || p.clienteNome.toLowerCase().includes(termo) || String(p.id).includes(termo);
    })
    .sort((a, b) =>
      filtro.id === "producao" || filtro.id === "atrasados" || ["arte", "costura", "acabamento"].includes(filtro.id)
        ? a.entregaCalculada.localeCompare(b.entregaCalculada)
        : b.id - a.id,
    );

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <h1 className="titulo text-[52px] lg:text-[72px]">Pedidos</h1>
        <Botao tamanho="grande" asChild className="hidden lg:inline-flex">
          <Link to="/pedidos/novo">+ Novo pedido</Link>
        </Botao>
      </div>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center">
        <Entrada
          type="search"
          placeholder="Buscar cliente ou número"
          aria-label="Buscar pedido por cliente ou número"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="lg:max-w-[360px]"
        />
        <div role="group" aria-label="Filtrar pedidos" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={f.id === filtro.id}
              onClick={() => setParams(f.id === "producao" ? {} : { filtro: f.id }, { replace: true })}
              className={cn(
                "min-h-11 shrink-0 rounded-[4px] border-[1.5px] px-4 text-[15px] font-semibold whitespace-nowrap",
                f.id === filtro.id ? "border-white bg-white text-black" : "border-divisoria text-cinza-medio hover:border-white hover:text-white",
              )}
            >
              {f.nome}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {consulta.isPending ? (
          <Carregando />
        ) : consulta.isError ? (
          <ErroTela mensagem={consulta.error.message} aoTentar={() => consulta.refetch()} />
        ) : lista.length === 0 ? (
          <p className="rounded-[4px] border border-divisoria p-6 text-cinza-medio">
            {busca ? `Nenhum pedido encontrado para “${busca}”.` : `Nenhum pedido em “${filtro.nome}”.`}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-cinza">{lista.length === 1 ? "1 pedido" : `${lista.length} pedidos`}</p>
            {lista.map((p) => (
              <CartaoPedido key={p.id} pedido={p} hoje={hoje} acaoNoCelular={false} mostrarNumero />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
