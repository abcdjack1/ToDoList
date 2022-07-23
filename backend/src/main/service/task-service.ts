import { Task } from '../type/task-type'
import { BulkWriteResult } from 'mongodb'
import { OrderInfos, TaskParams } from '../type/task-type'
import { TaskRepo, TaskRepoImpl } from '../repo/task-repo'
import * as TE from 'fp-ts/TaskEither'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/lib/function'

export interface TaskService {
  save(message: string): TE.TaskEither<Error, Task>
  update(id: string, task: TaskParams): TE.TaskEither<Error, Task>
  completedById(id: string): TE.TaskEither<Error, Task>
  deleteById(id: string): TE.TaskEither<Error, Task>
  getUnCompletedTasks(): TE.TaskEither<Error, Task[]>
  getCompletedTasks(): TE.TaskEither<Error, Task[]>
  reorder(orderParam: OrderInfos): TE.TaskEither<Error, BulkWriteResult>
  findById(id: string): TE.TaskEither<Error, Task>
}

export class TaskServiceImpl implements TaskService {

  private constructor() {
    //do nothing
  }

  private taskRepo: TaskRepo = TaskRepoImpl.getInstance()

  static taskService: TaskService

  static getInstance(): TaskService {
    const newInstance = () => {
      this.taskService = new TaskServiceImpl()
      return this.taskService
    }

    return pipe(
      this.taskService,
      O.fromNullable,
      O.getOrElse(
        newInstance
      )
    )
  }

  save(message: string): TE.TaskEither<Error, Task> {
    const getMaxOrder = this.taskRepo.getMaxOrder()
    const maxOrderPlusOne = (maxOrder: number) => maxOrder + 1
    const genTaskBody = (order: number): TaskParams => {
      return {
        message: message,
        completed: 'N',
        order: order
      }
    }
    const saveTask = (task: TaskParams) => this.taskRepo.save(task)

    return pipe(
      getMaxOrder,
      TE.map(maxOrderPlusOne),
      TE.map(genTaskBody),
      TE.chain(saveTask)
    )
  }

  update(id: string, taskParam: TaskParams): TE.TaskEither<Error, Task> {
    return this.taskRepo.updateById(id, taskParam)
  }

  completedById(id: string): TE.TaskEither<Error, Task> {
    return this.taskRepo.completedById(id)
  }

  deleteById(id: string): TE.TaskEither<Error, Task> {
    return this.taskRepo.deleteById(id)
  }

  getUnCompletedTasks(): TE.TaskEither<Error, Task[]> {
    return this.taskRepo.getUnCompletedTasks()
  }

  getCompletedTasks(): TE.TaskEither<Error, Task[]> {
    return this.taskRepo.getCompletedTasks()
  }

  reorder(orderParams: OrderInfos): TE.TaskEither<Error, BulkWriteResult> {
    return this.taskRepo.reorder(orderParams)
  }

  findById(id: string): TE.TaskEither<Error, Task> {
    return this.taskRepo.findById(id)
  }
}
