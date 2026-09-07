import { useId } from 'react'
import type { ReactNode } from 'react'
import { Acao, Caixa, Icone, Texto, Titulo } from './styles'

export interface EmptyStateProps {
  /**
   * Ícone ou emoji acima do texto. Fica fora da árvore de acessibilidade: ele
   * dá peso visual ao vazio, e quem ouve recebe o mesmo conteúdo pelo texto.
   */
  icone?: ReactNode
  /** Título curto. Só as telas em que o vazio é o assunto principal têm um. */
  titulo?: string
  /** O que oferecer a quem chegou no vazio — normalmente um botão. */
  acao?: ReactNode
  /**
   * Moldura tracejada em volta. Padrão: só quando há `titulo` — que é o sinal
   * de que este vazio é o assunto da área, e não um aviso de canto de tela.
   */
  comMoldura?: boolean
  children: ReactNode
}

/**
 * "Não há nada aqui", num lugar só.
 *
 * ## Por que este componente existe
 *
 * Ele nasceu de 14 declarações de `EmptyState` em 14 `styles.ts` diferentes
 * (#315). O custo não era a duplicação: era **não existir um lugar onde
 * alguém decidisse como o app diz que uma lista está vazia**. Cada página
 * respondeu isso sozinha, e as respostas já divergiam — nove aparências
 * distintas para a mesma ideia, com padding de 40, 48 e 60px, `<p>` num lugar
 * e `<div>` noutro, e três telas com moldura enquanto onze não tinham.
 *
 * ## O que ele deliberadamente não é
 *
 * **Não é estado de carregamento.** Duas das 14 declarações antigas eram: a
 * `Home` mostrava *"Carregando partidas…"* dentro de um `EmptyState`, e o
 * `Owner/Inventory` tinha um `EmptyState` com `svg { animation: spin }` — um
 * spinner morando dentro do componente do vazio. As duas telas passaram a usar
 * `Skeleton` e `ContentLoader`, que já existiam para isso. Vazio e carregando
 * são estados diferentes: um pede ação, o outro pede espera, e o mesmo desenho
 * para os dois faz a pessoa agir quando devia esperar.
 *
 * **Não é estado de erro.** Esse é o `ErrorState`, ao lado.
 */
export default function EmptyState({
  icone, titulo, acao, comMoldura, children, ...resto
}: EmptyStateProps & React.HTMLAttributes<HTMLDivElement>) {
  const idDoTitulo = useId()

  /*
   * Vazio com título vira **região nomeada**, e não um monte de texto solto.
   *
   * A `MinhasPartidas` já fazia isso à mão, e a razão dela vale para todas:
   * quem usa leitor de tela ouve o vazio como uma seção com nome, em vez de
   * dois parágrafos sem contexto; e o botão daqui pode ter o mesmo rótulo do
   * botão do cabeçalho — "Criar Partida" nas duas pontas —, caso em que quem
   * navega por botões ouviria o mesmo nome duas vezes sem nada que os separe.
   *
   * Vem antes do `...resto` de propósito: a tela que precise de outro papel
   * ainda sobrescreve.
   */
  const comoRegiao = titulo ? { role: 'region', 'aria-labelledby': idDoTitulo } : {}

  return (
    <Caixa $comMoldura={comMoldura ?? titulo !== undefined} {...comoRegiao} {...resto}>
      {icone && <Icone aria-hidden="true">{icone}</Icone>}
      {titulo && <Titulo id={idDoTitulo}>{titulo}</Titulo>}
      <Texto $comTitulo={titulo !== undefined}>{children}</Texto>
      {acao && <Acao>{acao}</Acao>}
    </Caixa>
  )
}
