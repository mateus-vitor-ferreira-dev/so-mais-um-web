import { Badge } from './styles'
import { papel } from '../../constants/papeis'
import type { UserRole } from '../../types/api'

export interface RoleBadgeProps {
  role: UserRole
}

export default function RoleBadge({ role }: RoleBadgeProps) {
  const { label, fundo, texto } = papel(role)
  return <Badge $fundo={fundo} $texto={texto}>{label}</Badge>
}
