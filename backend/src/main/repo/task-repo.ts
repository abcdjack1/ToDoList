import TaskModel from '../model/task-model'
import { TaskParams, Task } from '../type/task-type'
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
      error => databaseErrorOf(`Create task failed. ${error}`)
    )
  }

  updateById(id: string, taskParam: TaskParams): TE.TaskEither<AppError, Task> {
    const updateData = this.genUpdateData(taskParam)
    const findByIdAndUpdate = () => TE.tryCatch(
      () => TaskModel.findByIdAndUpdate(id, updateData, { new: true }).exec(),
      error => this.throwIdIsNotAvailedErrorIfCastError(error, id)
    )

    return pipe(
      findByIdAndUpdate(),
      TE.chain(TE.fromNullable(dataNotFoundErrorOf(`Task id ${id} not found`) as AppError))
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
      TE.chain(TE.fromNullable(dataNotFoundErrorOf(`Task id ${id} not found`) as AppError))
    )
  }

  deleteById(id: string): TE.TaskEither<AppError, Task> {
    const findByIdAndRemove = () => TE.tryCatch(
      () => TaskModel.findByIdAndRemove(id).exec(),
      (error) => this.throwIdIsNotAvailedErrorIfCastError(error, id)
    )

    return pipe(
      findByIdAndRemove(),
      TE.chain(TE.fromNullable(dataNotFoundErrorOf(`Task id ${id} not found`) as AppError))
    )
  }

  getUnCompletedTasks(): TE.TaskEither<AppError, Task[]> {
    return TE.tryCatch(
      () => TaskModel.find({ completed: 'N' }).exec(),
      (error: any) => databaseErrorOf(`${error.message}`)
    )
  }

  getCompletedTasks(): TE.TaskEither<AppError, Task[]> {
    return TE.tryCatch(
      () => TaskModel.find({ completed: 'Y' }).sort({ 'updatedAt': -1 }).exec(),
      (error: any) => databaseErrorOf(`${error.message}`)
    )
  }

  throwIdIsNotAvailedErrorIfCastError = (error: any, id: string) =>
    error instanceof mongoose.Error.CastError ?
      validationErrorOf(`Task ID ${id} is not availed.`) as AppError :
      databaseErrorOf(error) as AppError

}