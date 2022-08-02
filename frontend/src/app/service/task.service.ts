import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { Tasks, Task } from 'src/app/types/tasks';
import { environment } from 'src/environments/environment';
import * as TE from 'fp-ts/TaskEither'

@Injectable({
  providedIn: 'root'
})
export class ToDoService {

  private tasksApiUtl = `${environment.toDoListBackendUrl}/tasks`

  constructor(private http: HttpClient) { }

  getToDoTasks() {
    return TE.tryCatch(
      () => lastValueFrom(this.http.get<Tasks>(`${this.tasksApiUtl}/to-do`)),
      (error: any) => new Error(`Get to-do tasks failed. ${error.message}`)
    )
  }

  getCompletedTasks() {
    return TE.tryCatch(
      () => lastValueFrom(this.http.get<Tasks>(`${this.tasksApiUtl}/be-done`)),
      (error: any) => new Error(`Get Completed tasks failed. ${error.message}`)
    )
  }

  save(message: string, priority: string, reminderTime?: string) {
    return TE.tryCatch(
      () => lastValueFrom(this.http.post<{ task: Task }>(`${this.tasksApiUtl}`, { message: message, priority: priority, reminderTime: reminderTime })),
      (error: any) => new Error(`Save task failed. ${error.message}`)
    )
  }

  completed(id: string) {
    return TE.tryCatch(
      () => lastValueFrom(this.http.put<{ task: Task }>(`${this.tasksApiUtl}/${id}/be-done`, {})),
      (error: any) => new Error(`Completed task failed. ${error.message}`)
    )
  }

  update(task: Task) {
    return TE.tryCatch(
      () => lastValueFrom(this.http.put<{ task: Task }>(`${this.tasksApiUtl}/${task.id}`, task)),
      (error: any) => new Error(`Update task failed. ${error.message}`)
    )
  }

  delete(id: string) {
    return TE.tryCatch(
      () => lastValueFrom(this.http.delete(`${this.tasksApiUtl}/${id}`, {})),
      (error: any) => new Error(`Delete task failed. ${error.message}`)
    )
  }

}
