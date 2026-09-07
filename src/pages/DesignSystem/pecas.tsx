import CaptainBadge from '../../components/CaptainBadge'
import EmptyState from '../../components/EmptyState'
import ErrorState from '../../components/ErrorState'
import MarcaDoTime from '../../components/MarcaDoTime'
import RoleBadge from '../../components/RoleBadge'
import SeletorDeCorDoTime from '../../components/SeletorDeCorDoTime'
import { Skeleton, SkeletonCard } from '../../components/Skeleton'
import { CORES_DE_TIME, NOME_DA_COR } from '../../constants/coresDeTime'
import { Amostra, BotaoDeExemplo, Fileira } from './styles'

export interface Peca {
  /** Vira âncora e título. */
  nome: string
  /** Onde o componente mora, para quem for mexer. */
  onde: string
  /** Por que ele existe — a decisão, não a descrição. */
  porque: string
  /** Cada estado que o componente tem, desenhado. */
  estados: { rotulo: string; render: () => React.ReactNode }[]
}

/**
 * O vocabulário visual do app, desenhado (#315, #430).
 *
 * ## Por que isto é código, e não um arquivo no Figma
 *
 * A #315 nasceu de catorze `EmptyState` com nove aparências, e o diagnóstico
 * dela foi que **não existia um lugar onde alguém decidisse** como o app diz
 * "não há nada aqui". Ela pediu componente **e** desenho, porque *"componente
 * sem desenho volta a divergir na próxima página; desenho sem componente não é
 * aplicado por ninguém"*.
 *
 * Um protótipo desenhado à parte resolve metade e cria a outra: ele começa
 * igual ao código e envelhece sozinho, sem nada acusar — que é exatamente o
 * modo de falhar que a #315 descreve, só que do outro lado.
 *
 * Este catálogo **importa os componentes de verdade**. Não existe versão
 * "do desenho" para divergir da versão "do código": mudou o componente, mudou
 * o que se vê aqui, porque é o mesmo módulo.
 *
 * ## O que ele não resolve
 *
 * Ele não decide nada por ninguém. Continua sendo trabalho humano escolher o
 * tom de uma mensagem ou o peso de um selo — o catálogo só garante que a
 * escolha tenha **um lugar**, e que dê para vê-la nos dois temas antes de
 * repeti-la numa tela nova.
 */
