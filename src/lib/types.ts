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
  columnId: string;
  subtasks: SubTask[];
}

export interface Column {
    id: string;
    title: string;
}
