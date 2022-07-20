import fastify, { FastifyInstance } from 'fastify'
import { FastifyListenOptions } from 'fastify/types/instance'
import { dbConnection } from './config/db-handler'
import { EnvConfig } from './config/env-provider'
import { TaskRouter } from './route/task-route'
import fastifyCors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import path from 'path'

const server: FastifyInstance = fastify({
  logger: {
    transport: {
      target: 'pino-pretty'
    },
    level: 'error'
  }
})

export const startServer = (env: EnvConfig): FastifyInstance => {

  const fastifyListenOptions: FastifyListenOptions = {
    port: env.SERVER_PORT,
    host: '0.0.0.0'
  }

  server.listen(fastifyListenOptions, (error, _) => {
    if (error) {
      console.error(error)
    }
  })

  server.register(fastifyCors, {})
  server.register(fastifyStatic, {
    root: path.join(__dirname, '../../../frontend/dist/to-do-list'),
  })

  server.register(TaskRouter, { prefix: `/${env.API_VERSION}/tasks` })

  server.get('/health', async (_, response) => {
    return response.status(200).send({ status: 'active' })
  })

  return server
}