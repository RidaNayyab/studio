"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar, Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";


type TaskCardProps = {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onAddSubtask: (taskId: string, subtask: Omit<SubTask, "id" | "completed">) => void;
  onToggleSubtaskComplete: (taskId: string, subtaskId: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
};

const priorityVariant: Record<TaskPriority, "default" | "secondary" | "destructive"> = {
  Low: "secondary",
  Medium: "default",
  High: "destructive",
};

const subtaskFormSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().optional(),
  dueDate: z.date({ required_error: "A due date is required." }),
});

export function TaskCard({ 
  task, 
  onToggleComplete, 
  onDelete,
  onAddSubtask,
  onToggleSubtaskComplete,
  onDeleteSubtask,
}: TaskCardProps) {
  const [isSubtasksOpen, setSubtasksOpen] = useState(false);
  
  const form = useForm<z.infer<typeof subtaskFormSchema>>({
    resolver: zodResolver(subtaskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: undefined,
    },
  });

  const handleAddSubtask = (values: z.infer<typeof subtaskFormSchema>) => {
    onAddSubtask(task.id, values);
    form.reset();
  }
  
  const subtasksCompleted = task.subtasks.filter(st => st.completed).length;
  const subtasksTotal = task.subtasks.length;

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
      <CardContent className="flex-grow space-y-4">
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
        
        {(subtasksTotal > 0 || !task.completed) && <Separator />}

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
        
        {!task.completed && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddSubtask)} className="space-y-3 rounded-md border p-4">
               <h4 className="text-sm font-medium">Add a new sub-task</h4>
               <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Sub-task title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Sub-task description (optional)" {...field} className="text-xs"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="sr-only">Due Date</FormLabel>
                    <FormControl>
                      <DatePicker date={field.value} setDate={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-1"/> Add Sub-task
              </Button>
            </form>
          </Form>
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
