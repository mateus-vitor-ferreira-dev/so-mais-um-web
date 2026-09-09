/**
 * O link do WhatsApp da assinatura no Pix (web#447), e o que ele recusa (web#463).
 *
 * O módulo lê `import.meta.env` na carga, então cada caso precisa recarregá-lo
 * — daí o `resetModules` antes do import dinâmico.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

const carregar = async () => {
  vi.resetModules()
  return import('./contato')
}

/** Monta o link com o valor de ambiente dado, ou devolve `null`. */
const comNumero = async (valor: string) => {
  vi.stubEnv('VITE_WHATSAPP_ASSINATURA', valor)
  const { linkDeAssinaturaNoWhatsApp } = await carregar()
  return linkDeAssinaturaNoWhatsApp('Olá!')
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('linkDeAssinaturaNoWhatsApp', () => {
  it('monta o endereço com a mensagem escapada', async () => {
    vi.stubEnv('VITE_WHATSAPP_ASSINATURA', '5535999999999')
    const { linkDeAssinaturaNoWhatsApp } = await carregar()

    expect(linkDeAssinaturaNoWhatsApp('Olá! Quero o Pro')).toBe(
      'https://wa.me/5535999999999?text=Ol%C3%A1!%20Quero%20o%20Pro',
    )
  })

  it('sem número devolve null, e não um link para lugar nenhum', async () => {
    // Quem chama esconde o botão. Um atalho que abre o WhatsApp sem destino é
    // pior que atalho nenhum: a pessoa acha que mandou mensagem.
    await expect(comNumero('')).resolves.toBeNull()
  })

  it('variável ausente devolve null', async () => {
    // A asserção do meio existe porque sem ela este caso passaria pelo motivo
    // errado: se o `stubEnv` gravasse a string `"undefined"` em vez de remover a
    // chave, o resultado seria `null` do mesmo jeito — pelo caminho dos dígitos,
    // não pelo do `?.`.
    vi.stubEnv('VITE_WHATSAPP_ASSINATURA', undefined as unknown as string)
    expect(import.meta.env.VITE_WHATSAPP_ASSINATURA).toBeUndefined()

    const { linkDeAssinaturaNoWhatsApp } = await carregar()

    expect(linkDeAssinaturaNoWhatsApp('Olá!')).toBeNull()
  })
})

/**
 * O que a web#463 acrescentou: o guarda pergunta se **há telefone**, não se há
 * valor.
 */
describe('linkDeAssinaturaNoWhatsApp — valor que não é telefone', () => {
  it('recusa `[SENSITIVE]`, que é o caso que aconteceu em produção', async () => {
    /*
     * 09/09/2026: a variável foi criada na Vercel como *sensitive* — o padrão em
     * Production — e o `vercel pull` do CI devolveu este literal, que o Vite
     * inlinou no bundle. `[SENSITIVE]` é truthy, então o guarda antigo passava
     * reto e a tela ofereceu `https://wa.me/[SENSITIVE]` por dez minutos.
     *
     * Este caso mora aqui para que a linha do `replace(/\D/g, '')` nunca volte a
     * parecer supérflua.
     */
    await expect(comNumero('[SENSITIVE]')).resolves.toBeNull()
  })

  it('recusa o placeholder de exemplo e texto solto', async () => {
    await expect(comNumero('seu-numero-aqui')).resolves.toBeNull()
    await expect(comNumero('undefined')).resolves.toBeNull()
  })

  it('recusa dígitos que não chegam a ser telefone', async () => {
    // `wa.me/55` abre o WhatsApp e não leva a ninguém — o mesmo estrago do link
    // para lugar nenhum, com aparência de número.
    await expect(comNumero('55')).resolves.toBeNull()
    await expect(comNumero('5535997')).resolves.toBeNull()
  })

  it('aceita número com máscara, virando só dígitos', async () => {
    // É como um telefone é copiado do WhatsApp ou de um contrato.
    await expect(comNumero('+55 (35) 99746-0058')).resolves.toBe(
      'https://wa.me/5535997460058?text=Ol%C3%A1!',
    )
  })

  it('aceita o mais curto que um número brasileiro pode ser', async () => {
    // DDI + DDD + oito dígitos = 12. O limite é 12, e não 13, para não recusar
    // um número legítimo por um dígito.
    await expect(comNumero('553533211234')).resolves.toBe(
      'https://wa.me/553533211234?text=Ol%C3%A1!',
    )
  })
})
