import { Crown } from 'lucide-react'
import type { ReactNode } from 'react'
import { Selo } from './styles'

export interface CaptainBadgeProps {
  /**
   * O rótulo. Difere de propósito entre as telas: no cartão do **seu** time é
   * *"Você é o capitão"*, e na lista de membros é só *"Capitão"* — uma fala
   * com você, a outra rotula outra pessoa.
   */
  children: ReactNode
}

/**
 * O selo de quem manda no time.
 *
 * A mesma peça existia duas vezes, com **dois nomes**: `CaptainTag` em `Times`
 * e `CaptainBadge` em `TimeDetail` (#315). O estilo era idêntico byte a byte —
 * o que não era idêntico era como chamá-la, e é isso que faz a terceira tela
 * inventar uma terceira.
 *
 * Ficou `CaptainBadge`, pelo nome que o resto do repositório já usa para selo:
 * `RoleBadge`, `NavBadge`. `Tag` não aparece em lugar nenhum.
 *
 * A coroa vem de dentro, e o **texto** de fora. É a divisão certa: o desenho
 * do selo é a parte que precisava parar de divergir; o rótulo é conteúdo da
 * tela. Antes a coroa era desenhada por quem chamava, em dois tamanhos
 * diferentes — 12 e 11 —, e essa é a espécie de diferença que ninguém
 * escolheu.
 */
export default function CaptainBadge({ children }: CaptainBadgeProps) {
  return (
    <Selo>
      <Crown size={12} aria-hidden="true" />
      {children}
    </Selo>
  )
}
