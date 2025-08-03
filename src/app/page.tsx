
"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
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
import { AddTaskForm } from "@/components/add-task-form";
import { SortableTaskCard } from "@/components/sortable-task-card";
import { TaskCard } from "@/components/task-card";
import { Logo } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { SortableColumn } from "@/components/sortable-column";
import type { Task, SubTask, Column } from "@/lib/types";

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Setup development environment",
    description: "Install Node.js, Next.js, and Tailwind CSS.",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    columnId: "done",
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
    subtasks: [],
  },
  {
    id: "3",
    title: "Implement state management",
    description: "Use useState for managing tasks, filters, and sorting.",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
    columnId: "todo",
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
    subtasks: [],
  },
    {
    id: '5',
    title: 'Plan weekend trip',
    description: 'Book flights and accommodation.',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 10)),
    columnId: 'backlog',
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
      const activeTask = findTaskById(activeId as string);
      const overTask = findTaskById(overId as string);
      if (activeTask && overTask && activeTask.columnId !== overTask.columnId) {
        const activeIndex = tasks.findIndex(t => t.id === activeId);
        tasks[activeIndex].columnId = overTask.columnId;
        setTasks(arrayMove(tasks, activeIndex, tasks.findIndex(t => t.id === overId)));
      }
    }
    
    // Dropping a Task over a Column
    if (isActiveATask && isOverAColumn) {
        const activeTask = findTaskById(activeId as string);
        if (activeTask) {
            const activeIndex = tasks.findIndex(t => t.id === activeId);
            tasks[activeIndex].columnId = overId as string;
            setTasks([...tasks]);
        }
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
        const activeIndex = tasks.findIndex(t => t.id === activeId);
        const overIndex = tasks.findIndex(t => t.id === overId);
        
        if (tasks[activeIndex].columnId !== tasks[overIndex].columnId) {
            tasks[activeIndex].columnId = tasks[overIndex].columnId;
        }

        setTasks(prev => arrayMove(prev, activeIndex, overIndex));
    }
  };
  
  const dropAnimation: DropAnimation = {
    ...defaultDropAnimation,
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-primary">SmartTodoo</h1>
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
                    tasks={tasks.filter(t => t.columnId === column.id)}
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
                    tasks={tasks.filter(t => t.columnId === activeDragColumn.id)}
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
