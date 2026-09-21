/**
 * Variáveis de ambiente do frontend.
 *
 * Configure no .env local:
 *   VITE_API_URL           — URL base da API (padrão: http://localhost:3000)
 *   VITE_GOOGLE_CLIENT_ID  — Client ID do Google OAuth
 *   VITE_SENTRY_DSN        — para onde vão os erros; vazio desliga (web#529)
 */
export interface Env {
  apiUrl: string
  googleClientId: string
  cloudinaryCloud: string
  cloudinaryPreset: string
  stripePublishableKey: string
  /** Para onde vão os erros (web#529). Vazio desliga o relato. */
  sentryDsn: string
  /** O commit do build, carimbado pelo CI. Vazio fora do deploy. */
  commit: string
  /** `production` ou `preview` — todo PR vira deploy na Vercel. */
  ambiente: string
}

export const env: Env = {
  apiUrl:           import.meta.env.VITE_API_URL                 || 'http://localhost:3000',
  googleClientId:   import.meta.env.VITE_GOOGLE_CLIENT_ID        || '',
  cloudinaryCloud:  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME   || '',
  cloudinaryPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '',
  stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  sentryDsn:        import.meta.env.VITE_SENTRY_DSN               || '',
  commit:           import.meta.env.VITE_COMMIT                   || '',
  ambiente:         import.meta.env.VITE_AMBIENTE                 || 'development',
}
