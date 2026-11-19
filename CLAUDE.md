# Art Sports — Sistema de pedidos de fardamento esportivo

Sistema interno da ARTH Sports para acompanhar pedidos de uniformes (times e escolas) desde o sinal até a entrega. Usuário único: o dono, Eduardo. A produção é feita por uma confecção terceirizada, que avisa o andamento pelo WhatsApp; ela não tem acesso ao sistema.

## Documentos de referência (leia antes de qualquer tarefa)
- `docs/escopo.md`: fonte da verdade do que está no MVP, na Fase 2 e fora do escopo. Pedido novo que não está no escopo vai para a Fase 2 ou é avaliado antes de ser feito.
- `docs/design.md`: sistema visual (cores, tipografia, componentes e telas).
- `docs/telas/`: prints das telas de celular e PC.
- `public/logo.png`: logo da ARTH Sports com fundo transparente (usar este). `logo.webp` é o original, com fundo branco.

## Stack decidida
- **Front-end:** React com TypeScript, Vite, Tailwind CSS e componentes shadcn/ui; React Router; TanStack Query; React Hook Form com Zod; date-fns.
- **Back-end:** Node.js LTS com TypeScript, Fastify e Zod compartilhado com o front-end.
- **Banco:** PostgreSQL com Drizzle ORM.
- **Autenticação:** um único usuário, senha com hash Argon2 e sessão em cookie httpOnly.
- **Hospedagem:** tudo no Render: um serviço web (API e front-end estático) e um PostgreSQL.

## Regras do projeto
- Front-end sempre em React. Não usar HTML, CSS ou JavaScript puro em telas, nem tecnologias ultrapassadas (Create React App, Moment.js, componentes de classe).
- Não usar Supabase, nem criar contas em outros serviços. Só o Render.
- Interface e mensagens ao usuário em português do Brasil.
- Commits com a skill de commit semântico, com mensagens em português.
- Manter este arquivo atualizado a cada mudança relevante de stack, estrutura ou regra.
- Não implementar nada que esteja na Fase 2 ou fora do escopo sem antes atualizar o `docs/escopo.md`.

## Regras de produto (resumo)
- Pedido tem cliente, peças com grade de tamanhos, valor, sinal e data do sinal.
- Data de entrega = data do sinal + maior prazo padrão entre as peças do pedido. Camisa: 15 a 30 dias. Calção e agasalho: 30 a 45 dias.
- Etapas em ordem: aprovação da arte, corte e costura na terceirizada, acabamento e estampa, entregue ao cliente. Não pular etapas.
- Pedido em atraso (passou da data prevista e não foi entregue) aparece destacado no topo da tela inicial.
- Histórico de pedidos fica na ficha do cliente.

## Experiência
- Celular primeiro. Uma ação principal por tela, no rodapé.
- Avançar etapa em 1 toque (com desfazer por 10 segundos).
- Repetir o último pedido de um cliente em 2 toques.

## Estrutura
- `src/shared/`: regras de negócio (`dominio.ts`), validação Zod (`esquemas.ts`) e contrato da API (`api.ts`). Usado pelo front e pela API.
- `src/server/`: Fastify. `db/schema.ts` (Drizzle), `rotas/`, `auth.ts` (Argon2 + sessão em cookie httpOnly), `pedidos.ts` (consultas).
- `src/web/`: React. `paginas/` (uma por tela), `componentes/ui/` (componentes no estilo shadcn/ui), `lib/` (API, TanStack Query, formatação).
- `drizzle/`: migrações SQL geradas. Rodam sozinhas ao subir o servidor.
- `render.yaml`: blueprint do Render (serviço web + PostgreSQL).

## Comandos
- `npm install`: instala.
- `npm run dev`: API em :3000 e Vite em :5173 (abra http://localhost:5173). Sem `DATABASE_URL`, usa Postgres embutido (PGlite) em `.data/`.
- `npm test`: testes das regras de negócio (Vitest).
- `npm run typecheck`: checagem de tipos.
- `npm run build` e `npm start`: build e servidor de produção (serve API e front em :3000).
- `npm run db:generate -- --name <nome>`: gera migração depois de mudar `src/server/db/schema.ts`.
- `npm run senha -- "nova senha"`: troca a senha do Eduardo e derruba as sessões abertas.

## Decisões de implementação
- Valores em centavos (inteiro). Datas de negócio como `aaaa-mm-dd`; registros de etapa com data e hora.
- Grade de tamanhos: PP, P, M, G, GG (`TAMANHOS` em `src/shared/dominio.ts`).
- Desfazer avanço: o app mostra 10 segundos; a API aceita até 60 segundos e só desfaz o último avanço.
- Peças iniciais (só com catálogo vazio): Camisa 15–30, Calção 30–45, Agasalho 30–45 dias.
