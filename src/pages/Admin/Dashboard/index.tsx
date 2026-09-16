import { useState, useEffect } from 'react'
import { usePageHeader } from '../../../components/DashboardLayout/pageHeader'
import api from '../../../services/api'
import {
  Container, KpiGrid, KpiCard, Section, Table, Badge, ActionButton,
  DetailModal, DetailOverlay, DetailBox, DetailHeader, DetailTitle, CloseBtn,
  DetailRow, DetailLabel, DetailValue, SeloDeStatus,
} from './styles'
import { dataCurta } from '../../../utils/datas'

const STATUS_LABEL: Record<string, string> = { active: 'Ativo', trialing: 'Trial', past_due: 'Vencida', canceled: 'Cancelada', inactive: 'Inativo' }

/** Contrato como o /admin/subscriptions o devolve (ver admin.service.listSubscriptions). */
interface Contract {
  id: string
  owner: { name: string; email: string }
  place: { name: string } | null
  planName: string
  monthlyValue: string
  status: string
  currentPeriodEnd: string | null
}

/**
 * ⚠️ Forma que a tabela de pagamentos espera. O endpoint /admin/payments é um
 * stub no backend (admin.controller.listPayments devolve sempre []), então
 * nada produz estes campos hoje — a tabela nunca renderiza uma linha.
 * Declarado para documentar o contrato pretendido.
 */
interface Payment {
  id: string
  date: string
  place: { name: string } | null
  amount: string | number
  method: string
  status: string
}

interface DashboardStats {
  totalArenas: number
  active: number
  /** String formatada ("79,90"), não número — é o que a API devolve. */
  revenue: string
  expiring: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({ totalArenas: 0, active: 0, revenue: '0,00', expiring: 0 })
  const [contracts, setContracts] = useState<Contract[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [detailContract, setDetailContract] = useState<Contract | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [statsRes, contractsRes, paymentsRes] = await Promise.all([
          api.get('/admin/stats').catch(() => ({ data: { totalArenas: 0, active: 0, revenue: '0,00', expiring: 0 } })),
          api.get('/admin/subscriptions').catch(() => ({ data: [] })),
          api.get('/admin/payments').catch(() => ({ data: [] }))
        ])
        // O `?? statsRes.data` cobre o fallback do .catch acima, que devolve o
        // objeto cru em vez do envelope { success, data } da API.
        setStats((statsRes.data?.data ?? statsRes.data) as DashboardStats)
        setContracts((contractsRes.data?.data ?? contractsRes.data ?? []) as Contract[])
        setPayments((paymentsRes.data?.data ?? paymentsRes.data ?? []) as Payment[])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  usePageHeader("Visão Geral (Assinaturas)", "Acompanhe contratos, pagamentos e a saúde financeira da plataforma")

  return (
    <>
      <Container>
        <KpiGrid>
          <KpiCard $borderColor="#3b82f6"><h3>Total de Arenas</h3><p>{stats.totalArenas}</p></KpiCard>
          <KpiCard $borderColor="#22c55e"><h3>Assinaturas Ativas</h3><p>{stats.active}</p></KpiCard>
          <KpiCard $borderColor="#f97316"><h3>Receita Mensal</h3><p>R$&nbsp;{stats.revenue}</p></KpiCard>
          <KpiCard $borderColor="#ef4444"><h3>Vencendo</h3><p>{stats.expiring}</p></KpiCard>
        </KpiGrid>

        <Section>
          <h2>Contratos Ativos e Pendentes</h2>
          <Table>
            <thead>
              <tr>
                <th>Arena</th>
                <th>Proprietário</th>
                <th>Plano</th>
                <th>Valor Mensal</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract: Contract) => (
                <tr key={contract.id}>
                  <td className="principal"><strong>{contract.place?.name}</strong></td>
                  <td data-rotulo="Proprietário">{contract.owner?.name}</td>
                  <td data-rotulo="Plano" className="plano">{contract.planName || 'Básico'}</td>
                  <td data-rotulo="Valor mensal" className="valor">R$ {contract.monthlyValue}</td>
                  <td data-rotulo="Status"><SeloDeStatus $status={contract.status}>{STATUS_LABEL[contract.status] ?? contract.status}</SeloDeStatus></td>
                  <td className="acoes"><ActionButton onClick={() => setDetailContract(contract)}>Ver Detalhes</ActionButton></td>
                </tr>
              ))}
              {contracts.length === 0 && !loading && <tr><td colSpan={6} className="principal vazio">Nenhum contrato encontrado.</td></tr>}
            </tbody>
          </Table>
        </Section>

        <Section>
          <h2>Últimos Pagamentos Recebidos</h2>
          <Table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Arena</th>
                <th>Valor</th>
                <th>Método</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment: Payment) => (
                <tr key={payment.id}>
                  <td className="principal">{dataCurta(payment.date)}</td>
                  <td data-rotulo="Arena">{payment.place?.name}</td>
                  <td data-rotulo="Valor">R$ {payment.amount}</td>
                  <td data-rotulo="Método">{payment.method}</td>
                  <td data-rotulo="Status"><Badge $status={payment.status}>{payment.status}</Badge></td>
                </tr>
              ))}
              {payments.length === 0 && !loading && <tr><td colSpan={5} className="principal vazio">Nenhum pagamento registrado.</td></tr>}
            </tbody>
          </Table>
        </Section>
      </Container>

      {detailContract && (
        <DetailModal>
          <DetailOverlay onClick={() => setDetailContract(null)} />
          <DetailBox>
            <DetailHeader>
              <DetailTitle>Detalhes do Contrato</DetailTitle>
              <CloseBtn onClick={() => setDetailContract(null)} aria-label="Fechar">✕</CloseBtn>
            </DetailHeader>

            <DetailRow>
              <DetailLabel>Proprietário</DetailLabel>
              <DetailValue>{detailContract.owner?.name ?? '—'}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>E-mail</DetailLabel>
              <DetailValue>{detailContract.owner?.email ?? '—'}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Estabelecimento</DetailLabel>
              <DetailValue>{detailContract.place?.name ?? 'Não vinculado'}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Plano</DetailLabel>
              <DetailValue>{detailContract.planName ?? 'Só+1 Pro'}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Valor Mensal</DetailLabel>
              <DetailValue>R$ {detailContract.monthlyValue}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Status</DetailLabel>
              <DetailValue>
                <SeloDeStatus $status={detailContract.status}>
                  {STATUS_LABEL[detailContract.status] ?? detailContract.status}
                </SeloDeStatus>
              </DetailValue>
            </DetailRow>
            {detailContract.currentPeriodEnd && (
              <DetailRow>
                <DetailLabel>Vencimento</DetailLabel>
                <DetailValue>{dataCurta(detailContract.currentPeriodEnd)}</DetailValue>
              </DetailRow>
            )}
          </DetailBox>
        </DetailModal>
      )}
    </>
  )
}