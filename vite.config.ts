import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
// defineConfig vem de 'vitest/config', e não de 'vite': é a mesma função,
// só que ciente da chave `test` abaixo. Importar de 'vite' faz o tsc acusar
// propriedade desconhecida.
import { defineConfig, coverageConfigDefaults } from 'vitest/config'

// https://vite.dev/config/
/**
 * O upload dos source maps só acontece com as três variáveis do Sentry (web#529).
 *
 * Sem elas — máquina de quem desenvolve, PR de quem clonou o repositório — o
 * build é exatamente o de antes: nenhum `.map` é gerado e o plugin nem entra na
 * lista. Com elas, o CI manda os mapas e **apaga os arquivos antes do deploy**:
 * mapa de origem servido junto do bundle é o código-fonte inteiro público, e o
 * que se quer é stack legível no painel, não na internet.
 */
const sentryLigado = Boolean(
  process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT,
)

export default defineConfig({
  plugins: [
    react(),
    ...(sentryLigado
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            release: { name: process.env.VITE_COMMIT || undefined },
            sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
          }),
        ]
      : []),
  ],

  // `hidden`: gera o mapa para o upload, sem deixar o comentário que o aponta
  // no bundle servido.
  build: { sourcemap: sentryLigado ? 'hidden' : false },

  test: {
    // jsdom dá ao teste um DOM de mentira — sem ele não há document para
    // a Testing Library consultar.
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],

    // Sem globals: cada teste importa describe/it/expect de 'vitest'.
    // Fica explícito de onde vem cada coisa e o tsc não precisa de tipos
    // globais extras.
    globals: false,

    // styled-components injeta CSS de verdade; sem isto o Vitest ignora
    // os estilos e asserção sobre classe/estilo computado mente.
    css: true,

    // `api/` entra junto: as funções serverless da Vercel são código de
    // produção como qualquer outro, e a prévia do link é justamente a parte que
    // ninguém vê quebrar até alguém colar um link no WhatsApp.
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'api/**/*.{test,spec}.{js,ts}'],

    coverage: {
      provider: 'v8',
      // `json-summary` é o que o `readme:check` lê: o README anuncia a
      // cobertura de linhas, e sem um relatório legível por máquina esse
      // número só poderia ser conferido a olho — que é como ele foi de ~28%
      // para ~62% sem ninguém atualizar a frase.
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        ...coverageConfigDefaults.exclude,
        'src/main.tsx',
        'src/test/**',
        'src/types/**',
        'src/**/styles.ts',
        'src/styles/**',
      ],
    },
  },
})
