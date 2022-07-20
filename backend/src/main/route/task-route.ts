import { FastifyInstance, RouteShorthandOptions, FastifyReply } from 'fastify'
import { TaskService, TaskServiceImpl } from '../service/task-service'
import { IdParams, OrderParams, TaskParams } from '../type/params'


export const TaskRouter = (
  server: FastifyInstance,
  _: RouteShorthandOptions,
  done: (error?: Error) => void) => {

  const toDoTaskService: TaskService = TaskServiceImpl.create()

  server.post<{ Body: { message: string } }>('', async (request, response) => {
    const task = await toDoTaskService.save(request.body.message)
    return response.status(201).send({ task })
  })

  server.put<{ Params: IdParams, Body: TaskParams }>('/:id', async (request, response) => {
    const id = request.params.id
    const task = await toDoTaskService.update(id, request.body)
    return resultValidator(task, response, 200, { task }, 400, { message: taskIdNotFound(id) })
  })

  server.put<{ Params: IdParams }>('/:id/be-done', async (request, response) => {
    const id = request.params.id
    const task = await toDoTaskService.completedById(id)
    return resultValidator(task, response, 200, { task }, 400, { message: taskIdNotFound(id) })
  })

  server.delete<{ Params: IdParams }>('/:id', async (request, response) => {
    const id = request.params.id
    const task = await toDoTaskService.deleteById(id)
    return resultValidator(task, response, 204, {}, 400, { message: taskIdNotFound(id) })
  })

  server.get('/to-do', async (_, response) => {
    const tasks = await toDoTaskService.getUnCompletedTasks()
    return response.status(200).send({ tasks })
  })

  server.get('/be-done', async (_, response) => {
    const tasks = await toDoTaskService.getCompletedTasks()
    return response.status(200).send({ tasks })
  })

  server.put<{ Body: OrderParams[] }>('/orders', async (request, response) => {
    const bulkWriteResult = await toDoTaskService.reorder(request.body)
    const result = {
      ok: bulkWriteResult.ok,
      nMatched: bulkWriteResult.nMatched,
      nModified: bulkWriteResult.nModified
    }
    return response.status(200).send({ result })
  })

  const resultValidator = (checkObject: any, response: any, successCode: any,
    successReturn: any, failedCode: any, failedReturn: any) => {
    if (checkObject) {
      return response.status(successCode).send(successReturn)
    } else {
      return response.status(failedCode).send(failedReturn)
    }
  }

  const taskIdNotFound = (id: string) => {
    return `Task id ${id} not found`
  }

  done()
}