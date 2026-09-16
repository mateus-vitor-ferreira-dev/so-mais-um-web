import styled from 'styled-components'
import { ALVO_DE_TOQUE, alvoDeToque, ate } from '../../../styles/telas'

/* "Voltar para as turmas" era um texto de 16px de altura: em tela de toque, a linha inteira vira alvo. */
export const Voltar = styled.button`border:0;background:none;color:${({theme})=>theme.colors.textSecondary};display:flex;gap:8px;align-items:center;margin-bottom:16px;cursor:pointer;${ate.tablet}{min-height:${ALVO_DE_TOQUE};margin-bottom:8px;}`
/* \`ul + button\`: o "Salvar chamada" encostava no último aluno da lista. */
export const Caixa = styled.section`background:${({theme})=>theme.colors.bgCard};border:1px solid ${({theme})=>theme.colors.border};border-radius:14px;padding:20px;margin-bottom:16px;ul + button{margin-top:16px;}${ate.celular}{padding:16px;ul + button{width:100%;}}`
export const Topo = styled.div`display:flex;justify-content:space-between;gap:16px;align-items:end;margin-bottom:16px;${ate.tablet}{flex-direction:column;align-items:stretch;}label{display:flex;align-items:center;gap:8px;}`
export const Titulo = styled.h2`margin:0 0 4px;font-size:1.15rem;`
export const Ajuda = styled.p`margin:0;color:${({theme})=>theme.colors.textSecondary};`
/* 16px no celular: abaixo disso o Safari do iPhone dá zoom ao focar o campo. */
export const Data = styled.input`background:${({theme})=>theme.colors.bgInput};color:${({theme})=>theme.colors.textPrimary};border:1px solid ${({theme})=>theme.colors.border};border-radius:8px;padding:9px;${ate.tablet}{min-height:${ALVO_DE_TOQUE};font-size:1rem;}`
export const Lista = styled.ul`list-style:none;margin:0;padding:0;display:grid;grid-template-columns:minmax(0,1fr);gap:10px;`
/* No celular o nome vai em cima e as opções embaixo, na largura toda: lado a lado, o nome longo empurrava "Faltou" para uma segunda linha. */
export const Linha = styled.li`border:1px solid ${({theme})=>theme.colors.border};border-radius:10px;padding:13px;display:flex;justify-content:space-between;align-items:center;gap:12px;${ate.celular}{flex-direction:column;align-items:stretch;gap:10px;}`
export const Botao = styled.button`border:1px solid ${({theme})=>theme.colors.primary};color:${({theme})=>theme.colors.primary};background:transparent;border-radius:8px;padding:8px 12px;font-weight:700;cursor:pointer;white-space:nowrap;&:disabled{opacity:.5;}${alvoDeToque}`
/**
 * "Veio" e "Faltou". Em tela de toque, cada rótulo vira um botão de 44px, com o
 * marcado em destaque: eram rádios de 13px com rótulo de 20px, na tela que se
 * usa em pé, na beira da quadra, aluno por aluno.
 */
export const Opcoes = styled.div`display:flex;gap:8px;flex-wrap:wrap;label{display:flex;gap:5px;align-items:center;cursor:pointer;}input{accent-color:${({theme})=>theme.colors.primary};}
  ${ate.tablet}{
    label{min-height:${ALVO_DE_TOQUE};padding:0 14px;border:1px solid ${({theme})=>theme.colors.border};border-radius:8px;}
    label:has(input:checked){border-color:${({theme})=>theme.colors.primary};background:${({theme})=>theme.colors.primaryLight};color:${({theme})=>theme.colors.textPrimary};font-weight:600;}
    label:has(input:focus-visible){outline:2px solid ${({theme})=>theme.colors.primary};outline-offset:2px;}
  }
  ${ate.celular}{flex-wrap:nowrap;label{flex:1 1 0;justify-content:center;}}`
export const NaoChamado = styled.span`color:${({theme})=>theme.colors.warningText};font-size:.8rem;`
export const Estado = styled.p`color:${({theme})=>theme.colors.textSecondary};`
