
"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, ArrowUpDown } from "lucide-react";
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
import { v4 as uuidv4 } from 'uuid';

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

const defaultTasks: Task[] = [
    { id: '1', columnId: 'backlog', title: 'Design the new logo', description: 'Create a modern and fresh logo for the brand.', dueDate: new Date(2024, 7, 15), priority: 'High', category: 'Work', recurrence: 'none', subtasks: [], order: 0, createdAt: new Date() },
    { id: '2', columnId: 'backlog', title: 'Develop the landing page', description: 'Code the main landing page using Next.js and Tailwind.', dueDate: new Date(2024, 7, 20), priority: 'High', category: 'Work', recurrence: 'none', subtasks: [], order: 1, createdAt: new Date() },
    { id: '3', columnId: 'todo', title: 'Plan the social media campaign', description: 'Outline the content strategy for the next quarter.', dueDate: new Date(2024, 8, 1), priority: 'Medium', category: 'Work', recurrence: 'none', subtasks: [], order: 2, createdAt: new Date() },
    { id: '4', columnId: 'todo', title: 'Buy groceries', description: 'Milk, bread, eggs, and cheese.', dueDate: new Date(2024, 6, 30), priority: 'Low', category: 'Personal', recurrence: 'weekly', subtasks: [], order: 3, createdAt: new Date() },
    { id: '5', columnId: 'in-progress', title: 'Write the blog post', description: 'Draft a 1000-word article on the future of AI.', dueDate: new Date(2024, 7, 5), priority: 'Medium', category: 'Work', recurrence: 'none', subtasks: [], order: 4, createdAt: new Date() },
    { id: '6', columnId: 'done', title: 'Fix the login bug', description: 'The Google sign-in was failing on Safari.', dueDate: new Date(2024, 6, 28), priority: 'High', category: 'Work', recurrence: 'none', subtasks: [], order: 5, createdAt: new Date() },
];

const defaultColumns: Column[] = [
  { id: 'backlog', title: 'Backlog', order: 0 },
  { id: 'todo', title: 'To Do', order: 1 },
  { id: 'in-progress', title: 'In Progress', order: 2 },
  { id: 'done', title: 'Done', order: 3 },
];

