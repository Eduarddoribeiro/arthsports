import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { loginSchema } from "@shared/esquemas";
import { Botao } from "@/componentes/ui/botao";
import { Campo, Entrada } from "@/componentes/ui/campo";
import { api } from "@/lib/api";

export function PaginaLogin() {
  const qc = useQueryClient();
  const form = useForm({ resolver: zodResolver(loginSchema), defaultValues: { senha: "" } });
  const entrar = useMutation({
    mutationFn: (v: { senha: string }) => api.post("/auth/login", v),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessao"] }),
    onError: (e) => form.setError("senha", { message: e.message }),
  });

  return (
    <main className="mx-auto flex min-h-dvh max-w-[420px] flex-col justify-center px-5 py-10">
      <img src="/logo.png" alt="ARTH Sports" className="mb-10 w-[150px]" />
      <h1 className="titulo text-[52px]">Entrar</h1>
      <p className="mt-2 mb-8 text-cinza-medio">Pedidos de fardamento</p>
      <form onSubmit={form.handleSubmit((v) => entrar.mutate(v))} className="flex flex-col gap-6" noValidate>
        <Campo rotulo="Senha" erro={form.formState.errors.senha?.message}>
          {(id, desc) => (
            <Entrada
              id={id}
              type="password"
              autoComplete="current-password"
              autoFocus
              aria-describedby={desc}
              aria-invalid={!!form.formState.errors.senha}
              {...form.register("senha")}
            />
          )}
        </Campo>
        <Botao type="submit" tamanho="grande" disabled={entrar.isPending}>
          {entrar.isPending ? "Entrando…" : "Entrar"}
        </Botao>
      </form>
    </main>
  );
}
