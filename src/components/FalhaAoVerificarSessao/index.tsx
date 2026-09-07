import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Caixa, Container, Explicacao, Sair, Tentar, Titulo } from './styles'

/**
 * "Não deu para verificar sua sessão" — a tela que substitui o login indevido
 * (web#346).
 *
 * ## Por que ela existe
 *
 * Até a #346, qualquer falha do `/auth/me` no boot apagava a marca de sessão e
 * mandava a pessoa para o **login** — com o cookie válido no navegador e sem
 * ela ter feito nada. O sintoma não era "erro ao carregar": era tela de login,
 * e a pessoa concluía que a sessão tinha expirado e digitava a senha de novo.
 *
 * Agora o boot só apaga a marca em 401 e 403. Nos outros casos — 429, 5xx,
 * queda de rede — a marca fica, e esta tela aparece no lugar do redirect.
 *
 * ## Ela diz o que aconteceu, e não pede desculpa genérica
 *
 * "Sua sessão continua válida" é a informação que muda o que a pessoa faz: sem
 * isso ela vai procurar a senha. E o botão de sair existe porque quem estiver
 * numa rede que não volta precisa de uma saída que não seja fechar a aba.
 */
export default function FalhaAoVerificarSessao() {
  const { tentarNovamente, logout } = useAuth()
  const [tentando, setTentando] = useState(false)

  const tentar = async () => {
    setTentando(true)
    try {
      await tentarNovamente()
    } finally {
      setTentando(false)
    }
  }

  return (
    <Container>
      <Caixa>
        <Titulo>Não deu para verificar sua sessão</Titulo>
        <Explicacao>
          O Só+1 não conseguiu falar com o servidor agora — pode ser a sua conexão,
          ou o servidor respondendo devagar.
          {' '}
          <strong>Sua sessão continua válida</strong>: não é preciso entrar de novo.
        </Explicacao>

        <Tentar type="button" onClick={() => void tentar()} disabled={tentando}>
          {tentando ? 'Tentando…' : 'Tentar de novo'}
        </Tentar>

        <Sair type="button" onClick={logout}>
          Sair mesmo assim
        </Sair>
      </Caixa>
    </Container>
  )
}
