import { Task } from '../model/task-model'
import { BulkWriteResult } from 'mongodb'
import { OrderParams, TaskParams } from '../type/params'
import { TaskRepo, TaskRepoImpl } from '../repo/task-repo'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/lib/function'

export interface TaskService {
  save(message: string): TE.TaskEither<Error, Task>
  update(id: string, task: TaskParams): TE.TaskEither<Error, Task | null>
  completedById(id: string): TE.TaskEither<Error, Task | null>
  deleteById(id: string): TE.TaskEither<Error, Task | null>
  getUnCompletedTasks(): TE.TaskEither<Error, Task[]>
  getCompletedTasks(): TE.TaskEither<Error, Task[]>
  reorder(orderParam: OrderParams[]): TE.TaskEither<Error, BulkWriteResult>
  findById(id: string): TE.TaskEither<Error, Task | null>
}

export class TaskServiceImpl implements TaskService {

  private constructor() {
    //do nothing
  }

  private taskRepo: TaskRepo = TaskRepoImpl.build()

  static taskService: TaskService

  static create(): TaskService {
    if (!this.taskService) {
      this.taskService = new TaskServiceImpl()
    }
    return this.taskService
  }

  save(message: string): TE.TaskEither<Error, Task> {
    const getMaxOrderTask = this.taskRepo.getMaxOrderTask()
    const maxOrderPlusOne = (task: Task | null) => task == null ? 0 : task.order + 1
    const genTaskBody = (order: number): TaskParams => {
      return {
        message: message,
        completed: 'N',
        order: order
      }
    }
    const saveTask = (task: TaskParams) => this.taskRepo.save(task)

    return pipe(
      getMaxOrderTask,
      TE.map(maxOrderPlusOne),
      TE.map(genTaskBody),
      TE.chain(saveTask)
    )
  }

  update(id: string, taskParam: TaskParams): TE.TaskEither<Error, Task | null> {
    return this.taskRepo.updateById(id, taskParam)
  }

  completedById(id: string): TE.TaskEither<Error, Task | null> {
    return this.taskRepo.completedById(id)
  }

  deleteById(id: string): TE.TaskEither<Error, Task | null> {
    return this.taskRepo.deleteById(id)
  }

  getUnCompletedTasks(): TE.TaskEither<Error, Task[]> {
    return this.taskRepo.getUnCompletedTasks()
  }

  getCompletedTasks(): TE.TaskEither<Error, Task[]> {
    return this.taskRepo.getCompletedTasks()
  }

  reorder(orderParams: OrderParams[]): TE.TaskEither<Error, BulkWriteResult> {
    return this.taskRepo.reorder(orderParams)
  }

  findById(id: string): TE.TaskEither<Error, Task | null> {
    return this.taskRepo.findById(id)
  }
}
