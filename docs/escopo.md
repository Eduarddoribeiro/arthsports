# Escopo: Sistema de Controle de Pedidos de Fardamento Esportivo

**Status:** Rascunho
**Cliente / dono:** Eduardo (própria empresa de fardamento esportivo)
**Responsável:** Eduardo

> Regra de mudança: depois do aceite, qualquer pedido novo entra na Fase 2 ou é avaliado com a skill nova-ideia-projeto antes de ser feito. Mudanças aceitas são registradas no Histórico.

## 1. Visão
- **Em uma frase:** Sistema para o dono da empresa acompanhar pedidos de uniformes esportivos (times e escolas) desde o sinal até a entrega, usado por ele mesmo no computador ou celular.
- **Problema hoje:** o andamento da produção é acompanhado por WhatsApp com a confecção terceirizada, e não há visão consolidada de quantas peças estão em produção, em que etapa está cada pedido e quais estão atrasados.
- **Sucesso significa:** o dono consegue, em uma tela, ver quantas peças estão em produção, a etapa de cada pedido, a data prevista de entrega e os atrasos.

## 2. Pessoas e permissões
| Perfil | Quem é | Pode ver | Pode fazer |
|---|---|---|---|
| Admin | Eduardo (dono) | Tudo | Cadastrar clientes e peças, criar pedidos, avançar etapas, registrar sinal e pagamentos |

Só existe um usuário no MVP. Confecção e clientes não acessam o sistema.

## 3. Fluxos principais
### 3.1 Criar um pedido
1. Dono escolhe o cliente (ou cadastra um novo).
2. Adiciona as peças do pedido: tipo (camisa, agasalho ou jaqueta, calção ou short), grade de tamanhos e quantidade.
3. Registra o valor total e o sinal pago.
4. O sistema calcula a data de entrega: data do sinal + prazo padrão da peça (camisa 15 a 30 dias; calção e agasalho 30 a 45 dias).
**Termina quando:** o pedido aparece na lista de pedidos em produção com a etapa "Aprovação da arte".

### 3.2 Acompanhar a produção
1. Dono avança a etapa do pedido conforme a terceirizada informa pelo WhatsApp: Aprovação da arte → Corte e costura na terceirizada → Acabamento e estampa → Entregue ao cliente.
2. Cada avanço grava a data.
**Termina quando:** o pedido está marcado como "Entregue ao cliente".

### 3.3 Ver o painel inicial
1. Dono abre o sistema e vê: total de peças em produção, pedidos por etapa e pedidos atrasados destacados.
**Termina quando:** o dono sabe o que precisa cobrar hoje.

### 3.4 Consultar um cliente
1. Dono abre o cadastro do cliente e vê o histórico de pedidos anteriores.
**Termina quando:** o dono encontra os pedidos antigos do cliente.

## 4. Regras de negócio
- **RN-01 – Prazo padrão por peça:** cada tipo de peça tem um prazo padrão de produção. *Exemplo:* camisa tem prazo de 15 a 30 dias; calção e agasalho, 30 a 45 dias.
- **RN-02 – Contagem do prazo:** o prazo começa a contar no pagamento do sinal. *Exemplo:* sinal pago em 01/12; camisa com prazo máximo de 30 dias tem entrega prevista até 31/12.
- **RN-03 – Data de entrega calculada:** a data de entrega é calculada automaticamente pelo prazo padrão da peça. *Exemplo:* pedido com camisas e calções pagos em 01/12 usa o maior prazo entre as peças.
- **RN-04 – Atraso:** pedido sem a etapa "Entregue ao cliente" depois da data prevista aparece destacado na tela inicial. *Exemplo:* pedido com entrega prevista em 31/12 e sem entrega em 01/01 fica destacado.
- **RN-05 – Unidade de controle:** o acompanhamento é feito por pedido inteiro, não por peça individual. *Exemplo:* o uniforme de um time é um pedido com várias peças.
- **RN-06 – Histórico do cliente:** todo pedido fica vinculado ao cliente, mesmo depois de entregue. *Exemplo:* o time que renova todo ano tem todos os pedidos anteriores na ficha.

## 5. Entidades e ciclo de vida
| Entidade | Status possíveis | Pode repetir? | Cancelamento | Histórico |
|---|---|---|---|---|
| Cliente | ativo | Não | Não se apaga, só inativa | Mantém |
| Peça (catálogo) | ativa / inativa | Não | Inativa, sem apagar | Mantém |
| Pedido | aprovação da arte → corte e costura → acabamento e estampa → entregue; ou cancelado | Não (renovação é um pedido novo ligado ao mesmo cliente) | Marca como cancelado, mantém registro | Mantém |
| Item do pedido | ativo | Não | Removido junto com o pedido | Mantém no pedido |
| Pagamento | sinal / saldo | Não | Estorno registrado, não apagado | Mantém |

