import { useMemo, useState } from 'react'
import { ArrowLeft, MapPin, Navigation, Wallet } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import DayUsesDoDia from '../../components/DayUsesDoDia'
import ConviteDeLocalizacao from '../../components/ConviteDeLocalizacao'
import { useOrigemDeLocalizacao } from '../../hooks/useOrigemDeLocalizacao'
import { useSports } from '../../hooks/useSports'
import type { FiltrosDeDayUse } from '../../types/api'
import { ehFaixa, FAIXAS, faixaDeHorario, type Faixa } from './horarios'
import { Aba, Abas, Container, Filtros, Limpar, Titulo, Vazio } from './styles'

/** Os passos do raio. O teto da api é 100 km, e são os mesmos da `PartidasPerto`. */
const RAIOS = [10, 25, 50, 100]

/**
 * Onde jogar hoje — a busca de day use (#460, #469).
 *
 * ## A tela abre MOSTRANDO, e o filtro é refinamento
 *
 * A primeira versão desta página abria vazia, com "informe uma cidade ou
 * modalidade para ver os day uses disponíveis" — e havia três acontecendo
 * enquanto essa frase aparecia. Filtro é refinamento de uma lista: sem lista,
 * ele é pedágio.
 *
 * Day use é, de tudo que o produto tem, o que menos combina com formulário. Não
 * há reserva, não há organizador, não há convite: *a vaga é de quem chega*, e
 * quem chega quer ver o que existe.
 *
 * ## O título não promete "hoje"
 *
 * Ele dizia "Day uses de hoje", e a api corta por `fim >= agora`, sem teto —
 * a lista traz amanhã e depois. A promessa é que estava errada, não a lista:
 * esconder o day use de amanhã de manhã de quem procura hoje à noite tiraria
 * justamente quem está se programando. "Hoje" virou um atalho do filtro.
 *
 * ## Localização é UMA pergunta, com duas respostas possíveis
 *
 * Cidade **ou** perto de mim, e não os dois ao mesmo tempo. A api aceitaria os
 * dois juntos e os combinaria com E — o que produziria lista vazia sem que a
 * tela conseguisse explicar por quê.
 *
 * O "perto de mim" reusa o convite da #222 inteiro: o prompt do navegador só
 * dispara por clique, a recusa é lembrada entre sessões, e o endereço salvo é
 * a rede de segurança de quem negou ou abre no computador. Quem já tem
 * endereço não vê convite nenhum — a origem sai dele.
 *
 * **Recusar a localização não esvazia a tela.** Sem origem, a busca segue sem
 * raio e mostra tudo. Era o defeito que abriu este épico, e trocá-lo por outro
 * jeito de ficar vazio não seria conserto.
 *
 * ## Os filtros moram na URL
 *
 * Recarregar preserva a busca, e o atalho do Quero Jogar chega aqui com os
 * filtros dele já aplicados — é o que faz a porta de lá levar a algum lugar em
 * vez de recomeçar.
 */
