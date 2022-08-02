import { DatePipe } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import { Subscription, timer } from 'rxjs'
import { ToDoService } from 'src/app/service/task.service'
import { Task } from 'src/app/types/tasks'
import { SwPush } from '@angular/service-worker'
import { pipe } from 'fp-ts/lib/function'
import * as TE from 'fp-ts/TaskEither'

@Component({
  selector: 'app-to-do-list',
  templateUrl: './to-do-list.component.html',
  styleUrls: ['./to-do-list.component.scss']
})
export class ToDoListComponent implements OnInit {

  readonly priorities = ['Low', 'Medium', 'High']
  readonly sortMap = new Map([['High', 2], ['Medium', 1], ['Low', 0]])
  toDoTasks!: Task[]
  completedTasks!: Task[]
  inputMessage: string = ''
  inputPriority: string = 'Medium'
  inputReminderTime: Date | null = null
  displayAddDialog: boolean = false
  displayEditDialog: boolean = false
  displayErrorDialog: boolean = false
  serverErrorMessage: string = ''
  selectTask: Task = { id: '', message: '', completed: '', priority: 'Medium' }
  sw: ServiceWorkerRegistration | undefined = undefined
  datePipe: DatePipe = new DatePipe('en-US')
  timerMap = new Map<string, Subscription>()
  validationFailedMessage = ''

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

  async getToDoTasks() {
    await pipe(
      this.toDoService.getToDoTasks(),
      TE.match(
        error => {
          this.displayErrorDialog = true
          this.serverErrorMessage = error.message
        },
        tasks => {
          this.toDoTasks = tasks.tasks
          this.sortTasks()
        }
      )
    )()
  }

  sortTasks() {
    this.toDoTasks.sort((x, y) => {
      const xPriority: any = this.sortMap.get(x.priority)
      const yPriority: any = this.sortMap.get(y.priority)

      //sort by priority
      if (xPriority > yPriority) {
        return -1
      } else if (xPriority < yPriority) {
        return 1
      }

      const xRemider = this.stringToDate(x.reminderTime)?.getTime()
      const yRemider = this.stringToDate(y.reminderTime)?.getTime()

      //sort by remider
      if (xRemider !== undefined && yRemider !== undefined) {
        if (xRemider > yRemider) {
          return 1
        } else {
          return -1
        }
      }

      if (xRemider) {
        return -1
      }

      if (yRemider) {
        return 1
      }

      return 0
    })
    this.toDoTasks = this.toDoTasks.filter(t => true)
  }

  async getCompletedTasks() {
    await pipe(
      this.toDoService.getCompletedTasks(),
      TE.match(
        error => {
          this.displayErrorDialog = true
          this.serverErrorMessage = error.message
        },
        tasks => {
          this.completedTasks = tasks.tasks
        }
      )
    )()
  }

  async onSelectTabChange(event: any) {
    if (event.index === 0) {
      await this.getToDoTasks()
    } else {
      await this.getCompletedTasks()
    }
  }

  addDialoag() {
    this.inputMessage = ''
    this.inputPriority = 'Medium'
    this.inputReminderTime = null
    this.validationFailedMessage = ''
    this.displayAddDialog = true
  }

  async add() {
    if (this.validation()) {
      await pipe(
        this.toDoService.save(this.inputMessage, this.inputPriority, this.dateToString(this.inputReminderTime)),
        TE.match(
          error => {
            this.displayErrorDialog = true
            this.serverErrorMessage = error.message
          },
          task => {
            const saveTask = task.task
            this.toDoTasks.push(saveTask)
            this.displayAddDialog = false
            this.addNotification(saveTask)
            this.sortTasks()
          }
        )
      )()
    }
  }

  validation() {
    if (this.inputPriority === 'High' && (this.inputReminderTime === null || this.inputReminderTime.getTime() < Date.now())) {
      this.validationFailedMessage = 'High priority task need available reminder time.'
      return false
    }
    this.validationFailedMessage = ''
    return true
  }

  editDialog(task: Task) {
    this.inputMessage = task.message
    this.inputPriority = task.priority
    this.inputReminderTime = this.stringToDate(task.reminderTime)
    this.selectTask = task
    this.validationFailedMessage = ''
    this.displayEditDialog = true
  }

  async edit() {
    if (this.validation()) {
      this.selectTask.message = this.inputMessage
      this.selectTask.priority = this.inputPriority
      this.selectTask.reminderTime = this.dateToString(this.inputReminderTime)
      this.displayEditDialog = false
      await pipe(
        this.toDoService.update(this.selectTask),
        TE.match(
          error => {
            this.displayErrorDialog = true
            this.serverErrorMessage = error.message
          },
          task => {
            const updateTask = task.task
            this.rebuildNotification(updateTask)
            this.sortTasks()
          }
        )
      )()
    }
  }

  async done(id: string) {
    await pipe(
      this.toDoService.completed(id),
      TE.match(
        error => {
          this.displayErrorDialog = true
          this.serverErrorMessage = error.message
        },
        _ => {
          this.toDoTasks = this.toDoTasks.filter(t => t.id !== id)
          this.removeNotification(id)
        }
      )
    )()
  }

  async delete(id: string) {
    await pipe(
      this.toDoService.delete(id),
      TE.match(
        error => {
          this.displayErrorDialog = true
          this.serverErrorMessage = error.message
        },
        _ => {
          this.toDoTasks = this.toDoTasks.filter(t => t.id !== id)
          this.removeNotification(id)
        }
      )
    )()
  }

  initNotifications() {
    this.toDoTasks.forEach(t => this.addNotification(t))
  }

  addNotification(task: Task) {
    const date = this.stringToDate(task.reminderTime)
    if (date && date > new Date()) {
      this.timerMap.set(task.id, timer(date).subscribe(() => {
        this.sw?.showNotification('Task reminder', this.buildNotificationOption(task))
      }))
    }
  }

  removeNotification(id: string) {
    const notification = this.timerMap.get(id)
    if (notification) {
      notification.unsubscribe()
      this.timerMap.delete(id)
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
    if (this.toDoTasks.some(t => t.id === id)) {
      if (action === 'done') {
        await this.done(id)
      } else {
        const task = this.toDoTasks.find(t => t.id === id)
        if (task) {
          task.reminderTime = this.addOnehour(task.reminderTime)
        }
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

  isExpired(reminderTime: string) {
    const time = this.stringToDate(reminderTime)
    if (time) {
      return time.getTime() < Date.now()
    }
    return false
  }

  closeErrorDialog() {
    this.displayErrorDialog = false
    this.serverErrorMessage = ''
  }

}
