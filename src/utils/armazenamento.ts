/**
 * `localStorage` que não derruba a tela quando o navegador o recusa.
 *
 * ## Por que existe
 *
 * O acessor `window.localStorage` **lança** `SecurityError` quando o navegador
 * está configurado para bloquear dados de site — uma opção de privacidade, uma
 * extensão, ou uma WebView embarcada com armazenamento desligado. E `setItem`
 * lança `QuotaExceededError` com o armazenamento cheio.
 *
 * Nenhum desses é caso exótico, e o preço de não tratar foi medido: o
 * `ThemeContext` lia a preferência **no inicializador do `useState`**, ou seja
 * durante a renderização do provider que envolve o app inteiro. A exceção subia
 * antes de qualquer tela existir e o resultado era **página em branco** — não um
 * tema errado, o app inteiro (web#359).
 *
 * ## A regra é sempre a mesma
 *
 * Não conseguir lembrar uma preferência é um estado válido: o app cai no padrão
 * e segue. Nunca é motivo para quebrar a tela.
 *
 * Este arquivo existia como **quatro cópias** do mesmo `try/catch` —
 * `useOrigemDeLocalizacao`, `ConviteDeLocalizacao/dispensa`, `ThemeContext` e
 * o hint de sessão do `api.ts`. As duas primeiras acertavam, as duas últimas
 * não, e nada obrigava a próxima a acertar.
 *
 * ## O que ele NÃO faz
 *
 * Não guarda em memória o que não conseguiu gravar. Seria um cache que engana:
 * a pessoa acharia que a preferência ficou, e ela sumiria ao recarregar. Quem
 * precisa de valor que sobreviva ao render usa estado de React, que é honesto
 * sobre durar só a sessão.
 */

/** O valor guardado, ou `null` quando não há — ou quando não deu para ler. */
export function leia(chave: string): string | null {
  try {
    return localStorage.getItem(chave)
  } catch {
    return null
  }
}

/** Guarda, e engole a falha: sem registro, o app volta ao padrão na próxima visita. */
export function guarde(chave: string, valor: string): void {
  try {
    localStorage.setItem(chave, valor)
  } catch {
    /* Ver o cabeçalho: não lembrar é pior que lembrar, e muito melhor que estourar. */
  }
}

/** Esquece, e engole a falha — o que não dá para apagar também não dá para ler. */
export function esqueca(chave: string): void {
  try {
    localStorage.removeItem(chave)
  } catch {
    /* idem */
  }
}
