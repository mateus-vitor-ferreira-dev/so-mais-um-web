import { ownerNavItems } from './navItems'

/**
 * A conversa de suporte, dos dois lados (web#472, web#473 — épico api#570).
 */

/** O teto do texto de uma mensagem — o `TEXTO_MAX` da api#571. */
export const TEXTO_MAX = 2000

/**
 * Quantos caracteres antes do fim o contador aparece.
 *
 * Um contador sempre visível lembra formulário de repartição; ele só ajuda quando
 * o limite está perto de cortar o que a pessoa está escrevendo.
 */
export const CONTADOR_A_PARTIR_DE = 200

/**
 * O que esperar do atendimento, fixo na tela.
 *
 * Um chat que promete tempo real e fica mudo parece quebrado. Dizer quando a
 * equipe responde é o que transforma o silêncio em espera.
 *
 * ⚠️ **Assumido na web#472, e quem define o horário de verdade é o dono do
 * produto.** Trocar é mudar esta linha.
 */
export const HORARIO_DE_ATENDIMENTO = 'Respondemos em dias úteis, das 9h às 18h.'

/** A própria tela de suporte: escrever "de onde veio" como ela não diz nada. */
const ROTA_DO_SUPORTE = '/owner/suporte'

/** O que a api aceita como `tela`: caminho do app, sem host e sem query. */
const CAMINHO_DO_APP = /^\/[A-Za-z0-9\-_/]*$/
const TELA_MAX = 200

/**
 * A tela de onde o dono veio, pronta para ir como `tela` — ou `undefined`.
 *
 * É o que responde, sem precisar perguntar, a primeira pergunta de todo
 * atendimento: "onde você estava?". **O que a api recusaria é descartado aqui**,
 * e não mandado: um 422 por causa de um campo de contexto faria o dono perder o
 * que escreveu por um detalhe nosso.
 */
export function telaDeOrigem(caminho: unknown): string | undefined {
  if (typeof caminho !== 'string') return undefined
  if (caminho === ROTA_DO_SUPORTE || caminho.length > TELA_MAX || !CAMINHO_DO_APP.test(caminho)) return undefined
  return caminho
}

/**
 * A tela de onde o dono escreveu, pelo nome que ele vê no menu (web#473):
 * `/owner/inventory` vira "Estoque", `/owner/places/abc/courts` vira "Meus
 * Estabelecimentos".
 *
 * O menu é a fonte, e não uma tabela daqui: renomear um item lá renomeia aqui, e
 * tela nova no menu já chega com nome. O que não casa com item nenhum aparece
 * como o caminho cru — melhor que esconder a pista.
 */
export function rotuloDaTela(tela: string): string {
  const item = ownerNavItems('OWNER')
    .filter(i => tela === i.to || tela.startsWith(`${i.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0]
  return item?.label ?? tela
}

/** Só a hora para hoje; data e hora para o resto. No relógio de quem lê. */
export function horaDaMensagem(iso: string): string {
  const data = new Date(iso)
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (data.toDateString() === new Date().toDateString()) return hora
  return `${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${hora}`
}
