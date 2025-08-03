
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskCard } from "./task-card";
import { cn } from "@/lib/utils";
import type { Task, SubTask } from "@/lib/types";

type SortableTaskCardProps = {
  task: Task;
  onDelete: (id: string) => void;
  onAddSubtask: (taskId: string, subtask: Omit<SubTask, "id" | "completed">) => void;
  onToggleSubtaskComplete: (taskId: string, subtaskId: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  isSortingActive?: boolean;
};

export function SortableTaskCard(props: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.task.id,
    data: {
      type: 'Task',
      task: props.task
    },
    disabled: props.isSortingActive,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  const classes = cn(
    isDragging && "opacity-50",
    props.isSortingActive && "cursor-default"
  );

  return (
    <div ref={setNodeRef} style={style} {...attributes} className={classes}>
      <TaskCard {...props} dragHandleProps={props.isSortingActive ? undefined : listeners} />
    </div>
  );
}

    