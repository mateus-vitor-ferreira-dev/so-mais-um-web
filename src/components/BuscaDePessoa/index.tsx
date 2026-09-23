import { useEffect, useId, useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useBuscaDeUsuarios } from '../../hooks/useBuscaDeUsuarios'
import type { UserRole } from '../../types/api'
import { Busca, Escolhido, EscolhidoTexto, Opcao, OpcaoEmail, Opcoes, SemOpcao, Trocar } from './styles'

export interface PessoaDaBusca {
  id: string
  name: string
  email: string
}

interface Props {
  /** Só quem tem este papel. Sem ele, qualquer um. */
  papel?: UserRole
  /** Quem não pode ser escolhido aqui, mesmo casando com a busca (o dono que já assina). */
  excluir?: (pessoa: PessoaDaBusca) => boolean
  /** O nome do campo, para o leitor de tela: "Dono", "Jogador". */
  rotulo: string
  /** O que dizer quando a busca não acha ninguém que sirva. */
  semResultado: string
  pessoaId: string
  aoEscolher: (id: string) => void
  /** O erro do campo, dito pela tela: "escolha um dono da lista". */
  erro?: string
}

/** Quantos cabem na lista aberta. Mais que isso, quem busca digita mais uma letra. */
const MAXIMO = 8

/**
 * A folga para o `excluir`: pede mais do que mostra, porque os excluídos saem
 * depois de a página chegar. Sem ela, oito resultados com três donos que já
 * assinam virariam cinco sugestões.
 */
const FOLGA = 12

/**
 * Busca de pessoa por nome ou e-mail, no lugar do `<select>` com todos (web#502,
 * api#618).
 *
 * Nasceu como a busca de dono das Assinaturas, que filtrava no navegador a base
 * de donos inteira. Desde a api#618 ela pergunta ao servidor a cada tecla (com
 * debounce), e só os que casam atravessam a rede. É a mesma busca em
 * Assinaturas e em Estabelecimentos.
 *
 * Um combobox com lista (padrão do WAI-ARIA): setas andam, Enter escolhe, Esc
 * fecha. Escolhido, o campo vira o nome com "Trocar", para não parecer que o
 * texto digitado é o que vai para a api.
 */
export default function BuscaDePessoa({ papel, excluir, rotulo, semResultado, pessoaId, aoEscolher, erro }: Props) {
  const [termo, setTermo] = useState('')
  const [aberta, setAberta] = useState(false)
  const [destaque, setDestaque] = useState(0)
  /**
   * Quem foi escolhido, guardado aqui: a lista da busca muda a cada tecla, e o
   * escolhido não pode sumir do campo porque a próxima busca não o trouxe.
   */
  const [escolhida, setEscolhida] = useState<PessoaDaBusca | null>(null)
  const idDaLista = useId()
  const idDoErro = useId()

  const { pessoas, buscando, carregando } = useBuscaDeUsuarios({
    termo,
    papel,
    limite: MAXIMO + (excluir ? FOLGA : 0),
    habilitada: aberta || termo.length > 0,
  })

  const achados = useMemo(
    () => (excluir ? pessoas.filter((pessoa) => !excluir(pessoa)) : pessoas).slice(0, MAXIMO),
    [pessoas, excluir],
  )

  // A tela limpou o campo (fechou o formulário): o escolhido daqui vai junto.
  useEffect(() => {
    if (!pessoaId) setEscolhida(null)
  }, [pessoaId])

  const escolher = (pessoa: PessoaDaBusca) => {
    setEscolhida(pessoa)
    aoEscolher(pessoa.id)
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
      // Sem isto o Enter enviaria o formulário com a pessoa ainda vazia.
      evento.preventDefault()
      escolher(achados[destaque])
    } else if (evento.key === 'Escape') {
      setAberta(false)
    }
  }

  if (escolhida && escolhida.id === pessoaId) {
    return (
      <Escolhido>
        <EscolhidoTexto>
          <strong>{escolhida.name}</strong>
          <span>{escolhida.email}</span>
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
        aria-label={rotulo}
        aria-expanded={aberta}
        aria-controls={idDaLista}
        aria-autocomplete="list"
        aria-busy={buscando}
        aria-activedescendant={aberta && achados[destaque] ? `${idDaLista}-${achados[destaque].id}` : undefined}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? idDoErro : undefined}
        placeholder="Busque por nome ou e-mail"
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
      {aberta && (
        <Opcoes id={idDaLista} role="listbox" aria-label={`${rotulo}: resultados`}>
          {carregando ? (
            <SemOpcao>Buscando…</SemOpcao>
          ) : achados.length === 0 ? (
            <SemOpcao>{buscando ? 'Buscando…' : semResultado}</SemOpcao>
          ) : (
            achados.map((pessoa, indice) => (
              <Opcao
                key={pessoa.id}
                id={`${idDaLista}-${pessoa.id}`}
                role="option"
                aria-selected={indice === destaque}
                $destaque={indice === destaque}
                // `mousedown`, e não `click`: o clique chega depois do `blur`, e
                // uma lista que fecha no blur sumiria antes de receber o clique.
                onMouseDown={(evento) => {
                  evento.preventDefault()
                  escolher(pessoa)
                }}
              >
                {pessoa.name}
                <OpcaoEmail>{pessoa.email}</OpcaoEmail>
              </Opcao>
            ))
          )}
        </Opcoes>
      )}
      {erro && <SemOpcao id={idDoErro} role="alert" $erro>{erro}</SemOpcao>}
    </div>
  )
}
