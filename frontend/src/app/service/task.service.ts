import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { Tasks, Task } from 'src/app/types/tasks';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ToDoService {

  private tasksApiUtl = `${environment.toDoListBackendUrl}/tasks`

  constructor(private http: HttpClient) { }

  async getToDoTasks() {
    const result = await lastValueFrom(this.http.get<Tasks>(`${this.tasksApiUtl}/to-do`))
    return result.tasks
  }

  async getCompletedTasks() {
    const result = await lastValueFrom(this.http.get<Tasks>(`${this.tasksApiUtl}/be-done`))
    return result.tasks
  }

  async save(message: string, priority: string, reminderTime?: string): Promise<Task> {
    const result = await lastValueFrom(this.http.post<{ task: Task }>(`${this.tasksApiUtl}`, { message: message, priority: priority, reminderTime: reminderTime }))
    return result.task
  }

  async completed(id: string) {
    const result = await lastValueFrom(this.http.put<{ task: Task }>(`${this.tasksApiUtl}/${id}/be-done`, {}))
    return result.task
  }

  async update(task: Task) {
    const result = await lastValueFrom(this.http.put<{ task: Task }>(`${this.tasksApiUtl}/${task.id}`, task))
    return result.task
  }

  async delete(id: string) {
    await lastValueFrom(this.http.delete<{ task: Task }>(`${this.tasksApiUtl}/${id}`, {}))
  }

  async reorder(orderParams: any[]) {
    await lastValueFrom(this.http.put<{ task: Task }>(`${this.tasksApiUtl}/orders`, orderParams))
  }

}
