import { createElement } from 'react'
import { iconeDaCondicao } from '../../utils/previsao'

/**
 * O ícone da condição do tempo, do tamanho do texto em volta (#511).
 *
 * Eram emojis (⛅ 🌧️ ☀️): cada sistema desenha o seu, com cor própria, e no
 * Windows alguns saíam em preto e branco no meio da faixa colorida. O `1em`
 * deixa quem usa decidir o tamanho pelo `font-size`, como o emoji deixava.
 *
 * `createElement`, e não `<Icone />`: o ícone é escolhido por valor, e a regra
 * `static-components` lê a variável com letra maiúscula como componente novo a
 * cada render.
 */
export default function IconeDoTempo({ condicao }: { condicao: string | null }) {
  return createElement(iconeDaCondicao(condicao), {
    size: '1em',
    'aria-hidden': true,
    focusable: false,
    style: { flexShrink: 0, verticalAlign: '-0.125em' },
  })
}
