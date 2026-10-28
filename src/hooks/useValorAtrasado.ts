import { useEffect, useState } from 'react'

/**
 * O valor, só depois de ele parar de mudar por `atrasoMs` (api#618).
 *
 * Para a busca que vai ao servidor: sem isto, digitar "marina" seriam seis
 * requisições, e as respostas podem chegar fora de ordem. 300ms é o intervalo
 * em que quem digita ainda não parou para ler.
 */
export function useValorAtrasado<T>(valor: T, atrasoMs = 300): T {
  const [atrasado, setAtrasado] = useState(valor)

  useEffect(() => {
    const temporizador = setTimeout(() => setAtrasado(valor), atrasoMs)
    return () => clearTimeout(temporizador)
  }, [valor, atrasoMs])

  return atrasado
}
