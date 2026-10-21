import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usePageHeader } from '../../../components/DashboardLayout/pageHeader'
import { toast } from 'sonner'
import StatCard from '../../../components/StatCard'
import { GradeDeNumeros } from '../../../components/GradeDeNumeros'
import * as placeRequestsService from '../../../services/placeRequests'
import { useInvalidarSolicitacoesPendentes } from '../../../hooks/useSolicitacoesPendentes'
import type { PlaceRequest, PlaceRequestStatus } from '../../../types/api'
import {
  Tabs, Tab, RequestList, RequestCard, RequestAccent,
  RequestHeader, RequestTitle, RequestMeta, RequestFooter, RequestSentAt,
  StatusBadge, ActionGroup, ApproveBtn, RejectBtn, ErrorMsg, RejectModal,
  ModalOverlay, ModalBox, ModalTitle, ReasonInput, ModalActions, CancelBtn,
  ConfirmBtn,
} from './styles'
import EmptyState from '../../../components/EmptyState'
import CarregarMais from '../../../components/CarregarMais'
import { useListaPaginada } from '../../../hooks/useListaPaginada'
import { chaves } from '../../../lib/queryClient'
import { dataCurta } from '../../../utils/datas'

const STATUS_TABS: Array<{ key: PlaceRequestStatus | undefined; label: string }> = [
  { key: undefined,    label: 'Todas'      },
  { key: 'PENDING',    label: 'Pendentes'  },
  { key: 'APPROVED',   label: 'Aprovadas'  },
  { key: 'REJECTED',   label: 'Rejeitadas' },
]

const STATUS_LABEL = { PENDING: 'Pendente', APPROVED: 'Aprovada', REJECTED: 'Rejeitada' }

/**
 * Quantas solicitações há em cada situação, contadas na api (api#618).
 *
 * Uma página de um item por situação, lendo o `total`. Os cartões contavam a
 * lista que estava na tela — que agora é só uma página, e antes já era só a
 * aba aberta: na aba "Pendentes", o cartão "Aprovadas" dizia zero.
 */
async function contarPorSituacao() {
  const contar = async (status?: PlaceRequestStatus) =>
    (await placeRequestsService.listAll(status, { limite: 1 })).pagina?.total ?? 0
  const [total, pending, approved, rejected] = await Promise.all([
    contar(), contar('PENDING'), contar('APPROVED'), contar('REJECTED'),
  ])
  return { total, pending, approved, rejected }
}

