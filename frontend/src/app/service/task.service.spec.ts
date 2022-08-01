import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'

import { ToDoService } from './task.service'
import { Task } from 'src/app/types/tasks'
import { environment } from 'src/environments/environment'

describe('ToDoService', () => {
  let service: ToDoService
  let httpMock: HttpTestingController
  let testTask: Task
  const tasksApiUtl = `${environment.toDoListBackendUrl}/tasks`

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    })
    service = TestBed.inject(ToDoService)
    httpMock = TestBed.inject(HttpTestingController)

    testTask = { id: '1', message: 'msg1', completed: 'N', priority: 'Medium', reminderTime: '2999-01-01 01:00:00' }
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should httpClient send GET /tasks/to-do API when getToDoTasks() being called', async () => {
    service.getToDoTasks()
    const req = httpMock.expectOne(`${tasksApiUtl}/to-do`)

    expect(req.request.method).toEqual('GET')
  })

  it('should httpClient send GET /tasks/be-done API when getCompletedTasks() being called', async () => {
    service.getCompletedTasks()
    const req = httpMock.expectOne(`${tasksApiUtl}/be-done`)

    expect(req.request.method).toEqual('GET')
  })

  it('should httpClient send POST /tasks API when save() being called', async () => {
    const message = 'test1'
    const priority = 'Low'
    const reminderTime = '2022-01-01 01:00:00'

    service.save(message, priority, reminderTime)

    const req = httpMock.expectOne(`${tasksApiUtl}`)

    expect(req.request.method).toEqual('POST')
    expect(req.request.body).toEqual({ message: message, priority: priority, reminderTime: reminderTime })
  })

  it('should httpClient send PUT /tasks/:id API when update() being called', async () => {
    service.update(testTask)

    const req = httpMock.expectOne(`${tasksApiUtl}/${testTask.id}`)

    expect(req.request.method).toEqual('PUT')
    expect(req.request.body).toEqual(testTask)
  })

  it('should httpClient send DELETE /tasks/:id API when delete() being called', async () => {
    service.delete(testTask.id)

    const req = httpMock.expectOne(`${tasksApiUtl}/${testTask.id}`)

    expect(req.request.method).toEqual('DELETE')
  })

  it('should httpClient send PUT /tasks/:id/be-done API when completed() being called', async () => {
    service.completed(testTask.id)

    const req = httpMock.expectOne(`${tasksApiUtl}/${testTask.id}/be-done`)

    expect(req.request.method).toEqual('PUT')
  })

})
