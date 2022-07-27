import TaskModel from '../model/task-model'
import { OrderInfos, TaskParams, Task } from '../type/task-type'
import * as TE from 'fp-ts/TaskEither'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/lib/function'
import { AppError, databaseErrorOf, dataNotFoundErrorOf, validationErrorOf } from '../type/error-type'
import mongoose from 'mongoose'

export interface TaskRepo {
  save(task: TaskParams): TE.TaskEither<AppError, Task>
  updateById(id: string, taskParam: TaskParams): TE.TaskEither<AppError, Task>
  completedById(id: string): TE.TaskEither<AppError, Task>
  deleteById(id: string): TE.TaskEither<AppError, Task>
  getUnCompletedTasks(): TE.TaskEither<AppError, Task[]>
  getCompletedTasks(): TE.TaskEither<AppError, Task[]>
  reorder(orderParam: OrderInfos): TE.TaskEither<AppError, Number>
  getMaxOrder(): TE.TaskEither<AppError, number>
}

export class TaskRepoImpl implements TaskRepo {

  private constructor() {
    //do nothing
  }

  static taskRepoImpl: TaskRepo

  static getInstance(): TaskRepo {
    return pipe(
      this.taskRepoImpl,
      O.fromNullable,
      O.getOrElse(
        this.newInstance
      )
    )
  }

  static newInstance = () => {
    this.taskRepoImpl = new TaskRepoImpl()
    return this.taskRepoImpl
  }

  save(task: TaskParams): TE.TaskEither<AppError, Task> {
    return TE.tryCatch(
      () => TaskModel.create(task),
      (error) => databaseErrorOf(`${error}`)
    )
  }

  updateById(id: string, taskParam: TaskParams): TE.TaskEither<AppError, Task> {
    const updateData = this.genUpdateData(taskParam)
    const findByIdAndUpdate = () => TE.tryCatch(
      () => TaskModel.findByIdAndUpdate(id, updateData, { new: true }).exec(),
      (error) => this.throwIdIsNotAvailedErrorIfCastError(error, id)
    )
    return pipe(
      findByIdAndUpdate(),
      TE.chain(t => t === null ? TE.left(dataNotFoundErrorOf(`Task id ${id} not found`)) : TE.right(t))
    )
  }

  genUpdateData(taskParam: TaskParams) {
    return pipe(
      taskParam.reminderTime,
      O.fromNullable,
      O.match(
        () => {
          return { ...taskParam, $unset: { reminderTime: "" } }
        },
        () => taskParam
      )
    )
  }

  completedById(id: string): TE.TaskEither<AppError, Task> {
    const findByIdAndUpdate = () => TE.tryCatch(
      () => TaskModel.findByIdAndUpdate(id, { completed: 'Y' }, { new: true }).exec(),
      (error) => this.throwIdIsNotAvailedErrorIfCastError(error, id)
    )

    return pipe(
      findByIdAndUpdate(),
      TE.chain(t => t === null ? TE.left(dataNotFoundErrorOf(`Task id ${id} not found`)) : TE.right(t))
    )
  }

  deleteById(id: string): TE.TaskEither<AppError, Task> {
    const findByIdAndRemove = () => TE.tryCatch(
      () => TaskModel.findByIdAndRemove(id).exec(),
      (error) => this.throwIdIsNotAvailedErrorIfCastError(error, id)
    )

    return pipe(
      findByIdAndRemove(),
      TE.chain(t => t === null ? TE.left(dataNotFoundErrorOf(`Task id ${id} not found`)) : TE.right(t))
    )
  }

  getUnCompletedTasks(): TE.TaskEither<AppError, Task[]> {
    return TE.tryCatch(
      () => TaskModel.find({ completed: 'N' }).sort('order').exec(),
      (error) => databaseErrorOf(`${error}`)
    )
  }

  getCompletedTasks(): TE.TaskEither<AppError, Task[]> {
    return TE.tryCatch(
      () => TaskModel.find({ completed: 'Y' }).sort({ 'updatedAt': -1 }).exec(),
      (error) => databaseErrorOf(`${error}`)
    )
  }

  reorder(orderParams: OrderInfos): TE.TaskEither<AppError, Number> {
    const genWriteOperations = (orderParams: OrderInfos) => {
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
        (error) => databaseErrorOf(`${error}`) as AppError
      )
    }

    return pipe(
      orderParams,
      genWriteOperations,
      executeBulkWrite,
      TE.chain(r => r.nModified === orderParams.length ?
        TE.right(r.nModified) :
        TE.left(dataNotFoundErrorOf(`Just matched ${r.nMatched} data.`)))
    )
  }

  getMaxOrder(): TE.TaskEither<AppError, number> {
    const findOne = () => TE.tryCatch(
      () => TaskModel.find({ completed: 'N' }).findOne().sort({ 'order': -1 }).exec(),
      (error) => databaseErrorOf(`${error}`)
    )

    return pipe(
      findOne(),
      TE.map(t => t === null ? 0 : t.order)
    )
  }

  throwIdIsNotAvailedErrorIfCastError = (error: any, id: string) =>
    error instanceof mongoose.Error.CastError ?
      validationErrorOf(`Task ID ${id} is not availed.`) as AppError :
      databaseErrorOf(error) as AppError

}