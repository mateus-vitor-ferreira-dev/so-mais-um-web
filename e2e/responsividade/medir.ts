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
    if (b.right > largura + 1 || b.left < -1) r.vazando.push(chave(el))

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
