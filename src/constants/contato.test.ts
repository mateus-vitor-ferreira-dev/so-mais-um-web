/**
 * O link do WhatsApp da assinatura no Pix (web#447).
 *
 * O módulo lê `import.meta.env` na carga, então cada caso precisa recarregá-lo
 * — daí o `resetModules` antes do import dinâmico.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

const carregar = async () => {
  vi.resetModules()
  return import('./contato')
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
    vi.stubEnv('VITE_WHATSAPP_ASSINATURA', '')
    const { linkDeAssinaturaNoWhatsApp } = await carregar()

    expect(linkDeAssinaturaNoWhatsApp('Olá!')).toBeNull()
  })
})