## 6. MVP (primeira entrega)
| # | Funcionalidade | Critério de pronto |
|---|---|---|
| M1 | Cadastro de clientes | Criar, editar e inativar cliente com nome, contato e tipo (time, escola ou empresa) |
| M2 | Cadastro de peças com prazo padrão | Criar tipo de peça com prazo mínimo e máximo em dias |
| M3 | Criar pedido com itens | Pedido com cliente, peças, grade de tamanhos, quantidade, valor e sinal |
| M4 | Etapas do pedido | Avançar a etapa com data registrada, sem pular etapas |
| M5 | Data de entrega calculada | Data prevista = data do sinal + prazo padrão, mostrada no pedido |
| M6 | Painel inicial | Total de peças em produção, pedidos por etapa e pedidos atrasados destacados |
| M7 | Histórico do cliente | Ficha do cliente lista todos os pedidos anteriores |
| M8 | Acesso pelo celular | Telas usáveis no celular para atualizar etapas no dia a dia |

## 7. Fase 2 (combinado para depois)
| # | Funcionalidade | Como o MVP já deixa a porta aberta |
|---|---|---|
| F1 | Lembrete de renovação para clientes que voltam todo ano | Histórico do cliente com pedidos datados (M7) |
| F2 | Acesso da confecção terceirizada para atualizar etapas | Papel de usuário previsto no modelo, com só um perfil (Admin) ativo |
| F3 | Notificação por WhatsApp quando a etapa mudar | Etapas com data registrada (M4) |
| F4 | Ajuste manual da data de entrega | Data calculada guardada como campo separado da data definitiva |
| F5 | Controle de estoque de tecido e aviamentos | Itens do pedido ligados à peça (M2) |

## 8. Fora do escopo
- Pagamento online e cobrança automática: o sinal e o saldo são registrados à mão.
- Emissão de nota fiscal.
- Site de pedidos para clientes finais.
- Controle financeiro completo (contas a pagar, fluxo de caixa).
- Integração direta com a confecção: o andamento continua vindo pelo WhatsApp.

## 9. Telas
| Tela | Perfil | O que mostra / faz |
|---|---|---|
| Painel inicial | Admin | Peças em produção, pedidos por etapa, atrasos destacados |
| Lista de pedidos | Admin | Pedidos filtrados por etapa, com data prevista |
| Detalhe do pedido | Admin | Itens, grade, valor, sinal, etapas com datas, botão de avançar etapa |
| Novo pedido | Admin | Formulário de pedido com cálculo de data |
| Clientes | Admin | Lista e ficha com histórico |
| Peças | Admin | Catálogo com prazo padrão |

## 10. Modelo de dados (resumo)
- **Cliente**: nome, contato, tipo (time, escola, empresa), status; tem muitos Pedidos.
- **Peça**: tipo, prazo mínimo e máximo em dias; usada em Itens do pedido.
- **Pedido**: cliente, valor total, sinal, data do sinal, data prevista de entrega, etapa atual, status (ativo ou cancelado); tem muitos Itens e Etapas.
- **Item do pedido**: pedido, peça, grade de tamanhos (quantidade por tamanho), quantidade.
- **Etapa do pedido**: pedido, nome da etapa, data registrada.
- **Pagamento**: pedido, tipo (sinal ou saldo), valor, data.

## 11. Técnica
- **Front-end:** React com TypeScript, Vite, Tailwind CSS e componentes shadcn/ui; React Router; TanStack Query; React Hook Form com Zod; date-fns.
- **Back-end:** Node.js LTS com TypeScript, Fastify e Zod compartilhado com o front-end.
- **Banco:** PostgreSQL com Drizzle ORM.
- **Login:** um único usuário (Eduardo), senha com hash Argon2 e sessão em cookie httpOnly.
- **Hospedagem:** tudo no Render, em um único lugar: um serviço web (API + front-end estático) e um PostgreSQL. Sem Supabase e sem outras contas.
- **Custo mensal estimado:** a confirmar nos planos pagos do Render antes do aceite (o banco gratuito do Render expira, então precisa de plano pago).
- **Domínio / backup / offline:** domínio a definir; backup pelo serviço do Postgres no Render; não precisa funcionar offline no MVP.
- **Dados pessoais (LGPD):** guarda nome e contato de responsáveis por times e escolas. Se o cadastro incluir nomes de atletas menores de idade, a exposição é maior; a decidir se o MVP guarda isso.

## 12. Riscos
- Dados de contato de clientes e de atletas, incluindo menores, exigem cuidado com LGPD.
- Dependência do WhatsApp para saber o andamento: se a terceirizada atrasar a informação, o sistema fica desatualizado.
- Prazo de produção é uma média; atraso real pode não bater com a data calculada.

## 13. Suposições a confirmar
- [SUPOSIÇÃO] Tamanhos padrão de uniforme (PP a GG) são suficientes para a grade. (quem confirma: Eduardo)
- [SUPOSIÇÃO] O sinal é pago por Pix ou transferência e registrado manualmente. (quem confirma: Eduardo)
- [SUPOSIÇÃO] Um pedido pode ter peças de tipos diferentes e usa o maior prazo entre elas. (quem confirma: Eduardo)
- [SUPOSIÇÃO] Calção e agasalho têm prazo de 30 a 45 dias, camisa de 15 a 30 dias. (informado pelo dono; confirmar valores mínimo e máximo exatos)
- [SUPOSIÇÃO] Nenhum acesso externo no MVP. (quem confirma: Eduardo)

## 14. Perguntas para o cliente
Não se aplica: o dono é o próprio Eduardo.

## 15. Histórico de mudanças
| Data | Mudança | Origem | Decisão |
|---|---|---|---|
| 18/11/2026 | Escopo inicial (rascunho) | Entrevista com Eduardo | Aguardando aceite |
