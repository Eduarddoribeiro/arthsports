import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { Peca } from "@shared/api";
import { pecaSchema, type PecaEntrada } from "@shared/esquemas";
import { Carregando, ErroTela } from "@/componentes/layout";
import { Botao } from "@/componentes/ui/botao";
import { Campo, Entrada } from "@/componentes/ui/campo";
import { Dialogo } from "@/componentes/ui/dialogo";
import { api } from "@/lib/api";
import { usePecas } from "@/lib/consultas";
import { cn } from "@/lib/utils";

function FormPeca({ peca, aoSalvar }: { peca?: Peca; aoSalvar: () => void }) {
  const qc = useQueryClient();
  const form = useForm<PecaEntrada>({
    resolver: zodResolver(pecaSchema),
    defaultValues: { nome: peca?.nome ?? "", prazoMinDias: peca?.prazoMinDias ?? 15, prazoMaxDias: peca?.prazoMaxDias ?? 30 },
  });
  const erros = form.formState.errors;
  const salvar = useMutation({
    mutationFn: (v: PecaEntrada) => (peca ? api.put(`/pecas/${peca.id}`, v) : api.post("/pecas", v)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pecas"] });
      toast(peca ? "Peça atualizada" : "Peça cadastrada");
      aoSalvar();
    },
    onError: (e) => form.setError("root", { message: e.message }),
  });
  const alternar = useMutation({
    mutationFn: () => api.post(`/pecas/${peca!.id}/ativa`, { ativa: !peca!.ativa }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pecas"] });
      aoSalvar();
    },
  });

  return (
    <form onSubmit={form.handleSubmit((v) => salvar.mutate(v))} className="flex flex-col gap-5" noValidate>
      <Campo rotulo="Nome da peça" erro={erros.nome?.message}>
        {(id, desc) => <Entrada id={id} autoFocus aria-describedby={desc} placeholder="Ex.: Jaqueta" {...form.register("nome")} />}
      </Campo>
      <div className="grid grid-cols-2 gap-4">
        <Campo rotulo="Prazo mínimo (dias)" erro={erros.prazoMinDias?.message}>
          {(id, desc) => (
            <Entrada id={id} type="number" inputMode="numeric" min={1} aria-describedby={desc} {...form.register("prazoMinDias", { valueAsNumber: true })} />
          )}
        </Campo>
        <Campo rotulo="Prazo máximo (dias)" erro={erros.prazoMaxDias?.message}>
          {(id, desc) => (
            <Entrada id={id} type="number" inputMode="numeric" min={1} aria-describedby={desc} {...form.register("prazoMaxDias", { valueAsNumber: true })} />
          )}
        </Campo>
      </div>
      <p className="text-sm text-cinza">A entrega dos pedidos usa o prazo máximo. Mudar aqui só vale para pedidos novos.</p>
      {erros.root && <p role="alert" className="font-semibold">⚠ {erros.root.message}</p>}
      <Botao type="submit" tamanho="grande" disabled={salvar.isPending}>
        {peca ? "Salvar" : "Cadastrar peça"}
      </Botao>
      {peca && (
        <button type="button" onClick={() => alternar.mutate()} className="min-h-11 text-cinza-medio underline underline-offset-4 hover:text-white">
          {peca.ativa ? "Inativar peça (some do novo pedido)" : "Reativar peça"}
        </button>
      )}
    </form>
  );
}

export function PaginaPecas() {
  const consulta = usePecas();
  const [editando, setEditando] = useState<Peca | "nova" | null>(null);

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <h1 className="titulo text-[44px] lg:text-[72px]">Peças e prazos</h1>
        <Botao tamanho="grande" onClick={() => setEditando("nova")}>
          + Nova peça
        </Botao>
      </div>
      <p className="mt-3 max-w-[60ch] text-cinza-medio">
        Prazo de produção contado a partir do sinal. Num pedido com várias peças, vale o maior prazo.
      </p>

      <div className="mt-8">
        {consulta.isPending ? (
          <Carregando />
        ) : consulta.isError ? (
          <ErroTela mensagem={consulta.error.message} aoTentar={() => consulta.refetch()} />
        ) : (
          <ul className="divide-y divide-fina rounded-[4px] border border-divisoria bg-card lg:max-w-[760px]">
            {consulta.data.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setEditando(p)}
                  className={cn("flex min-h-[76px] w-full items-center justify-between gap-4 px-6 text-left hover:bg-white/5", !p.ativa && "opacity-60")}
                >
                  <span>
                    <span className="block text-[19px] font-semibold">{p.nome}</span>
                    {!p.ativa && <span className="block text-cinza">inativa</span>}
                  </span>
                  <span className="titulo text-[28px]">
                    {p.prazoMinDias} a {p.prazoMaxDias} dias
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialogo aberto={editando !== null} aoMudar={(v) => !v && setEditando(null)} titulo={editando === "nova" ? "Nova peça" : "Editar peça"}>
        {editando !== null && (
          <FormPeca key={editando === "nova" ? "nova" : editando.id} peca={editando === "nova" ? undefined : editando} aoSalvar={() => setEditando(null)} />
        )}
      </Dialogo>
    </div>
  );
}
