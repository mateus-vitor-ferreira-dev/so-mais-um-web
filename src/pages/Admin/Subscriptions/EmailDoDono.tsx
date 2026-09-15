import { useId, useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { oQueAcontece } from './previsaoDaCortesia'
import type { ContaDaBusca } from './previsaoDaCortesia'
import { Busca, NotaDoFiltro, Opcao, OpcaoEmail, Opcoes } from './styles'

interface Props {
  /** Todas as contas, de qualquer papel: é assim que a tela sabe se o e-mail é de alguém. */
  contas: ContaDaBusca[]
  carregando: boolean
  /** Os e-mails que já têm assinatura, em minúsculas. */
  assinam: Set<string>
  /** Os e-mails com convite de cortesia esperando o cadastro, em minúsculas. */
  pendentes: Set<string>
  email: string
  aoMudar: (email: string) => void
  /** Quantos dias de cortesia o formulário está dando, para o aviso do convite. */
  dias: number
}

const MAXIMO = 8

const semAcento = (texto: string) =>
  texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/**
 * O e-mail de quem recebe a cortesia, com os donos como sugestão (web#503).
 *
 * O campo é o e-mail, e não a escolha numa lista: o caso comum de venda é uma
 * arena que ainda não está no Só+1, e a lista só teria quem já está. Os donos
 * sem assinatura aparecem enquanto se digita, e escolher um preenche o e-mail.
 */
export default function EmailDoDono({ contas, carregando, assinam, pendentes, email, aoMudar, dias }: Props) {
  const [aberta, setAberta] = useState(false)
  const [destaque, setDestaque] = useState(0)
  const idDaLista = useId()
  const idDoAviso = useId()

  const sugestoes = useMemo(() => {
    const busca = semAcento(email.trim())
    if (!busca) return []
    return contas
      .filter((c) => c.role === 'OWNER' && !assinam.has(c.email.toLowerCase()))
      .filter((c) => semAcento(c.name).includes(busca) || semAcento(c.email).includes(busca))
      // O e-mail já digitado inteiro não precisa virar sugestão dele mesmo.
      .filter((c) => c.email.toLowerCase() !== email.trim().toLowerCase())
      .slice(0, MAXIMO)
  }, [contas, assinam, email])

  const previsao = carregando ? null : oQueAcontece(email, { contas, assinam, pendentes, dias })
  const listaAberta = aberta && sugestoes.length > 0

  const escolher = (conta: ContaDaBusca) => {
    aoMudar(conta.email)
    setAberta(false)
  }

  const aoTeclar = (evento: KeyboardEvent<HTMLInputElement>) => {
    if (evento.key === 'ArrowDown') {
      evento.preventDefault()
      setAberta(true)
      setDestaque((atual) => Math.min(atual + 1, sugestoes.length - 1))
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault()
      setDestaque((atual) => Math.max(atual - 1, 0))
    } else if (evento.key === 'Enter' && listaAberta && sugestoes[destaque]) {
      // Sem isto o Enter enviaria o formulário com o texto pela metade.
      evento.preventDefault()
      escolher(sugestoes[destaque])
    } else if (evento.key === 'Escape') {
      setAberta(false)
    }
  }

  return (
    <div>
      <Busca
        type="email"
        required
        role="combobox"
        aria-label="E-mail do dono"
        aria-expanded={listaAberta}
        aria-controls={idDaLista}
        aria-autocomplete="list"
        aria-activedescendant={listaAberta && sugestoes[destaque] ? `${idDaLista}-${sugestoes[destaque].id}` : undefined}
        aria-describedby={previsao ? idDoAviso : undefined}
        placeholder="nome@arena.com.br"
        autoComplete="off"
        value={email}
        onChange={(evento) => {
          aoMudar(evento.target.value)
          setDestaque(0)
          setAberta(true)
        }}
        onFocus={() => setAberta(true)}
        onBlur={() => setAberta(false)}
        onKeyDown={aoTeclar}
      />
      {listaAberta && (
        <Opcoes id={idDaLista} role="listbox" aria-label="Donos sem assinatura">
          {sugestoes.map((conta, indice) => (
            <Opcao
              key={conta.id}
              id={`${idDaLista}-${conta.id}`}
              role="option"
              aria-selected={indice === destaque}
              $destaque={indice === destaque}
              // `mousedown`, e não `click`: o clique chega depois do `blur`.
              onMouseDown={(evento) => {
                evento.preventDefault()
                escolher(conta)
              }}
            >
              {conta.name}
              <OpcaoEmail>{conta.email}</OpcaoEmail>
            </Opcao>
          ))}
        </Opcoes>
      )}
      {previsao && (
        <NotaDoFiltro id={idDoAviso} $tom={previsao.tipo === 'concede' ? undefined : 'alerta'} $noCampo role="status">
          {previsao.texto}
        </NotaDoFiltro>
      )}
    </div>
  )
}
