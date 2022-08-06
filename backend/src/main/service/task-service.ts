import { NewTask, Task } from '../type/task-type'
import { TaskParams } from '../type/task-type'
import { TaskRepo, TaskRepoImpl } from '../repo/task-repo'
import * as TE from 'fp-ts/TaskEither'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/lib/function'
import { AppError } from '../type/error-type'

export interface TaskService {
  save(data: NewTask): TE.TaskEither<AppError, Task>
  update(id: string, task: TaskParams): TE.TaskEither<AppError, Task>
  completedById(id: string): TE.TaskEither<AppError, Task>
  deleteById(id: string): TE.TaskEither<AppError, Task>
  getUnCompletedTasks(): TE.TaskEither<AppError, Task[]>
  getCompletedTasks(): TE.TaskEither<AppError, Task[]>
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

  save(data: NewTask): TE.TaskEither<AppError, Task> {
    return this.taskRepo.save({ ...data, completed: 'N' })
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

}
