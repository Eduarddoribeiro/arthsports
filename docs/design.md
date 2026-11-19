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
- **Barra de etapas:** quatro segmentos inclinados, com o nome das etapas embaixo. Preenchido em branco = concluído; atual = segmento cinza claro; restante = #333333. O nome da etapa atual fica em negrito.
- **Linha de pedido:** nome do cliente, peças, prazo em destaque e barra de etapas. No PC, o botão de avançar fica na mesma linha.
- **Atraso:** faixa esquerda com listras diagonais cinza claro, texto "X dias de atraso" e a barra de etapas.
- **Faixa de atraso (tela do pedido):** bloco de destaque com borda branca de 2 px.
- **Navegação celular:** barra inferior preta e fixa com Hoje, botão "+" central branco e inclinado (novo pedido), Pedidos e Clientes. Cabeçalho fixo no topo.
- **Navegação PC:** barra superior fixa ao rolar. À esquerda, Hoje e Pedidos; no centro, o logo; à direita, Clientes e Peças e prazos. Links em Anton inclinado, sem fundo: a tela ativa fica com a letra cinza (#8C8C8C) e o hover muda só a cor da letra.

## Logo
- Arquivo: `public/logo.png` (fundo transparente, recortado do `logo.webp` original, que tem fundo branco).
- Cabeçalho do celular: 48 px. Barra superior do PC: 96 px de altura, logo com 124 px saindo um pouco da barra.

## Telas
Celular: Hoje, Pedido, Novo pedido, Cliente.
PC: Hoje, Pedido, Novo pedido, Cliente, com a mesma estrutura de conteúdo, mas aproveitando a largura.
Os prints ficam em `docs/telas/`.

## Identidade (tirada do logo)
- Títulos e números em Anton inclinado, como as letras do logo.
- Listras diagonais de uniforme marcam atraso (cartões, placar e faixa do pedido).
- Títulos de seção com um marcador inclinado antes do texto.

## Princípios
1. Um toque para avançar etapa.
2. Dois toques para criar pedido repetindo o último.
3. O prazo fica sempre visível.
4. Celular primeiro; o PC é uma versão mais larga da mesma tela.
