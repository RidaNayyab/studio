"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar, Trash2, Plus, ChevronDown, ChevronUp, GripVertical } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Task, TaskPriority, SubTask } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AddSubtaskForm } from "@/components/add-subtask-form";

type TaskCardProps = {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onAddSubtask: (taskId: string, subtask: Omit<SubTask, "id" | "completed">) => void;
  onToggleSubtaskComplete: (taskId: string, subtaskId: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
};

const priorityVariant: Record<TaskPriority, "default" | "secondary" | "destructive"> = {
  Low: "secondary",
  Medium: "default",
  High: "destructive",
};

export function TaskCard({ 
  task, 
  onToggleComplete, 
  onDelete,
  onAddSubtask,
  onToggleSubtaskComplete,
  onDeleteSubtask,
  isDragging,
  dragHandleProps,
}: TaskCardProps) {
  const [isSubtasksOpen, setSubtasksOpen] = useState(false);
  const [isAddSubtaskOpen, setAddSubtaskOpen] = useState(false);
  const isCompleted = task.status === "completed";
  
  const subtasksCompleted = task.subtasks.filter(st => st.completed).length;
  const subtasksTotal = task.subtasks.length;

  return (
    <Card
      className={cn(
        "flex flex-col transition-colors",
        isCompleted && "bg-accent/30",
        isDragging && "shadow-2xl opacity-80"
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-2">
            {dragHandleProps && (
              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-grab" {...dragHandleProps}>
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </Button>
            )}
            <CardTitle
              className={cn(
                "font-semibold transition-all pt-1",
                isCompleted && "text-muted-foreground line-through"
              )}
            >
              {task.title}
            </CardTitle>
          </div>
          <Checkbox
            checked={isCompleted}
            onCheckedChange={() => onToggleComplete(task.id)}
            aria-label={`Mark "${task.title}" as ${
              isCompleted ? "incomplete" : "complete"
            }`}
            className="mt-1 h-5 w-5 shrink-0"
          />
        </div>
        <CardDescription
          className={cn(
            "flex items-center gap-2 pt-2 text-sm pl-10",
            isCompleted && "text-muted-foreground/80"
          )}
        >
          <Calendar className="h-4 w-4" />
          <span>Due by {format(task.dueDate, "PPP")}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        {task.description && (
          <p
            className={cn(
              "text-sm text-muted-foreground",
              isCompleted && "line-through"
            )}
          >
            {task.description}
          </p>
        )}
        
        {(subtasksTotal > 0 || !isCompleted) && <Separator />}

        <Collapsible open={isSubtasksOpen} onOpenChange={setSubtasksOpen} className="space-y-4">
          {subtasksTotal > 0 && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex w-full justify-between px-0 hover:bg-transparent">
                <span className="text-sm font-medium">
                  {subtasksCompleted} / {subtasksTotal} Sub-tasks
                </span>
                {isSubtasksOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          )}
          <CollapsibleContent className="space-y-3">
            {task.subtasks.map(subtask => (
              <div key={subtask.id} className="flex items-start gap-3 rounded-md border p-3">
                <Checkbox 
                  id={`subtask-${subtask.id}`}
                  checked={subtask.completed} 
                  onCheckedChange={() => onToggleSubtaskComplete(task.id, subtask.id)}
                  className="mt-1"
                />
                <div className="flex-grow space-y-1">
                  <label 
                    htmlFor={`subtask-${subtask.id}`}
                    className={cn("text-sm font-medium", subtask.completed && "line-through text-muted-foreground")}>
                    {subtask.title}
                  </label>
                  {subtask.description && (
                     <p className={cn("text-xs text-muted-foreground", subtask.completed && "line-through")}>
                       {subtask.description}
                     </p>
                  )}
                  <p className={cn("flex items-center gap-1.5 text-xs", subtask.completed ? "text-muted-foreground/80" : "text-muted-foreground")}>
                    <Calendar className="h-3 w-3" />
                    <span>{format(subtask.dueDate, "MMM d")}</span>
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onDeleteSubtask(task.id, subtask.id)}>
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
        
        {!isCompleted && (
          <Dialog open={isAddSubtaskOpen} onOpenChange={setAddSubtaskOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-1"/> Add Sub-task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Sub-task to "{task.title}"</DialogTitle>
              </DialogHeader>
              <AddSubtaskForm 
                taskId={task.id}
                onAddSubtask={onAddSubtask}
                setOpen={setAddSubtaskOpen}
              />
            </DialogContent>
          </Dialog>
        )}

      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>
          <Badge variant="outline">{task.category}</Badge>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              aria-label={`Delete task "${task.title}"`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                task and all of its sub-tasks.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(task.id)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
