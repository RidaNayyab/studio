
export type Priority = "Low" | "Medium" | "High";
export type Category = "Work" | "Personal" | "Home" | "Other";

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
}

export interface Column {
    id: string;
    title: string;
}
