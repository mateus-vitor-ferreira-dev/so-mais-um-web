import { createContext } from 'react'

/** Quem escuta um evento do stream. Recebe o `data` já lido do JSON. */
export type OuvinteDoStream = (dado: unknown) => void

/**
 * A conexão de stream da aba, vista por quem a consome (web#472).
 *
 * Mora fora do `StreamProvider` para o teste de quem consome montar um contexto
 * falso sem abrir `EventSource` nenhum.
 */
export interface StreamContextValue {
  /**
   * Escuta um evento pelo nome, e devolve o cancelamento.
   *
   * `'message'` é o evento **sem nome** — o das notificações, que o sino lê.
   * Os nomeados (`'suporte'`) chegam só a quem os assina: é o que impede uma
   * mensagem de suporte de aparecer no sino como notificação sem título.
   */
  assinar: (evento: string, ouvinte: OuvinteDoStream) => () => void
  /**
   * Chamado quando a conexão **volta** depois de cair — e não na primeira
   * abertura. O `EventSource` reconecta sozinho, mas o que chegou durante a
   * queda se perdeu: quem escuta relê do banco. O banco é a verdade; o stream
   * é a campainha.
   */
  aoReconectar: (ouvinte: () => void) => () => void
}

export const StreamContext = createContext<StreamContextValue | null>(null)
