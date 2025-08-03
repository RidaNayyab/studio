
"use client";

import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { SortableTaskCard } from "@/components/sortable-task-card";
import { cn } from "@/lib/utils";
import type { Column, Task, SubTask } from "@/lib/types";

type SortableColumnProps = {
  column: Column;
  tasks: Task[];
  deleteColumn: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onAddSubtask: (taskId: string, subtask: Omit<SubTask, "id" | "completed">) => void;
  onToggleSubtaskComplete: (taskId: string, subtaskId: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  isOverlay?: boolean;
};

export function SortableColumn({
  column,
  tasks,
  deleteColumn,
  onDeleteTask,
  onAddSubtask,
  onToggleSubtaskComplete,
  onDeleteSubtask,
  isOverlay,
}: SortableColumnProps) {
  const taskIds = useMemo(() => tasks.map(t => t.id), [tasks]);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const containerClasses = cn(
    "w-72 flex-shrink-0 flex flex-col",
    isOverlay && "rounded-xl shadow-lg border bg-card",
  )

  const headerClasses = cn(
    "flex items-center justify-between p-4 rounded-t-lg",
    isDragging ? "cursor-grabbing" : "cursor-grab",
    isOverlay && "rounded-t-xl"
  );
  
  if (isDragging) {
    return (
        <div ref={setNodeRef} style={style} className="w-72 flex-shrink-0 rounded-lg border-2 border-primary bg-card opacity-50 h-[500px]" />
    )
  }

  return (
    <div ref={setNodeRef} style={style} className={containerClasses}>
       <div {...attributes} {...listeners} className={headerClasses}>
        <div className="flex items-center gap-2">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">{column.title}</h3>
            <span className="text-sm text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{tasks.length}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteColumn(column.id)}>
            <Trash2 className="h-4 w-4 text-muted-foreground"/>
        </Button>
      </div>
      <div className="space-y-4 rounded-b-lg border-x-2 border-b-2 border-dashed bg-card/50 p-4 flex-grow min-h-[24rem]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {tasks.length > 0 ? (
                tasks.map((task) => (
                <SortableTaskCard
                    key={task.id}
                    task={task}
                    onDelete={onDeleteTask}
                    onAddSubtask={onAddSubtask}
                    onToggleSubtaskComplete={onToggleSubtaskComplete}
                    onDeleteSubtask={onDeleteSubtask}
                />
                ))
            ) : (
                <div className="flex h-full flex-col items-center justify-center text-center">
                    <p className="text-lg font-medium text-muted-foreground">
                        No tasks yet.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Drag a task here to get started.
                    </p>
                </div>
            )}
        </SortableContext>
      </div>
    </div>
  );
}
