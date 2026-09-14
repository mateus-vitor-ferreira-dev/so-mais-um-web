import { useId, type ReactNode } from 'react'
import { MapPin } from 'lucide-react'
import { getSportMeta } from '../../hooks/useSports'
import SportIcon from '../SportIcon'
import { diaDaSemanaEMes, hora } from '../../utils/datas'
import { valorPorPessoa } from '../../utils/formatCurrency'
import { contagem } from '../../utils/plural'
import { AlvoDoCartao } from '../../styles/cartaoClicavel'
import type { CourtType, Partida } from '../../types/api'
import {
  Barra, Cartao, Cabecalho, Esporte, Extra, IconeDoEsporte, Local, LinkDoMapa, NomeDoEsporte, Preco, Quando,
  Rodape, Selos, Vagas,
} from './styles'

export type PartidaDoCartao = Pick<Partida, 'id' | 'date' | 'maxPlayers' | 'totalValue' | '_count'> & {
  court?: {
    name?: string | null
    type?: CourtType | string | null
    place?: { name?: string | null; neighborhood?: string | null; city?: string | null } | null
  } | null
}

export interface CartaoDePartidaProps {
  partida: PartidaDoCartao
  /** O clique no cartão. O botão de dentro precisa de `stopPropagation`. */
  aoAbrir: () => void
  /** Status, visibilidade, distância: tudo o que vai à direita do esporte. */
  selos?: ReactNode
  /** Entre o local e as vagas: a etiqueta de requisitos, por exemplo. */
  extra?: ReactNode
  /** Abaixo do preço: o botão de entrar, as ações de quem organiza. */
  rodape?: ReactNode
  /** O link do mapa, quando a tela tem como montá-lo. */
  mapaUrl?: string | null
}

/**
 * O cartão de partida do app — um só (web#492).
 *
 * ## Por que existe
 *
 * O Início, o Quero Jogar e Minhas Partidas desenhavam a mesma partida de três
 * jeitos: o dia saía "ter., 15 de set · 19:00" num e "15/09/2026" + "19:00" em
 * duas linhas no outro, as vagas estavam no selo, embaixo da barra ou em lugar
 * nenhum, e o valor por pessoa aparecia em dois dos três.
 *
 * ## A hierarquia
 *
 * **Esporte, dia e hora primeiro**, e o espaço depois. É a pergunta de quem
 * procura jogo: "tem vôlei na quinta à noite?". O nome do espaço, que era o
 * título, vira a linha do local — e é o que mais quebra linha, então é também o
 * que pode encolher.
 *
 * As vagas e o valor ficam **sempre no mesmo lugar**, embaixo, com a barra. O
 * mapa é um link discreto na cor da marca, e não o azul de link do navegador.
 */
export default function CartaoDePartida({ partida, aoAbrir, selos, extra, rodape, mapaUrl }: CartaoDePartidaProps) {
  const esporte = getSportMeta(partida.court?.type as CourtType)
  const confirmados = partida._count?.participations ?? 0
  const vagas = Math.max(partida.maxPlayers - confirmados, 0)
  const lotada = vagas === 0
  const progresso = partida.maxPlayers > 0 ? Math.min((confirmados / partida.maxPlayers) * 100, 100) : 0
  const bairro = [partida.court?.place?.neighborhood, partida.court?.place?.city].filter(Boolean).join(', ')
  const idDoQuando = useId()

  return (
    // Clicável como os cartões que substituiu, e sem `role="link"`: o cartão tem
    // botão e link dentro, e elemento interativo dentro de link é ARIA inválido.
    // O teclado chega pelo nome do esporte, que é um botão (web#493).
    <Cartao onClick={aoAbrir}>
      <Cabecalho>
        <Esporte>
          <IconeDoEsporte aria-hidden="true">
            <SportIcon icon={esporte.icon} fallback={esporte.iconFallback} />
          </IconeDoEsporte>
          <div>
            <NomeDoEsporte>
              <AlvoDoCartao aria-describedby={idDoQuando}>{esporte.label}</AlvoDoCartao>
            </NomeDoEsporte>
            <Quando id={idDoQuando}>
              {diaDaSemanaEMes(partida.date)} · <strong>{hora(partida.date)}</strong>
            </Quando>
          </div>
        </Esporte>
        {selos && <Selos>{selos}</Selos>}
      </Cabecalho>

      <Local>
        <MapPin size={14} aria-hidden="true" />
        <span>
          {/* O espaço em elemento próprio: é o nome que a pessoa procura na tela. */}
          <span>{partida.court?.place?.name || 'Local a definir'}</span>
          {partida.court?.name && <span className="quadra"> · {partida.court.name}</span>}
          {bairro && <small>{bairro}</small>}
        </span>
      </Local>
      {mapaUrl && (
        <LinkDoMapa href={mapaUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
          Ver no mapa
        </LinkDoMapa>
      )}

      {extra && <Extra>{extra}</Extra>}

      <Barra $progresso={progresso} $lotada={lotada} aria-hidden="true">
        <div />
      </Barra>
      <Vagas>
        <span>{confirmados} / {partida.maxPlayers} confirmados</span>
        <span>{lotada ? 'Lotada' : contagem(vagas, 'vaga restante', 'vagas restantes')}</span>
      </Vagas>

      <Preco>{valorPorPessoa(partida.totalValue, partida.maxPlayers)} / pessoa</Preco>

      {rodape && <Rodape>{rodape}</Rodape>}
    </Cartao>
  )
}
