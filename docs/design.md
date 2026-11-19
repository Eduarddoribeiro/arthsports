# Sistema visual — Art Sports (Pedidos)

Base: o logo da ARTH Sports, em preto e branco. Tudo fica em preto, branco e cinzas. A única cor de alerta é o cinza claro, com texto sempre acompanhando, para não depender só da cor.

## Cores
| Nome | Hex | Uso |
|---|---|---|
| Fundo | #000000 | fundo de todas as telas |
| Branco | #FFFFFF | texto principal, bordas, botão principal |
| Card | #141414 | cards e blocos |
| Card elevado | #1A1A1A | faixas de destaque |
| Divisória | #333333 | bordas suaves, segmentos vazios |
| Divisória fina | #222222 | linhas dentro de tabelas |
| Cinza médio | #B3B3B3 | texto secundário |
| Cinza | #8C8C8C | rótulos, legendas, nome do app |
| Cinza claro | #9E9E9E | atraso (com texto "atrasado") |
| Confirmado | #B5B5B5 | no prazo, entregue |

## Tipografia
- **Títulos e números de destaque:** Anton, em caixa alta (ex.: "HOJE", prazo, valores).
- **Corpo, botões e rótulos:** IBM Plex Sans, pesos 400, 500 e 600.
- Escala: título de página 64 px (PC) ou 46 a 52 px (celular); número de destaque 26 a 44 px; corpo 15 a 17 px; rótulo 12 px em caixa alta, com espaçamento entre letras.

## Forma e espaçamento
- Raio: 4 px em cards e botões; 8 px em campos.
- Botão principal: altura 48 a 58 px; largura total no celular.
- Área de toque mínima: 44 px.
- Margem lateral no celular: 20 px.

## Componentes
- **Botão principal:** fundo branco, texto preto.
- **Botão secundário:** borda branca de 1,5 px, fundo transparente.
- **Barra de etapas:** quatro segmentos. Preenchido em branco = concluído; atual = segmento cinza claro; restante = #333333. O nome da etapa atual fica em negrito.
- **Linha de pedido:** nome do cliente, peças, prazo em destaque e barra de etapas. No PC, o botão de avançar fica na mesma linha.
- **Atraso:** borda esquerda grossa cinza claro, texto "X dias de atraso" e a barra de etapas.
- **Faixa de atraso (tela do pedido):** bloco de destaque com borda branca de 2 px.
- **Navegação celular:** barra inferior com Hoje, botão "+" central (novo pedido), Pedidos e Clientes.
- **Navegação PC:** barra superior. À esquerda, Hoje e Pedidos; no centro, o logo; à direita, Clientes e Peças e prazos. A tela ativa aparece com fundo branco e texto preto.

## Logo
- Arquivo: `public/logo.webp` (fundo transparente, letras brancas com contorno).
- Cabeçalho do celular: 52 px. Barra superior do PC: 170 px, com o logo saindo um pouco da barra.

## Telas
Celular: Hoje, Pedido, Novo pedido, Cliente.
PC: Hoje, Pedido, Novo pedido, Cliente, com a mesma estrutura de conteúdo, mas aproveitando a largura.
Os prints ficam em `docs/telas/`.

## Princípios
1. Um toque para avançar etapa.
2. Dois toques para criar pedido repetindo o último.
3. O prazo fica sempre visível.
4. Celular primeiro; o PC é uma versão mais larga da mesma tela.
