export type TaskPriority = "Low" | "Medium" | "High";

export interface SubTask {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  priority: TaskPriority;
  completed: boolean;
  category: string;
  subtasks: SubTask[];
}
