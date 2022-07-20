import { FastifyInstance, RouteShorthandOptions, FastifyReply } from 'fastify'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/lib/function'
import { TaskService, TaskServiceImpl } from '../service/task-service'
import { IdParams, OrderParams, TaskParams } from '../type/params'


export const TaskRouter = (
  server: FastifyInstance,
  _: RouteShorthandOptions,
  done: (error?: Error) => void) => {

  const toDoTaskService: TaskService = TaskServiceImpl.create()

  server.post<{ Body: { message: string } }>('', async (request, response) => {
    return await pipe(
      toDoTaskService.save(request.body.message),
      TE.match(
        e => response400WithMessage(response, e.message),
        task => response.status(201).send({ task })
      )
    )()
  })

  server.put<{ Params: IdParams, Body: TaskParams }>('/:id', async (request, response) => {
    const id = request.params.id
    return await pipe(
      toDoTaskService.update(id, request.body),
      TE.match(
        e => response400WithMessage(response, e.message),
        task => resultValidator(task, response, 200, { task }, 400, { message: taskIdNotFound(id) })
      )
    )()
  })

  server.put<{ Params: IdParams }>('/:id/be-done', async (request, response) => {
    const id = request.params.id
    return await pipe(
      toDoTaskService.completedById(id),
      TE.match(
        e => { response400WithMessage(response, e.message) },
        task => resultValidator(task, response, 200, { task }, 400, { message: taskIdNotFound(id) })
      )
    )()
  })

  server.delete<{ Params: IdParams }>('/:id', async (request, response) => {
    const id = request.params.id
    return await pipe(
      toDoTaskService.deleteById(id),
      TE.match(
        e => response400WithMessage(response, e.message),
        task => resultValidator(task, response, 204, {}, 400, { message: taskIdNotFound(id) })
      )
    )()
  })

  server.get('/to-do', async (_, response) => {
    return await pipe(
      toDoTaskService.getUnCompletedTasks(),
      TE.match(
        e => response400WithMessage(response, e.message),
        tasks => response.status(200).send({ tasks })
      )
    )()
  })

  server.get('/be-done', async (_, response) => {
    return await pipe(
      toDoTaskService.getCompletedTasks(),
      TE.match(
        e => response400WithMessage(response, e.message),
        tasks => response.status(200).send({ tasks })
      )
    )()
  })

  server.put<{ Body: OrderParams[] }>('/orders', async (request, response) => {
    const genResponseBody = (bulkWriteResult: any) => {
      return {
        ok: bulkWriteResult.ok,
        nMatched: bulkWriteResult.nMatched,
        nModified: bulkWriteResult.nModified
      }
    }
    return await pipe(
      toDoTaskService.reorder(request.body),
      TE.match(
        error => { throw error },
        bulkWriteResult => {
          return response.status(200).send({ result: genResponseBody(bulkWriteResult) })
        }
      )
    )()
  })

  const resultValidator = (checkObject: any, response: any, successCode: any,
    successReturn: any, failedCode: any, failedReturn: any) => {
    if (checkObject) {
      return response.status(successCode).send(successReturn)
    } else {
      return response.status(failedCode).send(failedReturn)
    }
  }

  const response400WithMessage = (response: any, message: string) => {
    response.status(400).send({ message: message })
  }

  const taskIdNotFound = (id: string) => {
    return `Task id ${id} not found`
  }

  done()
}