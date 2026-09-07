import type { ReactNode } from 'react'
import { Caixa } from './styles'

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

/**
 * "Não deu para carregar isto", num lugar só.
 *
 * Eram duas declarações idênticas, em `Times` e `TimeDetail` (#315) — byte a
 * byte, o que é o caso fácil: promover não muda aparência nenhuma.
 *
 * O `role="alert"` **não** vem embutido. Quem já estava na tela quando a falha
 * aconteceu precisa ser avisado; quem abriu a página com ela já quebrada
 * recebe o texto na leitura normal, e um alerta ali interromperia à toa. As
 * duas telas passam `role="alert"` porque nas duas o erro chega depois — e a
 * decisão continua de quem renderiza.
 *
 * **O `ErrorMsg` das telas de admin e owner não foi absorvido**, e não é
 * esquecimento: ele é a faixa fina de erro de formulário, que aparece **junto**
 * do conteúdo e some quando a ação dá certo. O `ErrorState` **ocupa o lugar**
 * do conteúdo que não carregou. Unificá-los por serem os dois vermelhos
 * juntaria duas ideias diferentes num componente só — que é como a divergência
 * da #315 começou, e não como ela termina.
 */
export default function ErrorState({ children, ...resto }: ErrorStateProps) {
  return <Caixa {...resto}>{children}</Caixa>
}
