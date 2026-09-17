import { useState, useRef, useEffect } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'
import { Check } from 'lucide-react'
import type { CourtType } from '../../types/api'
import type { SportOption } from '../../hooks/useSports'
import SportIcon from '../SportIcon'
import {
  Wrapper, Trigger, Placeholder, Tag, TagRemove, ChevronIcon,
  Dropdown, Option, Checkbox, OptionIcon,
} from './styles'

export interface SportSelectProps {
  sports?: SportOption[]
  value?: CourtType[]
  onChange: (ids: CourtType[]) => void
  loading?: boolean
}

/**
 * Multiselect customizado para modalidades esportivas.
 *
 * Exibe as modalidades selecionadas como tags removíveis e abre um dropdown
 * com todas as opções disponíveis ao clicar. Fecha ao clicar fora.
 *
 * As opções são botões com `aria-pressed` (#511): eram `div` com clique, e o
 * teclado não chegava nelas. Esc fecha a lista e devolve o foco ao gatilho.
 */
export default function SportSelect({
  sports = [],
  value = [],
  onChange,
  loading,
}: SportSelectProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Fecha o dropdown ao clicar fora do componente
  useEffect(() => {
    function onClickOutside(e: globalThis.MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  /** Adiciona ou remove um esporte da seleção */
  function toggle(id: CourtType) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  }

  /** Remove uma tag sem propagar o clique para o Trigger (que abriria o dropdown) */
  function remove(e: MouseEvent<HTMLElement>, id: CourtType) {
    e.stopPropagation()
    onChange(value.filter((v) => v !== id))
  }

  const selectedSports = sports.filter((s) => value.includes(s.id))

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Escape' || !open) return
    e.stopPropagation()
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <Wrapper ref={wrapperRef} onKeyDown={onKeyDown}>
      <Trigger ref={triggerRef} $open={open} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {loading ? (
          <Placeholder>Carregando…</Placeholder>
        ) : selectedSports.length === 0 ? (
          <Placeholder>Selecione as modalidades</Placeholder>
        ) : (
          selectedSports.map((s) => (
            <Tag key={s.id}>
              <SportIcon icon={s.icon} fallback={s.iconFallback} /> {s.label}
              <TagRemove onClick={(e) => remove(e, s.id)}>×</TagRemove>
            </Tag>
          ))
        )}
        <ChevronIcon $open={open} aria-hidden="true">▾</ChevronIcon>
      </Trigger>

      {open && (
        <Dropdown
          onWheel={(e) => e.stopPropagation()} // impede que o scroll do dropdown suba para a página
        >
          {sports.map((s) => {
            const checked = value.includes(s.id)
            return (
              <Option key={s.id} $selected={checked} aria-pressed={checked} onClick={() => toggle(s.id)}>
                <Checkbox $checked={checked} aria-hidden="true">{checked && <Check size={12} strokeWidth={3} />}</Checkbox>
                <OptionIcon><SportIcon icon={s.icon} fallback={s.iconFallback} /></OptionIcon>
                {s.label}
              </Option>
            )
          })}
        </Dropdown>
      )}
    </Wrapper>
  )
}
