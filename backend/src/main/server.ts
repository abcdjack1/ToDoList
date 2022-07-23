import fastify, { FastifyInstance } from 'fastify'
import { FastifyListenOptions } from 'fastify/types/instance'
import { env } from './config/env-provider'
import { TaskRouter } from './route/task-route'
import fastifyCors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import path from 'path'
import { pipe } from 'fp-ts/lib/function'

const server: FastifyInstance = fastify({
  logger: {
    transport: {
      target: 'pino-pretty'
    },
    level: env.LOG_LEVEL
  }
})

export const startServer = (): FastifyInstance => {
  return pipe(
    server,
    startListen,
    registerPlugins,
    registerRouters
  )
}

const startListen = (server: FastifyInstance) => {
  const fastifyListenOptions: FastifyListenOptions = {
    port: env.SERVER_PORT,
    host: '0.0.0.0'
  }

  server.listen(fastifyListenOptions, (error, _) => {
    if (error) {
      console.error(error)
    }
  })

  return server
}

const registerPlugins = (server: FastifyInstance) => {
  server.register(fastifyCors, {})
  server.register(fastifyStatic, {
    root: path.join(__dirname, '../../../frontend/dist/to-do-list'),
  })

  return server
}

const registerRouters = (server: FastifyInstance) => {
  server.register(TaskRouter, { prefix: `/v1/tasks` })

  server.get('/health', async (_, response) => {
    return response.status(200).send({ status: 'active' })
  })

  return server
}
