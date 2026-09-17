import { createGlobalStyle } from 'styled-components'

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    color-scheme: ${({ theme }) => theme.mode};
  }

  body {
    background: ${({ theme }) => theme.colors.bgApp};
    font-family: 'Inter', 'Segoe UI', sans-serif;
    overflow: hidden;
    transition: background-color 0.2s;
  }

  #root {
    width: 100vw;
    height: 100vh;
  }

  /*
   * As cores dos avisos (sonner, com richColors), pelos tokens do tema (#511).
   * As do próprio sonner davam 4,35:1 no erro e perto disso nos outros tons. O
   * atributo repetido só ganha em especificidade do CSS da biblioteca, que é
   * injetado depois deste.
   */
  [data-sonner-toaster][data-sonner-theme][data-sonner-theme] {
    --success-bg: ${({ theme }) => theme.colors.successLight};
    --success-border: ${({ theme }) => theme.colors.border};
    --success-text: ${({ theme }) => theme.colors.success};
    --info-bg: ${({ theme }) => theme.colors.infoLight};
    --info-border: ${({ theme }) => theme.colors.border};
    --info-text: ${({ theme }) => theme.colors.infoText};
    --warning-bg: ${({ theme }) => theme.colors.warningLight};
    --warning-border: ${({ theme }) => theme.colors.warningBorder};
    --warning-text: ${({ theme }) => theme.colors.warningText};
    --error-bg: ${({ theme }) => theme.colors.errorLight};
    --error-border: ${({ theme }) => theme.colors.border};
    --error-text: ${({ theme }) => theme.colors.error};
  }

  /*
   * Com mouse, o que é clicável troca o cursor (#511, computador). O <select> e
   * o <summary> ficavam com a seta comum. Seletor de elemento, de propósito:
   * qualquer componente que declare o próprio cursor ganha dele.
   */
  button:not(:disabled), select:not(:disabled), summary, [role='button']:not([aria-disabled='true']) {
    cursor: pointer;
  }

  input, select, textarea {
    background: ${({ theme }) => theme.colors.bgInput};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 1000px ${({ theme }) => theme.colors.bgInput} inset !important;
    -webkit-text-fill-color: ${({ theme }) => theme.colors.textPrimary} !important;
    transition: background-color 5000s ease-in-out 0s;
  }
`

export default GlobalStyles
