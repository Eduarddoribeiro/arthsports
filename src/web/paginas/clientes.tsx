import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { NOME_TIPO_CLIENTE } from "@shared/dominio";
import { FormCliente } from "@/componentes/form-cliente";
import { Carregando, ErroTela } from "@/componentes/layout";
import { Botao } from "@/componentes/ui/botao";
import { Entrada } from "@/componentes/ui/campo";
import { Dialogo } from "@/componentes/ui/dialogo";
import { useClientes } from "@/lib/consultas";
import { cn } from "@/lib/utils";

export function PaginaClientes() {
  const [inativos, setInativos] = useState(false);
  const consulta = useClientes(inativos);
  const [busca, setBusca] = useState("");
  const [novo, setNovo] = useState(false);
  const navegar = useNavigate();

  const lista = (consulta.data ?? []).filter((c) => c.nome.toLowerCase().includes(busca.trim().toLowerCase()));

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <h1 className="titulo text-[52px] lg:text-[72px]">Clientes</h1>
        <Botao tamanho="grande" onClick={() => setNovo(true)}>
          + Novo cliente
        </Botao>
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
        <Entrada
          type="search"
          placeholder="Buscar pelo nome"
          aria-label="Buscar cliente"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="lg:max-w-[360px]"
        />
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-cinza-medio">
          <input type="checkbox" className="size-5 accent-white" checked={inativos} onChange={(e) => setInativos(e.target.checked)} />
          Mostrar inativos
        </label>
      </div>

      <div className="mt-8">
        {consulta.isPending ? (
          <Carregando />
        ) : consulta.isError ? (
          <ErroTela mensagem={consulta.error.message} aoTentar={() => consulta.refetch()} />
        ) : lista.length === 0 ? (
          <div className="rounded-[4px] border border-divisoria p-6">
            <p className="text-cinza-medio">
              {busca ? `Nenhum cliente com “${busca}”.` : "Nenhum cliente cadastrado. Cadastre o primeiro time, escola ou empresa."}
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {lista.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/clientes/${c.id}`}
                  className={cn(
                    "flex min-h-[76px] items-center justify-between gap-4 rounded-[4px] border bg-card px-5 py-4 hover:border-white",
                    c.ativo ? "border-divisoria" : "border-dashed border-divisoria opacity-70",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[19px] font-semibold">{c.nome}</span>
                    <span className="block text-cinza-medio">
                      {NOME_TIPO_CLIENTE[c.tipo]}
                      {c.responsavel && ` · ${c.responsavel}`}
                      {!c.ativo && " · inativo"}
                    </span>
                  </span>
                  <span aria-hidden className="text-2xl text-cinza">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialogo aberto={novo} aoMudar={setNovo} titulo="Novo cliente">
        <FormCliente
          nomeInicial={busca}
          aoSalvar={(c) => {
            setNovo(false);
            navegar(`/clientes/${c.id}`);
          }}
        />
      </Dialogo>
    </div>
  );
}
