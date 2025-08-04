
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, ArrowUpDown, LogOut } from "lucide-react";
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
import {
  collection,
  doc,
  onSnapshot,
  writeBatch,
  query,
  orderBy,
  runTransaction,
  deleteDoc,
  setDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";

import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
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

const priorityOrder: Record<Priority, number> = {
    'High': 1,
    'Medium': 2,
    'Low': 3,
};

export default function Home() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);
  const [activeDragColumn, setActiveDragColumn] = useState<Column | null>(null);
  const [newColumnName, setNewColumnName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  const [sortBy, setSortBy] = useState<'manual' | 'priority'>('manual');
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (!user) return;

    const tasksQuery = query(collection(db, `users/${user.uid}/tasks`), orderBy("order"));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
        const fetchedTasks: Task[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                dueDate: (data.dueDate as Timestamp).toDate(),
                subtasks: data.subtasks.map((st: any) => ({
                    ...st,
                    dueDate: (st.dueDate as Timestamp).toDate()
                }))
            } as Task
        });
        setTasks(fetchedTasks);
    });

    const columnsQuery = query(collection(db, `users/${user.uid}/columns`), orderBy("order"));
    const unsubscribeColumns = onSnapshot(columnsQuery, (snapshot) => {
        const fetchedColumns: Column[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Column));
        setColumns(fetchedColumns);
    });

    return () => {
        unsubscribeTasks();
        unsubscribeColumns();
    };
  }, [user]);


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
    }

    return filtered;
  }, [tasks, searchTerm, filterCategory, filterPriority, sortBy]);


  const addTask = async (taskData: Omit<Task, "id" | "subtasks" | "columnId" | "order">) => {
    if (!user) return;
    const firstColumnId = columns.length > 0 ? columns[0].id : 'backlog';
    
    const newTask: Omit<Task, "id"> = {
      ...taskData,
      subtasks: [],
      columnId: firstColumnId,
      order: tasks.length,
      createdAt: new Date(),
    };
    
    const docRef = await addDoc(collection(db, `users/${user.uid}/tasks`), {
        ...newTask,
        dueDate: Timestamp.fromDate(newTask.dueDate),
    });
  };
  
  const addColumn = async () => {
    if (!newColumnName.trim() || !user) return;
    const newColumnData = {
        title: newColumnName.trim(),
        order: columns.length,
    };
    const newColumnRef = await addDoc(collection(db, `users/${user.uid}/columns`), newColumnData);
    setNewColumnName("");
  }

  const deleteColumn = async (columnId: string) => {
    if(!user) return;
    const batch = writeBatch(db);
    const columnDocRef = doc(db, `users/${user.uid}/columns`, columnId);
    batch.delete(columnDocRef);
    
    // For now, we will just delete tasks in the column.
    // A more robust solution might move them to a default column.
    const tasksInColumn = tasks.filter(task => task.columnId === columnId);
    tasksInColumn.forEach(task => {
        const taskDocRef = doc(db, `users/${user.uid}/tasks`, task.id);
        batch.delete(taskDocRef);
    });
    
    await batch.commit();
  }


  const deleteTask = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/tasks`, id));
  };
  
  const addSubtask = async (taskId: string, subtaskData: Omit<SubTask, "id" | "completed">) => {
    if(!user) return;
    const taskRef = doc(db, `users/${user.uid}/tasks`, taskId);
    await runTransaction(db, async (transaction) => {
        const taskDoc = await transaction.get(taskRef);
        if (!taskDoc.exists()) throw "Task does not exist!";
        
        const currentSubtasks = taskDoc.data().subtasks || [];
        const newSubtask: SubTask = {
          ...subtaskData,
          id: doc(collection(db, 'users')).id, // Generate a unique ID
          completed: false,
          dueDate: Timestamp.fromDate(subtaskData.dueDate) as any,
        };
        const updatedSubtasks = [...currentSubtasks, newSubtask];
        updatedSubtasks.sort((a,b) => (a.dueDate as any).seconds - (b.dueDate as any).seconds);
        
        transaction.update(taskRef, { subtasks: updatedSubtasks });
    });
  };

  const toggleSubtaskComplete = async (taskId: string, subtaskId: string) => {
    if(!user) return;
    const taskRef = doc(db, `users/${user.uid}/tasks`, taskId);
     await runTransaction(db, async (transaction) => {
        const taskDoc = await transaction.get(taskRef);
        if (!taskDoc.exists()) throw "Task does not exist!";
        
        const currentSubtasks = taskDoc.data().subtasks || [];
        const updatedSubtasks = currentSubtasks.map((st: SubTask) => 
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        
        transaction.update(taskRef, { subtasks: updatedSubtasks });
    });
  };

  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    if(!user) return;
    const taskRef = doc(db, `users/${user.uid}/tasks`, taskId);
     await runTransaction(db, async (transaction) => {
        const taskDoc = await transaction.get(taskRef);
        if (!taskDoc.exists()) throw "Task does not exist!";
        
        const currentSubtasks = taskDoc.data().subtasks || [];
        const updatedSubtasks = currentSubtasks.filter((st: SubTask) => st.id !== subtaskId);
        
        transaction.update(taskRef, { subtasks: updatedSubtasks });
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
            currentTasks[activeIndex].columnId = overId as string;
            return arrayMove(currentTasks, activeIndex, activeIndex); // Triggers a re-render
        }
        return currentTasks;
      });
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    if(!user || sortBy !== 'manual') return;

    setActiveDragTask(null);
    setActiveDragColumn(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;
    
    const batch = writeBatch(db);

    const isActiveAColumn = active.data.current?.type === 'Column';
    if(isActiveAColumn) {
        const activeIndex = columns.findIndex(c => c.id === activeId);
        const overIndex = columns.findIndex(c => c.id === overId);
        const newOrder = arrayMove(columns, activeIndex, overIndex);
        
        newOrder.forEach((col, index) => {
            const colRef = doc(db, `users/${user.uid}/columns`, col.id);
            batch.update(colRef, { order: index });
        });
        await batch.commit();
        return;
    }
    
    const isActiveATask = active.data.current?.type === "Task";
    if (isActiveATask) {
        const activeTask = tasks.find(t => t.id === activeId);
        if(!activeTask) return;

        let newTasksArray = [...tasks];
        const activeIndex = newTasksArray.findIndex(t => t.id === activeId);
        const overIndex = newTasksArray.findIndex(t => t.id === overId);
        
        const isOverATask = over.data.current?.type === "Task";
        const isOverAColumn = over.data.current?.type === "Column";

        let newColumnId = activeTask.columnId;
        if(isOverAColumn) {
            newColumnId = overId as string;
        } else if (isOverATask) {
            const overTask = tasks.find(t => t.id === overId);
            if(overTask) newColumnId = overTask.columnId;
        }

        // Update the task's column ID in the local state first for immediate UI feedback
        newTasksArray[activeIndex] = { ...newTasksArray[activeIndex], columnId: newColumnId };

        // Reorder tasks within the new column
        const tasksInNewColumn = newTasksArray.filter(t => t.columnId === newColumnId);
        const activeTaskIndexInNewCol = tasksInNewColumn.findIndex(t => t.id === activeId);
        const overTaskIndexInNewCol = tasksInNewColumn.findIndex(t => t.id === overId);

        let finalTasksArray;
        if (isOverAColumn && tasksInNewColumn.length === 1) {
            // Dropped on an empty column
            finalTasksArray = newTasksArray;
        } else {
            // Simulating arrayMove for visual ordering before batch update
            const reorderedTasksInColumn = arrayMove(tasksInNewColumn, activeTaskIndexInNewCol, overTaskIndexInNewCol);
            
            let otherTasks = newTasksArray.filter(t => t.columnId !== newColumnId);
            finalTasksArray = [...otherTasks, ...reorderedTasksInColumn];
        }

        // Update Firestore
        const taskRef = doc(db, `users/${user.uid}/tasks`, activeId as string);
        batch.update(taskRef, { columnId: newColumnId });
        
        finalTasksArray.forEach((task, index) => {
            const taskDocRef = doc(db, `users/${user.uid}/tasks`, task.id);
            batch.update(taskDocRef, { order: index });
        });

        await batch.commit();
    }
  };
  
  const dropAnimation: DropAnimation = {
    ...defaultDropAnimation,
  };
  
  if (loading || !user) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-lg">Loading...</div>
        </div>
    );
  }

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
            <Button variant="ghost" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
            </Button>
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
              {columns.map(column => (
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
