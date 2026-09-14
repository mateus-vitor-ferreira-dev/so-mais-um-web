import { Texto } from './styles'

/**
 * O crédito que a Weather API exige em toda tela que mostra o dado dela.
 *
 * As [políticas](https://developers.google.com/maps/documentation/weather/policies)
 * pedem a atribuição **no mesmo bloco** que o dado, visível e sem ser alterada.
 * E o que o Só+1 mostra não é o dado cru — o risco e os motivos saem da leitura
 * da api —, e para dado combinado a regra é escrever que ele *inclui* dados do
 * Google Maps.
 *
 * É um componente, e não uma frase repetida em cada tela, porque a atribuição
 * é contrato: a tela que a esquecer é a tela que descumpre os termos, e escrita
 * à mão ela diverge na terceira vez.
 */
export default function AtribuicaoDoTempo() {
  return <Texto>Fonte: inclui dados meteorológicos do Google Maps</Texto>
}
