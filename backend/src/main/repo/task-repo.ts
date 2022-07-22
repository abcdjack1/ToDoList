import { BulkWriteResult } from 'mongodb'
import TaskModel, { Task } from '../model/task-model'
import { OrderParams, TaskParams } from '../type/params'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/lib/function'

export interface TaskRepo {
  save(task: TaskParams): TE.TaskEither<Error, Task>
  updateById(id: string, taskParam: TaskParams): TE.TaskEither<Error, Task>
  completedById(id: string): TE.TaskEither<Error, Task>
  deleteById(id: string): TE.TaskEither<Error, Task>
  getUnCompletedTasks(): TE.TaskEither<Error, Task[]>
  getCompletedTasks(): TE.TaskEither<Error, Task[]>
  reorder(orderParam: OrderParams[]): TE.TaskEither<Error, BulkWriteResult>
  getMaxOrder(): TE.TaskEither<Error, number>
  findById(id: string): TE.TaskEither<Error, Task>
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
      this.throwNewError
    )
  }

  updateById(id: string, taskParam: TaskParams): TE.TaskEither<Error, Task> {
    const findByIdAndUpdate = () => TE.tryCatch(
      () => TaskModel.findByIdAndUpdate(id, taskParam, { new: true }).exec(),
      (error) => this.throwIdIsNotAvailedErrorIfCastError(error, id)
    )

    return pipe(
      findByIdAndUpdate(),
      TE.chain(t => t == null ? TE.left(this.taskIdNotFoundError(id)) : TE.right(t))
    )
  }

  completedById(id: string): TE.TaskEither<Error, Task> {
    const findByIdAndUpdate = () => TE.tryCatch(
      () => TaskModel.findByIdAndUpdate(id, { completed: 'Y' }, { new: true }).exec(),
      (error) => this.throwIdIsNotAvailedErrorIfCastError(error, id)
    )

    return pipe(
      findByIdAndUpdate(),
      TE.chain(t => t == null ? TE.left(this.taskIdNotFoundError(id)) : TE.right(t))
    )
  }

  deleteById(id: string): TE.TaskEither<Error, Task> {
    const findByIdAndRemove = () => TE.tryCatch(
      () => TaskModel.findByIdAndRemove(id).exec(),
      (error) => this.throwIdIsNotAvailedErrorIfCastError(error, id)
    )

    return pipe(
      findByIdAndRemove(),
      TE.chain(t => t == null ? TE.left(this.taskIdNotFoundError(id)) : TE.right(t))
    )
  }

  getUnCompletedTasks(): TE.TaskEither<Error, Task[]> {
    return TE.tryCatch(
      () => TaskModel.find({ completed: 'N' }).sort('order').exec(),
      this.throwNewError
    )
  }

  getCompletedTasks(): TE.TaskEither<Error, Task[]> {
    return TE.tryCatch(
      () => TaskModel.find({ completed: 'Y' }).sort({ 'updatedAt': -1 }).exec(),
      this.throwNewError
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
        this.throwNewError
      )
    }

    return pipe(
      orderParams,
      genWriteOperations,
      executeBulkWrite
    )
  }

  getMaxOrder(): TE.TaskEither<Error, number> {
    const findOne = () => TE.tryCatch(
      () => TaskModel.findOne().sort({ 'order': -1 }).exec(),
      this.throwNewError
    )

    return pipe(
      findOne(),
      TE.map(t => t == null ? 0 : 1)
    )
  }

  findById(id: string): TE.TaskEither<Error, Task> {
    const findById = () => TE.tryCatch(
      () => TaskModel.findById(id).exec(),
      this.throwNewError
    )

    return pipe(
      findById(),
      TE.chain(
        (t) => t == null ? TE.left(this.taskIdNotFoundError(id)) : TE.right(t)
      )
    )
  }

  throwNewError = (error: any) => new Error(error)

  throwIdIsNotAvailedErrorIfCastError = (error: any, id: string) =>
    error.name == 'CastError' ?
      new Error(`Task ID ${id} is not availed.`) :
      error

  taskIdNotFoundError = (id: string) => {
    return new Error(`Task id ${id} not found`)
  }

}