import { ComponentFixture, TestBed } from '@angular/core/testing'
import { HttpClientModule } from '@angular/common/http'

import { TabViewModule } from 'primeng/tabview'
import { OrderListModule } from 'primeng/orderlist'
import { DialogModule } from 'primeng/dialog'
import { FormsModule } from '@angular/forms'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { CalendarModule } from 'primeng/calendar'
import { SwPush } from '@angular/service-worker'

import { ToDoListComponent } from './to-do-list.component'
import { Task } from 'src/app/types/tasks'
import { ToDoService } from 'src/app/service/task.service'
import { Observable } from 'rxjs'

describe('ToDoListComponent', () => {
  let component: ToDoListComponent
  let fixture: ComponentFixture<ToDoListComponent>
  let testTask1: Task
  let testTask2: Task
  let toDoServiceSpy: jasmine.SpyObj<ToDoService>

  beforeEach(async () => {
    const toDoSpy = jasmine.createSpyObj('ToDoService', ['getToDoTasks',
      'getCompletedTasks', 'reorder', 'save', 'completed', 'update', 'delete'])
    const swPush = jasmine.createSpyObj('SwPush', {}, { notificationClicks: Observable })
    await TestBed.configureTestingModule({
      declarations: [ToDoListComponent],
      imports: [
        HttpClientModule,
        TabViewModule,
        OrderListModule,
        DialogModule,
        FormsModule,
        BrowserAnimationsModule,
        CalendarModule
      ],
      providers: [
        { provide: ToDoService, useValue: toDoSpy },
        { provide: SwPush, useValue: swPush },
      ]
    })
      .compileComponents();

    toDoServiceSpy = TestBed.inject(ToDoService) as jasmine.SpyObj<ToDoService>

    fixture = TestBed.createComponent(ToDoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    testTask1 = { id: '1', message: 'msg1', completed: 'N', order: 1, reminderTime: '2999-01-01 01:00:00' }
    testTask2 = { id: '2', message: 'msg2', completed: 'N', order: 0, reminderTime: '2999-01-01 01:00:00' }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('component test', () => {
    it(`should clear inputMessage and display addDialog when 'addDialoag()' being called`, () => {
      component.inputMessage = 'for test'
      component.displayAddDialog = false
      component.addDialoag()

      expect(component.inputMessage).toBe('')
      expect(component.displayAddDialog).toBeTrue()
    })

    it(`should hidden add dialog and tasks index increase 1 when 'add()' being called`, async () => {
      toDoServiceSpy.save.and.returnValue(Promise.resolve(testTask2))
      component.toDoTasks = [testTask1]
      component.displayAddDialog = true
      await component.add()

      expect(component.toDoTasks.length).toBe(2)
      expect(component.displayAddDialog).toBeFalse()
    })

    it(`should selectTask equals task and display edit dialog when 'editDialog()' being called`, () => {
      const task: Task = testTask1
      component.displayEditDialog = false
      component.editDialog(task)

      expect(component.selectTask).toBe(task)
      expect(component.displayEditDialog).toBeTrue()
    })

    it(`should hidden edit dialog and selectTask.message equals inputMessage when 'edit()' being called`, async () => {
      toDoServiceSpy.update.and.returnValue(
        Promise.resolve({ id: '1', message: 'test message 2', completed: 'N', order: 1, reminderTime: '2999-01-01 01:00:00' })
      )
      component.displayEditDialog = true
      component.selectTask = testTask1
      component.inputMessage = 'test message 2'
      await component.edit()

      expect(component.selectTask.message).toBe(component.inputMessage)
      expect(component.displayEditDialog).toBeFalse()
    })

    it(`should toDotasks reduce task when that task done`, async () => {
      component.toDoTasks = [testTask1, testTask2]
      await component.done(testTask1.id)

      expect(component.toDoTasks.filter(t => t.id == testTask1.id)).toEqual([])
    })

    it(`should task delete when 'delete(task.id)' being called`, async () => {
      toDoServiceSpy.getToDoTasks.and.returnValue(Promise.resolve([testTask2]))
      component.toDoTasks = [testTask1, testTask2]
      await component.delete(testTask1.id)

      expect(component.toDoTasks.filter(t => t.id == testTask1.id)).toEqual([])
    })

    it(`should reorder tasks when 'onReorder()' being called`, async () => {
      const tasks: Task[] = [testTask1, testTask2]
      component.toDoTasks = tasks
      await component.onReorder()

      expect(component.toDoTasks[0].order).toBe(0)
      expect(component.toDoTasks[1].order).toBe(1)
    })

    it(`should toDoTasks equals 'getToDoTasks()' result when 'onSelectTabChange(0)' being called`, async () => {
      const tasks: Task[] = [testTask1, testTask2]
      component.toDoTasks = []
      toDoServiceSpy.getToDoTasks.and.returnValue(Promise.resolve(tasks))
      await component.onSelectTabChange({ index: 0 })

      expect(component.toDoTasks).toBe(tasks)
    })

    it(`should completedTasks equals 'getCompletedTasks()' result when 'onSelectTabChange(1)' being called`, async () => {
      const tasks: Task[] = [testTask1, testTask2]
      component.completedTasks = []
      toDoServiceSpy.getCompletedTasks.and.returnValue(Promise.resolve(tasks))
      await component.onSelectTabChange({ index: 1 })

      expect(component.completedTasks).toBe(tasks)
    })

    it(`should get string result when dateToString being called`, () => {
      const date = new Date('2022-01-01 01:01:01')
      const result = component.dateToString(date)

      expect(result).toBe('2022-01-01 01:01:00')
    })

    it(`should get Undefined when dateToString input is null`, () => {
      const result = component.dateToString(null)

      expect(result).toBeUndefined()
    })


    it(`should get date result when stringToDate being called`, () => {
      const dateAsString = '2022-01-01 01:01:01'
      const date = new Date(dateAsString)
      const result = component.stringToDate(dateAsString)

      expect(result).toEqual(date)
    })

    it(`should get null when stringToDate input is undefined`, () => {
      const result = component.stringToDate(undefined)

      expect(result).toBeNull
    })

    it(`should get one hour ago when addOneOur being called`, () => {
      const result = component.addOnehour('2022-01-01 01:00:00')

      expect(result).toBe('2022-01-01 02:00:00')
    })

    it(`should timerMap add notification timer when initNotifications being called`, async () => {
      component.toDoTasks = [testTask1, testTask2]
      component.initNotifications()

      expect(component.timerMap[testTask1.id]).toBeDefined()
      expect(component.timerMap[testTask2.id]).toBeDefined()
    })

    it(`should timerMap add notification timer when addNotification being called`, async () => {
      component.addNotification(testTask2)

      expect(component.timerMap[testTask2.id]).toBeDefined()
    })

    it(`should timerMap remove notification timer when removeNotification being called`, async () => {
      component.addNotification(testTask2)
      component.removeNotification(testTask2.id)

      expect(component.timerMap[testTask2.id]).toBeUndefined()
    })

    it(`should timerMap keep have timer notification timer when rebuildNotification being called`, async () => {
      component.addNotification(testTask2)
      await component.rebuildNotification(testTask2)

      expect(component.timerMap[testTask2.id]).toBeDefined()
    })

    it(`should get notification option when buildNotificationOption being called`, () => {
      const result = component.buildNotificationOption(testTask2)
      const expectResult = {
        body: testTask2.message,
        data: {
          id: testTask2.id
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

      expect(result).toEqual(expectResult)
    })

  })

  describe('templated test', () => {
    let compiledComponent: HTMLElement

    beforeEach(() => {
      fixture.detectChanges()
      compiledComponent = fixture.nativeElement
    });

    describe('add task dialog save button enabled or disabled', () => {
      let saveButton: HTMLElement

      beforeEach(() => {
        const addButton: HTMLElement = compiledComponent.querySelector('#addButton')!
        addButton.click()
        fixture.detectChanges()
        saveButton = compiledComponent.querySelector('#saveButton')!
      });

      it(`should save button disabled when input is blank`, () => {
        expect(saveButton.getAttribute('disabled')).toBe('')
      })

      it(`should save button enabled when input is not blank`, () => {
        component.inputMessage = "test task"
        fixture.detectChanges()

        expect(saveButton.getAttribute('disabled')).toBeNull()
      })
    })

    describe('edit task dialog save button enabled or disabled', () => {
      let editSaveButton: HTMLElement

      beforeEach(() => {
        component.toDoTasks = [testTask1]
        fixture.detectChanges()
        const addButton: HTMLElement = compiledComponent.querySelector('.edit-button')!
        addButton.click()
        fixture.detectChanges()
        editSaveButton = compiledComponent.querySelector('#editSaveButton')!
      });

      it(`should save button enabled when input is not blank`, () => {
        expect(editSaveButton.getAttribute('disabled')).toBeNull()
      })

      it(`should save button disabled when input is blank`, () => {
        component.inputMessage = '  '
        fixture.detectChanges();

        expect(editSaveButton.getAttribute('disabled')).toBe('')
      })
    })

    describe('done and delete button event', () => {

      beforeEach(() => {
        component.toDoTasks = [testTask1]
        fixture.detectChanges()
      })

      it(`should trigger 'done(id)' when done button clicked`, () => {
        const doneButton: HTMLElement = compiledComponent.querySelector('.done-button')!
        spyOn(component, 'done')
        doneButton.click()

        expect(component.done).toHaveBeenCalled()
      })

      it(`should trigger 'delete(id)' when done button clicked`, () => {
        const deleteButton: HTMLElement = compiledComponent.querySelector('.delete-button')!
        spyOn(component, 'delete')
        deleteButton.click()

        expect(component.delete).toHaveBeenCalled()
      })

    })
  })

})


