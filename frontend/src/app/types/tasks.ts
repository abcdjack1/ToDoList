export interface Tasks {
  tasks: Task[]
}

export interface Task {
  id: string,
  message: string,
  completed: string,
  priority: string,
  reminderTime?: string
}