import { FastifyInstance } from 'fastify'
import { Task, OrderInfos } from '../../main/type/task-type'
import { startServer } from '../../main/server'
import { clearTestDB, closeTestDB, connectTestDB } from '../config/test-db-handler'
import { Response as LightMyRequestResponse } from 'light-my-request'
import { TaskServiceImpl } from '../../main/service/task-service'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/lib/function'
import { map } from 'fp-ts/Array'

describe('Testing To-Do List API', () => {
  let server: FastifyInstance
  const urlPath = 'v1/tasks'
  const taskService = TaskServiceImpl.getInstance()

  beforeAll(async () => {
    server = startServer()
    await server.ready()
    await connectTestDB()
  })

  beforeEach(async () => {
    await clearTestDB()
  })

  afterAll(async () => {
    await closeTestDB()
    await server.close()
  })

  const saveTask = (message: string, reminderTime?: string) => {
    return pipe(
      taskService.save(message, reminderTime),
      TE.match(
        error => { throw error },
        task => task
      )
    )()
  }

  const createListTask = (messages: string[]) => {
    const saveTask = (message: string) => taskService.save(message)
    return pipe(
      messages,
      TE.traverseArray(saveTask),
      TE.match(
        (e) => { throw e },
        (t) => t
      )
    )()
  }

  const getObjectFromBody = (response: LightMyRequestResponse, objectName: string): any => {
    return JSON.parse(response.body)[objectName]
  }

  const callAPI = async (url: any, method: any, payload?: any) => {
    return await server.inject({
      url: url,
      method: method,
      payload: payload
    })
  }

  it(`should get new task when 'POST /tasks'`, async () => {
    const message = 'test'
    const response = await callAPI(`${urlPath}`, 'POST', { message: message })

    expect(response.statusCode).toBe(201)

    const task = getObjectFromBody(response, 'task')

    expect(task.id).not.toBeNull()
    expect(task.message).toBe(message)
    expect(task.completed).toBe('N')
    expect(task.order).not.toBeNull()
  })

  it(`should update task when 'PUT /tasks/:id'`, async () => {
    const task = await saveTask('test')

    const taskParams = {
      message: 'new message',
      completed: 'Y',
      order: 666
    }

    const response = await callAPI(`${urlPath}/${task.id}`, 'PUT', taskParams)

    expect(response.statusCode).toBe(200)

    const befoerUpdatedTask = getObjectFromBody(response, 'task')

    expect(befoerUpdatedTask.id).toBe(task.id)
    expect(befoerUpdatedTask.message).toBe(taskParams.message)
    expect(befoerUpdatedTask.completed).toBe(taskParams.completed)
    expect(befoerUpdatedTask.order).toBe(taskParams.order)
  })

  it(`should update task has reminderTime when 'PUT /tasks/:id'`, async () => {
    const task = await saveTask('test')

    const taskParams = {
      message: 'new message',
      completed: 'Y',
      order: 666,
      reminderTime: '2099-01-01 01:00:00'
    }

    const response = await callAPI(`${urlPath}/${task.id}`, 'PUT', taskParams)

    expect(response.statusCode).toBe(200)

    const befoerUpdatedTask = getObjectFromBody(response, 'task')

    expect(befoerUpdatedTask.id).toBe(task.id)
    expect(befoerUpdatedTask.message).toBe(taskParams.message)
    expect(befoerUpdatedTask.completed).toBe(taskParams.completed)
    expect(befoerUpdatedTask.order).toBe(taskParams.order)
    expect(befoerUpdatedTask.reminderTime).toBe(taskParams.reminderTime)
  })

  it(`should update task not has reminderTime when 'PUT /tasks/:id'`, async () => {
    const task = await saveTask('test', '2099-01-01 01:00:00')

    const taskParams = {
      message: 'new message',
      completed: 'Y',
      order: 666
    }

    const response = await callAPI(`${urlPath}/${task.id}`, 'PUT', taskParams)

    expect(response.statusCode).toBe(200)

    const befoerUpdatedTask = getObjectFromBody(response, 'task')

    expect(befoerUpdatedTask.id).toBe(task.id)
    expect(befoerUpdatedTask.message).toBe(taskParams.message)
    expect(befoerUpdatedTask.completed).toBe(taskParams.completed)
    expect(befoerUpdatedTask.order).toBe(taskParams.order)
    expect(befoerUpdatedTask.reminderTime).toBeUndefined()
  })

  it(`shoud get error mssage when 'PUT /tasks/:id' use not existed Id`, async () => {
    const notExistedId = '62d44b90b928882b63cadbe2'
    const taskParams = {
      message: 'not existed',
      completed: 'Y',
      order: 666
    }

    const response = await callAPI(`${urlPath}/${notExistedId}`, 'PUT', taskParams)

    expect(response.statusCode).toBe(400)

    const message = getObjectFromBody(response, 'message')

    expect(message).toBe(`Task id ${notExistedId} not found`)
  })

  it(`shoud get error mssage when 'PUT /tasks/:id' use not availed Id`, async () => {
    const notAvailedId = '123456'
    const taskParams = {
      message: 'not availed',
      completed: 'Y',
      order: 666
    }

    const response = await callAPI(`${urlPath}/${notAvailedId}`, 'PUT', taskParams)

    expect(response.statusCode).toBe(400)

    const message = getObjectFromBody(response, 'message')

    expect(message).toBe(`Task ID ${notAvailedId} is not availed.`)
  })

  it(`should completed task when 'PUT /tasks/:id/be-done'`, async () => {
    const task = await saveTask('test')

    const response = await callAPI(`${urlPath}/${task.id}/be-done`, 'PUT')

    expect(response.statusCode).toBe(200)

    const befoerCompletedTask = getObjectFromBody(response, 'task')

    expect(befoerCompletedTask.id).toBe(task.id)
    expect(befoerCompletedTask.message).toBe(task.message)
    expect(befoerCompletedTask.completed).toBe('Y')
    expect(befoerCompletedTask.order).toBe(task.order)
  })

  it(`should get error when 'PUT /tasks/:id/be-done' use not availed id `, async () => {
    const id = '123456'
    const response = await callAPI(`${urlPath}/${id}/be-done`, 'PUT')

    expect(response.statusCode).toBe(400)

    const message = getObjectFromBody(response, 'message')

    expect(message).toBe(`Task ID ${id} is not availed.`)
  })

  it(`shoud get error mssage when 'PUT /tasks/:id/be-done' use not existed Id`, async () => {
    const notExistedId = '62d44b90b928882b63cadbe2'

    const response = await callAPI(`${urlPath}/${notExistedId}/be-done`, 'PUT')

    expect(response.statusCode).toBe(400)

    const message = getObjectFromBody(response, 'message')

    expect(message).toBe(`Task id ${notExistedId} not found`)
  })

  it(`should delete task when 'DELETE /tasks/:id'`, async () => {
    const task = await saveTask('test')

    const response = await callAPI(`${urlPath}/${task.id}`, 'DELETE')

    expect(response.statusCode).toBe(204)

    const unCompletedTasks = await pipe(
      taskService.getUnCompletedTasks(),
      TE.match(
        error => { throw error },
        tasks => tasks
      )
    )()

    expect(unCompletedTasks.length).toBe(0)
  })

  it(`shoud get error mssage when 'DELETE /tasks/:id' use not existed Id`, async () => {
    const notExistedId = '62d44b90b928882b63cadbe2'

    const response = await callAPI(`${urlPath}/${notExistedId}`, 'DELETE')

    expect(response.statusCode).toBe(400)

    const message = getObjectFromBody(response, 'message')

    expect(message).toBe(`Task id ${notExistedId} not found`)
  })

  it(`shoud get error mssage when 'DELETE /tasks/:id' use not availed id`, async () => {
    const id = '123456'

    const response = await callAPI(`${urlPath}/${id}`, 'DELETE')

    expect(response.statusCode).toBe(400)

    const message = getObjectFromBody(response, 'message')

    expect(message).toBe(`Task ID ${id} is not availed.`)
  })

  it(`should get uncompleted tasks when 'GET /tasks/to-do'`, async () => {
    const messages = ['test1', 'test2', 'test3']
    await createListTask(messages)

    const response = await callAPI(`${urlPath}/to-do`, 'GET')

    expect(response.statusCode).toBe(200)

    const toDoTasks: Task[] = getObjectFromBody(response, 'tasks')

    expect(toDoTasks.length).toBe(messages.length)
  })

  it(`should get completed tasks when 'GET /tasks/be-done'`, async () => {
    const messages = ['test1', 'test2', 'test3']
    const tasks = await createListTask(messages)

    tasks.map(async t =>
      await pipe(
        taskService.completedById(t.id),
        TE.match(
          error => { throw error },
          task => task
        )
      )()
    )

    const response = await callAPI(`${urlPath}/be-done`, 'GET')

    expect(response.statusCode).toBe(200)

    const toDoTasks: Task[] = getObjectFromBody(response, 'tasks')

    expect(toDoTasks.length).toBe(3)
  })

  it(`should reorder tasks when 'PUT /tasks/orders'`, async () => {
    const messages = ['test1', 'test2', 'test3']
    const tasks: any = await createListTask(messages)

    const orderInfos: OrderInfos = []

    const pushToOrderInfo = (t: any) => orderInfos.push({ id: t.id, order: t.order })

    pipe(
      tasks,
      map(pushToOrderInfo)
    )

    orderInfos[0].order = 10
    orderInfos[1].order = 100
    orderInfos[2].order = 1000

    const response = await callAPI(`${urlPath}/orders`, 'PUT', orderInfos)

    expect(response.statusCode).toBe(200)

    const modified = getObjectFromBody(response, 'modified')

    expect(modified).toBe(orderInfos.length)

    const unCompletedTasks = await pipe(
      taskService.getUnCompletedTasks(),
      TE.match(
        error => { throw error },
        tasks => tasks
      )
    )()

    const expectOrder = (orderInfo: any) => {
      expect(unCompletedTasks.find(t => t.id == orderInfo.id)?.order).toBe(orderInfo.order)
    }

    pipe(
      orderInfos,
      map(expectOrder)
    )
  })

  it(`should reorder tasks failed when 'PUT /tasks/orders' use not exist id`, async () => {
    const messages = ['test1', 'test2']
    const tasks: any = await createListTask(messages)

    const orderInfos: OrderInfos = []

    const pushToOrderInfo = (t: any) => orderInfos.push({ id: t.id, order: t.order })

    pipe(
      tasks,
      map(pushToOrderInfo)
    )

    orderInfos[0].id = '62d44b90b928882b63cadbe2'

    const response = await callAPI(`${urlPath}/orders`, 'PUT', orderInfos)

    expect(response.statusCode).toBe(400)

    const result = getObjectFromBody(response, 'message')

    expect(result).toBe('Just matched 1 data.')
  })

})