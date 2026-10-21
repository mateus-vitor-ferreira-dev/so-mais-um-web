import { Loader2 } from 'lucide-react'
import { formatarNumero } from '../../utils/numeros'
import { Botao, Contagem, Rodape } from './styles'

interface Props {
  /** Quantos já estão na tela. */
  mostrando: number
  /** Quantos há com o filtro. Sem ele, só "N carregados". */
  total?: number
  temMais: boolean
  carregando: boolean
  aoCarregar: () => void
  /** O substantivo da lista, no plural: "usuários", "estabelecimentos". */
  rotulo: string
}

/**
 * O pé de uma lista paginada (api#618): quantos estão na tela, de quantos, e o
 * botão que traz a próxima página.
 *
 * Botão, e não rolagem infinita: numa tabela de admin a pessoa procura alguém,
 * compara linhas, volta para cima — a rolagem que carrega sozinha empurra o
 * rodapé para longe e tira dela o controle de quanto buscar.
 *
 * A contagem é `aria-live`: quem usa leitor de tela ouve "Mostrando 50 de
 * 1.204" quando a página nova chega, que é o único sinal de que algo mudou
 * abaixo do ponto em que ela está.
 */
export default function CarregarMais({ mostrando, total, temMais, carregando, aoCarregar, rotulo }: Props) {
  if (mostrando === 0) return null

  const contagem = total !== undefined && total > mostrando
    ? `Mostrando ${formatarNumero(mostrando)} de ${formatarNumero(total)} ${rotulo}`
    : `${formatarNumero(mostrando)} ${rotulo}`

  return (
    <Rodape>
      <Contagem aria-live="polite">{contagem}</Contagem>
      {temMais && (
        <Botao type="button" onClick={aoCarregar} disabled={carregando} aria-busy={carregando}>
          {carregando && <Loader2 size={15} aria-hidden="true" className="girando" />}
          {carregando ? 'Carregando…' : 'Carregar mais'}
        </Botao>
      )}
    </Rodape>
  )
}
