/**
 * A medição, a mesma da auditoria da #511 (`metricas.mjs`, no ramo
 * `docs/auditoria-responsividade-scripts`), reduzida às duas métricas que
 * reprovam: elemento passando da borda e alvo de toque menor que 44px.
 *
 * Roda dentro da página (`page.evaluate`), então não pode usar nada de fora
 * da função.
 *
 * Cada ocorrência vira uma **chave de texto** (`tag "rótulo"`), e não uma
 * contagem: contagem deixaria uma correção esconder uma regressão nova na
 * mesma tela. A chave não leva classe (o styled-components gera hash) nem
 * tamanho (1px de diferença não é ocorrência nova).
 *
 * Ignorado de propósito, como na auditoria:
 * - **a gaveta do menu fechada**: o `aside` fica fora da tela até abrir;
 * - **o conteúdo da `RolagemHorizontal`** (`[role=region][tabindex]`): rola por
 *   dentro de propósito, e só a faixa em si é medida;
 * - **o que passa da borda dentro de uma faixa que rola de lado e cabe na
 *   tela**: é a mesma ideia da `RolagemHorizontal`, generalizada. Se o
 *   ancestral mais próximo que declara `overflow-x: auto` ou `scroll` (na regra
 *   CSS, não só no valor computado; ver `rolaDeLado`) cabe inteiro na
 *   largura, o conteúdo rola por dentro e a caixa não vaza, então o que está
 *   fora da tela não conta como vazamento. Exemplos: os chips de modalidade do
 *   Início (`TabsRow`, com setas e `role="group"`) e uma tabela com rolagem por
 *   dentro. Se a própria faixa passa da borda, ela conta. Só vale para
 *   vazamento: alvo pequeno dentro da faixa continua sendo medido;
 * - **o `.alvo-do-cartao`**: é só o ponto do teclado no cartão clicável; o alvo
 *   de toque é o cartão inteiro;
 * - **a caixa de seleção cujo `<label>` tem 44px**: o toque cai no rótulo.
 */
export interface Ocorrencias {
  vazando: string[]
  alvos: string[]
}

export function medir(largura: number): Ocorrencias {
  const fechada = (el: Element) => {
    const aside = el.closest('aside')
    return !!aside && aside.getBoundingClientRect().right <= 0
  }
  const naFaixa = (el: Element) => {
    const faixa = el.closest('[role=region][tabindex]')
    return !!faixa && faixa !== el
  }
  // Quem declara rolagem de lado: `overflow-x` (ou o atalho `overflow`) em
  // `auto` ou `scroll` numa regra CSS que vale agora. O valor computado não
  // serve: `overflow-y: auto` sozinho faz o `overflow-x` computado virar `auto`
  // também, e aí o `Content` do `DashboardLayout`, que rola na vertical,
  // calaria todo vazamento do painel.
  const rolaDeLado = new Set<Element>()
  const declaraRolagemDeLado = (estilo: CSSStyleDeclaration) =>
    ['auto', 'scroll'].includes(estilo.getPropertyValue('overflow-x').trim())
  const percorre = (regras: CSSRuleList) => {
    for (const regra of regras) {
      if (regra instanceof CSSStyleRule) {
        if (declaraRolagemDeLado(regra.style)) {
          try { document.querySelectorAll(regra.selectorText).forEach((e) => rolaDeLado.add(e)) } catch { /* seletor que o querySelectorAll não aceita */ }
        }
      } else if (regra instanceof CSSMediaRule) {
        if (matchMedia(regra.conditionText).matches) percorre(regra.cssRules)
      } else if (regra instanceof CSSSupportsRule) {
        if (CSS.supports(regra.conditionText)) percorre(regra.cssRules)
      }
    }
  }
  for (const folha of document.styleSheets) {
    try { percorre(folha.cssRules) } catch { /* folha de outra origem */ }
  }
  document.querySelectorAll<HTMLElement>('[style]').forEach((e) => { if (declaraRolagemDeLado(e.style)) rolaDeLado.add(e) })

  const rolaDentroDeFaixaQueCabe = (el: Element) => {
    for (let pai: Element | null = el.parentElement; pai && pai !== document.body; pai = pai.parentElement) {
      const overflowX = getComputedStyle(pai).overflowX
      if ((overflowX === 'auto' || overflowX === 'scroll') && rolaDeLado.has(pai)) {
        const f = pai.getBoundingClientRect()
        return f.left >= -1 && f.right <= largura + 1
      }
    }
    return false
  }
  const visivel = (el: Element) => {
    const b = el.getBoundingClientRect()
    const s = getComputedStyle(el)
    return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'
  }
  const rotuloDe = (el: Element) => (
    el.getAttribute('aria-label') ||
    (el.textContent ?? '').replace(/\s+/g, ' ').trim() ||
    el.getAttribute('placeholder') ||
    el.getAttribute('name') ||
    ''
  ).slice(0, 40)
  const chave = (el: Element) => {
    const role = el.getAttribute('role')
    const tipo = el.getAttribute('type')
    let rotulo = rotuloDe(el)
    // Sem rótulo próprio (um ícone, um span vazio), a chave diz onde ele está:
    // "span" sozinho seria igual em qualquer lugar da tela.
    for (let pai = el.parentElement; !rotulo && pai && pai !== document.body; pai = pai.parentElement) {
      const dele = rotuloDe(pai)
      if (dele) rotulo = `em ${pai.tagName.toLowerCase()} "${dele}"`
    }
    return `${el.tagName.toLowerCase()}${role ? `[role=${role}]` : ''}${tipo ? `[type=${tipo}]` : ''} ${rotulo.startsWith('em ') ? rotulo : `"${rotulo}"`}`
  }

  const r: Ocorrencias = { vazando: [], alvos: [] }
  for (const el of document.querySelectorAll('body *')) {
    // O desenho de dentro de um ícone acompanha o ícone: basta medir o `svg`.
    if (el.parentElement?.closest('svg')) continue
    if (fechada(el) || naFaixa(el) || !visivel(el)) continue
    const b = el.getBoundingClientRect()
    if ((b.right > largura + 1 || b.left < -1) && !rolaDentroDeFaixaQueCabe(el)) r.vazando.push(chave(el))

    const controle = el.matches('button, a[href], input:not([type=hidden]), select, textarea, [role=button]')
    if (!controle || el.classList.contains('alvo-do-cartao')) continue
    let pequeno = b.height < 44 || b.width < 44
    if (pequeno && el.matches('input[type=checkbox], input[type=radio]')) {
      const label = el.closest('label')
      if (label && label.getBoundingClientRect().height >= 44) pequeno = false
    }
    if (pequeno) r.alvos.push(chave(el))
  }
  r.vazando.sort()
  r.alvos.sort()
  return r
}

/** O que está em `atual` e não em `conhecido`, contando repetições. */
export function diferenca(atual: string[], conhecido: string[]): string[] {
  const resta = new Map<string, number>()
  for (const k of conhecido) resta.set(k, (resta.get(k) ?? 0) + 1)
  const sobra: string[] = []
  for (const k of atual) {
    const n = resta.get(k) ?? 0
    if (n > 0) resta.set(k, n - 1)
    else sobra.push(k)
  }
  return sobra
}
