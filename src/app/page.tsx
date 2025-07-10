
"use client";

import { useState, useMemo } from "react";
import { Plus, LayoutGrid, ListTodo } from "lucide-react";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DropAnimation,
  defaultDropAnimation,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

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
import { SortableTaskCard } from "@/components/sortable-task-card";
import { TaskCard } from "@/components/task-card";
import { Logo } from "@/components/icons";
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from "@/components/ui/sidebar";
import type { Task, TaskPriority, SubTask, TaskStatus } from "@/lib/types";

type SortOption = "dueDate" | "priority";

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Setup development environment",
    description: "Install Node.js, Next.js, and Tailwind CSS.",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    priority: "High",
    status: "completed",
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
    status: "incomplete",
    category: "Work",
    subtasks: [],
  },
  {
    id: "3",
    title: "Implement state management",
    description: "Use useState for managing tasks, filters, and sorting.",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
    priority: "High",
    status: "incomplete",
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
    status: "incomplete",
    category: "Work",
    subtasks: [],
  },
];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [sort, setSort] = useState<SortOption>("dueDate");
  const [activeBoard, setActiveBoard] = useState<string>("All Tasks");
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);

  const addTask = (task: Omit<Task, "id" | "status" | "subtasks">) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      status: "incomplete",
      subtasks: [],
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const setTaskStatus = (id: string, status: TaskStatus) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id ? { ...task, status } : task
      )
    );
  };
  
  const toggleComplete = (id: string) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === id) {
          return { ...task, status: task.status === "completed" ? "incomplete" : "completed" };
        }
        return task;
      })
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

  const boards = useMemo(() => {
    const categories = tasks.map((task) => task.category);
    return ["All Tasks", ...Array.from(new Set(categories))];
  }, [tasks]);

  const priorityOrder: Record<TaskPriority, number> = { High: 3, Medium: 2, Low: 1 };

  const baseFilteredAndSortedTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (activeBoard === "All Tasks") return true;
        return task.category === activeBoard;
      })
      .sort((a, b) => {
        if (sort === "priority") {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return a.dueDate.getTime() - b.dueDate.getTime();
      });
  }, [tasks, sort, activeBoard]);
  
  const incompleteTasks = useMemo(() => {
    return baseFilteredAndSortedTasks.filter((task) => task.status === 'incomplete');
  }, [baseFilteredAndSortedTasks]);

  const completedTasks = useMemo(() => {
    return baseFilteredAndSortedTasks.filter((task) => task.status === 'completed');
  }, [baseFilteredAndSortedTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findTaskById = (id: string) => tasks.find((task) => task.id === id);

  const handleDragStart = (event: DragEndEvent) => {
    const { active } = event;
    const task = findTaskById(active.id as string);
    if (task) {
      setActiveDragTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
  
    const activeId = active.id as string;
    const overId = over.id as string;
  
    const activeTask = findTaskById(activeId);
    if (!activeTask) return;
  
    // Handle dropping into a different column
    if (over.data.current?.sortable?.containerId) {
      const overContainer = over.data.current.sortable.containerId;
      const newStatus = overContainer as TaskStatus;
      
      if (activeTask.status !== newStatus) {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === activeId ? { ...task, status: newStatus } : task
          )
        );
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = findTaskById(activeId);
    const overTask = findTaskById(overId);

    if (!activeTask) return;

    const activeContainer = active.data.current?.sortable.containerId;
    const overContainer = over.data.current?.sortable.containerId || overTask?.status;

    if (!activeContainer || !overContainer) return;
    
    if (activeContainer === overContainer) {
      // Reordering within the same column
      const taskList = activeContainer === 'completed' ? completedTasks : incompleteTasks;
      const oldIndex = taskList.findIndex(t => t.id === activeId);
      const newIndex = taskList.findIndex(t => t.id === overId);
      
      if (oldIndex !== newIndex) {
         const newSortedList = arrayMove(taskList, oldIndex, newIndex);
         const otherList = activeContainer === 'completed' ? incompleteTasks : completedTasks;
         setTasks([...newSortedList, ...otherList]);
      }
    } else {
        // Moving to a different column
        setTaskStatus(activeId, overContainer as TaskStatus);
    }
  };
  
  const dropAnimation: DropAnimation = {
    ...defaultDropAnimation,
  };
  
  const taskIds = useMemo(() => ({
    incomplete: incompleteTasks.map(t => t.id),
    completed: completedTasks.map(t => t.id),
  }), [incompleteTasks, completedTasks]);

  return (
    <div className="flex">
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-primary">TaskFlow</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveBoard("All Tasks")}
                isActive={activeBoard === "All Tasks"}
                tooltip="All Tasks"
              >
                <LayoutGrid />
                <span>All Tasks</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {boards.filter(b => b !== "All Tasks").map(board => (
              <SidebarMenuItem key={board}>
                <SidebarMenuButton
                  onClick={() => setActiveBoard(board)}
                  isActive={activeBoard === board}
                  tooltip={board}
                >
                  <ListTodo />
                  <span>{board}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="min-h-screen w-full">
          <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
               <SidebarTrigger />
              <h2 className="text-2xl font-semibold">{activeBoard}</h2>
              <div className="flex items-center gap-4">
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
            </div>
          </header>
          
          <main className="container mx-auto px-4 py-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
              <div className="flex flex-wrap items-center gap-4">
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              {tasks.length > 0 ? (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <SortableContext items={taskIds.incomplete} strategy={verticalListSortingStrategy} id="incomplete">
                    <div>
                      <h3 className="mb-4 text-xl font-semibold">Incomplete</h3>
                      <div className="space-y-4 rounded-lg border-2 border-dashed bg-card p-4 min-h-[24rem]">
                        {incompleteTasks.length > 0 ? (
                          incompleteTasks.map((task) => (
                            <SortableTaskCard
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
                          <div className="flex h-full flex-col items-center justify-center">
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
                  </SortableContext>
                  <SortableContext items={taskIds.completed} strategy={verticalListSortingStrategy} id="completed">
                    <div>
                      <h3 className="mb-4 text-xl font-semibold">Completed</h3>
                      <div className="space-y-4 rounded-lg border-2 border-dashed bg-card p-4 min-h-[24rem]">
                        {completedTasks.length > 0 ? (
                          completedTasks.map((task) => (
                            <SortableTaskCard
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
                          <div className="flex h-full flex-col items-center justify-center">
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
                  </SortableContext>
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
               <DragOverlay dropAnimation={dropAnimation}>
                {activeDragTask ? (
                  <TaskCard
                    task={activeDragTask}
                    onToggleComplete={() => {}}
                    onDelete={() => {}}
                    onAddSubtask={() => {}}
                    onToggleSubtaskComplete={() => {}}
                    onDeleteSubtask={() => {}}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </main>
        </div>
      </SidebarInset>
    </div>
  );
}
