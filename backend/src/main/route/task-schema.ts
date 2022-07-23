import { Type } from '@sinclair/typebox'

export const messageSchema = Type.Object({
  message: Type.String()
})

export const idSchema = Type.Object({
  id: Type.String()
})

export const task = Type.Object({
  id: Type.String(),
  message: Type.String(),
  completed: Type.String(),
  order: Type.Number()
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
  order: Type.Number()
})

export const reorderTasksBodyScehma = Type.Array(
  Type.Object({
    id: Type.String(),
    order: Type.Number()
  })
)

export const modifiedSchema = Type.Object({
  modified: Type.Number()
})

export const postSaveTaskOption = {
  schema: {
    body: messageSchema,
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

export const putReorderTasksOption = {
  schema: {
    body: reorderTasksBodyScehma,
    response: {
      200: modifiedSchema
    }
  }
}