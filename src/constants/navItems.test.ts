/**
 * O menu do owner reflete o plano assinado.
 *
 * O que ele **não** pode fazer é esconder o que o dono poderia comprar: menu que
 * some deixa a pessoa achando que o produto não faz aquilo, e ninguém troca de plano
 * por uma funcionalidade que nunca viu. Item não incluso fica visível, com cadeado,
 * e leva para a comparação de planos.
 */
import { describe, it, expect } from 'vitest'
import { ownerNavItems } from './navItems'
import type { PlanFeature } from '../types/api'

const abre = (...quais: PlanFeature[]) => (f: PlanFeature) => quais.includes(f)

const rotulos = (itens: ReturnType<typeof ownerNavItems>) => itens.map((i) => i.label)
const bloqueados = (itens: ReturnType<typeof ownerNavItems>) =>
  itens.filter((i) => i.bloqueado).map((i) => i.label)

describe('ownerNavItems — o que o plano abre', () => {
  it('Básico: estoque, equipamento, turmas e day use com cadeado', () => {
    const itens = ownerNavItems('OWNER', abre())

    expect(bloqueados(itens)).toEqual(['Estoque', 'Equipamentos', 'Turmas', 'Day use'])
    // Continuam no menu — é assim que o dono descobre que existem.
    for (const item of ['Estoque', 'Equipamentos', 'Turmas', 'Day use']) {
      expect(rotulos(itens)).toContain(item)
    }
  })

  it('Pro: day use aberto, escolinha e balcão ainda não', () => {
    const itens = ownerNavItems('OWNER', abre('DAY_USE', 'ESTATISTICAS'))

    expect(bloqueados(itens)).toEqual(['Estoque', 'Equipamentos', 'Turmas'])
  })

  it('Premium: nada bloqueado', () => {
    const itens = ownerNavItems(
      'OWNER',
      abre('DAY_USE', 'ESTATISTICAS', 'ESCOLINHA', 'EQUIPAMENTOS', 'ESTOQUE'),
    )

    expect(bloqueados(itens)).toEqual([])
  })

  it('ESCOLINHA abre Turmas sozinha — day use tem cadeado próprio', () => {
    // Os dois formatos que o espaço vende, e a api#531 os separou de propósito:
    // quadra que só aluga hora ganha dinheiro com day use sem nunca abrir turma.
    const soEscolinha = ownerNavItems('OWNER', abre('ESCOLINHA'))
    const soDayUse = ownerNavItems('OWNER', abre('DAY_USE'))

    expect(bloqueados(soEscolinha)).toContain('Day use')
    expect(bloqueados(soEscolinha)).not.toContain('Turmas')
    expect(bloqueados(soDayUse)).toContain('Turmas')
    expect(bloqueados(soDayUse)).not.toContain('Day use')
  })
})

describe('ownerNavItems — o que nunca é bloqueado', () => {
  it('a porta de entrada, o que já foi contratado e a forma de pagar', () => {
    const itens = ownerNavItems('OWNER', abre())

    // Solicitações é como o dono entra na plataforma, Meus Estabelecimentos é o que
    // ele contratou e Planos é como ele paga. Trancar qualquer um deixaria o cliente
    // do lado de fora da própria assinatura.
    for (const item of ['Solicitações', 'Meus Estabelecimentos', 'Planos', 'Visão Geral']) {
      expect(bloqueados(itens)).not.toContain(item)
    }
  })

  it('Professores, mesmo depois de a escolinha virar funcionalidade paga', () => {
    // A api#531 portou turma, matrícula, mensalidade e aula sob `ESCOLINHA` e
    // deixou `/me/turmas` e `/me/aulas` de fora, de propósito: a assinatura é do
    // dono do espaço, e o professor é prestador — ele não assina nada. Cadeado
    // aqui contradiria a api, que tem teste prendendo a decisão do lado dela.
    const itens = ownerNavItems('OWNER', abre())

    expect(rotulos(itens)).toContain('Professores')
    expect(bloqueados(itens)).not.toContain('Professores')
  })
})

describe('ownerNavItems — enquanto o plano não chegou', () => {
  it('não marca nada, em vez de piscar cadeado e tirar', () => {
    const itens = ownerNavItems('OWNER')

    expect(bloqueados(itens)).toEqual([])
  })
})

describe('ownerNavItems — ADMIN', () => {
  it('ganha o atalho do painel admin e nada de cadeado', () => {
    // Quem decide isso é o `useSubscription`, que devolve `temFuncionalidade`
    // sempre verdadeiro para ADMIN — aqui só se confirma que o menu respeita.
    const itens = ownerNavItems('ADMIN', () => true)

    expect(rotulos(itens)).toContain('Painel Admin')
    expect(bloqueados(itens)).toEqual([])
  })
})
