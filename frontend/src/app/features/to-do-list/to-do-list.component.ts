import { Component, OnInit } from '@angular/core'
import { ToDoService } from 'src/app/service/to-do.service'
import { Task } from 'src/app/types/to-do-task'

@Component({
  selector: 'app-to-do-list',
  templateUrl: './to-do-list.component.html',
  styleUrls: ['./to-do-list.component.scss']
})
export class ToDoListComponent implements OnInit {

  toDoTasks!: Task[]
  completedTasks!: Task[]
  inputMessage: string = '';
  displayAddDialog: boolean = false
  displayEditDialog: boolean = false
  selectTask: Task = { id: '', message: '', completed: '', order: 0 }

  constructor(private toDoService: ToDoService) { }

  ngOnInit(): void {
    this.getToDoTasks()
  }

  private async getToDoTasks() {
    this.toDoTasks = await this.toDoService.getToDoTasks()
  }

  private async getCompletedTasks() {
    this.completedTasks = await this.toDoService.getCompletedTasks()
  }

  onSelectTabChange(event: any) {
    if (event.index == 0) {
      this.getToDoTasks()
    } else {
      this.getCompletedTasks()
    }
  }

  addDialoag() {
    this.inputMessage = ""
    this.displayAddDialog = true
  }

  async add() {
    const task = await this.toDoService.save(this.inputMessage)
    this.toDoTasks.push(task)
    this.toDoTasks = this.toDoTasks.filter(t => true)
    this.displayAddDialog = false
  }

  editDialog(task: Task) {
    this.inputMessage = task.message
    this.selectTask = task
    this.displayEditDialog = true
  }

  async edit() {
    this.selectTask.message = this.inputMessage
    await this.toDoService.update(this.selectTask)
    this.displayEditDialog = false
  }

  async done(id: string) {
    await this.toDoService.completed(id)
    this.toDoTasks = this.toDoTasks.filter(t => t.id !== id)
  }

  async delete(id: string) {
    await this.toDoService.delete(id)
    this.getToDoTasks()
  }

  async onReorder() {
    await this.reorderTaskByIndex(this.toDoTasks);
  }

  private async reorderTaskByIndex(tasks: Task[]) {
    const orderInfos: any[] = []
    tasks.forEach((value, index) => {
      value.order = index;
      const orderInfo = {
        id: value.id,
        order: index
      }
      orderInfos.push(orderInfo)
    })
    await this.toDoService.reorder(orderInfos)
  }

}
