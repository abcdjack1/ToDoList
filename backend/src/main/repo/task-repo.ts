import { BulkWriteResult } from 'mongodb'
import TaskModel, { Task } from '../model/task-model'
import { OrderParams, TaskParams } from '../type/params'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/lib/function'

export interface TaskRepo {
  save(task: TaskParams): TE.TaskEither<Error, Task>
  updateById(id: string, taskParam: TaskParams): TE.TaskEither<Error, Task | null>
  completedById(id: string): TE.TaskEither<Error, Task | null>
  deleteById(id: string): TE.TaskEither<Error, Task | null>
  getUnCompletedTasks(): TE.TaskEither<Error, Task[]>
  getCompletedTasks(): TE.TaskEither<Error, Task[]>
  reorder(orderParam: OrderParams[]): TE.TaskEither<Error, BulkWriteResult>
  getMaxOrderTask(): TE.TaskEither<Error, Task | null>
  findById(id: string): TE.TaskEither<Error, Task | null>
}

export class TaskRepoImpl implements TaskRepo {

  private constructor() {
    //do nothing
  }

  static taskRepoImpl: TaskRepo

  static build(): TaskRepo {
    if (!this.taskRepoImpl) {
      this.taskRepoImpl = new TaskRepoImpl()
    }
    return this.taskRepoImpl;
  }

  save(task: TaskParams): TE.TaskEither<Error, Task> {
    return TE.tryCatch(
      () => TaskModel.create(task),
      this.throwError
    )
  }

  updateById(id: string, taskParam: TaskParams): TE.TaskEither<Error, Task | null> {
    return TE.tryCatch(
      () => TaskModel.findByIdAndUpdate(id, taskParam, { new: true }).exec(),
      this.throwError
    )
  }

  completedById(id: string): TE.TaskEither<Error, Task | null> {
    return TE.tryCatch(
      () => TaskModel.findByIdAndUpdate(id, { completed: 'Y' }, { new: true }).exec(),
      this.throwError
    )
  }

  deleteById(id: string): TE.TaskEither<Error, Task | null> {
    return TE.tryCatch(
      () => TaskModel.findByIdAndRemove(id).exec(),
      this.throwError
    )
  }

  getUnCompletedTasks(): TE.TaskEither<Error, Task[]> {
    return TE.tryCatch(
      () => TaskModel.find({ completed: 'N' }).sort('order').exec(),
      this.throwError
    )
  }

  getCompletedTasks(): TE.TaskEither<Error, Task[]> {
    return TE.tryCatch(
      () => TaskModel.find({ completed: 'Y' }).sort('updateAt').exec(),
      this.throwError
    )
  }

  reorder(orderParams: OrderParams[]): TE.TaskEither<Error, BulkWriteResult> {
    const genWriteOperations = (orderParams: OrderParams[]) => {
      return orderParams.map(p => {
        return {
          'updateOne': {
            'filter': { '_id': p.id },
            'update': { '$set': { order: p.order } }
          }
        }
      })
    }
    const executeBulkWrite = (writeOperations: any[]) => {
      return TE.tryCatch(
        () => TaskModel.bulkWrite(writeOperations),
        this.throwError
      )
    }

    return pipe(
      orderParams,
      genWriteOperations,
      executeBulkWrite
    )
  }

  getMaxOrderTask(): TE.TaskEither<Error, Task | null> {
    return TE.tryCatch(
      () => TaskModel.findOne().sort({ 'order': -1 }).exec(),
      this.throwError
    )
  }

  findById(id: string): TE.TaskEither<Error, Task | null> {
    return TE.tryCatch(
      () => TaskModel.findById(id).exec(),
      this.throwError
    )
  }

  throwError = (error: any) => new Error(error)

}