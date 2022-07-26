import { Task } from '../type/task-type'
import { OrderInfos, TaskParams } from '../type/task-type'
import { TaskRepo, TaskRepoImpl } from '../repo/task-repo'
import * as TE from 'fp-ts/TaskEither'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/lib/function'
import { AppError } from '../type/error-type'

export interface TaskService {
  save(message: string, reminderTime?: string): TE.TaskEither<AppError, Task>
  update(id: string, task: TaskParams): TE.TaskEither<AppError, Task>
  completedById(id: string): TE.TaskEither<AppError, Task>
  deleteById(id: string): TE.TaskEither<AppError, Task>
  getUnCompletedTasks(): TE.TaskEither<AppError, Task[]>
  getCompletedTasks(): TE.TaskEither<AppError, Task[]>
  reorder(orderParam: OrderInfos): TE.TaskEither<AppError, Number>
}

export class TaskServiceImpl implements TaskService {

  private constructor() {
    //do nothing
  }

  private taskRepo: TaskRepo = TaskRepoImpl.getInstance()

  static taskService: TaskService

  static getInstance(): TaskService {
    return pipe(
      this.taskService,
      O.fromNullable,
      O.getOrElse(
        this.newInstance
      )
    )
  }

  static newInstance = () => {
    this.taskService = new TaskServiceImpl()
    return this.taskService
  }


  save(message: string, reminderTime?: string): TE.TaskEither<AppError, Task> {
    this.taskRepo = TaskRepoImpl.getInstance()
    const getMaxOrder = this.taskRepo.getMaxOrder()
    const maxOrderPlusOne = (maxOrder: number) => maxOrder + 1
    const genTaskBody = (order: number): TaskParams => {
      return {
        message: message,
        completed: 'N',
        order: order,
        reminderTime: reminderTime
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

  update(id: string, taskParam: TaskParams): TE.TaskEither<AppError, Task> {
    return this.taskRepo.updateById(id, taskParam)
  }

  completedById(id: string): TE.TaskEither<AppError, Task> {
    return this.taskRepo.completedById(id)
  }

  deleteById(id: string): TE.TaskEither<AppError, Task> {
    return this.taskRepo.deleteById(id)
  }

  getUnCompletedTasks(): TE.TaskEither<AppError, Task[]> {
    return this.taskRepo.getUnCompletedTasks()
  }

  getCompletedTasks(): TE.TaskEither<AppError, Task[]> {
    return this.taskRepo.getCompletedTasks()
  }

  reorder(orderParams: OrderInfos): TE.TaskEither<AppError, Number> {
    return this.taskRepo.reorder(orderParams)
  }

}
