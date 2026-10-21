import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usePageHeader } from '../../../components/DashboardLayout/pageHeader'
import { toast } from 'sonner'
import StatCard from '../../../components/StatCard'
import { GradeDeNumeros } from '../../../components/GradeDeNumeros'
import * as placesService from '../../../services/places'
import * as adminService from '../../../services/admin'
import type { Place } from '../../../types/api'
import type { PaginaDeEspacos } from '../../../services/places'
import {
  Table, OwnerCell, NoOwner, StatusBadge, ActionGroup,
  ActionBtn, ErrorMsg, Modal, ModalOverlay, ModalBox, ModalTitle,
  ModalActions, CancelBtn, ConfirmBtn, PromoteLink,
  PromoteBox, PromoteBtn, Busca,
} from './styles'
import EmptyState from '../../../components/EmptyState'
import CarregarMais from '../../../components/CarregarMais'
import BuscaDePessoa from '../../../components/BuscaDePessoa'
import { useListaPaginada } from '../../../hooks/useListaPaginada'
import { useValorAtrasado } from '../../../hooks/useValorAtrasado'
import { chaves } from '../../../lib/queryClient'

const STATUS_LABEL = { OPEN: 'Aberto', CLOSED: 'Fechado' }

export default function AdminPlaces() {
  const queryClient = useQueryClient()
  const [termo, setTermo]       = useState('')
  const [togglingId, setTogglingId]   = useState<string | null>(null)
  const [assignTarget, setAssignTarget] = useState<Place | null>(null)
  const [selectedOwner, setSelectedOwner] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [promoteMode, setPromoteMode] = useState(false)
  const [selectedPromote, setSelectedPromote] = useState('')
  const [promoting, setPromoting] = useState(false)

  // Por página, com a busca no servidor (api#618): até ali vinham todos.
  const busca = useValorAtrasado(termo.trim())
  const espacos = useListaPaginada<Place, PaginaDeEspacos>(
    chaves.paginaDeEspacos(busca),
    (cursor) => placesService.list(busca, { cursor }),
  )
  const places = espacos.itens
  const error = espacos.erro ? 'Não foi possível carregar os estabelecimentos.' : null

  /** Recarrega a lista e as buscas de pessoa: um dono mudou de espaço, ou de papel. */
  const fetchPlaces = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['espacos', 'pagina'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] }),
    ])
  }

  const handleToggleStatus = async (place: Place) => {
    const next = place.status === 'OPEN' ? 'CLOSED' : 'OPEN'
    setTogglingId(place.id)
    try {
      await placesService.updateStatus(place.id, next)
      await fetchPlaces()
    } catch {
      toast.error('Erro ao alterar status.')
    } finally {
      setTogglingId(null)
    }
  }

  const openAssignModal = (place: Place) => {
    setAssignTarget(place)
    // Vazio, e não o dono atual: a busca só mostra quem foi buscado, e o
    // "Confirmar" com o mesmo dono seria um clique que não muda nada.
    setSelectedOwner('')
    setPromoteMode(false)
    setSelectedPromote('')
  }

  const openPromoteMode = () => setPromoteMode(true)

  const handlePromoteAndAssign = async () => {
    if (!assignTarget || !selectedPromote) return
    setPromoting(true)
    try {
      await adminService.updateUserRole(selectedPromote, 'OWNER')
      await placesService.assignOwner(assignTarget.id, selectedPromote)
      setAssignTarget(null)
      setSelectedOwner('')
      setPromoteMode(false)
      setSelectedPromote('')
      await fetchPlaces()
    } catch {
      toast.error('Erro ao promover e atribuir proprietário.')
    } finally {
      setPromoting(false)
    }
  }

  const handleAssignOwner = async () => {
    if (!assignTarget || !selectedOwner) return
    setAssigning(true)
    try {
      await placesService.assignOwner(assignTarget.id, selectedOwner)
      setAssignTarget(null)
      setSelectedOwner('')
      await fetchPlaces()
    } catch {
      toast.error('Erro ao atribuir proprietário.')
    } finally {
      setAssigning(false)
    }
  }

  // A plataforma inteira, contada na api: a tela só tem a página.
  const resumo = espacos.pagina
  const counts = {
    total:  (resumo?.porStatus?.OPEN ?? 0) + (resumo?.porStatus?.CLOSED ?? 0),
    open:   resumo?.porStatus?.OPEN ?? 0,
    closed: resumo?.porStatus?.CLOSED ?? 0,
    noOwner: resumo?.semDono ?? 0,
  }

  usePageHeader("Estabelecimentos", "Gerencie todos os estabelecimentos da plataforma e atribua proprietários")

  return (
    <>
      <GradeDeNumeros>
        <StatCard label="Total"           value={counts.total}   accent="#3b82f6" />
        <StatCard label="Abertos"         value={counts.open}    accent="#22c55e" />
        <StatCard label="Fechados"        value={counts.closed}  accent="#6b7280" />
        <StatCard label="Sem Proprietário" value={counts.noOwner} accent="#f59e0b" />
      </GradeDeNumeros>

      <Busca
        type="search"
        aria-label="Buscar estabelecimento"
        placeholder="Buscar por nome, cidade ou bairro..."
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
      />

      {error && <ErrorMsg>{error}</ErrorMsg>}

      {!espacos.carregando && places.length === 0 && !error && (
        <EmptyState>
          {termo.trim()
            ? 'Nenhum estabelecimento com esse nome, cidade ou bairro. Tente outro pedaço do nome.'
            : 'Nenhum estabelecimento cadastrado.'}
        </EmptyState>
      )}

      {places.length > 0 && (
        <Table aria-busy={espacos.atualizando}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Cidade</th>
              <th>Proprietário</th>
              <th className="centro">Quadras</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {places.map((place: Place) => (
              <tr key={place.id}>
                <td className="principal"><strong>{place.name}</strong></td>
                <td data-rotulo="Cidade">{place.city}, {place.state}</td>
                <td data-rotulo="Proprietário">
                  {place.owner
                    ? <OwnerCell>{place.owner.name}</OwnerCell>
                    : <NoOwner>Sem proprietário</NoOwner>
                  }
                </td>
                <td data-rotulo="Quadras" className="centro">{place._count?.courts ?? 0}</td>
                <td data-rotulo="Status">
                  <StatusBadge $aberto={place.status === 'OPEN'}>
                    {STATUS_LABEL[place.status]}
                  </StatusBadge>
                </td>
                <td className="acoes">
                  <ActionGroup>
                    <ActionBtn
                      variant={place.status === 'OPEN' ? 'danger' : 'success'}
                      onClick={() => handleToggleStatus(place)}
                      disabled={togglingId === place.id}
                    >
                      {togglingId === place.id
                        ? '...'
                        : place.status === 'OPEN' ? 'Fechar' : 'Abrir'}
                    </ActionBtn>
                    <ActionBtn variant="secondary" onClick={() => openAssignModal(place)}>
                      {place.ownerId ? 'Trocar Owner' : 'Atribuir Owner'}
                    </ActionBtn>
                  </ActionGroup>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <CarregarMais
        mostrando={places.length}
        total={espacos.pagina?.total}
        temMais={espacos.temMais}
        carregando={espacos.carregandoMais}
        aoCarregar={espacos.carregarMais}
        rotulo="estabelecimentos"
      />

      {assignTarget && (
        <Modal>
          <ModalOverlay onClick={() => setAssignTarget(null)} />
          <ModalBox>
            <ModalTitle>
              {assignTarget.ownerId ? 'Trocar Proprietário' : 'Atribuir Proprietário'}
            </ModalTitle>
            <p>{assignTarget.name}</p>
            {assignTarget.owner && <p>Dono atual: <strong>{assignTarget.owner.name}</strong></p>}

            {/* Busca no servidor, e não um <select> com todos os donos (api#618). */}
            <BuscaDePessoa
              papel="OWNER"
              rotulo="Dono"
              semResultado="Nenhum dono com esse nome ou e-mail. Se a pessoa ainda é jogador, promova abaixo."
              pessoaId={selectedOwner}
              aoEscolher={setSelectedOwner}
            />

            {!promoteMode && (
              <PromoteLink onClick={openPromoteMode}>
                Usuário não tem role Owner ainda? Promover aqui →
              </PromoteLink>
            )}

            {promoteMode && (
              <PromoteBox>
                <label>Promover jogador para Owner</label>
                <BuscaDePessoa
                  papel="PLAYER"
                  rotulo="Jogador"
                  semResultado="Nenhum jogador com esse nome ou e-mail."
                  pessoaId={selectedPromote}
                  aoEscolher={setSelectedPromote}
                />
                <PromoteBtn
                  onClick={handlePromoteAndAssign}
                  disabled={!selectedPromote || promoting}
                >
                  {promoting ? 'Promovendo...' : 'Promover e Atribuir'}
                </PromoteBtn>
              </PromoteBox>
            )}

            <ModalActions>
              <CancelBtn onClick={() => setAssignTarget(null)}>Cancelar</CancelBtn>
              <ConfirmBtn
                onClick={handleAssignOwner}
                disabled={!selectedOwner || assigning}
              >
                {assigning ? 'Salvando...' : 'Confirmar'}
              </ConfirmBtn>
            </ModalActions>
          </ModalBox>
        </Modal>
      )}
    </>
  )
}
