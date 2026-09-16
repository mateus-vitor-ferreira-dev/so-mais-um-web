# Scripts da auditoria de responsividade (web#511)

Usados em 16/09/2026 para medir as telas antes e depois das correções dos PRs
web#513 (admin), web#514 (dono) e web#515 (jogador). As medições combinadas estão
em `../medicoes-antes-depois-2026-09-16.json`.

## Pré-requisitos

- **api:** rodando com `NODE_ENV=test node --import tsx/esm src/server.ts`. Sem isso, o limite de 120 req/min derruba a sessão no meio da auditoria.
- **Playwright:** o do cache do npx (`~/.npm/_npx/*/node_modules/playwright`). Ajuste o caminho do `createRequire` se o hash do cache mudar.
- **Dados:** banco de dev com a seed.
- **Logins:**
  - admin: `mateus.ferreira10profissional@gmail.com` / `admin123`;
  - dono: `contato@napraialavras.com.br` / `senha123`;
  - Suporte: `arenabeach@arenabeachlavras.com`;
  - jogador: `mateus@player.com` / `senha123`.
- **Saída:** `SAIDA=<pasta>` define onde vão as capturas (em `shots/` e `metricas/`).

## Scripts

- **`audita.mjs <rota> <prefixo> [tema]`**
  - `EMAIL`/`SENHA` no ambiente;
  - mede a rota em 360, 390, 768 e 1280: elementos passando da borda e alvos menores que 44px;
  - tira captura em cada largura.
- **`clica-alvos.mjs <rota> <arquivo> <largura> <tema> <texto do botão>`:** clica num botão (modal, aba) e lista os alvos pequenos depois do clique.
- **`rola.mjs <rota> <prefixo> <largura> [tema]`:** capturas rolando o `Content` do layout, que rola por dentro (o `fullPage` não pega).
- **`chamada.mjs` e `criar.mjs`:** fluxos com passos (a Chamada num dia com aula e o Criar Partida até os detalhes).
- **`metricas.mjs`:** antes e depois de verdade.
  - **Preparação:** suba duas cópias do app com `git worktree`, a `develop` antiga numa e o ramo com as correções na outra, com vite em 5175 e 5176 (portas que a CORS da api aceita).
  - **O que mede:** vazamento, controles fora da tela, alvos < 44px, texto < 12px, campos < 16px e contraste WCAG (fundo efetivo somando camadas transparentes), nos temas claro e escuro.
  - **Configuração:** a lista `TELAS` define o que medir.
- **`gera_doc.py`:** monta o documento HTML de métricas a partir do JSON.

## O que as medições ignoram de propósito

- A gaveta do menu fechada (`aside` fora da tela).
- O conteúdo da `RolagemHorizontal` (`[role=region][tabindex]`), que rola por dentro de propósito.
- O `.alvo-do-cartao`: o nome no cartão clicável, que é só o ponto do teclado. O alvo de toque é o cartão inteiro.
- A caixa de seleção cujo `<label>` tem 44px.
- Texto com `font-size: 0`: a ação da barra do topo só com ícone.