export default function DayUses() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { sports } = useSports()
  const localizacao = useOrigemDeLocalizacao()
  const { origem, estado } = localizacao

  const courtType = params.get('courtType') ?? ''
  const city = params.get('city') ?? ''
  const precoMax = params.get('precoMax') ?? ''
  const faixaCrua = params.get('quando') ?? ''
  const faixa: Faixa = ehFaixa(faixaCrua) ? faixaCrua : 'qualquer'

  /**
   * "Perto de mim" é escolha da sessão, e não da URL.
   *
   * Link compartilhado com `perto=1` levaria a pessoa a uma lista medida a
   * partir de **outro** ponto — ou a nenhuma, se ela não tiver origem. A
   * cidade viaja no link; a distância até você, não.
   */
  const [perto, setPerto] = useState(false)
  const [raioKm, setRaioKm] = useState(RAIOS[1])

  const porRaio = perto && origem !== null

  const filtros = useMemo<FiltrosDeDayUse>(() => {
    const { from, to } = faixaDeHorario(faixa)

    return {
      courtType: courtType || undefined,
      from,
      to,
      precoMax: precoMax === '' ? undefined : Number(precoMax),
      // Um lado ou o outro, nunca os dois: ver a nota do topo.
      ...(porRaio && origem
        ? { latitude: origem.latitude, longitude: origem.longitude, radiusKm: raioKm }
        : { city: city || undefined }),
    }
  }, [courtType, city, precoMax, faixa, porRaio, origem, raioKm])

  const mexeuNaBusca = Boolean(courtType || city || precoMax || faixa !== 'qualquer' || porRaio)

  function trocar(chave: string, valor: string) {
    const proximos = new URLSearchParams(params)
    if (valor) proximos.set(chave, valor)
    else proximos.delete(chave)
    setParams(proximos, { replace: true })
  }

  function limpar() {
    setPerto(false)
    setParams(new URLSearchParams(), { replace: true })
  }

  return (
    <Container>
      <button type="button" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Voltar
      </button>

      <Titulo>
        <h1>Day uses</h1>
        <p>Encontre um espaço, chegue e pague no local. A vaga é de quem chega.</p>
      </Titulo>

      {/* O convite só aparece para quem não tem origem nenhuma — nem endereço
          salvo, nem permissão já concedida. Ele mesmo se cala depois de
          dispensado, e nunca dispara o prompt sozinho. */}
      <ConviteDeLocalizacao
        contexto="Para ver os day uses mais perto de você, e a distância até cada um"
        localizacao={localizacao}
      />

      <Filtros>
        <label>
          Modalidade
          <select value={courtType} onChange={(e) => trocar('courtType', e.target.value)}>
            <option value="">Todas as modalidades</option>
            {sports.map((sport) => (
              <option key={sport.id} value={sport.id}>
                {sport.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Quando
          <select value={faixa} onChange={(e) => trocar('quando', e.target.value)}>
            {FAIXAS.map((f) => (
              <option key={f.valor} value={f.valor}>
                {f.rotulo}
              </option>
            ))}
          </select>
        </label>

        <label>
          <Wallet size={16} aria-hidden /> Preço até
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={precoMax}
            onChange={(e) => trocar('precoMax', e.target.value)}
            placeholder="Qualquer preço"
          />
        </label>

        <div className="localizacao">
          <Abas role="group" aria-label="Localização">
            <Aba type="button" $ativa={!perto} onClick={() => setPerto(false)}>
              <MapPin size={14} aria-hidden /> Cidade
            </Aba>
            {/* Sem origem o botão continua visível e desabilitado: escondê-lo
                faria o recurso parecer inexistente para quem só precisa
                conceder a permissão. */}
            <Aba
              type="button"
              $ativa={perto}
              disabled={origem === null}
              title={origem === null ? 'Precisa da sua localização ou de um endereço no perfil' : undefined}
              onClick={() => setPerto(true)}
            >
              <Navigation size={14} aria-hidden /> Perto de mim
            </Aba>
          </Abas>

          {perto ? (
            <select
              aria-label="Raio da busca"
              value={raioKm}
              onChange={(e) => setRaioKm(Number(e.target.value))}
            >
              {RAIOS.map((km) => (
                <option key={km} value={km}>
                  Até {km} km
                </option>
              ))}
            </select>
          ) : (
            <input
              aria-label="Cidade"
              value={city}
              onChange={(e) => trocar('city', e.target.value)}
              placeholder={user?.address?.city ? `Ex.: ${user.address.city}` : 'Ex.: Lavras'}
            />
          )}
        </div>

        {mexeuNaBusca && (
          <Limpar type="button" onClick={limpar}>
            Limpar filtros
          </Limpar>
        )}
      </Filtros>

      <DayUsesDoDia
        filtros={filtros}
        vazio={
          <Vazio>
            {mexeuNaBusca ? (
              <>
                <strong>Nenhum day use com esses filtros.</strong>
                <span>
                  Tente {porRaio ? 'aumentar o raio' : 'outra cidade'}, outra modalidade ou um preço
                  maior — ou <button type="button" onClick={limpar}>limpe os filtros</button> para
                  ver todos.
                </span>
              </>
            ) : (
              <>
                <strong>Nenhum day use acontecendo agora.</strong>
                <span>
                  Os espaços abrem day use com pouca antecedência. Vale voltar mais perto do dia em
                  que você quer jogar.
                </span>
              </>
            )}
          </Vazio>
        }
      />

      {/* O estado sem permissão não é erro, e não some com a lista: a pessoa
          continua vendo tudo, e o convite acima explica o que ela ganha se
          mudar de ideia. */}
      {perto && estado === 'negado' && (
        <p role="status">
          Sem a sua localização não dá para medir distância. A busca continua mostrando tudo.
        </p>
      )}
    </Container>
  )
}
