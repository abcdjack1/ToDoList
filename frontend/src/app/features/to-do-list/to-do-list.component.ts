import { DatePipe } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import { Subscription, timer } from 'rxjs'
import { ToDoService } from 'src/app/service/task.service'
import { Task } from 'src/app/types/tasks'
import { SwPush } from '@angular/service-worker'

@Component({
  selector: 'app-to-do-list',
  templateUrl: './to-do-list.component.html',
  styleUrls: ['./to-do-list.component.scss']
})
export class ToDoListComponent implements OnInit {

  toDoTasks!: Task[]
  completedTasks!: Task[]
  inputMessage: string = ''
  inputReminderTime: Date | null = null
  displayAddDialog: boolean = false
  displayEditDialog: boolean = false
  selectTask: Task = { id: '', message: '', completed: '', order: 0 }
  sw: ServiceWorkerRegistration | undefined = undefined
  datePipe: DatePipe = new DatePipe('en-US')
  timerMap = Object.create({})

  constructor(private toDoService: ToDoService, private swPush: SwPush) { }

  async ngOnInit(): Promise<void> {
    this.askNotificationPermission()
    await this.getToDoTasks()
    this.registNotificationClicks()
    this.initNotifications()
  }

  private async askNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        this.sw = await navigator.serviceWorker.getRegistration()
      }
    }
  }

  private async getToDoTasks() {
    this.toDoTasks = await this.toDoService.getToDoTasks()
  }

  private async getCompletedTasks() {
    this.completedTasks = await this.toDoService.getCompletedTasks()
  }

  onSelectTabChange(event: any) {
    if (event.index === 0) {
      this.getToDoTasks()
    } else {
      this.getCompletedTasks()
    }
  }

  addDialoag() {
    this.inputMessage = ""
    this.inputReminderTime = null
    this.displayAddDialog = true
  }

  async add() {
    const task = await this.toDoService.save(this.inputMessage, this.dateToString(this.inputReminderTime))
    this.toDoTasks.push(task)
    this.toDoTasks = this.toDoTasks.filter(t => true)
    this.displayAddDialog = false
    this.addNotification(task)
  }

  editDialog(task: Task) {
    this.inputMessage = task.message
    this.inputReminderTime = this.stringToDate(task.reminderTime)
    this.selectTask = task
    this.displayEditDialog = true
  }

  async edit() {
    this.selectTask.message = this.inputMessage
    this.selectTask.reminderTime = this.dateToString(this.inputReminderTime)
    const task = await this.toDoService.update(this.selectTask)
    this.displayEditDialog = false
    this.rebuildNotification(task)
  }

  async done(id: string) {
    await this.toDoService.completed(id)
    this.toDoTasks = this.toDoTasks.filter(t => t.id !== id)
    this.removeNotification(id)
  }

  async delete(id: string) {
    await this.toDoService.delete(id)
    this.getToDoTasks()
    this.removeNotification(id)
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

  initNotifications() {
    this.toDoTasks.forEach(t => this.addNotification(t))
  }

  addNotification(task: Task) {
    const date = this.stringToDate(task.reminderTime)
    if (date && date > new Date()) {
      this.timerMap[task.id] = timer(date).subscribe(() => {
        this.sw?.showNotification('Task reminder', this.buildNotificationOption(task))
      })
    }
  }

  removeNotification(id: string) {
    if (this.timerMap[id]) {
      const notification = this.timerMap[id] as Subscription
      notification.unsubscribe()
      this.timerMap[id] = undefined
    }
  }

  async rebuildNotification(task: Task) {
    this.removeNotification(task.id)
    this.addNotification(task)
  }

  buildNotificationOption(task: Task) {
    return {
      body: task.message,
      data: {
        id: task.id
      },
      requireInteraction: true,
      actions: [
        {
          action: 'done',
          title: 'Done'
        },
        {
          action: 'wait',
          title: 'Reminder in an hour'
        }
      ]
    }
  }

  registNotificationClicks() {
    this.swPush.notificationClicks.subscribe(({ action, notification }) => {
      this.notificationHandle(action, notification.data.id)
    })
  }

  async notificationHandle(action: string, id: string) {
    if (action === 'done') {
      await this.done(id)
    } else {
      const task = this.toDoTasks.find(t => t.id === id)
      if (task) {
        task.reminderTime = this.addOnehour(task.reminderTime)
      }
    }
  }

  addOnehour(dateAsString: string | undefined) {
    const date = this.stringToDate(dateAsString)
    date?.setTime(date.getTime() + (60 * 60 * 1000))
    return this.dateToString(date)
  }

  dateToString(date: Date | null) {
    const result = this.datePipe.transform(date, 'yyyy-MM-dd HH:mm')
    if (result) {
      return result + ':00'
    }
    return undefined
  }

  stringToDate(dateAsString: string | undefined) {
    if (dateAsString) {
      return new Date(dateAsString)
    }
    return null
  }

}
