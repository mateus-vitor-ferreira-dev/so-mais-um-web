import { ThemeProvider } from 'styled-components'
import { darkTheme, lightTheme } from '../../styles/theme'
import { PECAS } from './pecas'
import type { Peca } from './pecas'
import {
  Cabecalho, Estado, Indice, Pagina, Painéis, Painel, Secao, Token, Tokens,
} from './styles'

/** Os tokens que as peças deste catálogo realmente usam. */
const TOKENS = [
  'bgCard', 'bgPage', 'border', 'textPrimary', 'textSecondary', 'textMuted',
  'primary', 'primaryLight', 'primaryDark', 'error', 'errorLight',
] as const

const ancora = (nome: string) => nome.toLowerCase()

/**
 * Uma peça, desenhada nos dois temas.
 *
 * O `ThemeProvider` é aninhado de propósito: ele sobrescreve o tema do app só
 * para a subárvore dele, então os dois painéis renderizam claro e escuro ao
 * mesmo tempo — independente do tema em que quem visita está. É o que torna
 * "nos dois temas" verificável numa olhada, em vez de exigir alternar e
 * lembrar como era.
 */
function PecaNosDoisTemas({ peca }: { peca: Peca }) {
  return (
    <Secao id={ancora(peca.nome)}>
      <h2>{peca.nome}</h2>
      <p className="onde">{peca.onde}</p>
      <p className="porque">{peca.porque}</p>

      <Painéis>
        {([['Claro', lightTheme, false], ['Escuro', darkTheme, true]] as const).map(
          ([rotulo, tema, escuro]) => (
            <Painel key={rotulo} $escuro={escuro}>
              <div className="titulo">{rotulo}</div>
              <div className="corpo">
                <ThemeProvider theme={tema}>
                  <>
                    {peca.estados.map((estado) => (
                      <Estado key={estado.rotulo}>
                        <div className="rotulo">{estado.rotulo}</div>
                        {estado.render()}
                      </Estado>
                    ))}
                  </>
                </ThemeProvider>
              </div>
            </Painel>
          ),
        )}
      </Painéis>
    </Secao>
  )
}

function Paleta() {
  return (
    <Secao id="tokens">
      <h2>Tokens</h2>
      <p className="onde">styles/theme.ts</p>
      <p className="porque">
        As peças acima não escrevem cor: elas pedem token. É por isso que trocar
        o tema funciona sem tocar em componente nenhum — e é por isso que uma cor
        escrita à mão dentro de um componente é o começo da próxima divergência.
      </p>

      <Painéis>
        {([['Claro', lightTheme, false], ['Escuro', darkTheme, true]] as const).map(
          ([rotulo, tema, escuro]) => (
            <Painel key={rotulo} $escuro={escuro}>
              <div className="titulo">{rotulo}</div>
              <div className="corpo">
                <Tokens>
                  {TOKENS.map((nome) => (
                    <Token key={nome}>
                      <div
                        className="amostra"
                        style={{ background: tema.colors[nome] }}
                      />
                      <div className="nome" style={{ color: tema.colors.textPrimary }}>{nome}</div>
                      <div className="valor">{tema.colors[nome]}</div>
                    </Token>
                  ))}
                </Tokens>
              </div>
            </Painel>
          ),
        )}
      </Painéis>
    </Secao>
  )
}

/**
 * O catálogo do vocabulário visual (#315, #430).
 *
 * A #315 pedia que os componentes promovidos fossem registrados num protótipo,
 * nos dois temas. O protótipo não existe e não vai existir por ora — então o
 * registro é este, e ele tem uma propriedade que um arquivo de desenho não
 * teria: **importa os componentes de verdade**, e por isso não envelhece
 * sozinho.
 *
 * Rota pública e fora de qualquer menu. Pública porque não mostra dado de
 * ninguém e porque é na URL de preview do PR que a revisão de desenho
 * acontece; fora do menu porque é ferramenta de quem constrói, não tela de
 * produto.
 */
export default function DesignSystem() {
  return (
    <Pagina>
      <Cabecalho>
        <h1>Vocabulário visual do Só+1</h1>
        <p>
          As peças que o app usa para dizer as mesmas coisas em telas diferentes —
          que não há nada aqui, que algo falhou, de quem é este time. Cada uma
          aparece nos <strong>dois temas</strong>, com todos os estados que ela tem.
        </p>
        <p>
          Isto <strong>não é uma maquete</strong>: os componentes abaixo são
          importados de <code>src/components</code>. Mudou o componente, mudou o
          que se vê aqui — não existe versão do desenho para divergir da versão
          do código, que é o defeito que a #315 corrigiu e que um protótipo
          separado reintroduziria.
        </p>
        <p>
          Peça nova do vocabulário entra em <code>pecas.tsx</code>. Um teste
          reprova quando aparece componente que não está nem aqui nem na lista
          do que não é vocabulário — a decisão pode ser qualquer uma, menos
          ficar implícita.
        </p>

        <Indice>
          {PECAS.map((p) => (
            <a key={p.nome} href={`#${ancora(p.nome)}`}>{p.nome}</a>
          ))}
          <a href="#tokens">Tokens</a>
        </Indice>
      </Cabecalho>

      {PECAS.map((peca) => (
        <PecaNosDoisTemas key={peca.nome} peca={peca} />
      ))}

      <Paleta />
    </Pagina>
  )
}
