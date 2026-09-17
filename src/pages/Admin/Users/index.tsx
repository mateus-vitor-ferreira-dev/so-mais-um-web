import type { FormEvent } from 'react'
import { usePageHeader } from '../../../components/DashboardLayout/pageHeader'
import type { UserRole } from '../../../types/api'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Mail } from 'lucide-react'
import StatCard from '../../../components/StatCard'
import { GradeDeNumeros } from '../../../components/GradeDeNumeros'
import RoleBadge from '../../../components/RoleBadge'
import { papel } from '../../../constants/papeis'
import * as adminService from '../../../services/admin'
import type { AdminUser, InviteResult } from '../../../services/admin'
import { mensagemDeErro } from '../../../utils/apiError'
import {
  FilterBar, SearchInput, RoleFilters, RoleBtn, BotaoConvidar, Tabela, Usuario,
  AvatarCell, UserMeta, UserEmail, ActionBtn, ErrorMsg, ModalWrap,
  ModalOverlay, ModalBox, ModalTitle, ModalText, ModalInput, ModalActions,
  ModalCancelBtn, ModalConfirmBtn,
} from './styles'
import EmptyState from '../../../components/EmptyState'
import { dataCurta } from '../../../utils/datas'

const ROLES = ['Todos', 'PLAYER', 'OWNER', 'ADMIN']

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase()).join('')
}