const priorityOrder: Record<Priority, number> = {
    'High': 1,
    'Medium': 2,
    'Low': 3,
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window === 'undefined') return defaultTasks;
    const savedTasks = localStorage.getItem('tasks');
    return savedTasks ? JSON.parse(savedTasks).map((t: Task) => ({...t, dueDate: new Date(t.dueDate)})) : defaultTasks;
  });
  
  const [columns, setColumns] = useState<Column[]>(() => {
      if (typeof window === 'undefined') return defaultColumns;
      const savedColumns = localStorage.getItem('columns');
      return savedColumns ? JSON.parse(savedColumns) : defaultColumns;
  });

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);
  const [activeDragColumn, setActiveDragColumn] = useState<Column | null>(null);
  const [newColumnName, setNewColumnName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  const [sortBy, setSortBy] = useState<'manual' | 'priority'>('manual');
  
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('columns', JSON.stringify(columns));
  }, [columns]);


  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
        const matchesSearch = searchTerm.trim() === "" ||
            task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = filterCategory === 'all' || task.category === filterCategory;
        const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
        return matchesSearch && matchesCategory && matchesPriority;
    });

    if (sortBy === 'priority') {
        filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    } else {
        filtered.sort((a,b) => a.order - b.order);
    }

    return filtered;
  }, [tasks, searchTerm, filterCategory, filterPriority, sortBy]);


  const addTask = async (taskData: Omit<Task, "id" | "subtasks" | "columnId" | "order" | "createdAt">) => {
    const firstColumn = columns.find(c => c.order === 0);
    const firstColumnId = firstColumn ? firstColumn.id : 'backlog';
    
    const newTask: Task = {
      id: uuidv4(),
      ...taskData,
      subtasks: [],
      columnId: firstColumnId,
      order: tasks.length,
      createdAt: new Date(),
    };
    
    setTasks(currentTasks => [...currentTasks, newTask]);
  };
  
  const addColumn = async () => {
    if (!newColumnName.trim()) return;
    const newColumnData: Column = {
        id: uuidv4(),
        title: newColumnName.trim(),
        order: columns.length,
    };
    setColumns(current => [...current, newColumnData]);
    setNewColumnName("");
  }

  const deleteColumn = async (columnId: string) => {
    setColumns(current => current.filter(c => c.id !== columnId));
    setTasks(current => current.filter(t => t.columnId !== columnId));
  }


  const deleteTask = async (id: string) => {
    setTasks(current => current.filter(task => task.id !== id));
  };
  
  const addSubtask = async (taskId: string, subtaskData: Omit<SubTask, "id" | "completed">) => {
    setTasks(currentTasks => {
        const newTasks = [...currentTasks];
        const taskIndex = newTasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return currentTasks;

        const newSubtask: SubTask = {
            id: uuidv4(),
            ...subtaskData,
            completed: false,
        };

        const updatedSubtasks = [...newTasks[taskIndex].subtasks, newSubtask];
        updatedSubtasks.sort((a,b) => a.dueDate.getTime() - b.dueDate.getTime());

        newTasks[taskIndex].subtasks = updatedSubtasks;
        return newTasks;
    });
  };

  const toggleSubtaskComplete = async (taskId: string, subtaskId: string) => {
    setTasks(currentTasks => {
        const newTasks = [...currentTasks];
        const taskIndex = newTasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return currentTasks;

        const subtaskIndex = newTasks[taskIndex].subtasks.findIndex(st => st.id === subtaskId);
        if (subtaskIndex === -1) return currentTasks;
        
        newTasks[taskIndex].subtasks[subtaskIndex].completed = !newTasks[taskIndex].subtasks[subtaskIndex].completed;
        return newTasks;
    });
  };

  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    setTasks(currentTasks => {
        const newTasks = [...currentTasks];
        const taskIndex = newTasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return currentTasks;

        newTasks[taskIndex].subtasks = newTasks[taskIndex].subtasks.filter(st => st.id !== subtaskId);
        return newTasks;
    });
  };
  
  const columnIds = useMemo(() => columns.map(c => c.id), [columns]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const onDragStart = (event: DragEndEvent) => {
    if(sortBy !== 'manual') return;
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
    if (sortBy !== 'manual') return;
    const { active, over } = event;
    if (!over) return;
  
    const activeId = active.id;
    const overId = over.id;
  
    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === "Task";
    const isOverAColumn = over.data.current?.type === "Column";

    // Dropping a Task over a Column
    if (isActiveATask && isOverAColumn) {
      setTasks(currentTasks => {
        const activeIndex = currentTasks.findIndex(t => t.id === activeId);
        if (currentTasks[activeIndex].columnId !== overId) {
            const newTasks = [...currentTasks];
            newTasks[activeIndex].columnId = overId as string;
            return arrayMove(newTasks, activeIndex, activeIndex); // Triggers a re-render
        }
        return currentTasks;
      });
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    if(sortBy !== 'manual') return;

    setActiveDragTask(null);
    setActiveDragColumn(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;
    
    const isActiveAColumn = active.data.current?.type === 'Column';
    if(isActiveAColumn) {
        setColumns(current => {
            const activeIndex = current.findIndex(c => c.id === activeId);
            const overIndex = current.findIndex(c => c.id === overId);
            const newOrder = arrayMove(current, activeIndex, overIndex);
            return newOrder.map((col, index) => ({...col, order: index}));
        });
        return;
    }
    
    const isActiveATask = active.data.current?.type === "Task";
    if (isActiveATask) {
        setTasks(currentTasks => {
            const activeTaskIndex = currentTasks.findIndex(t => t.id === activeId);
            const overTaskIndex = currentTasks.findIndex(t => t.id === overId);
            let newTasks = [...currentTasks];

            const isOverATask = over.data.current?.type === "Task";
            const isOverAColumn = over.data.current?.type === "Column";

            let newColumnId = newTasks[activeTaskIndex].columnId;

            if (isOverAColumn) {
                newColumnId = overId as string;
            } else if (isOverATask) {
                newColumnId = newTasks[overTaskIndex].columnId;
            }
            
            newTasks[activeTaskIndex].columnId = newColumnId;
            
            // Move the task
            newTasks = arrayMove(newTasks, activeTaskIndex, overTaskIndex);
            
            // Re-assign order for all tasks
            return newTasks.map((task, index) => ({...task, order: index}));
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
             <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'manual' | 'priority')}>
                <SelectTrigger className="w-[140px]">
                    <div className="flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Sort by" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
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
             <SortableContext items={columnIds} strategy={horizontalListSortingStrategy} disabled={sortBy !== 'manual'}>
              {columns.sort((a,b) => a.order - b.order).map(column => (
                <SortableColumn 
                    key={column.id}
                    column={column}
                    tasks={filteredAndSortedTasks.filter(t => t.columnId === column.id)}
                    deleteColumn={deleteColumn}
                    onDeleteTask={deleteTask}
                    onAddSubtask={addSubtask}
                    onToggleSubtaskComplete={toggleSubtaskComplete}
                    onDeleteSubtask={deleteSubtask}
                    isSortingActive={sortBy !== 'manual'}
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
                    tasks={filteredAndSortedTasks.filter(t => t.columnId === activeDragColumn.id)}
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

    