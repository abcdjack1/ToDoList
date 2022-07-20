import { BulkWriteResult } from "mongodb"
import TaskModel, { Task } from "../model/task-model"
import { OrderParams, TaskParams } from "../type/params"

export interface TaskRepo {
  save(task: TaskParams): Promise<Task>
  updateById(id: string, taskParam: TaskParams): Promise<Task | null>
  completedById(id: string): Promise<Task | null>
  deleteById(id: string): Promise<Task | null>
  getUnCompletedTasks(): Promise<Task[]>
  getCompletedTasks(): Promise<Task[]>
  reorder(orderParam: OrderParams[]): Promise<BulkWriteResult>
  getMaxOrderTask(): Promise<Task | null>
  findById(id: string): Promise<Task | null>
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

  async save(task: TaskParams): Promise<Task> {
    return TaskModel.create(task)
  }

  async updateById(id: string, taskParam: TaskParams): Promise<Task | null> {
    return TaskModel.findByIdAndUpdate(id, taskParam, { new: true })
  }

  async completedById(id: string): Promise<Task | null> {
    return TaskModel.findByIdAndUpdate(id, { completed: 'Y' }, { new: true })
  }

  async deleteById(id: string): Promise<Task | null> {
    return TaskModel.findByIdAndRemove(id)
  }

  async getUnCompletedTasks(): Promise<Task[]> {
    return TaskModel.find({ completed: 'N' }).sort('order')
  }

  async getCompletedTasks(): Promise<Task[]> {
    return TaskModel.find({ completed: 'Y' }).sort('updateAt')
  }

  async reorder(orderParams: OrderParams[]): Promise<BulkWriteResult> {
    const writeOerations: any[] = []
    orderParams.forEach(p => {
      writeOerations.push({
        'updateOne': {
          'filter': { '_id': p.id },
          'update': { '$set': { order: p.order } }
        }
      })
    })
    return TaskModel.bulkWrite(writeOerations)
  }

  async getMaxOrderTask(): Promise<Task | null> {
    return TaskModel.findOne().sort({ 'order': -1 })
  }

  async findById(id: string): Promise<Task | null> {
    return TaskModel.findById(id)
  }

}