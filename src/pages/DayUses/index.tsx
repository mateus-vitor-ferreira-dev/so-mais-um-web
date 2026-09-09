import { useState } from 'react'
import { ArrowLeft, MapPin } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import DayUsesDoDia from '../../components/DayUsesDoDia'
import { useSports } from '../../hooks/useSports'
import type { CourtType } from '../../types/api'
import { Container, Filtros, Hint, Titulo } from './styles'

/** Day use é uma busca própria: não herda estado da busca de partidas. */
export default function DayUses() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { sports } = useSports()
  const [city, setCity] = useState(params.get('city') ?? user?.address?.city ?? '')
  const [courtType, setCourtType] = useState(params.get('courtType') ?? '')
  const temFiltro = Boolean(city || courtType)

  return (
    <Container>
      <button type="button" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Voltar</button>
      <Titulo>
        <h1>Day uses de hoje</h1>
        <p>Encontre um espaço, chegue e pague no local. A vaga é de quem chega.</p>
      </Titulo>

      <Filtros>
        <label>
          <MapPin size={16} aria-hidden /> Cidade
          <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Ex.: Lavras" />
        </label>
        <label>
          Modalidade
          <select value={courtType} onChange={(event) => setCourtType(event.target.value)}>
            <option value="">Todas as modalidades</option>
            {sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.label}</option>)}
          </select>
        </label>
      </Filtros>

      {temFiltro ? (
        <DayUsesDoDia city={city} courtType={courtType as CourtType | ''} />
      ) : (
        <Hint>Informe uma cidade ou modalidade para ver os day uses disponíveis.</Hint>
      )}
    </Container>
  )
}
