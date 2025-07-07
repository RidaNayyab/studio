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
import type { Task, TaskPriority } from "@/lib/types";

type SortOption = "dueDate" | "priority";
type FilterOption = "all" | "completed" | "incomplete";

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Setup development environment",
    description: "Install Node.js, Next.js, and Tailwind CSS.",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    priority: "High",
    completed: true,
  },
  {
    id: "2",
    title: "Create UI components",
    description: "Build TaskCard and AddTaskForm components.",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 3)),
    priority: "Medium",
    completed: false,
  },
  {
    id: "3",
    title: "Implement state management",
    description: "Use useState for managing tasks, filters, and sorting.",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
    priority: "High",
    completed: false,
  },
  {
    id: "4",
    title: "Deploy to production",
    description: "Use Firebase App Hosting to deploy the application.",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    priority: "Low",
    completed: false,
  },
];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<FilterOption>("all");
  const [sort, setSort] = useState<SortOption>("dueDate");

  const addTask = (task: Omit<Task, "id" | "completed">) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      completed: false,
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

  const priorityOrder: Record<TaskPriority, number> = { High: 3, Medium: 2, Low: 1 };

  const filteredAndSortedTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (filter === "completed") return task.completed;
        if (filter === "incomplete") return !task.completed;
        return true;
      })
      .sort((a, b) => {
        if (sort === "priority") {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        // Default to sorting by due date
        return a.dueDate.getTime() - b.dueDate.getTime();
      });
  }, [tasks, filter, sort]);

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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Filter</label>
              <Select
                value={filter}
                onValueChange={(value) => setFilter(value as FilterOption)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter tasks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
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
        {filteredAndSortedTasks.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAndSortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={toggleComplete}
                onDelete={deleteTask}
              />
            ))}
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
