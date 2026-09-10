/**
 * Para onde vai quem escolhe pagar no Pix (web#447).
 *
 * O Pix não é botão de pagamento: é conversa. A plataforma não cobra do dono —
 * o combinado acontece no WhatsApp, o comprovante chega por lá, e alguém
 * registra a assinatura em `/admin/subscriptions` (web#445). É a mesma decisão
 * do épico api#444, que já vale para a mensalidade do aluno.
 *
 * O número vem do ambiente porque ele muda: hoje é um CPF e um celular, e
 * quando o CNPJ existir vira outro. Cravá-lo no código faria de uma troca de
 * telefone um deploy.
 */

/**
 * O mínimo de dígitos para aquilo ser um telefone, e não um resto de configuração.
 *
 * DDI + DDD + oito dígitos é a forma mais curta que um número brasileiro toma
 * (`55` + `35` + `33211234`). Celular tem nove e daria 13 — o limite fica em 12
 * de propósito, para não recusar um número legítimo por um dígito.
 *
 * Não é validação de telefone, e não tenta ser: é a fronteira entre "alguém
 * configurou um número" e "sobrou lixo aqui". Quem valida de verdade é o
 * WhatsApp, quando o link abre.
 */
const MIN_DIGITOS = 12

/**
 * Só os dígitos do que veio no ambiente — vazio se não sobrou telefone nenhum.
 *
 * **Ler só dígitos é a correção da web#463, e ela é sobre um caso real.** Antes
 * daqui o guarda era `if (!NUMERO)`, que pergunta *"tem valor?"* quando a
 * pergunta é *"tem telefone?"*. Em 09/09/2026 a variável foi criada na Vercel
 * como *sensitive* — que é o **padrão** em Production —, e nesse estado o
 * `vercel pull` do CI devolve o literal `[SENSITIVE]`. O Vite inlinou aquilo no
 * bundle, `[SENSITIVE]` é *truthy*, e a tela de planos ficou dez minutos
 * oferecendo `https://wa.me/[SENSITIVE]`.
 *
 * Era o pior dos dois mundos: pior que o estado anterior, em que a variável não
 * existia e o botão ficava escondido. Agora qualquer coisa sem dígitos
 * suficientes — `[SENSITIVE]`, o placeholder do `.env.example`, um `""` — cai no
 * mesmo lugar seguro: sem número.
 *
 * De brinde, número com máscara passa a funcionar: `+55 (35) 99746-0058` vira
 * `5535997460058`. É a mesma régua do `WHATSAPP_ASSINATURA` da api (api#553),
 * que já fazia `replace(/\D/g, "")` — os dois lados montam o mesmo link e
 * discordar sobre o que é um número seria a próxima surpresa.
 */
const digitos = (import.meta.env.VITE_WHATSAPP_ASSINATURA as string | undefined)?.replace(/\D/g, '') ?? ''

const NUMERO = digitos.length >= MIN_DIGITOS ? digitos : ''

/**
 * O link do WhatsApp com a mensagem já escrita, ou `null` se não há número.
 *
 * `null` em vez de um link para lugar nenhum: quem chama esconde o botão. Um
 * atalho que abre o WhatsApp sem destino é pior que atalho nenhum — a pessoa
 * acha que mandou mensagem.
 */
export function linkDeAssinaturaNoWhatsApp(mensagem: string): string | null {
  if (!NUMERO) return null
  return `https://wa.me/${NUMERO}?text=${encodeURIComponent(mensagem)}`
}
