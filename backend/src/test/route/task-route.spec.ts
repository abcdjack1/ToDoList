import { FastifyInstance } from 'fastify'
import { env } from '../../main/config/env-provider'
import { Task } from '../../main/model/task-model'
import { startServer } from '../../main/server'
import { clearTestDB, closeTestDB, connectTestDB } from '../config/test-db-handler'
import { Response as LightMyRequestResponse } from 'light-my-request'
import { TaskServiceImpl } from '../../main/service/task-service'
import { OrderParams } from '../../main/type/params'

describe('Testing To-Do List API', () => {
  let server: FastifyInstance
  const urlPath = env.API_VERSION + '/tasks'
  const taskService = TaskServiceImpl.create()

  beforeAll(async () => {
    server = startServer(env)
    await server.ready()
    await connectTestDB()
  })

  afterEach(async () => {
    await clearTestDB()
  })

  afterAll(async () => {
    await closeTestDB()
    await server.close()
  })

  it(`should get new task when 'POST /tasks'`, async () => {
    const message = 'test'
    const response = await server.inject({
      url: `${urlPath}`,
      method: 'POST',
      payload: {
        message: message
      }
    })

    expect(response.statusCode).toBe(201)

    const task = getObjectFromBody(response, 'task')

    expect(task.id).not.toBeNull()
    expect(task.message).toBe(message)
    expect(task.completed).toBe('N')
    expect(task.order).not.toBeNull()
  })

  it(`should update task when 'PUT /tasks/:id'`, async () => {
    const task = await taskService.save('test')
    const taskParams = {
      message: 'new message',
      completed: 'Y',
      order: 666
    }

    const response = await server.inject({
      url: `${urlPath}/${task.id}`,
      method: 'PUT',
      payload: taskParams
    })

    expect(response.statusCode).toBe(200)

    const befoerUpdatedTask = getObjectFromBody(response, 'task')

    expect(befoerUpdatedTask.id).toBe(task.id)
    expect(befoerUpdatedTask.message).toBe(taskParams.message)
    expect(befoerUpdatedTask.completed).toBe(taskParams.completed)
    expect(befoerUpdatedTask.order).toBe(taskParams.order)
  })

  it(`shoud get error mssage when 'PUT /tasks/:id' use not existed Id`, async () => {
    const notExistedId = '62d44b90b928882b63cadbe2'
    const taskParams = {
      message: 'not existed',
      completed: 'Y',
      order: 666
    }

    const response = await server.inject({
      url: `${urlPath}/${notExistedId}`,
      method: 'PUT',
      payload: taskParams
    })

    expect(response.statusCode).toBe(400)

    const message = getObjectFromBody(response, 'message')

    expect(message).toBe(`Task id ${notExistedId} not found`)
  })

  it(`should completed task when 'PUT /tasks/:id/be-done'`, async () => {
    const task = await taskService.save('test')
    const response = await server.inject({
      url: `${urlPath}/${task.id}/be-done`,
      method: 'PUT'
    })

    expect(response.statusCode).toBe(200)

    const befoerCompletedTask = getObjectFromBody(response, 'task')

    expect(befoerCompletedTask.id).toBe(task.id)
    expect(befoerCompletedTask.message).toBe(task.message)
    expect(befoerCompletedTask.completed).toBe('Y')
    expect(befoerCompletedTask.order).toBe(task.order)
  })

  it(`shoud get error mssage when 'PUT /tasks/:id/be-done' use not existed Id`, async () => {
    const notExistedId = '62d44b90b928882b63cadbe2'
    const response = await server.inject({
      url: `${urlPath}/${notExistedId}/be-done`,
      method: 'PUT'
    })

    expect(response.statusCode).toBe(400)

    const message = getObjectFromBody(response, 'message')

    expect(message).toBe(`Task id ${notExistedId} not found`)
  })

  it(`should delete task when 'DELETE /tasks/:id'`, async () => {
    const task = await taskService.save('test')
    const response = await server.inject({
      url: `${urlPath}/${task.id}`,
      method: 'DELETE'
    })

    expect(response.statusCode).toBe(204)

    let beNull = await taskService.findById(task.id)

    expect(beNull).toBeNull()
  })

  it(`shoud get error mssage when 'DELETE /tasks/:id' use not existed Id`, async () => {
    const notExistedId = '62d44b90b928882b63cadbe2'
    const response = await server.inject({
      url: `${urlPath}/${notExistedId}`,
      method: 'DELETE'
    })

    expect(response.statusCode).toBe(400)

    const message = getObjectFromBody(response, 'message')

    expect(message).toBe(`Task id ${notExistedId} not found`)
  })

  it(`should get uncompleted tasks when 'GET /tasks/to-do'`, async () => {
    const messages = ['test1', 'test2', 'test3']
    await createListTask(messages)

    const response = await server.inject({
      url: `${urlPath}/to-do`,
      method: 'GET'
    })

    expect(response.statusCode).toBe(200)

    const toDoTasks: Task[] = getObjectFromBody(response, 'tasks')

    toDoTasks.forEach((t, index) => expect(t.message).toBe(messages[index]))
  })

  it(`should get completed tasks when 'GET /tasks/be-done'`, async () => {
    const messages = ['test1', 'test2', 'test3']
    const tasks = await createListTask(messages)

    await Promise.all(tasks.map(async t =>
      await taskService.completedById(t.id)
    ))

    const response = await server.inject({
      url: `${urlPath}/be-done`,
      method: 'GET'
    })

    expect(response.statusCode).toBe(200)

    const toDoTasks: Task[] = getObjectFromBody(response, 'tasks')

    expect(toDoTasks.length).toBe(3)
  })

  it(`should reorder tasks when 'PUT /tasks/orders'`, async () => {
    const messages = ['test1', 'test2', 'test3']
    const tasks = await createListTask(messages)

    const orderParams: OrderParams[] = []
    tasks.forEach(t => orderParams.push({ id: t.id, order: t.order }))

    orderParams[0].order = 10
    orderParams[1].order = 100
    orderParams[2].order = 1000

    const response = await server.inject({
      url: `${urlPath}/orders`,
      method: 'PUT',
      payload: orderParams
    })

    expect(response.statusCode).toBe(200)

    const result = getObjectFromBody(response, 'result')

    expect(result.ok).toBe(1)
    expect(result.nMatched).toBe(messages.length)
    expect(result.nModified).toBe(messages.length)

    const unCompletedTasks = await taskService.getUnCompletedTasks()

    orderParams.forEach(p =>
      expect(
        unCompletedTasks.find(t => t.id == p.id)?.order
      ).toBe(p.order)
    )
  })

  const createListTask = async (messages: string[]): Promise<Task[]> => {
    let task: Task[] = []
    await Promise.all(messages.map(async m =>
      task.push(await taskService.save(m))
    ))
    return task
  }

  const getObjectFromBody = (response: LightMyRequestResponse, objectName: string): any => {
    return JSON.parse(response.body)[objectName]
  }

})