export default function AdminRequests() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<PlaceRequestStatus | undefined>(undefined)
  const [actionId, setActionId]   = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<PlaceRequest | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const recontarPendentes = useInvalidarSolicitacoesPendentes('todas')

  const fila = useListaPaginada<PlaceRequest>(
    chaves.filaDeSolicitacoes(tab ?? 'TODAS'),
    (cursor) => placeRequestsService.listAll(tab, { cursor }),
  )
  const requests = fila.itens
  const error = fila.erro ? 'Não foi possível carregar as solicitações.' : null

  const contagem = useQuery({ queryKey: chaves.contagemDeSolicitacoes(), queryFn: contarPorSituacao })

  /** Aprovar ou rejeitar muda a fila de todas as abas e os números do topo. */
  const fetchRequests = () => queryClient.invalidateQueries({ queryKey: ['solicitacoes'] })

  const handleApprove = async (id: string) => {
    setActionId(id)
    try {
      await placeRequestsService.approve(id)
      await fetchRequests()
      // O contador do menu está na tela junto com esta lista: sem recontar, ele
      // segue anunciando a solicitação que acabou de sair da fila.
      await recontarPendentes()
    } catch {
      toast.error('Erro ao aprovar solicitação.')
    } finally {
      setActionId(null)
    }
  }

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return
    setActionId(rejectTarget.id)
    try {
      await placeRequestsService.reject(rejectTarget.id, rejectReason)
      setRejectTarget(null)
      setRejectReason('')
      await fetchRequests()
      await recontarPendentes()
    } catch {
      toast.error('Erro ao rejeitar solicitação.')
    } finally {
      setActionId(null)
    }
  }

  const counts = contagem.data ?? { total: 0, pending: 0, approved: 0, rejected: 0 }

  usePageHeader("Solicitações de Estabelecimento", "Aprove ou rejeite solicitações de Owners para cadastro de novos estabelecimentos")

  return (
    <>
      <GradeDeNumeros>
        <StatCard label="Total"      value={counts.total}    accent="#3b82f6" />
        <StatCard label="Pendentes"  value={counts.pending}  accent="#f59e0b" />
        <StatCard label="Aprovadas"  value={counts.approved} accent="#22c55e" />
        <StatCard label="Rejeitadas" value={counts.rejected} accent="#ef4444" />
      </GradeDeNumeros>

      <Tabs>
        {STATUS_TABS.map(({ key, label }) => (
          <Tab key={String(key)} active={tab === key} aria-pressed={tab === key} onClick={() => setTab(key)}>
            {label}
          </Tab>
        ))}
      </Tabs>

      {error && <ErrorMsg>{error}</ErrorMsg>}

      {!fila.carregando && requests.length === 0 && !error && (
        <EmptyState>Nenhuma solicitação encontrada.</EmptyState>
      )}

      <RequestList>
        {requests.map((req) => (
          <RequestCard key={req.id}>
            <RequestAccent $status={req.status} />

            <RequestHeader>
              <div>
                {/*
                  * `placeName`, `ownerName` e `ownerEmail` não existem no
                  * retorno da API — eram fallbacks mortos, e os campos reais
                  * (name, owner.name, owner.email) já vinham primeiro.
                  */}
                <RequestTitle>{req.name ?? 'Estabelecimento'}</RequestTitle>
                <RequestMeta>
                  Owner: <strong>{req.owner?.name ?? '—'}</strong>
                  {' · '}
                  {req.owner?.email ?? '—'}
                </RequestMeta>
              </div>
              <StatusBadge $status={req.status}>
                {STATUS_LABEL[req.status]}
              </StatusBadge>
            </RequestHeader>

            <RequestFooter>
              <RequestSentAt>
                Enviada em {dataCurta(req.createdAt)}
              </RequestSentAt>

              {req.status === 'PENDING' && (
                <ActionGroup>
                  <ApproveBtn
                    onClick={() => handleApprove(req.id)}
                    disabled={actionId === req.id}
                  >
                    ✓ Aprovar
                  </ApproveBtn>
                  <RejectBtn
                    onClick={() => setRejectTarget(req)}
                    disabled={actionId === req.id}
                  >
                    ✕ Rejeitar
                  </RejectBtn>
                </ActionGroup>
              )}
            </RequestFooter>
          </RequestCard>
        ))}
      </RequestList>

      <CarregarMais
        mostrando={requests.length}
        total={fila.pagina?.total}
        temMais={fila.temMais}
        carregando={fila.carregandoMais}
        aoCarregar={fila.carregarMais}
        rotulo="solicitações"
      />

      {rejectTarget && (
        <RejectModal>
          <ModalOverlay onClick={() => setRejectTarget(null)} />
          <ModalBox>
            <ModalTitle>Rejeitar Solicitação</ModalTitle>
            <p>Informe o motivo da rejeição (opcional):</p>
            <ReasonInput
              placeholder="Ex.: Documentação incompleta..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
            <ModalActions>
              <CancelBtn onClick={() => { setRejectTarget(null); setRejectReason('') }}>
                Cancelar
              </CancelBtn>
              <ConfirmBtn onClick={handleRejectConfirm} disabled={actionId === rejectTarget.id}>
                {actionId === rejectTarget.id ? 'Rejeitando...' : 'Confirmar Rejeição'}
              </ConfirmBtn>
            </ModalActions>
          </ModalBox>
        </RejectModal>
      )}
    </>
  )
}
