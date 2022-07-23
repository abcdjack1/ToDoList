import { FastifyInstance, RouteShorthandOptions } from 'fastify'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/lib/function'
import { TaskService, TaskServiceImpl } from '../service/task-service'
import * as TaskSchema from './task-schema'
import { Message, Id, TaskParams, OrderInfos } from '../type/task-type'

export const TaskRouter = (
  server: FastifyInstance,
  _: RouteShorthandOptions,
  done: (error?: Error) => void) => {

  pipe(
    server,
    postSaveTask,
    putUpdateTask,
    putCompletedTask,
    deleteTask,
    getToDoTasks,
    getCompletedTasks,
    putReorderTasks
  )

  done()
}

const toDoTaskService: TaskService = TaskServiceImpl.getInstance()

const postSaveTask = (server: FastifyInstance) => {
  return server.post<{ Body: Message }>('', TaskSchema.postSaveTaskOption, async (request, response) => {
    return await pipe(
      toDoTaskService.save(request.body.message),
      TE.match(
        e => response.status(400).send({ message: e.message }),
        task => response.status(201).send({ task })
      )
    )()
  })
}

const putUpdateTask = (server: FastifyInstance) => {
  return server.put<{ Params: Id, Body: TaskParams }>(
    '/:id', TaskSchema.putUpdateTaskOption, async (request, response) => {
      const id = request.params.id
      return await pipe(
        toDoTaskService.update(id, request.body),
        TE.match(
          e => response.status(400).send({ message: e.message }),
          task => response.status(200).send({ task })
        )
      )()
    }
  )
}

const putCompletedTask = (server: FastifyInstance) => {
  return server.put<{ Params: Id }>('/:id/be-done', TaskSchema.putCompletedTaskOption, async (request, response) => {
    const id = request.params.id
    return await pipe(
      toDoTaskService.completedById(id),
      TE.match(
        e => { response.status(400).send({ message: e.message }) },
        task => response.status(200).send({ task })
      )
    )()
  })
}

const deleteTask = (server: FastifyInstance) => {
  return server.delete<{ Params: Id }>('/:id', TaskSchema.deleteTaskOption, async (request, response) => {
    const id = request.params.id
    return await pipe(
      toDoTaskService.deleteById(id),
      TE.match(
        e => response.status(400).send({ message: e.message }),
        task => response.status(204).send()
      )
    )()
  })
}

const getToDoTasks = (server: FastifyInstance) => {
  return server.get('/to-do', TaskSchema.getToDoTasksOption, async (_, response) => {
    return await pipe(
      toDoTaskService.getUnCompletedTasks(),
      TE.match(
        e => response.status(400).send({ message: e.message }),
        tasks => response.status(200).send({ tasks })
      )
    )()
  })
}

const getCompletedTasks = (server: FastifyInstance) => {
  return server.get('/be-done', TaskSchema.getCompletedTasksOption, async (_, response) => {
    return await pipe(
      toDoTaskService.getCompletedTasks(),
      TE.match(
        e => response.status(400).send({ message: e.message }),
        tasks => response.status(200).send({ tasks })
      )
    )()
  })
}

const putReorderTasks = (server: FastifyInstance) => {
  return server.put<{ Body: OrderInfos }>('/orders', TaskSchema.putReorderTasksOption, async (request, response) => {
    return await pipe(
      toDoTaskService.reorder(request.body),
      TE.match(
        error => { throw error },
        bulkWriteResult => {
          if (bulkWriteResult.nMatched == request.body.length) {
            return response.status(204).send()
          } else {
            return response.status(400).send({ message: `Just matched ${bulkWriteResult.nMatched} data.` })
          }
        }
      )
    )()
  })
}