export const PECAS: Peca[] = [
  {
    nome: 'EmptyState',
    onde: 'components/EmptyState',
    porque:
      'Eram catorze declarações em catorze styles.ts, com nove aparências para a mesma ideia. ' +
      'A moldura tracejada acompanha o título por padrão: ela diz "aqui caberia conteúdo", e vazio ' +
      'de canto de tela não pode virar o elemento mais pesado da página.',
    estados: [
      {
        rotulo: 'texto simples — a maioria das telas',
        render: () => <EmptyState>Nenhum usuário encontrado.</EmptyState>,
      },
      {
        rotulo: 'com ícone — CriarPartida, Tournaments',
        render: () => <EmptyState icone="🏆">Nenhum torneio encontrado.</EmptyState>,
      },
      {
        rotulo: 'com título e ação — vira região nomeada, e ganha moldura',
        render: () => (
          <EmptyState
            titulo="Você ainda não tem time"
            acao={<BotaoDeExemplo type="button">Criar meu primeiro time</BotaoDeExemplo>}
          >
            Time é o grupo que joga junto toda semana.
          </EmptyState>
        ),
      },
      {
        rotulo: 'com moldura, sem título — TimeDetail',
        render: () => (
          <EmptyState comMoldura>Este time ainda não jogou nenhuma partida.</EmptyState>
        ),
      },
    ],
  },
  {
    nome: 'ErrorState',
    onde: 'components/ErrorState',
    porque:
      'Ocupa o LUGAR do conteúdo que não carregou — diferente do ErrorMsg, que é faixa fina ' +
      'aparecendo junto do conteúdo e sumindo quando a ação dá certo. O role="alert" não vem ' +
      'embutido: quem abriu a página já quebrada recebe o texto na leitura normal.',
    estados: [
      {
        rotulo: 'padrão',
        render: () => <ErrorState>Não deu para carregar seus times.</ErrorState>,
      },
    ],
  },
  {
    nome: 'CaptainBadge',
    onde: 'components/CaptainBadge',
    porque:
      'Existia duas vezes, idêntico byte a byte, com DOIS nomes — e é a divergência de nome que ' +
      'faz a terceira tela inventar uma terceira peça. A coroa vem de dentro; o texto, de fora, ' +
      'porque ele legitimamente difere entre as telas.',
    estados: [
      { rotulo: 'no cartão do seu time', render: () => <CaptainBadge>Você é o capitão</CaptainBadge> },
      { rotulo: 'na lista de membros', render: () => <CaptainBadge>Capitão</CaptainBadge> },
    ],
  },
  {
    nome: 'MarcaDoTime',
    onde: 'components/MarcaDoTime',
    porque:
      'A marca visual do time (#314): iniciais com cor, de uma paleta fechada de oito. O banco ' +
      'guarda o NOME da cor, não o hexadecimal — o tom que fica bom no claro some no escuro. ' +
      'Time sem cor escolhida cai numa cor derivada do nome, estável entre sessões e aparelhos.',
    estados: [
      {
        rotulo: 'a paleta fechada — oito, porque acima disso elas se confundem',
        render: () => (
          <Fileira>
            {CORES_DE_TIME.map((cor) => (
              <Amostra key={cor}>
                <MarcaDoTime nome={NOME_DA_COR[cor]} cor={cor} />
                <span className="legenda">{NOME_DA_COR[cor]}</span>
              </Amostra>
            ))}
          </Fileira>
        ),
      },
      {
        rotulo: 'os três tamanhos — convite, cartão, cabeçalho',
        render: () => (
          <Fileira>
            <MarcaDoTime nome="Fúria Azul" cor="AZUL" tamanho="sm" />
            <MarcaDoTime nome="Fúria Azul" cor="AZUL" tamanho="md" />
            <MarcaDoTime nome="Fúria Azul" cor="AZUL" tamanho="lg" />
          </Fileira>
        ),
      },
      {
        rotulo: 'sem cor escolhida — a cor sai do nome, e as iniciais descartam ligações',
        render: () => (
          <Fileira>
            <MarcaDoTime nome="Os Boleiros" cor={null} />
            <MarcaDoTime nome="Time de Futsal" cor={null} />
            <MarcaDoTime nome="Águias Unidas" cor={null} />
            <MarcaDoTime nome="Fúria" cor={null} />
          </Fileira>
        ),
      },
    ],
  },
  {
    nome: 'SeletorDeCorDoTime',
    onde: 'components/SeletorDeCorDoTime',
    porque:
      'Grupo de rádio, e não um <select>: num select a cor viraria a palavra "Roxo" numa lista, ' +
      'pedindo que a pessoa imagine o resultado. Cada opção tem o nome da cor como rótulo ' +
      'acessível, porque quem não distingue as cores escolhe pelo nome.',
    estados: [
      {
        rotulo: 'sem escolha — a derivada do nome já vem marcada',
        render: () => <SeletorDeCorDoTime valor={null} aoEscolher={() => {}} nome="Fúria Azul" />,
      },
      {
        rotulo: 'com escolha — e o caminho para desfazê-la',
        render: () => <SeletorDeCorDoTime valor="ROXO" aoEscolher={() => {}} nome="Fúria Azul" />,
      },
    ],
  },
  {
    nome: 'RoleBadge',
    onde: 'components/RoleBadge',
    porque:
      'O papel do usuário. A chave USER não é papel da api — é o rótulo de fallback que o PLAYER ' +
      'acaba exibindo, e está explicitado no tipo em vez de escondido.',
    estados: [
      {
        rotulo: 'os três papéis',
        render: () => (
          <Fileira>
            <RoleBadge role="ADMIN" />
            <RoleBadge role="OWNER" />
            <RoleBadge role="PLAYER" />
          </Fileira>
        ),
      },
    ],
  },
  {
    nome: 'Skeleton',
    onde: 'components/Skeleton',
    porque:
      'Carregando não é vazio: um pede espera, o outro pede ação, e o mesmo desenho para os dois ' +
      'faz a pessoa agir na hora de esperar. Dois EmptyState do app eram na verdade isto — a Home ' +
      'e o Owner/Inventory, este último com um spinner morando dentro do componente do vazio.',
    estados: [
      { rotulo: 'linha', render: () => <Skeleton height={16} /> },
      { rotulo: 'cartão', render: () => <SkeletonCard count={1} /> },
    ],
  },
]
