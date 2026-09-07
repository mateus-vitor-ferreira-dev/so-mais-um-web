/**
 * A área do professor (api#451).
 *
 * O teste que carrega este arquivo é o do **que a tela não mostra**. A #451
 * pedia, entre os critérios, que *"a tela do professor não mostra plano,
 * faturamento nem cadastro de quadra"* — e por três meses esse critério esteve
 * "satisfeito por ausência", porque não havia tela. Ausência não é satisfação:
 * ela some no dia em que a tela existe, e é justamente aí que o critério passa
 * a poder ser violado sem ninguém notar.
 *
 * Os outros dois protegem o que a issue decidiu e que é fácil desfazer sem
 * perceber: a agenda mistura as academias numa lista só, e a chamada abre
 * dentro da aula.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor } from '../../test/render'
import AreaDoProfessor from './index'

vi.mock('../../services/professor')
vi.mock('../../services/aulas')
import { professorService } from '../../services/professor'
import { aulasService } from '../../services/aulas'

const prof = vi.mocked(professorService)
const aulas = vi.mocked(aulasService)

const quadra = (place: string, nome: string) => ({
  id: `q-${place}`, name: nome, type: 'FUTSAL' as const,
  place: { id: `p-${place}`, name: place, city: 'Lavras' },
})

/** Duas academias, para o caso que a #451 chama de comum e não de exceção. */
const AULAS = [
  {
    id: 'a1', inicio: '2027-03-01T21:00:00.000Z', fim: '2027-03-01T22:00:00.000Z',
    status: 'AGENDADA' as const,
    turma: { id: 't1', modalidade: 'FUTSAL' as const, court: quadra('Arena Sul', 'Quadra 1') },
  },
  {
    id: 'a2', inicio: '2027-03-01T23:00:00.000Z', fim: '2027-03-02T00:00:00.000Z',
    status: 'AGENDADA' as const,
    turma: { id: 't2', modalidade: 'FUTSAL' as const, court: quadra('Ginásio Norte', 'Quadra A') },
  },
  {
    id: 'a3', inicio: '2027-03-02T21:00:00.000Z', fim: '2027-03-02T22:00:00.000Z',
    status: 'CANCELADA' as const,
    turma: { id: 't1', modalidade: 'FUTSAL' as const, court: quadra('Arena Sul', 'Quadra 1') },
  },
]

const TURMAS = [
  {
    id: 't1', modalidade: 'FUTSAL' as const, diaDaSemana: 1, horario: '18:00',
    duracaoMinutos: 60, vagas: 12, ativa: true,
    court: quadra('Arena Sul', 'Quadra 1'), alunosMatriculados: 8,
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  prof.minhasAulas.mockResolvedValue(AULAS)
  prof.minhasTurmas.mockResolvedValue(TURMAS)
  aulas.chamada.mockResolvedValue({
    aula: { id: 'a1', inicio: AULAS[0].inicio, fim: AULAS[0].fim, status: 'AGENDADA' },
    alunos: [
      { matriculaId: 'm1', nome: 'Bia', temConta: true, presente: null },
      { matriculaId: 'm2', nome: 'Caio', temConta: false, presente: true },
    ],
  })
})

describe('área do professor', () => {
  it('não mostra plano, faturamento nem cadastro de quadra', async () => {
    const { container } = renderWithProviders(<AreaDoProfessor />)
    await waitFor(() => expect(container.textContent).toMatch(/Arena Sul/))

    const texto = container.textContent ?? ''

    // A api já não devolve mensalidade nestas rotas, então a tela não teria de
    // onde tirar o número. Este teste guarda o outro lado: que ninguém
    // acrescente o campo buscando-o noutra rota.
    expect(texto).not.toMatch(/mensalidade|faturamento|receita|plano|assinatura/i)
    expect(texto).not.toMatch(/R\$/)
    expect(texto).not.toMatch(/nova quadra|cadastrar quadra/i)
  })

  it('junta as academias numa lista só, dizendo de qual é cada aula', async () => {
    const { container } = renderWithProviders(<AreaDoProfessor />)

    // A #451 decidiu a lista única: quem dá aula às 18h numa e às 20h noutra
    // quer ver as duas. Sem o nome do espaço a lista fica ambígua justamente
    // para quem ela existe.
    //
    // Pelo `textContent`, e não por `getByText`: o nome do espaço e o da quadra
    // são nós de texto irmãos dentro do mesmo elemento, e o matcher de texto
    // não casa a frase que atravessa os dois.
    await waitFor(() => expect(container.textContent).toMatch(/Arena Sul · Quadra 1/))
    expect(container.textContent).toMatch(/Ginásio Norte · Quadra A/)
  })

  it('a chamada abre dentro da aula, e não noutra tela', async () => {
    const { user } = renderWithProviders(<AreaDoProfessor />)

    const botoes = await screen.findAllByRole('button', { name: 'Fazer chamada' })
    await user.click(botoes[0])

    expect(await screen.findByText('Bia')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Salvar chamada/ })).toBeInTheDocument()
    // Continua sendo a mesma tela: a agenda não sumiu.
    expect(screen.getAllByRole('button', { name: /chamada/i }).length).toBeGreaterThan(1)
    expect(screen.getByText(/Ginásio Norte · Quadra A/)).toBeInTheDocument()
  })

  it('aula cancelada aparece marcada, e não oferece chamada', async () => {
    renderWithProviders(<AreaDoProfessor />)
    await screen.findByText('Cancelada')

    // Some da lista seria pior: ausência não se distingue de defeito, e o
    // professor precisa saber que a aula existia.
    const botoes = screen.getAllByRole('button', { name: 'Fazer chamada' })
    expect(botoes).toHaveLength(2)
  })

  it('sem aula na janela, diz o que aconteceu em vez de ficar vazia', async () => {
    prof.minhasAulas.mockResolvedValue([])
    renderWithProviders(<AreaDoProfessor />)

    expect(
      await screen.findByRole('region', { name: 'Nenhuma aula nos próximos sete dias' }),
    ).toBeInTheDocument()
  })

  it('falha da agenda não derruba as turmas, e vice-versa', async () => {
    prof.minhasAulas.mockRejectedValue(new Error('rede fora'))
    renderWithProviders(<AreaDoProfessor />)

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    // As duas consultas são independentes: uma cair não pode levar a outra.
    expect(await screen.findByText(/8 de 12 vagas ocupadas/)).toBeInTheDocument()
  })
})
