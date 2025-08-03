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
}

export interface Column {
    id: string;
    title: string;
}
