import { defineConfig, devices } from '@playwright/test'

/**
 * A checagem de responsividade (web#511), separada do Vitest de propósito: ela
 * precisa de navegador de verdade para medir caixa, e o Vitest só enxerga
 * `src/` e `api/`.
 *
 * O app é o do build, servido pelo `vite preview` numa porta só dela (5177: a
 * 5173–5176 costumam estar com vites de desenvolvimento). A api NÃO sobe: o
 * build aponta para `/api-gravada`, que só existe dentro da suíte, servido
 * pelas respostas de `respostas/`. Ver `api-gravada.ts`.
 */
const PORTA = 5177

export default defineConfig({
  testDir: '.',
  outputDir: '../../test-results/responsividade',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  timeout: 90_000,

  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://localhost:${PORTA}`,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    colorScheme: 'light',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  webServer: {
    // Build próprio, em pasta própria: o `dist` é o do `npm run build`, que o
    // `primeira-tela:check` lê.
    command: `npx vite build --outDir dist-responsividade --emptyOutDir && npx vite preview --outDir dist-responsividade --port ${PORTA} --strictPort`,
    cwd: '../..',
    url: `http://localhost:${PORTA}`,
    env: { VITE_API_URL: '/api-gravada' },
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
