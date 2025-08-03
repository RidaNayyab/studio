
"use client";

import { useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
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
  horizontalListSortingStrategy,
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
import { Input } from "@/components/ui/input";
import { SortableColumn } from "@/components/sortable-column";
import type { Task, SubTask, Column, Category, Priority } from "@/lib/types";

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Setup development environment",
    description: "Install Node.js, Next.js, and Tailwind CSS.",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    columnId: "done",
    priority: 'High',
    category: 'Work',
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
    columnId: "in-progress",
    priority: 'Medium',
    category: 'Work',
    subtasks: [],
  },
  {
    id: "3",
    title: "Implement state management",
    description: "Use useState for managing tasks, filters, and sorting.",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
    columnId: "todo",
    priority: 'High',
    category: 'Work',
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
    columnId: "backlog",
    priority: 'Low',
    category: 'Work',
    subtasks: [],
  },
    {
    id: '5',
    title: 'Plan weekend trip',
    description: 'Book flights and accommodation.',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 10)),
    columnId: 'backlog',
    priority: 'Medium',
    category: 'Personal',
    subtasks: [],
  },
];

const initialColumns: Column[] = [
    { id: 'backlog', title: 'Backlog' },
    { id: 'todo', title: 'To Do' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'done', title: 'Done' },
]

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);
  const [activeDragColumn, setActiveDragColumn] = useState<Column | null>(null);
  const [newColumnName, setNewColumnName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
        const matchesSearch = searchTerm.trim() === "" ||
            task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = filterCategory === 'all' || task.category === filterCategory;
        const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;

        return matchesSearch && matchesCategory && matchesPriority;
    });
  }, [tasks, searchTerm, filterCategory, filterPriority]);


  const addTask = (task: Omit<Task, "id" | "subtasks" | "columnId">) => {
    const firstColumnId = columns.length > 0 ? columns[0].id : 'backlog';
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      subtasks: [],
      columnId: firstColumnId,
    };
    setTasks((prev) => [...prev, newTask]);
  };
  
  const addColumn = () => {
    if (!newColumnName.trim()) return;
    const newColumn: Column = {
        id: crypto.randomUUID(),
        title: newColumnName.trim(),
    };
    setColumns([...columns, newColumn]);
    setNewColumnName("");
  }

  const deleteColumn = (columnId: string) => {
    setColumns(columns.filter(col => col.id !== columnId));
    // Re-assign tasks from the deleted column to the first available column
    const firstColumnId = columns.length > 1 ? columns.find(c => c.id !== columnId)?.id : undefined;
    if (firstColumnId) {
        setTasks(tasks.map(task => task.columnId === columnId ? {...task, columnId: firstColumnId} : task));
    } else {
        // If no other columns, delete tasks
        setTasks(tasks.filter(task => task.columnId !== columnId));
    }
  }

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
  
  const columnIds = useMemo(() => columns.map(c => c.id), [columns]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findTaskById = (id: string) => tasks.find((task) => task.id === id);
  const findColumnById = (id: string) => columns.find(col => col.id === id);
  
  const onDragStart = (event: DragEndEvent) => {
    const { active } = event;
    const { data } = active;
    const { type, task, column } = data.current || {};
    
    if (type === 'Task') {
      setActiveDragTask(task);
    }
    if (type === 'Column') {
      setActiveDragColumn(column);
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
  
    const activeId = active.id;
    const overId = over.id;
  
    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === "Task";
    const isOverATask = over.data.current?.type === "Task";
    const isOverAColumn = over.data.current?.type === "Column";

    // Dropping a Task over another Task
    if (isActiveATask && isOverATask) {
      setTasks(currentTasks => {
        const activeIndex = currentTasks.findIndex(t => t.id === activeId);
        const overIndex = currentTasks.findIndex(t => t.id === overId);
        if (currentTasks[activeIndex].columnId !== currentTasks[overIndex].columnId) {
          currentTasks[activeIndex].columnId = currentTasks[overIndex].columnId;
          return arrayMove(currentTasks, activeIndex, overIndex);
        }
        return arrayMove(currentTasks, activeIndex, overIndex);
      });
    }
    
    // Dropping a Task over a Column
    if (isActiveATask && isOverAColumn) {
        setTasks(currentTasks => {
          const activeIndex = currentTasks.findIndex(t => t.id === activeId);
          currentTasks[activeIndex].columnId = overId as string;
          return arrayMove(currentTasks, activeIndex, activeIndex);
        })
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveDragTask(null);
    setActiveDragColumn(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;
    
    const isActiveAColumn = active.data.current?.type === 'Column';
    if(isActiveAColumn) {
        setColumns(prev => {
            const activeIndex = prev.findIndex(c => c.id === activeId);
            const overIndex = prev.findIndex(c => c.id === overId);
            return arrayMove(prev, activeIndex, overIndex);
        });
        return;
    }
    
    const isActiveATask = active.data.current?.type === "Task";
    if (isActiveATask) {
        setTasks(currentTasks => {
            const activeIndex = currentTasks.findIndex(t => t.id === activeId);
            const overIndex = currentTasks.findIndex(t => t.id === overId);
            return arrayMove(currentTasks, activeIndex, overIndex);
        });
    }
  };
  
  const dropAnimation: DropAnimation = {
    ...defaultDropAnimation,
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-primary">SmartTodoo</h1>
          </div>
          <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
            <div className="relative w-full max-w-sm">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>
            <Select value={filterCategory} onValueChange={(value) => setFilterCategory(value as Category | "all")}>
                <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Work">Work</SelectItem>
                    <SelectItem value="Personal">Personal</SelectItem>
                    <SelectItem value="Home">Home</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={(value) => setFilterPriority(value as Priority | "all")}>
                <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                </SelectContent>
            </Select>
          </div>
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
                <AddTaskForm
                    addTask={addTask}
                    setOpen={setDialogOpen}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-6 overflow-x-auto pb-4">
             <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
              {columns.map(column => (
                <SortableColumn 
                    key={column.id}
                    column={column}
                    tasks={filteredTasks.filter(t => t.columnId === column.id)}
                    deleteColumn={deleteColumn}
                    onDeleteTask={deleteTask}
                    onAddSubtask={addSubtask}
                    onToggleSubtaskComplete={toggleSubtaskComplete}
                    onDeleteSubtask={deleteSubtask}
                 />
              ))}
            </SortableContext>
            <div className="w-72 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <Input 
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        placeholder="New column name"
                        onKeyPress={(e) => e.key === 'Enter' && addColumn()}
                    />
                    <Button onClick={addColumn}>
                        <Plus className="h-4 w-4 mr-2" /> Add Column
                    </Button>
                </div>
            </div>
          </div>
           <DragOverlay dropAnimation={dropAnimation}>
            {activeDragTask ? (
              <TaskCard
                task={activeDragTask}
                onDelete={() => {}}
                onAddSubtask={() => {}}
                onToggleSubtaskComplete={() => {}}
                onDeleteSubtask={() => {}}
              />
            ) : null}
            {activeDragColumn ? (
                 <SortableColumn 
                    column={activeDragColumn}
                    tasks={filteredTasks.filter(t => t.columnId === activeDragColumn.id)}
                    deleteColumn={deleteColumn}
                    onDeleteTask={deleteTask}
                    onAddSubtask={addSubtask}
                    onToggleSubtaskComplete={toggleSubtaskComplete}
                    onDeleteSubtask={deleteSubtask}
                    isOverlay
                 />
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>
    </div>
  );
}
