import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useFieldArray, useForm, type UseFormReturn } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import type { Cliente, PedidoDetalhe } from "@shared/api";
import { calcularEntrega, gradeVazia, hojeISO, resumoGrade, TAMANHOS, totalGrade } from "@shared/dominio";
import { pedidoSchema, type PedidoEntrada } from "@shared/esquemas";
import { FormCliente } from "@/componentes/form-cliente";
import { AcaoRodape } from "@/componentes/layout";
import { Botao } from "@/componentes/ui/botao";
import { Campo, Entrada, EntradaDinheiro } from "@/componentes/ui/campo";
import { Dialogo } from "@/componentes/ui/dialogo";
import { api } from "@/lib/api";
import { useCliente, useClientes, usePecas } from "@/lib/consultas";
import { diaMes, dinheiro, numeroPedido, plural } from "@/lib/formato";
import { cn } from "@/lib/utils";

type Form = UseFormReturn<PedidoEntrada>;

const vazio = (clienteId = 0): PedidoEntrada => ({
  clienteId,
  itens: [],
  valorTotalCentavos: 0,
  sinalCentavos: 0,
  dataSinal: hojeISO(),
});

/** Copia um pedido anterior: mesmas peças, grade e valores; sinal com a data de hoje. */
const copiaDe = (p: PedidoDetalhe): PedidoEntrada => ({
  clienteId: p.clienteId,
  itens: p.itens.map((i) => ({ pecaId: i.pecaId, grade: { ...gradeVazia(), ...i.grade } })),
  valorTotalCentavos: p.valorTotalCentavos,
  sinalCentavos: p.sinalCentavos,
  dataSinal: hojeISO(),
});

function Passo({ value, onChange, rotulo }: { value: number; onChange: (n: number) => void; rotulo: string }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={`Diminuir ${rotulo}`}
        disabled={value <= 0}
        onClick={() => onChange(Math.max(0, value - 1))}
        className="grid size-11 place-items-center rounded-[4px] border-[1.5px] border-white disabled:border-divisoria disabled:text-divisoria"
      >
        <Minus className="size-5" />
      </button>
      <input
        aria-label={rotulo}
        inputMode="numeric"
        value={value}
        onFocus={(e) => e.target.select()}
        onChange={(e) => onChange(Math.min(9999, Number(e.target.value.replace(/\D/g, "") || 0)))}
        className="titulo h-11 w-14 bg-transparent text-center text-[30px]"
      />
      <button
        type="button"
        aria-label={`Aumentar ${rotulo}`}
        onClick={() => onChange(value + 1)}
        className="grid size-11 place-items-center rounded-[4px] border-[1.5px] border-white"
      >
        <Plus className="size-5" />
      </button>
    </div>
  );
}

