"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddTaskForm } from "@/components/add-task-form";
import { TaskCard } from "@/components/task-card";
import { Logo } from "@/components/icons";
import type { Task, TaskPriority, SubTask } from "@/lib/types";

type SortOption = "dueDate" | "priority";

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Setup development environment",
    description: "Install Node.js, Next.js, and Tailwind CSS.",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    priority: "High",
    completed: true,
    category: "Work",
    subtasks: [
      { id: "sub1", title: "Install Node.js", completed: true, dueDate: new Date() },
      { id: "sub2", title: "Install Next.js", completed: true, dueDate: new Date() },
    ],
  },
  {
    id: "2",
    title: "Create UI components",
    description: "Build TaskCard and AddTaskForm components.",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 3)),
    priority: "Medium",
    completed: false,
    category: "Work",
    subtasks: [],
  },
  {
    id: "3",
    title: "Implement state management",
    description: "Use useState for managing tasks, filters, and sorting.",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
    priority: "High",
    completed: false,
    category: "Personal",
    subtasks: [
      { id: "sub3", title: "Handle main tasks", completed: false, dueDate: new Date(new Date().setDate(new Date().getDate() + 4)), description: "State for top-level tasks" },
      { id: "sub4", title: "Handle sub-tasks", completed: false, dueDate: new Date(new Date().setDate(new Date().getDate() + 4)) },
    ],
  },
  {
    id: "4",
    title: "Deploy to production",
    description: "Use Firebase App Hosting to deploy the application.",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    priority: "Low",
    completed: false,
    category: "Work",
    subtasks: [],
  },
];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [sort, setSort] = useState<SortOption>("dueDate");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const addTask = (task: Omit<Task, "id" | "completed" | "subtasks">) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      completed: false,
      subtasks: [],
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const toggleComplete = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };
  
  const addSubtask = (taskId: string, subtask: Omit<SubTask, "id" | "completed">) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const newSubtask: SubTask = {
          ...subtask,
          id: crypto.randomUUID(),
          completed: false
        };
        const updatedSubtasks = [...task.subtasks, newSubtask];
        updatedSubtasks.sort((a,b) => a.dueDate.getTime() - b.dueDate.getTime());
        return { ...task, subtasks: updatedSubtasks };
      }
      return task;
    }));
  };

  const toggleSubtaskComplete = (taskId: string, subtaskId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          subtasks: task.subtasks.map(subtask => 
            subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
          )
        };
      }
      return task;
    }));
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          subtasks: task.subtasks.filter(subtask => subtask.id !== subtaskId)
        };
      }
      return task;
    }));
  };

  const categories = useMemo(() => {
    const allCategories = tasks.map((task) => task.category);
    return ["all", ...Array.from(new Set(allCategories))];
  }, [tasks]);

  const priorityOrder: Record<TaskPriority, number> = { High: 3, Medium: 2, Low: 1 };

  const baseFilteredAndSortedTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (categoryFilter === "all") return true;
        return task.category === categoryFilter;
      })
      .sort((a, b) => {
        if (sort === "priority") {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return a.dueDate.getTime() - b.dueDate.getTime();
      });
  }, [tasks, sort, categoryFilter]);
  
  const incompleteTasks = useMemo(() => {
    return baseFilteredAndSortedTasks.filter((task) => !task.completed);
  }, [baseFilteredAndSortedTasks]);

  const completedTasks = useMemo(() => {
    return baseFilteredAndSortedTasks.filter((task) => task.completed);
  }, [baseFilteredAndSortedTasks]);


  return (
    <div className="min-h-screen w-full">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-primary">TaskFlow</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add a new task</DialogTitle>
              </DialogHeader>
              <AddTaskForm addTask={addTask} setOpen={setDialogOpen} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold">Your Tasks</h2>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={categoryFilter}
                onValueChange={(value) => setCategoryFilter(value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Sort by</label>
              <Select
                value={sort}
                onValueChange={(value) => setSort(value as SortOption)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort tasks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dueDate">Due Date</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        {tasks.length > 0 ? (
           <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-4 text-xl font-semibold">Incomplete</h3>
              <div className="space-y-4">
                {incompleteTasks.length > 0 ? (
                  incompleteTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleComplete={toggleComplete}
                      onDelete={deleteTask}
                      onAddSubtask={addSubtask}
                      onToggleSubtaskComplete={toggleSubtaskComplete}
                      onDeleteSubtask={deleteSubtask}
                    />
                  ))
                ) : (
                  <div className="flex h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card">
                    <p className="text-lg font-medium text-muted-foreground">
                      No incomplete tasks.
                    </p>
                     <p className="text-sm text-muted-foreground">
                      Great job!
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-xl font-semibold">Completed</h3>
              <div className="space-y-4">
                {completedTasks.length > 0 ? (
                  completedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleComplete={toggleComplete}
                      onDelete={deleteTask}
                      onAddSubtask={addSubtask}
                      onToggleSubtaskComplete={toggleSubtaskComplete}
                      onDeleteSubtask={deleteSubtask}
                    />
                  ))
                ) : (
                  <div className="flex h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card">
                    <p className="text-lg font-medium text-muted-foreground">
                      No completed tasks.
                    </p>
                     <p className="text-sm text-muted-foreground">
                      Keep up the good work!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card">
            <p className="text-lg font-medium text-muted-foreground">
              No tasks found.
            </p>
            <p className="text-sm text-muted-foreground">
              Add a new task to get started!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
