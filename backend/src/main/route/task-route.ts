import { FastifyInstance, RouteShorthandOptions } from 'fastify'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/lib/function'
import { TaskService, TaskServiceImpl } from '../service/task-service'
import * as TaskSchema from './task-schema'
import { NewTask, Id, TaskParams } from '../type/task-type'
import { match, P } from 'ts-pattern'
import { AppError } from '../type/error-type'

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
    getCompletedTasks
  )

  done()
}

const toDoTaskService: TaskService = TaskServiceImpl.getInstance()

const postSaveTask = (server: FastifyInstance) => {
  return server.post<{ Body: NewTask }>('', TaskSchema.postSaveTaskOption, async (request, response) => {
    return await pipe(
      toDoTaskService.save(request.body),
      TE.match(
        e => errorHandler(e, response),
        task => response.status(201).send({ task })
      )
    )()
  })
}

const putUpdateTask = (server: FastifyInstance) => {
  return server.put<{ Params: Id, Body: TaskParams }>(
    '/:id', TaskSchema.putUpdateTaskOption, async (request, response) => {
      return await pipe(
        toDoTaskService.update(request.params.id, request.body),
        TE.match(
          e => errorHandler(e, response),
          task => response.status(200).send({ task })
        )
      )()
    }
  )
}

const putCompletedTask = (server: FastifyInstance) => {
  return server.put<{ Params: Id }>('/:id/be-done', TaskSchema.putCompletedTaskOption, async (request, response) => {
    return await pipe(
      toDoTaskService.completedById(request.params.id),
      TE.match(
        e => errorHandler(e, response),
        task => response.status(200).send({ task })
      )
    )()
  })
}

const deleteTask = (server: FastifyInstance) => {
  return server.delete<{ Params: Id }>('/:id', TaskSchema.deleteTaskOption, async (request, response) => {
    return await pipe(
      toDoTaskService.deleteById(request.params.id),
      TE.match(
        e => errorHandler(e, response),
        _ => response.status(204).send()
      )
    )()
  })
}

const getToDoTasks = (server: FastifyInstance) => {
  return server.get('/to-do', TaskSchema.getToDoTasksOption, async (_, response) => {
    return await pipe(
      toDoTaskService.getUnCompletedTasks(),
      TE.match(
        e => errorHandler(e, response),
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
        e => errorHandler(e, response),
        tasks => response.status(200).send({ tasks })
      )
    )()
  })
}

const errorHandler = (e: AppError, response: any) => {
  match(e)
    .with({ _tag: P.select(P.union('DatabaseError', 'DataNotFoundError', 'ValidationError')) },
      (error) => response.status(400).send({ error: error, message: e.message }))
    .otherwise(() => response.status(500).send({ message: e.message }))
}
