import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Cliente, ClienteDetalhe, Peca, PedidoDetalhe, PedidoResumo } from "@shared/api";
import { NOME_ETAPA, proximaEtapa, SITUACAO_ETAPA, type Etapa } from "@shared/dominio";
import { api } from "./api";

export const useSessao = () =>
  useQuery({ queryKey: ["sessao"], queryFn: () => api.get<{ nome: string }>("/auth/sessao"), retry: false });

export const usePedidos = () => useQuery({ queryKey: ["pedidos"], queryFn: () => api.get<PedidoResumo[]>("/pedidos") });

export const usePedido = (id: number | null) =>
  useQuery({
    queryKey: ["pedidos", id],
    queryFn: () => api.get<PedidoDetalhe>(`/pedidos/${id}`),
    enabled: !!id,
  });

export const useClientes = (inativos = false) =>
  useQuery({
    queryKey: ["clientes", { inativos }],
    queryFn: () => api.get<Cliente[]>(`/clientes${inativos ? "?inativos=true" : ""}`),
  });

export const useCliente = (id: number | null) =>
  useQuery({
    queryKey: ["clientes", id],
    queryFn: () => api.get<ClienteDetalhe>(`/clientes/${id}`),
    enabled: !!id,
  });

export const usePecas = () => useQuery({ queryKey: ["pecas"], queryFn: () => api.get<Peca[]>("/pecas") });

/** Texto do botão de avanço para a próxima etapa. */
export function textoAvancar(atual: Etapa) {
  const prox = proximaEtapa(atual);
  if (!prox) return null;
  return prox === "entregue" ? "Marcar como entregue" : `Avançar para ${NOME_ETAPA[prox].toLowerCase()} →`;
}

/** Avançar etapa em 1 toque, com "Desfazer" por 10 segundos. */
export function useAvancarEtapa() {
  const qc = useQueryClient();
  const atualizar = () => qc.invalidateQueries();

  const desfazer = useMutation({
    mutationFn: (v: { id: number; de: Etapa }) => api.post(`/pedidos/${v.id}/desfazer`, { de: v.de }),
    onSuccess: () => toast("Avanço desfeito"),
    onError: (e) => toast.error(e.message),
    onSettled: atualizar,
  });

  return useMutation({
    mutationFn: (v: { id: number; de: Etapa; clienteNome: string }) =>
      api.post<{ etapaAtual: Etapa }>(`/pedidos/${v.id}/avancar`, { de: v.de }),
    onSuccess: ({ etapaAtual }, v) => {
      toast(`${v.clienteNome}: ${SITUACAO_ETAPA[etapaAtual]}`, {
        duration: 10_000,
        action: { label: "Desfazer", onClick: () => desfazer.mutate({ id: v.id, de: etapaAtual }) },
      });
    },
    onError: (e) => toast.error(e.message),
    onSettled: atualizar,
  });
}