function Pecas({ form, aberto, setAberto }: { form: Form; aberto: number | null; setAberto: (i: number | null) => void }) {
  const pecas = usePecas();
  const itens = useFieldArray({ control: form.control, name: "itens" });
  const valores = form.watch("itens");
  const [escolhendo, setEscolhendo] = useState(false);
  const nomeDe = (id: number) => pecas.data?.find((p) => p.id === id)?.nome ?? "Peça";
  const erro = form.formState.errors.itens;

  return (
    <section aria-labelledby="t-pecas">
      <h2 id="t-pecas" className="secao marcador mb-3">
        Peças
      </h2>
      {itens.fields.length > 0 && (
        <ul className="divide-y divide-divisoria rounded-[4px] border border-white bg-card">
          {itens.fields.map((f, i) => {
            const grade = valores[i]?.grade ?? gradeVazia();
            const total = totalGrade(grade);
            const expandido = aberto === i;
            return (
              <li key={f.id} className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    aria-expanded={expandido}
                    onClick={() => setAberto(expandido ? null : i)}
                  >
                    <span className="block text-[19px] font-semibold">{nomeDe(valores[i]?.pecaId)}</span>
                    <span className={cn("block text-[15px]", total ? "text-cinza-medio" : "font-semibold text-white")}>
                      {total ? resumoGrade(grade) : "Toque para preencher a grade"}
                    </span>
                  </button>
                  <span className="titulo text-[36px]">{total}</span>
                </div>
                {expandido && (
                  <div className="mt-5 border-t border-divisoria pt-5">
                    <ul className="flex flex-col gap-3">
                      {TAMANHOS.map((t) => (
                        <li key={t} className="flex items-center justify-between">
                          <span className="w-12 text-[17px] font-semibold">{t}</span>
                          <Controller
                            control={form.control}
                            name={`itens.${i}.grade.${t}`}
                            render={({ field }) => (
                              <Passo value={field.value} onChange={field.onChange} rotulo={`${nomeDe(valores[i]?.pecaId)} tamanho ${t}`} />
                            )}
                          />
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5 flex justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          itens.remove(i);
                          setAberto(null);
                        }}
                        className="min-h-11 text-cinza-medio underline underline-offset-4 hover:text-white"
                      >
                        Remover peça
                      </button>
                      <Botao variante="secundario" onClick={() => setAberto(null)}>
                        Pronto
                      </Botao>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <button
        type="button"
        onClick={() => setEscolhendo(true)}
        className="mt-3 min-h-11 text-[17px] font-semibold hover:underline"
      >
        + {itens.fields.length ? "Adicionar outra peça" : "Adicionar peça"}
      </button>
      {erro && (
        <p role="alert" className="mt-2 font-semibold">
          ⚠ {erro.message ?? erro.root?.message}
        </p>
      )}

      <Dialogo aberto={escolhendo} aoMudar={setEscolhendo} titulo="Adicionar peça">
        <ul className="flex flex-col gap-2">
          {(pecas.data ?? [])
            .filter((p) => p.ativa)
            .map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    itens.append({ pecaId: p.id, grade: gradeVazia() });
                    setAberto(itens.fields.length);
                    setEscolhendo(false);
                  }}
                  className="flex min-h-14 w-full items-center justify-between rounded-[4px] border border-divisoria px-5 text-left hover:border-white"
                >
                  <span className="text-[17px] font-semibold">{p.nome}</span>
                  <span className="text-cinza-medio">
                    {p.prazoMinDias} a {p.prazoMaxDias} dias
                  </span>
                </button>
              </li>
            ))}
        </ul>
        <Link to="/pecas" className="mt-5 inline-flex min-h-11 items-center text-cinza-medio underline underline-offset-4">
          Cadastrar outro tipo de peça
        </Link>
      </Dialogo>
    </section>
  );
}

function EscolherCliente({ aoEscolher, aberto, aoMudar }: { aoEscolher: (c: Cliente) => void; aberto: boolean; aoMudar: (v: boolean) => void }) {
  const clientes = useClientes();
  const [busca, setBusca] = useState("");
  const [novo, setNovo] = useState(false);
  const lista = (clientes.data ?? []).filter((c) => c.nome.toLowerCase().includes(busca.trim().toLowerCase()));

  return (
    <Dialogo
      aberto={aberto}
      aoMudar={(v) => {
        aoMudar(v);
        if (!v) setNovo(false);
      }}
      titulo={novo ? "Novo cliente" : "Escolher cliente"}
    >
      {novo ? (
        <FormCliente nomeInicial={busca} aoSalvar={(c) => (aoEscolher(c), setNovo(false))} />
      ) : (
        <div className="flex flex-col gap-4">
          <Entrada type="search" autoFocus placeholder="Buscar pelo nome" aria-label="Buscar cliente" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <ul className="flex max-h-[45dvh] flex-col gap-2 overflow-y-auto">
            {lista.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => aoEscolher(c)}
                  className="flex min-h-14 w-full items-center rounded-[4px] border border-divisoria px-5 text-left text-[17px] font-semibold hover:border-white"
                >
                  {c.nome}
                </button>
              </li>
            ))}
            {clientes.isSuccess && lista.length === 0 && (
              <li className="p-2 text-cinza-medio">{busca ? `Nenhum cliente com “${busca}”.` : "Nenhum cliente cadastrado ainda."}</li>
            )}
          </ul>
          <Botao variante="secundario" tamanho="grande" onClick={() => setNovo(true)}>
            + Cadastrar novo cliente
          </Botao>
        </div>
      )}
    </Dialogo>
  );
}

export function PaginaNovoPedido() {
  const [params] = useSearchParams();
  const navegar = useNavigate();
  const qc = useQueryClient();
  const repetirId = Number(params.get("repetir")) || null;
  const clienteParam = Number(params.get("cliente")) || 0;

  const form = useForm<PedidoEntrada>({ resolver: zodResolver(pedidoSchema), defaultValues: vazio(clienteParam) });
  const [aberto, setAberto] = useState<number | null>(null);
  const [escolhendoCliente, setEscolhendoCliente] = useState(false);
  const [repetindo, setRepetindo] = useState<number | null>(null);
  const carregouRepeticao = useRef(false);

  const pecas = usePecas();
  const clienteId = form.watch("clienteId");
  const cliente = useCliente(clienteId || null);
  const v = form.watch();

  const aplicarRepeticao = async (id: number) => {
    const p = await qc.fetchQuery({ queryKey: ["pedidos", id], queryFn: () => api.get<PedidoDetalhe>(`/pedidos/${id}`) });
    form.reset(copiaDe(p));
    setRepetindo(p.id);
    setAberto(null);
  };

  useEffect(() => {
    if (repetirId && !carregouRepeticao.current) {
      carregouRepeticao.current = true;
      aplicarRepeticao(repetirId).catch(() => toast.error("Não foi possível copiar o pedido"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repetirId]);

  const ultimo = cliente.data?.pedidos.find((p) => p.status === "ativo") ?? cliente.data?.pedidos[0];

  // Entrega calculada (RN-03): maior prazo entre as peças escolhidas.
  const escolhidas = v.itens.map((i) => pecas.data?.find((p) => p.id === i.pecaId)).filter((p) => !!p);
  const maior = escolhidas.reduce<(typeof escolhidas)[number] | null>((m, p) => (!m || p.prazoMaxDias > m.prazoMaxDias ? p : m), null);
  const entrega = maior && /^\d{4}-\d{2}-\d{2}$/.test(v.dataSinal) ? calcularEntrega(v.dataSinal, [maior.prazoMaxDias]) : null;
  const totalPecas = v.itens.reduce((s, i) => s + totalGrade(i.grade), 0);
  const saldo = Math.max(0, v.valorTotalCentavos - v.sinalCentavos);

  const criar = useMutation({
    mutationFn: (dados: PedidoEntrada) => api.post<PedidoDetalhe>("/pedidos", dados),
    onSuccess: (p) => {
      qc.invalidateQueries();
      toast(`Pedido ${numeroPedido(p.id)} criado · entrega ${diaMes(p.entregaCalculada)}`);
      navegar(`/pedidos/${p.id}`, { replace: true });
    },
    onError: (e) => toast.error(e.message),
  });

  const enviar = form.handleSubmit(
    (dados) => criar.mutate(dados),
    () => toast.error("Confira os campos marcados"),
  );
  const erros = form.formState.errors;

  const caixaEntrega = (
    <div className="flex items-center justify-between gap-4 rounded-[4px] border-2 border-dashed border-white px-7 py-6">
      <div>
        <p className="text-[17px] text-cinza-medio">Entrega calculada</p>
        <p className="text-[15px] text-cinza">
          {maior
            ? `${maior.nome}: ${maior.prazoMaxDias} dias${new Set(escolhidas.map((p) => p.id)).size > 1 ? ", o maior prazo" : ""}`
            : "escolha as peças"}
        </p>
      </div>
      <p className="titulo text-[52px]" aria-live="polite">
        {entrega ? diaMes(entrega) : "—"}
      </p>
    </div>
  );

  return (
    <form onSubmit={enviar} noValidate>
      <div className="flex items-center justify-between gap-4">
        <button type="button" onClick={() => navegar(-1)} className="-ml-2 grid size-11 place-items-center lg:hidden" aria-label="Cancelar e voltar">
          <X className="size-8" strokeWidth={1.5} />
        </button>
        <h1 className="titulo text-[44px] lg:text-[88px]">Novo pedido</h1>
        <span className="size-11 lg:hidden" />
        <Botao variante="secundario" tamanho="grande" className="hidden lg:inline-flex" onClick={() => navegar(-1)}>
          Cancelar
        </Botao>
      </div>

      {ultimo && repetindo !== ultimo.id && (
        <div className="mt-6 flex items-center justify-between gap-4 rounded-[4px] bg-white px-5 py-5 text-black lg:px-7">
          <div className="min-w-0">
            <p className="text-[15px] text-[#444]">Renovação? Repita o último</p>
            <p className="truncate text-[19px] font-semibold">
              {ultimo.clienteNome}
              <span className="hidden lg:inline"> · pedido {numeroPedido(ultimo.id)}</span> · {plural(ultimo.totalPecas, "peça", "peças")}
            </p>
          </div>
          <Botao variante="escuro" tamanho="grande" onClick={() => aplicarRepeticao(ultimo.id)}>
            Repetir
          </Botao>
        </div>
      )}
      {repetindo && (
        <p className="mt-6 rounded-[4px] border border-divisoria px-5 py-4 text-cinza-medio" role="status">
          Copiado do pedido {numeroPedido(repetindo)}. Confira e toque em Criar pedido.
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_440px] lg:gap-10">
        <div className="flex flex-col gap-8 lg:gap-10">
          <section aria-labelledby="t-cliente" className="flex flex-col gap-6 lg:rounded-[4px] lg:border lg:border-divisoria lg:bg-card lg:p-7">
            <div>
              <h2 id="t-cliente" className="secao marcador mb-3">
                Cliente
              </h2>
              <button
                type="button"
                onClick={() => setEscolhendoCliente(true)}
                aria-invalid={!!erros.clienteId}
                className="flex min-h-[60px] w-full items-center justify-between gap-4 rounded-[8px] border border-white bg-card px-5 text-left aria-invalid:border-2"
              >
                <span className={cn("text-[19px] font-semibold", !cliente.data && "text-cinza-medio")}>
                  {cliente.data?.nome ?? "Escolher cliente"}
                </span>
                <span className="text-cinza">{cliente.data ? "trocar" : "buscar ou cadastrar"}</span>
              </button>
              {erros.clienteId && <p role="alert" className="mt-2 font-semibold">⚠ Escolha o cliente</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Controller
                control={form.control}
                name="sinalCentavos"
                render={({ field }) => (
                  <Campo rotulo="Sinal" erro={erros.sinalCentavos?.message}>
                    {(id, desc) => <EntradaDinheiro id={id} aria-describedby={desc} valor={field.value} aoMudar={field.onChange} />}
                  </Campo>
                )}
              />
              <Controller
                control={form.control}
                name="valorTotalCentavos"
                render={({ field }) => (
                  <Campo rotulo="Total" erro={erros.valorTotalCentavos?.message}>
                    {(id, desc) => <EntradaDinheiro id={id} aria-describedby={desc} valor={field.value} aoMudar={field.onChange} />}
                  </Campo>
                )}
              />
            </div>
            <Campo rotulo="Data do sinal" erro={erros.dataSinal?.message} ajuda="O prazo de produção conta a partir daqui.">
              {(id, desc) => <Entrada id={id} type="date" aria-describedby={desc} max={hojeISO()} {...form.register("dataSinal")} />}
            </Campo>
          </section>

          <div className="lg:rounded-[4px] lg:border lg:border-divisoria lg:bg-card lg:p-7">
            <Pecas form={form} aberto={aberto} setAberto={setAberto} />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <section aria-labelledby="t-resumo" className="hidden rounded-[4px] border border-divisoria bg-card p-7 lg:block">
            <h2 id="t-resumo" className="secao marcador mb-4">
              Resumo
            </h2>
            <dl className="flex flex-col gap-3 border-b border-divisoria pb-5 text-[17px]">
              <div className="flex justify-between">
                <dt className="text-cinza-medio">Total de peças</dt>
                <dd className="font-semibold">{totalPecas}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-cinza-medio">Valor total</dt>
                <dd className="font-semibold">{dinheiro(v.valorTotalCentavos)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-cinza-medio">Sinal</dt>
                <dd className="font-semibold">{dinheiro(v.sinalCentavos)}</dd>
              </div>
            </dl>
            <div className="flex items-end justify-between pt-5">
              <p className="text-[17px] text-cinza-medio">Saldo</p>
              <p className="titulo text-[52px]">{dinheiro(saldo)}</p>
            </div>
          </section>
          {caixaEntrega}
          <div className="hidden lg:block">
            <Botao type="submit" tamanho="grande" className="w-full" disabled={criar.isPending}>
              Criar pedido
            </Botao>
            <p className="mt-4 text-center text-sm text-cinza">Com “Repetir”: 2 cliques e pronto.</p>
          </div>
        </div>
      </div>

      <AcaoRodape nota={totalPecas ? `${plural(totalPecas, "peça", "peças")} · saldo ${dinheiro(saldo)}` : "Com o repetir: 2 toques e pronto."}>
        <Botao type="submit" tamanho="grande" disabled={criar.isPending}>
          Criar pedido
        </Botao>
      </AcaoRodape>

      <EscolherCliente
        aberto={escolhendoCliente}
        aoMudar={setEscolhendoCliente}
        aoEscolher={(c) => {
          form.setValue("clienteId", c.id, { shouldValidate: form.formState.isSubmitted });
          setRepetindo(null);
          setEscolhendoCliente(false);
        }}
      />
    </form>
  );
}
