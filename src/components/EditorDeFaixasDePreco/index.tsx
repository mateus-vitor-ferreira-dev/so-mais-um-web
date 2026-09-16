import { Plus, X } from 'lucide-react'
import type { FaixaDeExpediente } from '../../types/api'
import {
  DIAS_DA_SEMANA, DIAS_UTEIS, FIM_DE_SEMANA, TODOS_OS_DIAS,
  avisoDeExpediente, copiarDia, fimPorExtenso, novaFaixa,
  type FaixaEditavel, type SemanaDeFaixas,
} from '../../utils/faixasDePreco'
import {
  Adicionar, Atalho, Atalhos, Campo, Cabecalho, Dia, Dias, Linha, NomeDoDia, Nota, Remover, SemFaixa, Horario, Valor,
} from './styles'

export interface EditorDeFaixasDePrecoProps {
  semana: SemanaDeFaixas
  aoMudar: (semana: SemanaDeFaixas) => void
  /** O expediente do espaço, para o aviso de faixa fora dele. Vazio não avisa nada. */
  expediente?: FaixaDeExpediente[]
  /** As faixas que a api recusou por sobreposição, pela chave. */
  destacadas?: string[]
  desabilitado?: boolean
}

/**
 * O editor das faixas de preço da quadra, dia por dia (web#474, api#576).
 *
 * ## Por que os atalhos de cópia
 *
 * O caso comum é "noite de semana mais cara", e ele não pode custar cinco
 * digitações. A faixa se escreve uma vez, na segunda, e **dias úteis** a leva
 * para terça a sexta. A cópia substitui as faixas do destino, e não soma: somar
 * deixaria a terça com a faixa antiga e a nova, e a api recusaria as duas.
 *
 * ## O que ele não faz
 *
 * Não confere sobreposição. Quem recusa é a api, e as duas faixas que ela
 * aponta chegam aqui em `destacadas`. A regra da faixa que atravessa a
 * meia-noite mora num lugar só.
 *
 * O componente é próprio, e não um pedaço do formulário da quadra: o expediente
 * do espaço ainda não tem tela, e quando ganhar pode reusar este desenho.
 */
export default function EditorDeFaixasDePreco({
  semana, aoMudar, expediente = [], destacadas = [], desabilitado = false,
}: EditorDeFaixasDePrecoProps) {
  const mudarFaixa = (dia: number, chave: string, campo: keyof Omit<FaixaEditavel, 'chave'>, valor: string) =>
    aoMudar({ ...semana, [dia]: semana[dia].map((f) => (f.chave === chave ? { ...f, [campo]: valor } : f)) })

  const adicionar = (dia: number) => aoMudar({ ...semana, [dia]: [...semana[dia], novaFaixa()] })
  const remover = (dia: number, chave: string) =>
    aoMudar({ ...semana, [dia]: semana[dia].filter((f) => f.chave !== chave) })

  return (
    <Dias>
      {DIAS_DA_SEMANA.map(({ dia, nome }) => {
        const faixas = semana[dia] ?? []
        return (
          <Dia key={dia} aria-label={nome}>
            <Cabecalho>
              <NomeDoDia>{nome}</NomeDoDia>
              {faixas.length > 0 && (
                <Atalhos>
                  Copiar para:
                  <Atalho type="button" disabled={desabilitado} onClick={() => aoMudar(copiarDia(semana, dia, TODOS_OS_DIAS))}>
                    outros dias
                  </Atalho>
                  <Atalho type="button" disabled={desabilitado} onClick={() => aoMudar(copiarDia(semana, dia, DIAS_UTEIS))}>
                    dias úteis
                  </Atalho>
                  <Atalho type="button" disabled={desabilitado} onClick={() => aoMudar(copiarDia(semana, dia, FIM_DE_SEMANA))}>
                    fim de semana
                  </Atalho>
                </Atalhos>
              )}
            </Cabecalho>

            {faixas.length === 0 && <SemFaixa>Sem faixa</SemFaixa>}

            {faixas.map((faixa) => {
              const extenso = fimPorExtenso(faixa)
              const aviso = avisoDeExpediente(dia, faixa, expediente)
              const destacada = destacadas.includes(faixa.chave)
              return (
                <div key={faixa.chave}>
                  <Linha $destacada={destacada} data-destacada={destacada || undefined}>
                    <Horario>
                    das
                    <Campo
                      type="time"
                      aria-label={`${nome}: início`}
                      value={faixa.inicio}
                      disabled={desabilitado}
                      onChange={(e) => mudarFaixa(dia, faixa.chave, 'inicio', e.target.value)}
                    />
                    às
                    <Campo
                      type="time"
                      aria-label={`${nome}: fim`}
                      value={faixa.fim}
                      disabled={desabilitado}
                      onChange={(e) => mudarFaixa(dia, faixa.chave, 'fim', e.target.value)}
                    />
                    </Horario>
                    <Valor>
                      R$
                      <Campo
                        type="number"
                        min="0.01"
                        step="0.01"
                        inputMode="decimal"
                        aria-label={`${nome}: valor por hora`}
                        placeholder="0,00"
                        value={faixa.valor}
                        disabled={desabilitado}
                        onChange={(e) => mudarFaixa(dia, faixa.chave, 'valor', e.target.value)}
                      />
                      /h
                    </Valor>
                    <Remover
                      type="button"
                      aria-label={`Remover faixa de ${nome}`}
                      disabled={desabilitado}
                      onClick={() => remover(dia, faixa.chave)}
                    >
                      <X size={14} />
                    </Remover>
                  </Linha>
                  {extenso && <Nota>{extenso}</Nota>}
                  {aviso && <Nota $aviso>{aviso}</Nota>}
                </div>
              )
            })}

            <Adicionar type="button" aria-label={`Adicionar faixa em ${nome}`} disabled={desabilitado} onClick={() => adicionar(dia)}>
              <Plus size={13} /> Adicionar faixa
            </Adicionar>
          </Dia>
        )
      })}
    </Dias>
  )
}
