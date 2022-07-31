import { Type } from '@sinclair/typebox'

const priorityType = Type.Union([
  Type.Literal('Low'),
  Type.Literal('Medium'),
  Type.Literal('High')
])

export const newTaskSchema = Type.Object({
  message: Type.String(),
  priority: priorityType,
  reminderTime: Type.Optional(Type.String({ format: 'date-time' }))
})

export const idSchema = Type.Object({
  id: Type.String()
})

export const task = Type.Object({
  id: Type.String(),
  message: Type.String(),
  completed: Type.String(),
  priority: priorityType,
  reminderTime: Type.Optional(Type.String({ format: 'date-time' }))
})

const TaskSchema = Type.Object({
  task: task
})

const TasksSchema = Type.Object({
  tasks: Type.Array(
    task
  )
})

export const updateTaskRequestBodySchema = Type.Object({
  message: Type.String(),
  completed: Type.String(),
  priority: Type.String(),
  reminderTime: Type.Optional(Type.String({ format: 'date-time' }))
})

export const modifiedSchema = Type.Object({
  modified: Type.Number()
})

export const postSaveTaskOption = {
  schema: {
    body: newTaskSchema,
    response: {
      201: TaskSchema
    }
  }
}

export const putUpdateTaskOption = {
  schema: {
    param: idSchema,
    body: updateTaskRequestBodySchema,
    response: {
      200: TaskSchema
    }
  }
}

export const putCompletedTaskOption = {
  schema: {
    param: idSchema,
    response: {
      200: TaskSchema
    }
  }
}

export const deleteTaskOption = {
  schema: {
    param: idSchema,
    response: {
      204: {}
    }
  }
}

export const getToDoTasksOption = {
  schema: {
    response: {
      200: TasksSchema
    }
  }
}

export const getCompletedTasksOption = getToDoTasksOption
