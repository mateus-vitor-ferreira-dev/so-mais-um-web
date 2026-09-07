import type { PartidaStatus } from '../types/api'

/** O tom do selo, para a tela pintar o chip. */
export type TomDoStatus = 'aberta' | 'cheia' | 'fim' | 'cancelada'

export interface RotuloDeStatus {
  label: string
  tom: TomDoStatus
  /** Bolinha colorida, para a tela que mostra o status por extenso. */
  emoji: string
}

/**
 * Como o app chama cada estado de uma partida — num lugar só (#315).
 *
 * ## O que estava errado
 *
 * Três páginas tinham o próprio mapa, e os três discordavam:
 *
 * | status | MinhasPartidas | PartidaDetail | TimeDetail |
 * |---|---|---|---|
 * | `WAITING`   | Aguardando  | Aguardando | **Aberta** |
 * | `FULL`      | Lota**do**  | Lota**do**  | Lota**da** |
 * | `FINISHED`  | Finaliza**do** | Finaliza**do** | Finaliza**da** |
 * | `CANCELLED` | Cancela**do** | Cancela**do** | Cancela**da** |
 *
 * Ninguém errou: não havia onde acertar. Duas divergências diferentes, e cada
 * uma exigiu a sua decisão.
 *
 * ## O gênero: ficou o feminino
 *
 * A palavra do produto é **partida**, e ela é feminina — "Criar Partida",
 * "Minhas Partidas", "Nenhuma partida disponível". "Partida · Lotado" é erro
 * de concordância visível para quem lê, e o masculino só existia porque as
 * duas páginas mais antigas concordavam com um substantivo que não está
 * escrito em lugar nenhum.
 *
 * ## `WAITING`: ficou "Aguardando", e não "Aberta"
 *
 * Este é o caso em que a maioria e o argumento apontam para o mesmo lado, mas
 * pelo argumento — não pela maioria.
 *
 * **"Aberta" colide com o vocabulário de visibilidade.** O produto já usa
 * *Pública*, *Por link* e *Privada* para dizer **quem vê e quem entra**
 * (`ConfiguracaoDeAcesso`, `MarcaDeVisibilidade`). Uma partida "Aberta" seria
 * lida como "qualquer um entra", e é justamente o que o status **não** diz:
 * uma partida `WAITING` pode ser privada e exigir convite.
 *
 * "Aguardando" descreve o que de fato distingue este estado do `FULL` — ainda
 * cabe gente — sem prometer nada sobre quem pode ocupar a vaga.
 *
 * O tom `'aberta'` do chip ficou com o nome antigo de propósito: ele nomeia a
 * **cor**, não o rótulo, e renomeá-lo junto misturaria duas mudanças numa.
 *
 * ## O que ficou de fora, e por quê
 *
 * Este arquivo fala de **partida**, e só dela. Estes outros rótulos parecem
 * iguais e não são — cada um concorda com outro substantivo, ou descreve outra
 * coisa:
 *
 * | onde | rótulo | por que fica |
 * |---|---|---|
 * | `DayUsesDoDia` | "Lotado" | concorda com **o day use**, masculino. Trazê-lo para cá o feminizaria errado |
 * | `Owner/Courts` | "Aberta" / "Fechada" | é o expediente da **quadra**, não o estado de uma partida — e é justamente aqui que "aberta" quer dizer "funcionando" |
 * | `Owner/Requests` | "Aguardando" / "Aprovada" / "Rejeitada" | é a **solicitação de espaço**, outro fluxo |
 * | `Owner/Professores`, `TournamentRegistrations`, `DivisionRegistration` | "Aguardando resposta" / "Aguardando o organizador" | são **convites e inscrições** esperando outra pessoa; a partida não espera ninguém em particular |
 *
 * O `StatusChip` do `TimeDetail` também ficou onde estava: uma tela só desenha
 * chip de status, e promover o **desenho** com um usuário seria inventar
 * necessidade. O que precisava sair de lá era o **vocabulário**, e saiu.
 */
export const STATUS_DA_PARTIDA: Record<PartidaStatus, RotuloDeStatus> = {
  WAITING:   { label: 'Aguardando', tom: 'aberta',    emoji: '🟢' },
  FULL:      { label: 'Lotada',     tom: 'cheia',     emoji: '🟡' },
  FINISHED:  { label: 'Finalizada', tom: 'fim',       emoji: '🔵' },
  CANCELLED: { label: 'Cancelada',  tom: 'cancelada', emoji: '🔴' },
}

/** O rótulo de um status, com desfecho seguro para valor que a api ainda não tinha. */
export function rotuloDoStatus(status: PartidaStatus | string): RotuloDeStatus {
  return STATUS_DA_PARTIDA[status as PartidaStatus] ?? { label: status, tom: 'fim', emoji: '⚪' }
}
