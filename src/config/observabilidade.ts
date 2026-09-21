// `EventoDeErro` e não `ErrorEvent`: o DOM já tem um com esse nome, e é dele
// que o ouvinte global abaixo precisa.
import type { ErrorEvent as EventoDeErro } from '@sentry/react'
import { env } from './env'

/**
 * Para onde vai o erro que hoje morre no navegador de quem estava usando (web#529).
 *
 * O `ErrorBoundary` pinta uma tela de erro bonita e **morre ali**. Vale para
 * tudo que só acontece no cliente e que teste nenhum pega: resposta da api num
 * formato que a tela não esperava, erro de render que só aparece num navegador
 * ou num tamanho de tela.
 *
 * **Sem `VITE_SENTRY_DSN` nada acontece**, que é a mesma regra da api: quem
 * clonou o repositório roda o projeto inteiro sem abrir conta em serviço nenhum.
 *
 * ## Por que o SDK entra por `import()`
 *
 * Importado de forma estática, ele engorda o chunk da raiz em **86 KiB** (de
 * 336 para 422 KiB) — peso que TODO visitante baixa antes de ver a tela de
 * login, para uma funcionalidade que não é dele, e sim nossa. É exatamente o
 * caso que o `primeira-tela:check` existe para impedir (#317).
 *
 * Em chunk próprio, ele chega uns milissegundos depois. Esses milissegundos são
 * justamente quando um app quebrado mais quebra, então o que acontece neles não
 * pode se perder: os ouvintes abaixo guardam o que aparecer e a fila é
 * despejada quando o SDK termina de carregar.
 */

type ModuloSentry = typeof import('@sentry/react')

let sentry: ModuloSentry | null = null
let carregando = false

interface Reportavel {
  erro: unknown
  contexto: Record<string, string>
}

/** O que aconteceu antes de o SDK chegar. Despejada assim que ele chega. */
const fila: Reportavel[] = []
/** Teto de segurança: app em laço de erro não pode virar consumo de memória. */
const TETO_DA_FILA = 20

/**
 * O que NÃO é defeito nosso.
 *
 * O jogador no ginásio sem sinal, a aba fechada no meio de uma requisição e a
 * extensão do navegador que estoura sozinha produzem erro de JavaScript sem que
 * uma linha deste repositório esteja errada. Mandar isso para o painel enche o
 * lugar de ruído que ninguém pode consertar — e painel cheio de ruído é painel
 * que ninguém abre.
 */
const RUIDO = [
  'Network Error',
  'Failed to fetch',
  'NetworkError when attempting to fetch resource',
  'Load failed',
  'canceled',
  'AbortError',
  'ResizeObserver loop',
  // Chunk velho depois de um deploy: o `lazyWithRetry` do `paginas.ts` já
  // recarrega a página, que é o tratamento certo. Não é notícia.
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'Unable to preload CSS',
]

/** Exportada para ter teste próprio: é a regra que decide o que chega ao painel. */
export function ehRuido(evento: EventoDeErro): boolean {
  const valores = evento.exception?.values ?? []
  const textos = [evento.message, ...valores.map((v) => v.value)].filter(Boolean) as string[]
  return textos.some((texto) => RUIDO.some((ruido) => texto.includes(ruido)))
}

function enfileira(erro: unknown, contexto: Record<string, string>) {
  if (fila.length >= TETO_DA_FILA) return
  fila.push({ erro, contexto })
}

function manda(modulo: ModuloSentry, { erro, contexto }: Reportavel) {
  modulo.withScope((escopo) => {
    for (const [chave, valor] of Object.entries(contexto)) escopo.setTag(chave, valor)
    modulo.captureException(erro)
  })
}

/** Enquanto o SDK não chega, é isto que não deixa o erro se perder. */
function deGlobal(evento: Event) {
  const erro =
    evento instanceof PromiseRejectionEvent
      ? evento.reason
      : ((evento as ErrorEvent).error ?? evento)
  enfileira(erro, { origem: 'global' })
}

/**
 * Liga o Sentry, se houver DSN.
 *
 * **Sem rastreamento de desempenho e sem gravação de sessão.** Os dois custam
 * cota de evento e mandam para fora muito mais do que "o que quebrou", que é o
 * que a web#529 pediu. Quando houver pergunta de desempenho, ela se decide
 * inteira, com o preço na mesa.
 */
export async function iniciaObservabilidade(): Promise<boolean> {
  if (!env.sentryDsn || carregando || sentry) return false
  carregando = true

  window.addEventListener('error', deGlobal)
  window.addEventListener('unhandledrejection', deGlobal)

  try {
    const modulo = await import('@sentry/react')

    modulo.init({
      dsn: env.sentryDsn,
      /**
       * Prévia e produção separadas.
       *
       * Todo PR gera deploy na Vercel, e erro de prévia — de código que ainda
       * está sendo escrito — misturado com o de produção faz o painel mentir
       * sobre o que acontece com quem usa o app de verdade.
       */
      environment: env.ambiente,
      /** O commit do build. Sem ele, todo erro pertence a uma versão desconhecida. */
      release: env.commit || undefined,
      sendDefaultPii: false,
      beforeSend: (evento: EventoDeErro) => (ehRuido(evento) ? null : evento),
    })

    sentry = modulo
    // A partir daqui os ouvintes do próprio SDK cobrem o global.
    window.removeEventListener('error', deGlobal)
    window.removeEventListener('unhandledrejection', deGlobal)

    for (const item of fila.splice(0)) manda(modulo, item)
    return true
  } catch (falha) {
    // Chunk do SDK que não baixou não pode derrubar o app inteiro.
    console.error('[observabilidade] O SDK não carregou:', falha)
    return false
  } finally {
    carregando = false
  }
}

/** Só para teste e para quem precisa decidir se vale a pena montar contexto. */
export function observabilidadeLigada(): boolean {
  return sentry !== null
}

/**
 * Manda um erro pego por nós — hoje, o do `ErrorBoundary`.
 *
 * Nunca lança: um erro dentro do repórter de erros derrubaria justamente a tela
 * de erro, e o usuário veria a página em branco em vez do "algo deu errado".
 */
export function reportaErro(erro: unknown, contexto: Record<string, string> = {}): void {
  if (!env.sentryDsn) return
  try {
    if (!sentry) return enfileira(erro, contexto)
    manda(sentry, { erro, contexto })
  } catch (falha) {
    console.error('[observabilidade] Falha ao reportar erro:', falha)
  }
}
