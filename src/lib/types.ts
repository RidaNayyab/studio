export type TaskPriority = "Low" | "Medium" | "High";
export type TaskStatus = "incomplete" | "completed";

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
  status: TaskStatus;
  category: string;
  subtasks: SubTask[];
}
