import { Schema, model, Document } from "mongoose";
import { Task } from "../type/task-type";

const taskSchema: Schema = new Schema({
  message: {
    type: String,
    required: true
  },
  completed: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  reminderTime: {
    type: String,
    required: false
  }
}, {
  timestamps: true
})

taskSchema.set('toJSON', {
  virtuals: true,
  versionKey: false
})

export default model<Task>('TaskModel', taskSchema)