export default function AdminUsers() {
  const [users, setUsers]         = useState<AdminUser[]>([])
  const [search, setSearch]       = useState('')
  const [roleFilter, setRoleFilter] = useState('Todos')
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<AdminUser | null>(null)
  const [showInvite, setShowInvite]       = useState(false)
  const [inviteEmail, setInviteEmail]     = useState('')
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteResult, setInviteResult]   = useState<InviteResult | null>(null) // { email, inviteUrl }

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const role = roleFilter === 'Todos' ? undefined : (roleFilter as UserRole)
      const res = await adminService.listUsers(role)
      setUsers(res.data.data)
    } catch {
      setError('Não foi possível carregar os usuários.')
    } finally {
      setLoading(false)
    }
  }, [roleFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleSendInvite = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!inviteEmail) return
    setInviteSending(true)
    try {
      const res = await adminService.inviteOwner(inviteEmail)
      // O `?? res.data?.inviteUrl` era código morto: inviteOwner devolve a
      // resposta axios, então a URL vive sempre em data.data.
      const url = res.data.data.inviteUrl
      setInviteResult({ email: inviteEmail, inviteUrl: url, expiresAt: res.data.data.expiresAt })
      setInviteEmail('')
    } catch (err) {
      toast.error(mensagemDeErro(err, 'Erro ao enviar convite.'))
    } finally {
      setInviteSending(false)
    }
  }

  const handleRoleChange = async () => {
    if (!confirmTarget) return
    const next = confirmTarget.role === 'PLAYER' ? 'OWNER' : 'PLAYER'
    setUpdatingId(confirmTarget.id)
    setConfirmTarget(null)
    try {
      await adminService.updateUserRole(confirmTarget.id, next)
      await fetchUsers()
    } catch {
      toast.error('Erro ao alterar role.')
    } finally {
      setUpdatingId(null)
    }
  }

  const counts = {
    total: users.length,
    owners: users.filter((u: AdminUser) => u.role === 'OWNER').length,
    admins: users.filter((u: AdminUser) => u.role === 'ADMIN').length,
    regular: users.filter((u: AdminUser) => u.role === 'PLAYER').length,
  }

  const filtered = users.filter((u: AdminUser) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  usePageHeader("Gestão de Usuários", "Gerencie roles, filtre e monitore todos os usuários da plataforma")

  return (
    <>
      <GradeDeNumeros>
        <StatCard label="Total de Usuários" value={counts.total}   accent="#3b82f6" />
        <StatCard label="Owners"            value={counts.owners}  accent="#22c55e" />
        <StatCard label="Admins"            value={counts.admins}  accent="#f59e0b" />
        <StatCard label="Usuários Comuns"   value={counts.regular} accent="#6b7280" />
      </GradeDeNumeros>

      <FilterBar>
        <SearchInput
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <RoleFilters>
          {ROLES.map((r) => (
            <RoleBtn key={r} active={roleFilter === r} onClick={() => setRoleFilter(r)}>
              {r}
            </RoleBtn>
          ))}
        </RoleFilters>
        <BotaoConvidar onClick={() => setShowInvite(true)}>
          <Mail size={14} />
          Convidar Owner
        </BotaoConvidar>
      </FilterBar>

      {error && <ErrorMsg>{error}</ErrorMsg>}

      {!loading && filtered.length === 0 && !error && (
        <EmptyState>Nenhum usuário encontrado.</EmptyState>
      )}

      {!error && filtered.length > 0 && (
        <Tabela>
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Role</th>
              <th className="centro">Partidas</th>
              <th className="centro">Locais</th>
              <th>Cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u: AdminUser) => (
              <tr key={u.id}>
                <td className="principal">
                  <Usuario>
                    <AvatarCell $tom={papel(u.role)}>
                      {getInitials(u.name)}
                    </AvatarCell>
                    <UserMeta>
                      <strong>{u.name}</strong>
                      <UserEmail>{u.email}</UserEmail>
                    </UserMeta>
                  </Usuario>
                </td>
                <td data-rotulo="Role"><RoleBadge role={u.role} /></td>
                <td data-rotulo="Partidas" className="centro">{u._count?.matchesCreated ?? 0}</td>
                <td data-rotulo="Locais" className="centro">{u._count?.placesOwned ?? 0}</td>
                <td data-rotulo="Cadastro">{dataCurta(u.createdAt)}</td>
                <td className="acoes">{u.role !== 'ADMIN' && (
                  <ActionBtn
                    onClick={() => setConfirmTarget(u)}
                    disabled={updatingId === u.id}
                  >
                    {updatingId === u.id
                      ? 'Salvando...'
                      : u.role === 'OWNER' ? 'Rebaixar → Jogador' : 'Promover → OWNER'}
                  </ActionBtn>
                )}</td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}
      {showInvite && (
        <ModalWrap>
          <ModalOverlay onClick={() => { setShowInvite(false); setInviteEmail(''); setInviteResult(null) }} />
          <ModalBox>
            {inviteResult ? (
              <>
                <ModalTitle>Convite criado!</ModalTitle>
                <ModalText>
                  O email foi enviado para <strong>{inviteResult.email}</strong>. Se não chegar, compartilhe o link abaixo diretamente:
                </ModalText>
                <ModalInput
                  readOnly
                  value={inviteResult.inviteUrl ?? ''}
                  onFocus={(e) => e.target.select()}
                />
                <ModalActions>
                  <ModalConfirmBtn
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteResult.inviteUrl ?? '')
                      toast.success('Link copiado!')
                    }}
                  >
                    Copiar link
                  </ModalConfirmBtn>
                  <ModalCancelBtn type="button" onClick={() => { setShowInvite(false); setInviteResult(null) }}>
                    Fechar
                  </ModalCancelBtn>
                </ModalActions>
              </>
            ) : (
              <>
                <ModalTitle>Convidar novo Owner</ModalTitle>
                <ModalText>
                  Informe o e-mail do proprietário do estabelecimento. Um link de convite único e válido por 7 dias será enviado automaticamente.
                </ModalText>
                <form onSubmit={handleSendInvite}>
                  <ModalInput
                    type="email"
                    placeholder="email@estabelecimento.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    autoFocus
                  />
                  <ModalActions>
                    <ModalCancelBtn type="button" onClick={() => { setShowInvite(false); setInviteEmail('') }}>
                      Cancelar
                    </ModalCancelBtn>
                    <ModalConfirmBtn type="submit" disabled={inviteSending}>
                      {inviteSending ? 'Criando…' : 'Enviar convite'}
                    </ModalConfirmBtn>
                  </ModalActions>
                </form>
              </>
            )}
          </ModalBox>
        </ModalWrap>
      )}

      {confirmTarget && (() => {
        const next = confirmTarget.role === 'PLAYER' ? 'OWNER' : 'PLAYER'
        const isPromo = next === 'OWNER'
        return (
          <ModalWrap>
            <ModalOverlay onClick={() => setConfirmTarget(null)} />
            <ModalBox>
              <ModalTitle>{isPromo ? 'Promover para Owner' : 'Rebaixar para Usuário'}</ModalTitle>
              <ModalText>
                Você está prestes a {isPromo ? 'promover' : 'rebaixar'} <strong>{confirmTarget.name}</strong> ({confirmTarget.email}) de <strong>{confirmTarget.role}</strong> para <strong>{next}</strong>. Deseja continuar?
              </ModalText>
              <ModalActions>
                <ModalCancelBtn onClick={() => setConfirmTarget(null)}>Cancelar</ModalCancelBtn>
                <ModalConfirmBtn $danger={!isPromo} onClick={handleRoleChange}>
                  {isPromo ? 'Promover' : 'Rebaixar'}
                </ModalConfirmBtn>
              </ModalActions>
            </ModalBox>
          </ModalWrap>
        )
      })()}
    </>
  )
}
