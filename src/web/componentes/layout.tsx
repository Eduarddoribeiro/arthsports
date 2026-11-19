import { useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ItemMenu, Menu } from "./ui/menu";

const SECAO: [RegExp, string][] = [
  [/^\/$/, "Visão geral"],
  [/^\/pedidos\/novo/, "Novo pedido"],
  [/^\/pedidos/, "Pedidos"],
  [/^\/clientes/, "Clientes"],
  [/^\/pecas/, "Peças e prazos"],
];

/** Telas de lista mostram a barra inferior; telas de detalhe/formulário usam a ação no rodapé. */
const COM_NAV_INFERIOR = /^\/($|pedidos\/?$|clientes\/?$|pecas\/?$)/;

function useSair() {
  const qc = useQueryClient();
  const navegar = useNavigate();
  return async () => {
    await api.post("/auth/logout").catch(() => {});
    qc.clear();
    navegar("/");
    qc.invalidateQueries({ queryKey: ["sessao"] });
  };
}

/** Só a letra muda: ativo fica cinza, hover clareia. Sem fundo no botão. */
function LinkTopo({ para, children }: { para: string; children: ReactNode }) {
  return (
    <NavLink
      to={para}
      end={para === "/"}
      className={({ isActive }) =>
        cn(
          "titulo flex min-h-12 items-center px-1 text-[26px] tracking-[0.02em] transition-colors duration-150",
          isActive ? "text-cinza" : "text-white hover:text-cinza-medio",
        )
      }
    >
      {children}
    </NavLink>
  );
}

function LinkInferior({ para, children }: { para: string; children: ReactNode }) {
  return (
    <NavLink
      to={para}
      end={para === "/"}
      className={({ isActive }) =>
        cn(
          "titulo flex min-h-14 flex-1 items-center justify-center text-[19px] tracking-[0.03em] transition-colors",
          isActive ? "text-cinza" : "text-white",
        )
      }
    >
      {children}
    </NavLink>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  const sair = useSair();
  const navegar = useNavigate();
  const secao = SECAO.find(([r]) => r.test(pathname))?.[1] ?? "";
  const navInferior = COM_NAV_INFERIOR.test(pathname);

  return (
    <div className="min-h-dvh">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:p-3 focus:text-black">
        Pular para o conteúdo
      </a>

      {/* Celular: cabeçalho com logo */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-fina bg-black/90 px-5 pt-[max(10px,env(safe-area-inset-top))] pb-2.5 backdrop-blur-md lg:hidden">
        <Link to="/" className="flex items-center gap-5" aria-label="ARTH Sports, ir para Hoje">
          <img src="/logo.png" alt="" className="h-[48px] w-auto" />
          <span className="secao marcador">{secao}</span>
        </Link>
        <Menu
          gatilho={
            <button type="button" className="grid size-11 place-items-center rounded-[4px] hover:bg-white/10" aria-label="Mais opções">
              <MoreHorizontal className="size-6" />
            </button>
          }
        >
          <ItemMenu onSelect={() => navegar("/pecas")}>Peças e prazos</ItemMenu>
          <ItemMenu onSelect={sair}>Sair</ItemMenu>
        </Menu>
      </header>

      {/* PC: barra superior com o logo saindo da linha */}
      <header className="sticky top-0 z-30 hidden h-[96px] border-b border-white bg-black/90 backdrop-blur-md lg:block">
        <nav aria-label="Principal" className="relative mx-auto flex h-full max-w-[1280px] items-center justify-between px-10">
          <div className="flex gap-10">
            <LinkTopo para="/">Hoje</LinkTopo>
            <LinkTopo para="/pedidos">Pedidos</LinkTopo>
          </div>
          <Link
            to="/"
            className="absolute top-3 left-1/2 -translate-x-1/2 transition-transform duration-200 hover:-rotate-2"
            aria-label="ARTH Sports, ir para Hoje"
          >
            <img src="/logo.png" alt="" className="w-[124px] drop-shadow-[0_6px_14px_rgba(0,0,0,0.9)]" />
          </Link>
          <div className="flex gap-10">
            <LinkTopo para="/clientes">Clientes</LinkTopo>
            <LinkTopo para="/pecas">Peças e prazos</LinkTopo>
          </div>
        </nav>
      </header>

      <main id="conteudo" className={cn("mx-auto max-w-[1280px] px-5 pt-6 lg:px-10 lg:pt-20", navInferior ? "pb-32 lg:pb-16" : "pb-40 lg:pb-16")}>
        <Outlet />
      </main>

      <footer className="mx-auto hidden max-w-[1280px] justify-end px-10 pb-10 lg:flex">
        <button type="button" onClick={sair} className="min-h-11 px-3 text-cinza hover:text-white">
          Sair
        </button>
      </footer>

      {navInferior && (
        <nav aria-label="Principal" className="pb-seguro fixed inset-x-0 bottom-0 z-30 border-t border-white bg-black lg:hidden">
          <div className="flex h-[72px] items-center">
            <LinkInferior para="/">Hoje</LinkInferior>
            <Link
              to="/pedidos/novo"
              aria-label="Novo pedido"
              className="-mt-9 grid size-[68px] shrink-0 -skew-x-6 place-items-center rounded-[4px] bg-white text-black shadow-[0_0_0_6px_black] active:scale-95"
            >
              <Plus className="size-9 skew-x-6" strokeWidth={2.25} />
            </Link>
            <LinkInferior para="/pedidos">Pedidos</LinkInferior>
            <LinkInferior para="/clientes">Clientes</LinkInferior>
          </div>
        </nav>
      )}
    </div>
  );
}

/** Ação principal fixa no rodapé (celular). No PC, a página mostra a ação no cabeçalho. */
export function AcaoRodape({ children, nota }: { children: ReactNode; nota?: string }) {
  return (
    <div className="pb-seguro fixed inset-x-0 bottom-0 z-30 border-t border-white bg-black px-5 pt-4 lg:hidden">
      <div className="flex gap-3 [&>*]:flex-1">{children}</div>
      <p className="py-3 text-center text-sm text-cinza">{nota ?? " "}</p>
    </div>
  );
}

export function Carregando() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Carregando">
      <div className="h-12 w-48 animate-pulse rounded-[4px] bg-card" />
      <div className="h-28 animate-pulse rounded-[4px] bg-card" />
      <div className="h-28 animate-pulse rounded-[4px] bg-card" />
    </div>
  );
}

export function ErroTela({ mensagem, aoTentar }: { mensagem: string; aoTentar?: () => void }) {
  return (
    <div className="rounded-[4px] border-2 border-white bg-elevado p-6">
      <p className="titulo text-[28px]">Não carregou</p>
      <p className="mt-2 text-cinza-medio">{mensagem}</p>
      {aoTentar && (
        <button type="button" onClick={aoTentar} className="mt-4 min-h-11 font-semibold underline underline-offset-4">
          Tentar de novo
        </button>
      )}
    </div>
  );
}
