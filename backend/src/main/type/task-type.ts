import { Static } from '@sinclair/typebox'
import * as TaskSchema from '../route/task-schema'

export type NewTask = Static<typeof TaskSchema.messageSchema>

export type Id = Static<typeof TaskSchema.idSchema>

export type Task = Static<typeof TaskSchema.task>

export type TaskParams = Static<typeof TaskSchema.updateTaskRequestBodySchema>

export type OrderInfos = Static<typeof TaskSchema.reorderTasksBodyScehma>