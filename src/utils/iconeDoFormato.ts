import { LayoutGrid, ListOrdered, Repeat, Shuffle, Swords, type LucideIcon } from 'lucide-react'

/**
 * O ícone de cada formato de torneio, na mesma família de traço do resto da
 * interface (#492).
 *
 * Eram emojis (⚡ 📊 🎯 🔁 ♟️): cada sistema desenha o seu, com cor e peso
 * próprios, e eles brigavam com os ícones da linha de baixo no mesmo cartão.
 * A API devolve o formato e não opina sobre ícone; a escolha é de front, e
 * fica aqui para a lista e o detalhe do torneio mostrarem o mesmo.
 */
export const ICONE_DO_FORMATO: Record<string, LucideIcon> = {
  KNOCKOUT:            Swords,
  LEAGUE:              ListOrdered,
  GROUPS_AND_KNOCKOUT: LayoutGrid,
  DOUBLE_ELIMINATION:  Repeat,
  SWISS:               Shuffle,
}
