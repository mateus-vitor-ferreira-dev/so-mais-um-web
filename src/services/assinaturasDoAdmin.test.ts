/**
 * A detecção da cortesia por e-mail (web#503, api#597).
 *
 * A tela decide entre o campo de e-mail e a busca de dono pelo que
 * `convitesPendentes` devolve. Se um erro qualquer virasse "api antiga", uma
 * queda momentânea esconderia os convites e trocaria o formulário sem aviso.
 */
import { afterEach, describe, expect, it } from 'vitest'
import api from './api'
import { assinaturasDoAdmin } from './assinaturasDoAdmin'
import { erroDaApi } from '../test/factories'

const adapterOriginal = api.defaults.adapter

afterEach(() => {
  api.defaults.adapter = adapterOriginal
})

describe('convitesPendentes', () => {
  it('devolve a lista quando a api tem a rota', async () => {
    api.defaults.adapter = async (config) => ({
      data: { success: true, data: [{ id: 'c1' }] }, status: 200, statusText: 'OK', headers: {}, config,
    })

    await expect(assinaturasDoAdmin.convitesPendentes()).resolves.toEqual([{ id: 'c1' }])
  })

  it('devolve null no 404: a api ainda não concede por e-mail', async () => {
    api.defaults.adapter = async () => {
      throw erroDaApi('Not Found', 404)
    }

    await expect(assinaturasDoAdmin.convitesPendentes()).resolves.toBeNull()
  })

  it('outro erro continua sendo erro', async () => {
    api.defaults.adapter = async () => {
      throw erroDaApi('Falhou', 500)
    }

    await expect(assinaturasDoAdmin.convitesPendentes()).rejects.toThrow()
  })
})
