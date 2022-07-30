import { FastifyInstance } from 'fastify'
import { Task, OrderInfos } from '../../main/type/task-type'
import { startServer } from '../../main/server'
import { clearTestDB, closeTestDB, connectTestDB } from '../config/test-db-handler'
import { Response as LightMyRequestResponse } from 'light-my-request'
import { TaskServiceImpl } from '../../main/service/task-service'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/lib/function'
import { elem, map } from 'fp-ts/Array'
import { Eq } from 'fp-ts/lib/Eq'
import { AppError, runtimeErrorOf } from '../../main/type/error-type'

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

  const saveTask = (message: string, reminderTime?: string) => taskService.save(message, reminderTime)

  const createListTask = (messages: string[]) => {
    const saveTask = (message: string) => taskService.save(message)
    return pipe(
      messages,
      TE.traverseArray(saveTask)
    )
  }

  const getObjectFromBody = (response: LightMyRequestResponse, objectName: string): any => {
    return JSON.parse(response.body)[objectName]
  }

  const callAPI = (url: any, method: any, payload?: any): TE.TaskEither<AppError, LightMyRequestResponse> => {
    return TE.tryCatch(
      () => server.inject({
        url: url,
        method: method,
        payload: payload
      }),
      (error) => runtimeErrorOf(`${method} ${url} API failed. ${error}`)
    )
  }

  describe('POST /tasks', () => {
    it(`should get new task`, async () => {
      const message = 'test'

      await pipe(
        callAPI(`${urlPath}`, 'POST', { message: message }),
        TE.match(
          (error) => { throw error },
          response => {
            expect(response.statusCode).toBe(201)

            const task = getObjectFromBody(response, 'task')

            expect(task.id).not.toBeNull()
            expect(task.message).toBe(message)
            expect(task.completed).toBe('N')
            expect(task.order).not.toBeNull()
          }
        )
      )()
    })
  })

  describe('PUT /tasks/:id', () => {
    it(`should update task`, async () => {
      const taskParams = {
        message: 'new message',
        completed: 'Y',
        order: 666,
        reminderTime: '2099-01-01 01:00:00'
      }

      await pipe(
        TE.Do,
        TE.bind("task", () => saveTask('test')),
        TE.bind("response", ({ task }) => callAPI(`${urlPath}/${task.id}`, 'PUT', taskParams)),
        TE.match(
          (error) => { throw error },
          ({ task, response }) => {
            expect(response.statusCode).toBe(200)

            const befoerUpdatedTask = getObjectFromBody(response, 'task')

            expect(befoerUpdatedTask.id).toBe(task.id)
            expect(befoerUpdatedTask.message).toBe(taskParams.message)
            expect(befoerUpdatedTask.completed).toBe(taskParams.completed)
            expect(befoerUpdatedTask.order).toBe(taskParams.order)
            expect(befoerUpdatedTask.reminderTime).toBe(taskParams.reminderTime)
          }
        )
      )()
    })

    it(`should clear reminderTime when update task without reminderTime`, async () => {
      const taskParams = {
        message: 'new message',
        completed: 'Y',
        order: 666
      }

      await pipe(
        TE.Do,
        TE.bind("task", () => saveTask('test', '2099-01-01 01:00:00')),
        TE.bind("response", ({ task }) => callAPI(`${urlPath}/${task.id}`, 'PUT', taskParams)),
        TE.match(
          (error) => { throw error },
          ({ task, response }) => {
            expect(response.statusCode).toBe(200)

            const befoerUpdatedTask = getObjectFromBody(response, 'task')

            expect(befoerUpdatedTask.id).toBe(task.id)
            expect(befoerUpdatedTask.message).toBe(taskParams.message)
            expect(befoerUpdatedTask.completed).toBe(taskParams.completed)
            expect(befoerUpdatedTask.order).toBe(taskParams.order)
            expect(befoerUpdatedTask.reminderTime).toBeUndefined()
          }
        )
      )()
    })

    it(`shoud get 'DataNotFoundError' error when use not existed Id`, async () => {
      const notExistedId = '62d44b90b928882b63cadbe2'
      const taskParams = {
        message: 'not existed',
        completed: 'Y',
        order: 666
      }

      await pipe(
        callAPI(`${urlPath}/${notExistedId}`, 'PUT', taskParams),
        TE.match(
          (error) => { throw error },
          response => {
            expect(response.statusCode).toBe(400)

            const error = getObjectFromBody(response, 'error')
            const message = getObjectFromBody(response, 'message')

            expect(error).toBe('DataNotFoundError')
            expect(message).toBe(`Task id ${notExistedId} not found`)
          }
        )
      )()
    })

    it(`shoud get 'ValidationError' error when use not availed Id`, async () => {
      const notAvailedId = '123456'
      const taskParams = {
        message: 'not availed',
        completed: 'Y',
        order: 666
      }

      await pipe(
        callAPI(`${urlPath}/${notAvailedId}`, 'PUT', taskParams),
        TE.match(
          (error) => { throw error },
          response => {
            expect(response.statusCode).toBe(400)

            const error = getObjectFromBody(response, 'error')
            const message = getObjectFromBody(response, 'message')

            expect(error).toBe('ValidationError')
            expect(message).toBe(`Task ID ${notAvailedId} is not availed.`)
          }
        )
      )()
    })
  })


  describe('PUT /tasks/:id/be-done', () => {
    it(`should completed task`, async () => {
      await pipe(
        TE.Do,
        TE.bind("task", () => saveTask('test')),
        TE.bind("response", ({ task }) => callAPI(`${urlPath}/${task.id}/be-done`, 'PUT')),
        TE.match(
          error => { throw error },
          ({ task, response }) => {
            expect(response.statusCode).toBe(200)

            const befoerCompletedTask = getObjectFromBody(response, 'task')

            expect(befoerCompletedTask.id).toBe(task.id)
            expect(befoerCompletedTask.message).toBe(task.message)
            expect(befoerCompletedTask.completed).toBe('Y')
            expect(befoerCompletedTask.order).toBe(task.order)
          }
        )
      )()
    })

    it(`should get 'ValidationError' error when use not availed id`, async () => {
      const id = '123456'

      await pipe(
        callAPI(`${urlPath}/${id}/be-done`, 'PUT'),
        TE.match(
          error => { throw error },
          (response) => {
            expect(response.statusCode).toBe(400)

            const error = getObjectFromBody(response, 'error')
            const message = getObjectFromBody(response, 'message')

            expect(error).toBe('ValidationError')
            expect(message).toBe(`Task ID ${id} is not availed.`)
          }
        )
      )()
    })

    it(`should get 'DataNotFoundError' error when use not existed Id`, async () => {
      const notExistedId = '62d44b90b928882b63cadbe2'

      await pipe(
        callAPI(`${urlPath}/${notExistedId}/be-done`, 'PUT'),
        TE.match(
          error => { throw error },
          (response) => {
            expect(response.statusCode).toBe(400)

            const error = getObjectFromBody(response, 'error')
            const message = getObjectFromBody(response, 'message')

            expect(error).toBe('DataNotFoundError')
            expect(message).toBe(`Task id ${notExistedId} not found`)
          }
        )
      )()
    })
  })

  describe('DELETE /tasks/:id', () => {
    it(`should delete task`, async () => {
      await pipe(
        saveTask('test'),
        TE.chain(t => callAPI(`${urlPath}/${t.id}`, 'DELETE')),
        TE.chain(
          (response) => {
            expect(response.statusCode).toBe(204)
            return TE.right(response)
          }
        ),
        TE.chain(_ => taskService.getUnCompletedTasks()),
        TE.match(
          error => { throw error },
          tasks => {
            expect(tasks.length).toBe(0)
          }
        )
      )()

      // const response = await callAPI(`${urlPath}/${task.id}`, 'DELETE')

      // expect(response.statusCode).toBe(204)

      // const unCompletedTasks = await pipe(
      //   taskService.getUnCompletedTasks(),
      //   TE.match(
      //     error => { throw error },
      //     tasks => tasks
      //   )
      // )()

      // expect(unCompletedTasks.length).toBe(0)
    })

    it(`shoud get 'DataNotFoundError' error when use not existed Id`, async () => {
      const notExistedId = '62d44b90b928882b63cadbe2'

      await pipe(
        callAPI(`${urlPath}/${notExistedId}`, 'DELETE'),
        TE.match(
          error => { throw error },
          (response) => {
            expect(response.statusCode).toBe(400)

            const error = getObjectFromBody(response, 'error')
            const message = getObjectFromBody(response, 'message')

            expect(error).toBe('DataNotFoundError')
            expect(message).toBe(`Task id ${notExistedId} not found`)
          }
        )
      )()
    })

    it(`shoud get 'ValidationError' error when use not availed id`, async () => {
      const id = '123456'

      await pipe(
        callAPI(`${urlPath}/${id}`, 'DELETE'),
        TE.match(
          error => { throw error },
          (response) => {
            expect(response.statusCode).toBe(400)

            const error = getObjectFromBody(response, 'error')
            const message = getObjectFromBody(response, 'message')

            expect(error).toBe('ValidationError')
            expect(message).toBe(`Task ID ${id} is not availed.`)
          }
        )
      )()
    })
  })

  describe('GET /tasks/to-do', () => {
    it(`should get uncompleted tasks`, async () => {
      const arrangeTestData = () => pipe(
        ['test1', 'test2'],
        createListTask
      )

      await pipe(
        TE.Do,
        TE.bind('arrangeData', () => arrangeTestData()),
        TE.bind('response', () => callAPI(`${urlPath}/to-do`, 'GET')),
        TE.match(
          error => { throw error },
          ({ arrangeData, response }) => {

            expect(response.statusCode).toBe(200)

            const toDoTasks: Task[] = getObjectFromBody(response, 'tasks')

            expect(toDoTasks.length).toBe(arrangeData.length)

            const eqTask: Eq<Task> = {
              equals: (a: Task, b: Task) => a.message === b.message
            }

            expect(pipe(toDoTasks, elem(eqTask)(arrangeData[0]))).toBeTruthy()
            expect(pipe(toDoTasks, elem(eqTask)(arrangeData[1]))).toBeTruthy()
          }
        )
      )()
    })
  })

  describe('GET /tasks/be-done', () => {
    it(`should get completed tasks`, async () => {
      const completed = (task: Task) => taskService.completedById(task.id)
      const arrangeTestData = () => pipe(
        ['test1', 'test2'],
        createListTask,
        TE.chain(TE.traverseArray(completed))
      )

      await pipe(
        arrangeTestData(),
        TE.chain(_ => callAPI(`${urlPath}/be-done`, 'GET')),
        TE.match(
          error => { throw error },
          (response) => {
            expect(response.statusCode).toBe(200)

            const toDoTasks: Task[] = getObjectFromBody(response, 'tasks')

            expect(toDoTasks.length).toBe(2)
          }
        )
      )()
    })
  })

  // describe('PUT /tasks/orders', () => {
  //   it(`should reorder tasks`, async () => {
  //     const taskData = await pipe(
  //       ['test1', 'test2'],
  //       createListTask,
  //       TE.match(
  //         (e) => [],
  //         (tasks) => tasks
  //       )
  //     )()

  //     expect(taskData.length).toBe(2)

  //     const orderInfos: OrderInfos = []

  //     const pushToOrderInfo = (t: Task) => orderInfos.push({ id: t.id, order: t.order })

  //     pipe(
  //       [...taskData],
  //       map(pushToOrderInfo)
  //     )

  //     orderInfos[0].order = 10
  //     orderInfos[1].order = 100

  //     const response = await callAPI(`${urlPath}/orders`, 'PUT', orderInfos)

  //     expect(response.statusCode).toBe(200)

  //     const modified = getObjectFromBody(response, 'modified')

  //     expect(modified).toBe(orderInfos.length)

  //     const unCompletedTasks = await pipe(
  //       taskService.getUnCompletedTasks(),
  //       TE.match(
  //         error => { throw error },
  //         tasks => tasks
  //       )
  //     )()

  //     const expectOrder = (orderInfo: any) => {
  //       expect(unCompletedTasks.find(t => t.id === orderInfo.id)?.order).toBe(orderInfo.order)
  //     }

  //     pipe(
  //       orderInfos,
  //       map(expectOrder)
  //     )
  //   })

  //   it(`should get 'DataNotFoundError' error when use not exist id`, async () => {
  //     const taskData: any = await pipe(
  //       ['test1', 'test2'],
  //       createListTask,
  //       TE.match(
  //         (e) => [],
  //         (tasks) => tasks
  //       )
  //     )()

  //     expect(taskData.length).toBe(2)

  //     const orderInfos: OrderInfos = []

  //     const pushToOrderInfo = (t: any) => orderInfos.push({ id: t.id, order: t.order })

  //     pipe(
  //       taskData,
  //       map(pushToOrderInfo)
  //     )

  //     orderInfos[0].id = '62d44b90b928882b63cadbe2'

  //     const response = await callAPI(`${urlPath}/orders`, 'PUT', orderInfos)

  //     expect(response.statusCode).toBe(400)

  //     const error = getObjectFromBody(response, 'error')
  //     const message = getObjectFromBody(response, 'message')

  //     expect(error).toBe('DataNotFoundError')
  //     expect(message).toBe('Just matched 1 data.')
  //   })
  // })

})