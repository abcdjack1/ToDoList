import TaskModel from '../model/task-model'
import { OrderInfos, TaskParams, Task } from '../type/task-type'
import * as TE from 'fp-ts/TaskEither'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/lib/function'

export interface TaskRepo {
  save(task: TaskParams): TE.TaskEither<Error, Task>
  updateById(id: string, taskParam: TaskParams): TE.TaskEither<Error, Task>
  completedById(id: string): TE.TaskEither<Error, Task>
  deleteById(id: string): TE.TaskEither<Error, Task>
  getUnCompletedTasks(): TE.TaskEither<Error, Task[]>
  getCompletedTasks(): TE.TaskEither<Error, Task[]>
  reorder(orderParam: OrderInfos): TE.TaskEither<Error, Number>
  getMaxOrder(): TE.TaskEither<Error, number>
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

  save(task: TaskParams): TE.TaskEither<Error, Task> {
    return TE.tryCatch(
      () => TaskModel.create(task),
      this.throwNewError
    )
  }

  updateById(id: string, taskParam: TaskParams): TE.TaskEither<Error, Task> {
    const updateData = this.genUpdateData(taskParam)
    const findByIdAndUpdate = () => TE.tryCatch(
      () => TaskModel.findByIdAndUpdate(id, updateData, { new: true }).exec(),
      (error) => this.throwIdIsNotAvailedErrorIfCastError(error, id)
    )
    return pipe(
      findByIdAndUpdate(),
      TE.chain(t => t == null ? TE.left(this.taskIdNotFoundError(id)) : TE.right(t))
    )
  }

  genUpdateData(taskParam: TaskParams) {
    let upadteData: any
    if (!taskParam.reminderTime) {
      upadteData = {
        message: taskParam.message,
        completed: taskParam.completed,
        order: taskParam.order,
        $unset: { reminderTime: "" }
      }
    } else {
      upadteData = taskParam
    }
    return upadteData
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

  reorder(orderParams: OrderInfos): TE.TaskEither<Error, Number> {
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
        this.throwNewError
      )
    }

    return pipe(
      orderParams,
      genWriteOperations,
      executeBulkWrite,
      TE.chain(r => r.nModified == orderParams.length ?
        TE.right(r.nModified) :
        TE.left(new Error(`Just matched ${r.nMatched} data.`)))
    )
  }

  getMaxOrder(): TE.TaskEither<Error, number> {
    const findOne = () => TE.tryCatch(
      () => TaskModel.find({ completed: 'N' }).findOne().sort({ 'order': -1 }).exec(),
      this.throwNewError
    )

    return pipe(
      findOne(),
      TE.map(t => t == null ? 0 : t.order)
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