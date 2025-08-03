
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar, Trash2, Plus, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Task, SubTask, Priority, Category } from "@/lib/types";
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
  onDelete: (id: string) => void;
  onAddSubtask: (taskId: string, subtask: Omit<SubTask, "id" | "completed">) => void;
  onToggleSubtaskComplete: (taskId: string, subtaskId: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
};

const priorityStyles: Record<Priority, string> = {
    High: 'bg-red-500 hover:bg-red-500/80',
    Medium: 'bg-yellow-500 hover:bg-yellow-500/80',
    Low: 'bg-green-500 hover:bg-green-500/80',
}

const categoryStyles: Record<Category, string> = {
    Work: 'bg-blue-500 hover:bg-blue-500/80',
    Personal: 'bg-purple-500 hover:bg-purple-500/80',
    Home: 'bg-orange-500 hover:bg-orange-500/80',
    Other: 'bg-gray-500 hover:bg-gray-500/80'
}


export function TaskCard({ 
  task, 
  onDelete,
  onAddSubtask,
  onToggleSubtaskComplete,
  onDeleteSubtask,
  dragHandleProps,
}: TaskCardProps) {
  const [isSubtasksOpen, setSubtasksOpen] = useState(false);
  const [isAddSubtaskOpen, setAddSubtaskOpen] = useState(false);
  
  const subtasksCompleted = task.subtasks.filter(st => st.completed).length;
  const subtasksTotal = task.subtasks.length;
  const allSubtasksComplete = subtasksTotal > 0 && subtasksCompleted === subtasksTotal;
  
  const isDone = task.columnId === 'done';

  return (
    <Card
      className={cn(
        "flex flex-col transition-colors w-full",
        isDone && "bg-card/60 grayscale-[50%]"
      )}
    >
      <div
        className="flex-grow cursor-grab"
        {...dragHandleProps}
      >
        <CardHeader className="relative">
          <div className="absolute top-3 right-3">
              <AlertDialog>
              <AlertDialogTrigger asChild>
                  <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  aria-label={`Delete task "${task.title}"`}
                  onClick={(e) => e.stopPropagation()}
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
          </div>
          <div className="flex items-start gap-4">
            <div className="flex-grow">
              <CardTitle
                className={cn(
                  "font-semibold transition-all text-lg pr-8",
                  isDone && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </CardTitle>
              <CardDescription
                className={cn(
                  "flex items-center gap-2 pt-2 text-sm",
                )}
              >
                <Calendar className="h-4 w-4" />
                <span>Due by {format(task.dueDate, "PPP")}</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-4" onClick={(e) => e.stopPropagation()}>
           <div className="flex items-center gap-2">
            <Badge className={cn("text-primary-foreground", priorityStyles[task.priority])}>{task.priority}</Badge>
            <Badge className={cn("text-primary-foreground", categoryStyles[task.category])}>{task.category}</Badge>
           </div>
          {task.description && (
            <p
              className={cn(
                "text-sm text-muted-foreground",
              )}
            >
              {task.description}
            </p>
          )}
        </CardContent>
      </div>
      <div onClick={(e) => e.stopPropagation()} className="px-6 space-y-4">
        {(subtasksTotal > 0) && <Separator />}

        <Collapsible open={isSubtasksOpen} onOpenChange={setSubtasksOpen} className="space-y-4">
          {subtasksTotal > 0 && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex w-full justify-between px-0 hover:bg-transparent">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {allSubtasksComplete && <CheckCircle2 className="h-4 w-4 text-green-500" />}
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
                  disabled={isDone}
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
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onDeleteSubtask(task.id, subtask.id)} disabled={isDone}>
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
        
        <Dialog open={isAddSubtaskOpen} onOpenChange={setAddSubtaskOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full" disabled={isDone}>
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
      </div>

      <CardFooter className="flex items-center justify-between mt-4" onClick={(e) => e.stopPropagation()}>
      </CardFooter>
    </Card>
  );
}
