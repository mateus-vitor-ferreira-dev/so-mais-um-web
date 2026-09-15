import { useId, useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Busca, Escolhido, EscolhidoTexto, Opcao, OpcaoEmail, Opcoes, SemOpcao, Trocar } from './styles'

export interface DonoDaBusca {
  id: string
  name: string
  email: string
}

interface Props {
  donos: DonoDaBusca[]
  carregando: boolean
  donoId: string
  aoEscolher: (id: string) => void
  /** O erro do campo, dito pela tela: "escolha um dono da lista". */
  erro?: string
}

/** Quantos cabem na lista aberta. Mais que isso, quem busca digita mais uma letra. */
const MAXIMO = 8

const semAcento = (texto: string) =>
  texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/**
 * A busca de dono por nome ou e-mail, no lugar do `<select>` com todos (web#502).
 *
 * O `<select>` listava a base inteira de donos numa coluna só, e a opção mais
 * longa decidia a largura: no modal, ela passava da borda da caixa. Aqui a
 * pessoa digita o que sabe — quase sempre o e-mail que recebeu no WhatsApp — e
 * escolhe entre poucos.
 *
 * Um combobox com lista (padrão do WAI-ARIA): setas andam, Enter escolhe, Esc
 * fecha. Escolhido, o campo vira o nome com "Trocar", para não parecer que o
 * texto digitado é o que vai para a api.
 */
export default function BuscaDeDono({ donos, carregando, donoId, aoEscolher, erro }: Props) {
  const [termo, setTermo] = useState('')
  const [aberta, setAberta] = useState(false)
  const [destaque, setDestaque] = useState(0)
  const idDaLista = useId()
  const idDoErro = useId()

  const escolhido = donos.find((dono) => dono.id === donoId)

  const achados = useMemo(() => {
    const busca = semAcento(termo.trim())
    if (!busca) return donos.slice(0, MAXIMO)
    return donos
      .filter((dono) => semAcento(dono.name).includes(busca) || semAcento(dono.email).includes(busca))
      .slice(0, MAXIMO)
  }, [donos, termo])

  const escolher = (dono: DonoDaBusca) => {
    aoEscolher(dono.id)
    setTermo('')
    setAberta(false)
  }

  const aoTeclar = (evento: KeyboardEvent<HTMLInputElement>) => {
    if (evento.key === 'ArrowDown') {
      evento.preventDefault()
      setAberta(true)
      setDestaque((atual) => Math.min(atual + 1, achados.length - 1))
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault()
      setDestaque((atual) => Math.max(atual - 1, 0))
    } else if (evento.key === 'Enter' && aberta && achados[destaque]) {
      // Sem isto o Enter enviaria o formulário com o dono ainda vazio.
      evento.preventDefault()
      escolher(achados[destaque])
    } else if (evento.key === 'Escape') {
      setAberta(false)
    }
  }

  if (escolhido) {
    return (
      <Escolhido>
        <EscolhidoTexto>
          <strong>{escolhido.name}</strong>
          <span>{escolhido.email}</span>
        </EscolhidoTexto>
        <Trocar type="button" onClick={() => aoEscolher('')}>
          Trocar
        </Trocar>
      </Escolhido>
    )
  }

  return (
    <div>
      <Busca
        type="search"
        role="combobox"
        aria-label="Dono"
        aria-expanded={aberta}
        aria-controls={idDaLista}
        aria-autocomplete="list"
        aria-activedescendant={aberta && achados[destaque] ? `${idDaLista}-${achados[destaque].id}` : undefined}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? idDoErro : undefined}
        placeholder={carregando ? 'Carregando donos…' : 'Busque por nome ou e-mail'}
        autoComplete="off"
        value={termo}
        onChange={(evento) => {
          setTermo(evento.target.value)
          setDestaque(0)
          setAberta(true)
        }}
        onFocus={() => setAberta(true)}
        onBlur={() => setAberta(false)}
        onKeyDown={aoTeclar}
      />
      {aberta && !carregando && (
        <Opcoes id={idDaLista} role="listbox" aria-label="Donos encontrados">
          {achados.length === 0 ? (
            <SemOpcao>Nenhum dono sem assinatura com esse nome ou e-mail.</SemOpcao>
          ) : (
            achados.map((dono, indice) => (
              <Opcao
                key={dono.id}
                id={`${idDaLista}-${dono.id}`}
                role="option"
                aria-selected={indice === destaque}
                $destaque={indice === destaque}
                // `mousedown`, e não `click`: o clique chega depois do `blur`, e
                // uma lista que fecha no blur sumiria antes de receber o clique.
                onMouseDown={(evento) => {
                  evento.preventDefault()
                  escolher(dono)
                }}
              >
                {dono.name}
                <OpcaoEmail>{dono.email}</OpcaoEmail>
              </Opcao>
            ))
          )}
        </Opcoes>
      )}
      {erro && <SemOpcao id={idDoErro} role="alert" $erro>{erro}</SemOpcao>}
    </div>
  )
}
