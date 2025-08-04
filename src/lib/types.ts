
export type Priority = "Low" | "Medium" | "High";
export type Category = "Work" | "Personal" | "Home" | "Other";
export type Recurrence = "none" | "daily" | "weekly" | "monthly";

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
  columnId: string;
  subtasks: SubTask[];
  priority: Priority;
  category: Category;
  recurrence: Recurrence;
  order: number;
  createdAt: Date;
}

export interface Column {
    id: string;
    title: string;
    order: number;
}
