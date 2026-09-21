import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ErrorEvent } from '@sentry/react'

/**
 * `vi.hoisted` porque o `vi.mock` sobe para o topo do arquivo — e o mock precisa
 * valer também para o `import()` dinâmico que o módulo usa para não pesar na
 * primeira tela.
 */
const { init, captureException, setTag, withScope } = vi.hoisted(() => {
  const setTag = vi.fn()
  return {
    init: vi.fn(),
    captureException: vi.fn(),
    setTag,
    withScope: vi.fn((corpo: (escopo: { setTag: typeof setTag }) => void) => corpo({ setTag })),
  }
})

vi.mock('@sentry/react', () => ({ init, captureException, withScope }))

const DSN = 'https://chave@exemplo.ingest.sentry.io/1'

/** Estado de módulo (SDK carregado, fila) não pode vazar de um caso para o outro. */
async function carregaModulo(dsn: string) {
  vi.resetModules()
  const { env } = await import('./env')
  env.sentryDsn = dsn
  env.commit = 'abc1234'
  env.ambiente = 'preview'
  return import('./observabilidade')
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('observabilidade — sem VITE_SENTRY_DSN', () => {
  /**
   * A regra da casa: quem clonou o repositório roda o projeto inteiro sem abrir
   * conta em serviço nenhum.
   */
  it('não liga, e o app segue', async () => {
    const obs = await carregaModulo('')

    await expect(obs.iniciaObservabilidade()).resolves.toBe(false)
    expect(init).not.toHaveBeenCalled()
    expect(obs.observabilidadeLigada()).toBe(false)
  })

  it('reportaErro não faz nada e não lança', async () => {
    const obs = await carregaModulo('')

    expect(() => obs.reportaErro(new Error('sem destino'))).not.toThrow()
    expect(captureException).not.toHaveBeenCalled()
  })
})

describe('observabilidade — com VITE_SENTRY_DSN', () => {
  it('liga com ambiente e release, e sem PII', async () => {
    const obs = await carregaModulo(DSN)

    await expect(obs.iniciaObservabilidade()).resolves.toBe(true)

    const config = init.mock.calls[0][0]
    expect(config.dsn).toBe(DSN)
    // Prévia e produção separadas: todo PR vira deploy na Vercel.
    expect(config.environment).toBe('preview')
    expect(config.release).toBe('abc1234')
    expect(config.sendDefaultPii).toBe(false)
  })

  it('manda o erro com o contexto virado em tag', async () => {
    const obs = await carregaModulo(DSN)
    await obs.iniciaObservabilidade()

    const erro = new Error('a tela quebrou')
    obs.reportaErro(erro, { origem: 'errorBoundary' })

    expect(captureException).toHaveBeenCalledWith(erro)
    expect(setTag).toHaveBeenCalledWith('origem', 'errorBoundary')
  })

  /**
   * O SDK entra por `import()` para não pesar 86 KiB na primeira tela, e esses
   * milissegundos de espera são justamente quando um app quebrado mais quebra.
   * O que acontece neles não pode se perder.
   */
  it('guarda o que aconteceu antes de o SDK chegar, e despeja depois', async () => {
    const obs = await carregaModulo(DSN)

    const cedo = new Error('quebrou antes do SDK')
    obs.reportaErro(cedo, { origem: 'errorBoundary' })
    expect(captureException).not.toHaveBeenCalled()

    await obs.iniciaObservabilidade()

    expect(captureException).toHaveBeenCalledWith(cedo)
  })
})

describe('ehRuido — o que não é defeito nosso', () => {
  const comMensagem = (texto: string) =>
    ({ exception: { values: [{ value: texto }] } }) as unknown as ErrorEvent

  it.each([
    'Network Error',
    'Failed to fetch',
    'AbortError: canceled',
    'Failed to fetch dynamically imported module: /assets/Perfil-abc.js',
    'ResizeObserver loop completed with undelivered notifications',
  ])('descarta %s', async (texto) => {
    const obs = await carregaModulo(DSN)
    expect(obs.ehRuido(comMensagem(texto))).toBe(true)
  })

  /**
   * O contrapeso do caso acima: filtro largo demais esconde defeito de verdade,
   * e aí o painel fica limpo pelo motivo errado.
   */
  it('deixa passar erro de verdade', async () => {
    const obs = await carregaModulo(DSN)

    expect(obs.ehRuido(comMensagem("Cannot read properties of undefined (reading 'nome')"))).toBe(
      false,
    )
  })
})
