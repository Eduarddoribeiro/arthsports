import "@fontsource/anton/400.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "./estilos.css";

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from "sonner";
import { Carregando, Layout } from "./componentes/layout";
import { ErroApi } from "./lib/api";
import { useSessao } from "./lib/consultas";
import { PaginaCliente } from "./paginas/cliente";
import { PaginaClientes } from "./paginas/clientes";
import { PaginaHoje } from "./paginas/hoje";
import { PaginaLogin } from "./paginas/login";
import { PaginaNovoPedido } from "./paginas/novo-pedido";
import { PaginaPecas } from "./paginas/pecas";
import { PaginaPedido } from "./paginas/pedido";
import { PaginaPedidos } from "./paginas/pedidos";

const clienteQuery: QueryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 15_000, refetchOnWindowFocus: true, retry: (n, e) => !(e instanceof ErroApi && e.status < 500) && n < 2 },
  },
  queryCache: new QueryCache({
    // Sessão expirou em qualquer consulta: volta para o login.
    onError: (e) => {
      if (e instanceof ErroApi && e.status === 401) clienteQuery.setQueryData(["sessao"], null);
    },
  }),
});

function App() {
  const sessao = useSessao();
  if (sessao.isPending) {
    return (
      <div className="p-5">
        <Carregando />
      </div>
    );
  }
  if (!sessao.data) return <PaginaLogin />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<PaginaHoje />} />
        <Route path="pedidos" element={<PaginaPedidos />} />
        <Route path="pedidos/novo" element={<PaginaNovoPedido />} />
        <Route path="pedidos/:id" element={<PaginaPedido />} />
        <Route path="clientes" element={<PaginaClientes />} />
        <Route path="clientes/:id" element={<PaginaCliente />} />
        <Route path="pecas" element={<PaginaPecas />} />
        <Route
          path="*"
          element={<p className="text-cinza-medio">Página não encontrada.</p>}
        />
      </Route>
    </Routes>
  );
}

createRoot(document.getElementById("raiz")!).render(
  <StrictMode>
    <QueryClientProvider client={clienteQuery}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <Toaster
        position="top-center"
        theme="dark"
        toastOptions={{
          classNames: {
            toast: "!bg-white !text-black !border-0 !rounded-[4px] !font-sans !text-[15px] !min-h-14",
            actionButton: "!bg-black !text-white !font-semibold !min-h-10 !px-4 !rounded-[4px] !text-[15px]",
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
);
