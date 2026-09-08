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
const NUMERO = import.meta.env.VITE_WHATSAPP_ASSINATURA as string | undefined

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
