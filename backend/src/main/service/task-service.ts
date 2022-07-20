import { Task } from "../model/task-model"
import { BulkWriteResult } from "mongodb"
import { OrderParams, TaskParams } from "../type/params"
import { TaskRepo, TaskRepoImpl } from "../repo/task-repo"

export interface TaskService {
  save(message: string): Promise<Task>
  update(id: string, task: TaskParams): Promise<Task | null>
  completedById(id: string): Promise<Task | null>
  deleteById(id: string): Promise<Task | null>
  getUnCompletedTasks(): Promise<Task[]>
  getCompletedTasks(): Promise<Task[]>
  reorder(orderParam: OrderParams[]): Promise<BulkWriteResult>
  findById(id: string): Promise<Task | null>
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

  async save(message: string): Promise<Task> {
    let maxOrderTask = await this.taskRepo.getMaxOrderTask()
    const maxOrder = maxOrderTask == null ? 0 : maxOrderTask.order + 1
    const newTask: TaskParams = {
      message: message,
      completed: 'N',
      order: maxOrder
    }
    return this.taskRepo.save(newTask)
  }

  async update(id: string, taskParam: TaskParams): Promise<Task | null> {
    return this.taskRepo.updateById(id, taskParam)
  }

  async completedById(id: string): Promise<Task | null> {
    return this.taskRepo.completedById(id)
  }

  async deleteById(id: string): Promise<Task | null> {
    return this.taskRepo.deleteById(id)
  }

  async getUnCompletedTasks(): Promise<Task[]> {
    return this.taskRepo.getUnCompletedTasks()
  }

  async getCompletedTasks(): Promise<Task[]> {
    return this.taskRepo.getCompletedTasks()
  }

  async reorder(orderParams: OrderParams[]): Promise<BulkWriteResult> {
    return this.taskRepo.reorder(orderParams)
  }

  findById(id: string): Promise<Task | null> {
    return this.taskRepo.findById(id)
  }
}
