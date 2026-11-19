import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { Cliente } from "@shared/api";
import { NOME_TIPO_CLIENTE, TIPOS_CLIENTE } from "@shared/dominio";
import { clienteSchema, type ClienteEntrada } from "@shared/esquemas";
import { api } from "@/lib/api";
import { Botao } from "./ui/botao";
import { Campo, Entrada } from "./ui/campo";
import { cn } from "@/lib/utils";

export function FormCliente({
  cliente,
  nomeInicial = "",
  aoSalvar,
}: {
  cliente?: Cliente;
  nomeInicial?: string;
  aoSalvar: (c: Cliente) => void;
}) {
  const qc = useQueryClient();
  const form = useForm<ClienteEntrada>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: cliente?.nome ?? nomeInicial,
      tipo: cliente?.tipo ?? "time",
      responsavel: cliente?.responsavel ?? "",
      telefone: cliente?.telefone ?? "",
    },
  });
  const erros = form.formState.errors;
  const tipo = form.watch("tipo");

  const salvar = useMutation({
    mutationFn: (v: ClienteEntrada) =>
      cliente ? api.put<Cliente>(`/clientes/${cliente.id}`, v) : api.post<Cliente>("/clientes", v),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
      qc.invalidateQueries({ queryKey: ["pedidos"] });
      aoSalvar(c);
    },
    onError: (e) => form.setError("root", { message: e.message }),
  });

  return (
    <form onSubmit={form.handleSubmit((v) => salvar.mutate(v))} className="flex flex-col gap-5" noValidate>
      <Campo rotulo="Nome" erro={erros.nome?.message}>
        {(id, desc) => (
          <Entrada id={id} autoFocus aria-describedby={desc} aria-invalid={!!erros.nome} placeholder="Ex.: Time Azul" {...form.register("nome")} />
        )}
      </Campo>

      <fieldset className="flex flex-col gap-2">
        <legend className="rotulo mb-2">Tipo</legend>
        <div className="grid grid-cols-3 gap-2">
          {TIPOS_CLIENTE.map((t) => (
            <label
              key={t}
              className={cn(
                "flex min-h-12 cursor-pointer items-center justify-center rounded-[4px] border-[1.5px] font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-white",
                tipo === t ? "border-white bg-white text-black" : "border-divisoria text-cinza-medio",
              )}
            >
              <input type="radio" value={t} className="sr-only" {...form.register("tipo")} />
              {NOME_TIPO_CLIENTE[t]}
            </label>
          ))}
        </div>
      </fieldset>

      <Campo rotulo="Responsável" erro={erros.responsavel?.message}>
        {(id, desc) => <Entrada id={id} aria-describedby={desc} placeholder="Quem fala pelo cliente" {...form.register("responsavel")} />}
      </Campo>

      <Campo rotulo="Telefone / WhatsApp" erro={erros.telefone?.message}>
        {(id, desc) => (
          <Entrada id={id} type="tel" inputMode="tel" autoComplete="off" aria-describedby={desc} placeholder="(51) 99999-0000" {...form.register("telefone")} />
        )}
      </Campo>

      {erros.root && <p role="alert" className="font-semibold">⚠ {erros.root.message}</p>}

      <Botao type="submit" tamanho="grande" disabled={salvar.isPending}>
        {cliente ? "Salvar alterações" : "Cadastrar cliente"}
      </Botao>
    </form>
  );
}
