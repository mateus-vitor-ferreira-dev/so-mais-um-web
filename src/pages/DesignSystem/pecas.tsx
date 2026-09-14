import AtribuicaoDoTempo from '../../components/AtribuicaoDoTempo'
import CaptainBadge from '../../components/CaptainBadge'
import EmptyState from '../../components/EmptyState'
import ErrorState from '../../components/ErrorState'
import FaixaDoTempo from '../../components/FaixaDoTempo'
import MarcaDoTime from '../../components/MarcaDoTime'
import PrevisaoDoTempo from '../../components/PrevisaoDoTempo'
import PrevisaoDosDias from '../../components/PrevisaoDosDias'
import RoleBadge from '../../components/RoleBadge'
import SeletorDeCorDoTime from '../../components/SeletorDeCorDoTime'
import SeloDoTempo from '../../components/SeloDoTempo'
import { Skeleton, SkeletonCard } from '../../components/Skeleton'
import { CORES_DE_TIME, NOME_DA_COR } from '../../constants/coresDeTime'
import type { HoraDoTempo, LeituraDoTempo } from '../../types/api'
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
const horaDeExemplo = (h: number, extra: Partial<HoraDoTempo>): HoraDoTempo => ({
  inicio: new Date(2026, 8, 14, h).toISOString(),
  fim: new Date(2026, 8, 14, h + 1).toISOString(),
  temperatura: 26 - (h - 17),
  sensacao: 26,
  chanceDeChuva: 10,
  chuvaMm: 0,
  chanceDeTempestade: 0,
  vento: 8,
  rajada: 15,
  uv: 1,
  condicao: 'PARTLY_CLOUDY',
  risco: 'NENHUM',
  motivos: [],
  ...extra,
})

const HORAS_DE_EXEMPLO: HoraDoTempo[] = [
  horaDeExemplo(17, { condicao: 'CLEAR' }),
  horaDeExemplo(18, {}),
  horaDeExemplo(19, { chanceDeChuva: 40, condicao: 'LIGHT_RAIN', risco: 'ATENCAO', motivos: ['CHUVA'] }),
  horaDeExemplo(20, { chanceDeChuva: 80, chanceDeTempestade: 45, condicao: 'THUNDERSTORM', risco: 'ALTO', motivos: ['TEMPESTADE', 'CHUVA'] }),
]

const LEITURA_POR_HORA: LeituraDoTempo = {
  alcance: 'HORA',
  risco: 'ALTO',
  motivos: ['TEMPESTADE', 'CHUVA'],
  horas: HORAS_DE_EXEMPLO,
}

const LEITURA_DO_DIA: LeituraDoTempo = {
  alcance: 'DIA',
  risco: 'ATENCAO',
  motivos: ['CHUVA'],
  dia: {
    data: '2026-09-20', maxima: 24, minima: 15, sensacaoMaxima: 25, chanceDeChuva: 70,
    chanceDeTempestade: 10, vento: 12, condicao: 'RAIN', risco: 'ATENCAO', motivos: ['CHUVA'],
  },
}

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
  {
    nome: 'FaixaDoTempo',
    onde: 'components/FaixaDoTempo',
    porque:
      'O tempo hora a hora aparece na agenda do dono e na página da partida, e as duas precisam ler ' +
      'o risco do mesmo jeito. A cor está só na borda, e o motivo vai por escrito no nome acessível: ' +
      'quem não distingue o vermelho não perde a tempestade.',
    estados: [
      { rotulo: 'sem risco', render: () => <FaixaDoTempo horas={HORAS_DE_EXEMPLO.slice(0, 2)} /> },
      { rotulo: 'com atenção e risco alto', render: () => <FaixaDoTempo horas={HORAS_DE_EXEMPLO} /> },
    ],
  },
  {
    nome: 'AtribuicaoDoTempo',
    onde: 'components/AtribuicaoDoTempo',
    porque:
      'Os termos da Weather API exigem o crédito no mesmo bloco do dado. É contrato, e não enfeite: ' +
      'escrita à mão em cada tela, a frase diverge ou some na terceira.',
    estados: [{ rotulo: 'abaixo do dado', render: () => <AtribuicaoDoTempo /> }],
  },
  {
    nome: 'PrevisaoDoTempo',
    onde: 'components/PrevisaoDoTempo',
    porque:
      'Um estado por alcance, e o texto de cada um é a decisão: sem "a previsão por hora aparece dois ' +
      'dias antes", a pessoa pergunta por que não há faixa. O erro é cinza, e não vermelho: previsão ' +
      'fora do ar não é defeito da partida.',
    estados: [
      { rotulo: 'por hora, com risco', render: () => <PrevisaoDoTempo leitura={LEITURA_POR_HORA} carregando={false} erro={false} /> },
      { rotulo: 'do dia', render: () => <PrevisaoDoTempo leitura={LEITURA_DO_DIA} carregando={false} erro={false} /> },
      {
        rotulo: 'ainda longe',
        render: () => (
          <PrevisaoDoTempo
            leitura={{ alcance: 'AINDA_LONGE', disponivelEm: '2026-09-21', risco: 'NENHUM', motivos: [] }}
            carregando={false}
            erro={false}
          />
        ),
      },
      { rotulo: 'quadra coberta', render: () => <PrevisaoDoTempo leitura={{ alcance: 'COBERTA', risco: 'NENHUM', motivos: [] }} carregando={false} erro={false} /> },
      { rotulo: 'indisponível', render: () => <PrevisaoDoTempo carregando={false} erro /> },
    ],
  },
  {
    nome: 'SeloDoTempo',
    onde: 'components/SeloDoTempo',
    porque:
      'O tempo num cartão cabe numa linha: a temperatura e, havendo, o risco. Sem previsão o selo some, ' +
      'porque "sem previsão" repetido em vinte cartões não diz nada.',
    estados: [
      { rotulo: 'por hora', render: () => <SeloDoTempo leitura={LEITURA_POR_HORA} /> },
      { rotulo: 'do dia', render: () => <SeloDoTempo leitura={LEITURA_DO_DIA} /> },
      { rotulo: 'só o risco, no jogo da chave', render: () => <SeloDoTempo leitura={LEITURA_POR_HORA} soRisco /> },
    ],
  },
  {
    nome: 'PrevisaoDosDias',
    onde: 'components/PrevisaoDosDias',
    porque:
      'Torneio dura dias, e a pergunta de quem organiza é que dia vai chover. Uma linha por dia, com a ' +
      'previsão do dia; o risco por horário fica no selo de cada jogo.',
    estados: [
      {
        rotulo: 'três dias',
        render: () => (
          <PrevisaoDosDias
            carregando={false}
            erro={false}
            dias={[
              { data: '2026-09-19', leitura: { ...LEITURA_DO_DIA, risco: 'NENHUM', motivos: [] } },
              { data: '2026-09-20', leitura: LEITURA_DO_DIA },
              { data: '2026-09-30', leitura: { alcance: 'AINDA_LONGE', disponivelEm: '2026-09-21', risco: 'NENHUM', motivos: [] } },
            ]}
          />
        ),
      },
    ],
  },
]
