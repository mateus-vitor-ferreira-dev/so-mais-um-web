import { useState, useEffect, useCallback } from 'react'
import { usePageHeader } from '../../../components/DashboardLayout/pageHeader'
import { toast } from 'sonner'
import StatCard from '../../../components/StatCard'
import { GradeDeNumeros } from '../../../components/GradeDeNumeros'
import * as placesService from '../../../services/places'
import * as adminService from '../../../services/admin'
import type { Place } from '../../../types/api'
import type { AdminUser } from '../../../services/admin'
import {
  Table, OwnerCell, NoOwner, StatusBadge, ActionGroup,
  ActionBtn, ErrorMsg, Modal, ModalOverlay, ModalBox, ModalTitle,
  ModalActions, CancelBtn, ConfirmBtn, Select, OwnerOption, PromoteLink,
  PromoteBox, PromoteBtn,
} from './styles'
import EmptyState from '../../../components/EmptyState'

const STATUS_LABEL = { OPEN: 'Aberto', CLOSED: 'Fechado' }

export default function AdminPlaces() {
  const [places, setPlaces]     = useState<Place[]>([])
  const [owners, setOwners]     = useState<AdminUser[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [togglingId, setTogglingId]   = useState<string | null>(null)
  const [assignTarget, setAssignTarget] = useState<Place | null>(null)
  const [selectedOwner, setSelectedOwner] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [promoteMode, setPromoteMode] = useState(false)
  const [allUsers, setAllUsers]       = useState<AdminUser[]>([])
  const [selectedPromote, setSelectedPromote] = useState('')
  const [promoting, setPromoting] = useState(false)

  const fetchPlaces = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await placesService.list()
      setPlaces(res.data.data)
    } catch {
      setError('Não foi possível carregar os estabelecimentos.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchOwners = useCallback(async () => {
    try {
      const res = await adminService.listUsers('OWNER')
      setOwners(res.data.data)
    } catch {
      // silencioso — owners são carregados só quando o modal abre
    }
  }, [])

  useEffect(() => { fetchPlaces() }, [fetchPlaces])

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

  const openAssignModal = async (place: Place) => {
    setAssignTarget(place)
    setSelectedOwner(place.ownerId ?? '')
    setPromoteMode(false)
    setSelectedPromote('')
    await fetchOwners()
  }

  const openPromoteMode = async () => {
    setPromoteMode(true)
    if (allUsers.length === 0) {
      try {
        const res = await adminService.listUsers()
        setAllUsers(res.data.data.filter((u: AdminUser) => u.role !== 'OWNER' && u.role !== 'ADMIN'))
      } catch {
        // silencioso
      }
    }
  }

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
      setAllUsers([])
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

  const counts = {
    total:  places.length,
    open:   places.filter((p) => p.status === 'OPEN').length,
    closed: places.filter((p) => p.status === 'CLOSED').length,
    noOwner: places.filter((p) => !p.ownerId).length,
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

      {error && <ErrorMsg>{error}</ErrorMsg>}

      {!loading && places.length === 0 && !error && (
        <EmptyState>Nenhum estabelecimento cadastrado.</EmptyState>
      )}

      {places.length > 0 && (
        <Table>
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

      {assignTarget && (
        <Modal>
          <ModalOverlay onClick={() => setAssignTarget(null)} />
          <ModalBox>
            <ModalTitle>
              {assignTarget.ownerId ? 'Trocar Proprietário' : 'Atribuir Proprietário'}
            </ModalTitle>
            <p>{assignTarget.name}</p>

            <Select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
            >
              <option value="" disabled>Selecione um Owner...</option>
              {owners.map((o) => (
                <OwnerOption key={o.id} value={o.id}>
                  {o.name} — {o.email}
                </OwnerOption>
              ))}
            </Select>

            {!promoteMode && (
              <PromoteLink onClick={openPromoteMode}>
                Usuário não tem role Owner ainda? Promover aqui →
              </PromoteLink>
            )}

            {promoteMode && (
              <PromoteBox>
                <label>Promover jogador para Owner</label>
                <Select
                  value={selectedPromote}
                  onChange={(e) => setSelectedPromote(e.target.value)}
                >
                  <option value="" disabled>Selecione um usuário...</option>
                  {allUsers.map((u: AdminUser) => (
                    <OwnerOption key={u.id} value={u.id}>
                      {u.name} — {u.email} ({u.role})
                    </OwnerOption>
                  ))}
                </Select>
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
