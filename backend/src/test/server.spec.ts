import { FastifyInstance } from 'fastify'
import { startServer } from '../main/server'

describe(' Testing start server', () => {

  let server: FastifyInstance

  beforeAll(async () => {
    server = startServer()
    await server.ready()
  })

  afterAll(async () => {
    await server.close()
  })

  it(`should get 200 status code and 'status = active' when 'GET /health'`, async () => {
    const response = await server.inject({
      url: '/health',
      method: 'GET'
    })
    expect(response.statusCode).toBe(200)

    const data = JSON.parse(response.body)

    expect(data.status).toBe('active')
  })
})