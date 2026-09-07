/**
 * A memória do "não, obrigado".
 *
 * Em arquivo próprio porque a regra `react-refresh/only-export-components`
 * recusa função exportada ao lado de componente — a mesma separação que a
 * árvore de rotas teve que fazer entre `paginas.ts` e `index.tsx`.
 *
 * A escolha vive no `localStorage`, e não em estado de sessão: convite que
 * volta a cada visita depois de recusado é o que ensina a pessoa a não ler o
 * que o app mostra. É o mesmo tratamento que a preferência de localização já
 * recebe em `useOrigemDeLocalizacao`.
 */

import { guarde, leia } from '../../utils/armazenamento'

/** Mesma prateleira da preferência de localização (`so-mais-um:localizacao`). */
const CHAVE = 'so-mais-um:convite-de-localizacao'

// O `try/catch` que estava aqui virou `utils/armazenamento` (web#359): a mesma
// guarda existia em quatro lugares, e dois deles a tinham esquecido.
export function foiDispensado(): boolean {
  return leia(CHAVE) === 'dispensado'
}

export function guardeDispensa() {
  guarde(CHAVE, 'dispensado')
}
