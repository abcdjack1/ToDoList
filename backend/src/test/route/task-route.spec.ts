import { FastifyInstance } from 'fastify'
import { Task, NewTask } from '../../main/type/task-type'
import { startServer } from '../../main/server'
import { Response as LightMyRequestResponse } from 'light-my-request'
import { TaskServiceImpl } from '../../main/service/task-service'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/lib/function'
import { elem } from 'fp-ts/Array'
import { Eq } from 'fp-ts/lib/Eq'
import { AppError, runtimeErrorOf } from '../../main/type/error-type'
import * as dbHandler from 'testcontainers-mongoose'
import * as E from 'fp-ts/Either'

describe('Testing To-Do List API', () => {
  let server: FastifyInstance
  const urlPath = 'v1/tasks'
  const taskService = TaskServiceImpl.getInstance()

  beforeAll(async () => {
    server = startServer()
    await server.ready()
    await dbHandler.connect('mongo:5.0.9')
  })

  beforeEach(async () => {
    await dbHandler.clearDatabase()
  })

  afterAll(async () => {
    await dbHandler.closeDatabase()
    await server.close()
  })

  const saveTask = (data: NewTask) => taskService.save(data)

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

  const newTaskData: NewTask = {
    message: 'test',
    priority: 'Medium'
  }

  const newTaskData2: NewTask = {
    message: 'test2',
    priority: 'Medium'
  }

  describe('POST /tasks', () => {
    it(`should get new task`, async () => {
      const responseData = await callAPI(`${urlPath}`, 'POST', { message: newTaskData.message, priority: newTaskData.priority })()

      expect(E.isRight(responseData)).toBe(true)

      pipe(
        responseData,
        E.map(response => {
          expect(response.statusCode).toBe(201)

          const task = getObjectFromBody(response, 'task')

          expect(task.id).not.toBeNull()
          expect(task.message).toBe(newTaskData.message)
          expect(task.completed).toBe('N')
          expect(task.priority).toBe(newTaskData.priority)
        })
      )
    })
  })

  describe('PUT /tasks/:id', () => {
    it(`should update task`, async () => {
      const taskParams = {
        message: 'new message',
        completed: 'Y',
        priority: 'High',
        reminderTime: '2099-01-01 01:00:00'
      }

      const testData = await pipe(
        TE.Do,
        TE.bind("task", () => saveTask(newTaskData)),
        TE.bind("response", ({ task }) => callAPI(`${urlPath}/${task.id}`, 'PUT', taskParams))
      )()

      expect(E.isRight(testData)).toBe(true)

      pipe(
        testData,
        E.map(({ task, response }) => {
          expect(response.statusCode).toBe(200)

          const befoerUpdatedTask = getObjectFromBody(response, 'task')

          expect(befoerUpdatedTask.id).toBe(task.id)
          expect(befoerUpdatedTask.message).toBe(taskParams.message)
          expect(befoerUpdatedTask.completed).toBe(taskParams.completed)
          expect(befoerUpdatedTask.priority).toBe(taskParams.priority)
          expect(befoerUpdatedTask.reminderTime).toBe(taskParams.reminderTime)
        })
      )

    })

    it(`should clear reminderTime when update task without reminderTime`, async () => {
      const taskParams = {
        message: 'new message',
        completed: 'Y',
        priority: 'Low'
      }

      const testData = await pipe(
        TE.Do,
        TE.bind("task", () => saveTask({ ...newTaskData, reminderTime: '2099-01-01 01:00:00' })),
        TE.bind("response", ({ task }) => callAPI(`${urlPath}/${task.id}`, 'PUT', taskParams))
      )()

      expect(E.isRight(testData)).toBe(true)

      pipe(
        testData,
        E.map(({ task, response }) => {
          expect(response.statusCode).toBe(200)

          const befoerUpdatedTask = getObjectFromBody(response, 'task')

          expect(befoerUpdatedTask.id).toBe(task.id)
          expect(befoerUpdatedTask.message).toBe(taskParams.message)
          expect(befoerUpdatedTask.completed).toBe(taskParams.completed)
          expect(befoerUpdatedTask.priority).toBe(taskParams.priority)
          expect(befoerUpdatedTask.reminderTime).toBeUndefined()
        })
      )
    })

    it(`shoud get 'DataNotFoundError' error when use not existed Id`, async () => {
      const notExistedId = '62d44b90b928882b63cadbe2'
      const taskParams = {
        message: 'not existed',
        completed: 'Y',
        priority: 'Low'
      }

      const responseData = await callAPI(`${urlPath}/${notExistedId}`, 'PUT', taskParams)()

      expect(E.isRight(responseData)).toBe(true)

      pipe(
        responseData,
        E.map(response => {
          expect(response.statusCode).toBe(400)

          const error = getObjectFromBody(response, 'error')
          const message = getObjectFromBody(response, 'message')

          expect(error).toBe('DataNotFoundError')
          expect(message).toBe(`Task id ${notExistedId} not found`)
        })
      )
    })

    it(`shoud get 'ValidationError' error when use not availed Id`, async () => {
      const notAvailedId = '123456'
      const taskParams = {
        message: 'not availed',
        completed: 'Y',
        priority: 'Medium'
      }

      const responseData = await callAPI(`${urlPath}/${notAvailedId}`, 'PUT', taskParams)()

      expect(E.isRight(responseData)).toBe(true)

      pipe(
        responseData,
        E.map(response => {
          expect(response.statusCode).toBe(400)

          const error = getObjectFromBody(response, 'error')
          const message = getObjectFromBody(response, 'message')

          expect(error).toBe('ValidationError')
          expect(message).toBe(`Task ID ${notAvailedId} is not availed.`)
        })
      )

    })
  })


  describe('PUT /tasks/:id/be-done', () => {
    it(`should completed task`, async () => {
      const testData = await pipe(
        TE.Do,
        TE.bind("task", () => saveTask(newTaskData)),
        TE.bind("response", ({ task }) => callAPI(`${urlPath}/${task.id}/be-done`, 'PUT'))
      )()

      expect(E.isRight(testData)).toBe(true)

      pipe(
        testData,
        E.map(({ task, response }) => {
          expect(response.statusCode).toBe(200)

          const befoerCompletedTask = getObjectFromBody(response, 'task')

          expect(befoerCompletedTask.id).toBe(task.id)
          expect(befoerCompletedTask.message).toBe(task.message)
          expect(befoerCompletedTask.completed).toBe('Y')
          expect(befoerCompletedTask.priority).toBe(task.priority)
        })
      )

    })

    it(`should get 'ValidationError' error when use not availed id`, async () => {
      const id = '123456'

      const responseData = await callAPI(`${urlPath}/${id}/be-done`, 'PUT')()

      expect(E.isRight(responseData)).toBe(true)

      pipe(
        responseData,
        E.map(response => {
          expect(response.statusCode).toBe(400)

          const error = getObjectFromBody(response, 'error')
          const message = getObjectFromBody(response, 'message')

          expect(error).toBe('ValidationError')
          expect(message).toBe(`Task ID ${id} is not availed.`)
        })
      )

    })

    it(`should get 'DataNotFoundError' error when use not existed Id`, async () => {
      const notExistedId = '62d44b90b928882b63cadbe2'

      const responseData = await callAPI(`${urlPath}/${notExistedId}/be-done`, 'PUT')()

      expect(E.isRight(responseData)).toBe(true)

      pipe(
        responseData,
        E.map(response => {
          expect(response.statusCode).toBe(400)

          const error = getObjectFromBody(response, 'error')
          const message = getObjectFromBody(response, 'message')

          expect(error).toBe('DataNotFoundError')
          expect(message).toBe(`Task id ${notExistedId} not found`)
        })
      )

    })
  })

  describe('DELETE /tasks/:id', () => {
    it(`should delete task`, async () => {
      const responseData = await pipe(
        saveTask(newTaskData),
        TE.chain(t => callAPI(`${urlPath}/${t.id}`, 'DELETE'))
      )()

      expect(E.isRight(responseData)).toBe(true)

      pipe(
        responseData,
        E.map(response => {
          expect(response.statusCode).toBe(204)
        })
      )

      const tasksData = await taskService.getUnCompletedTasks()()

      expect(E.isRight(tasksData)).toBe(true)

      pipe(
        tasksData,
        E.map(tasks => {
          expect(tasks.length).toBe(0)
        })
      )

    })

    it(`shoud get 'DataNotFoundError' error when use not existed Id`, async () => {
      const notExistedId = '62d44b90b928882b63cadbe2'

      const responseData = await callAPI(`${urlPath}/${notExistedId}`, 'DELETE')()

      expect(E.isRight(responseData)).toBe(true)

      pipe(
        responseData,
        E.map(response => {
          expect(response.statusCode).toBe(400)

          const error = getObjectFromBody(response, 'error')
          const message = getObjectFromBody(response, 'message')

          expect(error).toBe('DataNotFoundError')
          expect(message).toBe(`Task id ${notExistedId} not found`)
        })
      )

    })

    it(`shoud get 'ValidationError' error when use not availed id`, async () => {
      const id = '123456'

      const responseData = await callAPI(`${urlPath}/${id}`, 'DELETE')()

      expect(E.isRight(responseData)).toBe(true)

      pipe(
        responseData,
        E.map(response => {
          expect(response.statusCode).toBe(400)

          const error = getObjectFromBody(response, 'error')
          const message = getObjectFromBody(response, 'message')

          expect(error).toBe('ValidationError')
          expect(message).toBe(`Task ID ${id} is not availed.`)
        })
      )
    })
  })

  describe('GET /tasks/to-do', () => {
    it(`should get uncompleted tasks`, async () => {

      const testData = await pipe(
        TE.Do,
        TE.bind('tasks', () => pipe(
          [newTaskData, newTaskData2],
          TE.traverseArray(saveTask)
        )),
        TE.bind('response', () => callAPI(`${urlPath}/to-do`, 'GET'))
      )()

      expect(E.isRight(testData)).toBe(true)

      pipe(
        testData,
        E.map(({ tasks, response }) => {
          expect(response.statusCode).toBe(200)

          const toDoTasks: Task[] = getObjectFromBody(response, 'tasks')

          expect(toDoTasks.length).toBe(tasks.length)

          const eqTask: Eq<Task> = {
            equals: (a: Task, b: Task) => a.message === b.message
          }

          expect(pipe(toDoTasks, elem(eqTask)(tasks[0]))).toBe(true)
          expect(pipe(toDoTasks, elem(eqTask)(tasks[1]))).toBe(true)
        })
      )

    })
  })

  describe('GET /tasks/be-done', () => {
    it(`should get completed tasks`, async () => {
      const completed = (task: Task) => taskService.completedById(task.id)

      const responseData = await pipe(
        [newTaskData, newTaskData2],
        TE.traverseArray(
          m => pipe(
            m,
            saveTask,
            TE.chain(completed))
        ),
        TE.chain(_ => callAPI(`${urlPath}/be-done`, 'GET'))
      )()

      expect(E.isRight(responseData)).toBe(true)

      pipe(
        responseData,
        E.map(response => {
          expect(response.statusCode).toBe(200)

          const toDoTasks: Task[] = getObjectFromBody(response, 'tasks')

          expect(toDoTasks.length).toBe(2)
        })
      )

    })
  })
})