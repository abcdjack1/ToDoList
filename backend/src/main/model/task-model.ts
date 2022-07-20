import { Schema, model, Document } from "mongoose";
import { TaskParams } from "../type/params";

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
  }
}, {
  timestamps: true
})

taskSchema.set('toJSON', {
  virtuals: true,
  versionKey: false
})


export interface Task extends TaskParams, Document {
}

export default model<Task>('TaskModel', taskSchema)