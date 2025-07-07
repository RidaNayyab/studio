"use client";

import { format } from "date-fns";
import { Calendar, Trash2 } from "lucide-react";

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
import { cn } from "@/lib/utils";
import type { Task, TaskPriority } from "@/lib/types";
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

type TaskCardProps = {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
};

const priorityVariant: Record<TaskPriority, "default" | "secondary" | "destructive"> = {
  Low: "secondary",
  Medium: "default",
  High: "destructive",
};

export function TaskCard({ task, onToggleComplete, onDelete }: TaskCardProps) {
  return (
    <Card
      className={cn(
        "flex flex-col transition-colors",
        task.completed && "bg-accent/30"
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle
            className={cn(
              "font-semibold transition-all",
              task.completed && "text-muted-foreground line-through"
            )}
          >
            {task.title}
          </CardTitle>
          <Checkbox
            checked={task.completed}
            onCheckedChange={() => onToggleComplete(task.id)}
            aria-label={`Mark "${task.title}" as ${
              task.completed ? "incomplete" : "complete"
            }`}
            className="mt-1 h-5 w-5 shrink-0"
          />
        </div>
        <CardDescription
          className={cn(
            "flex items-center gap-2 pt-2 text-sm",
            task.completed && "text-muted-foreground/80"
          )}
        >
          <Calendar className="h-4 w-4" />
          <span>Due by {format(task.dueDate, "PPP")}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {task.description && (
          <p
            className={cn(
              "text-sm text-muted-foreground",
              task.completed && "line-through"
            )}
          >
            {task.description}
          </p>
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
                task.
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
