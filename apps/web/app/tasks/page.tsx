"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, LogOut, BookOpen, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import {
  Course,
  Task,
  createCourse,
  createTask,
  deleteTask,
  listCourses,
  listTasks,
  updateTask,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function normalizeTag(rawTag: string) {
  const trimmedTag = rawTag.trim().toLowerCase();
  return trimmedTag || "general";
}

function formatTagLabel(tag: string) {
  return tag
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function TasksPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courseName, setCourseName] = useState("");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskTag, setTaskTag] = useState("homework");
  const [taskDueDate, setTaskDueDate] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  const loadCoursesAndTasks = useCallback(async () => {
    try {
      const nextCourses = await listCourses();
      setCourses(nextCourses);
      const nextCourseId = selectedCourseId || nextCourses[0]?.id || "";
      setSelectedCourseId(nextCourseId);
      if (!nextCourseId) {
        setTasks([]);
        return;
      }
      setTasks(await listTasks(nextCourseId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load data");
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (status === "authenticated") {
      loadCoursesAndTasks();
    }
  }, [status, loadCoursesAndTasks]);

  async function refreshTasks() {
    if (!selectedCourseId) return;
    setTasks(await listTasks(selectedCourseId));
  }

  async function onCreateCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!courseName.trim()) return;

    setBusy(true);
    setError(null);

    try {
      const createdCourse = await createCourse(courseName.trim());
      setCourseName("");
      setSelectedCourseId(createdCourse.id);
      await loadCoursesAndTasks();
    } catch (createCourseError) {
      setError(createCourseError instanceof Error ? createCourseError.message : "Failed to create course");
    } finally {
      setBusy(false);
    }
  }

  async function onCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCourseId || !taskTitle.trim()) return;

    setBusy(true);
    setError(null);

    try {
      await createTask(selectedCourseId, {
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
        tag: normalizeTag(taskTag),
        dueDate: taskDueDate || null,
      });

      setTaskTitle("");
      setTaskDescription("");
      setTaskDueDate("");
      await refreshTasks();
    } catch (createTaskError) {
      setError(createTaskError instanceof Error ? createTaskError.message : "Failed to create task");
    } finally {
      setBusy(false);
    }
  }

  async function toggleDone(task: Task) {
    await updateTask(task.id, { done: !task.done });
    await refreshTasks();
  }

  async function onDeleteTask(taskId: string) {
    await deleteTask(taskId);
    await refreshTasks();
  }

  async function onSignOut() {
    await signOut({ callbackUrl: "/login" });
  }

  const groupedTasks = useMemo(() => {
    const groups = new Map<string, Task[]>();

    for (const task of tasks) {
      const normalizedTaskTag = normalizeTag(task.tag);
      const existingTasksForTag = groups.get(normalizedTaskTag) || [];
      existingTasksForTag.push(task);
      groups.set(normalizedTaskTag, existingTasksForTag);
    }

    return Array.from(groups.entries())
      .map(([tag, tasksForTag]) => ({
        tag,
        tasks: tasksForTag,
        doneCount: tasksForTag.filter((task) => task.done).length,
      }))
      .sort((leftGroup, rightGroup) => leftGroup.tag.localeCompare(rightGroup.tag));
  }, [tasks]);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground font-medium">Loading your workspace...</p>
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <main className="min-h-screen bg-muted/30 pb-12">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Study Tasks</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:inline-block">{session?.user?.email}</span>
            <Button variant="ghost" size="sm" onClick={onSignOut} className="gap-2 rounded-full">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline-block">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Your Courses</h2>
            <p className="text-sm text-muted-foreground">Organize tasks by tags and track progress per column.</p>
          </div>

          <form onSubmit={onCreateCourse} className="flex w-full gap-2 sm:max-w-sm">
            <Input
              value={courseName}
              onChange={(event) => setCourseName(event.target.value)}
              placeholder="New course name…"
              className="rounded-full bg-background"
            />
            <Button type="submit" disabled={busy || !courseName.trim()} className="shrink-0 rounded-full">
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </form>
        </section>

        {courses.length > 0 ? (
          <div className="w-full sm:max-w-xs">
            <Select
              value={selectedCourseId}
              onValueChange={async (nextCourseId) => {
                setSelectedCourseId(nextCourseId);
                setTasks(nextCourseId ? await listTasks(nextCourseId) : []);
              }}
            >
              <SelectTrigger className="h-12 rounded-full bg-background px-5 text-base font-medium">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id} className="rounded-xl">
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <Card className="border-dashed bg-transparent shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-medium">No courses yet</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">Create your first course above to start tracking tasks.</p>
            </CardContent>
          </Card>
        )}

        {selectedCourseId && (
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b bg-muted/10 pb-4">
              <CardTitle className="text-lg">Create Task</CardTitle>
              <CardDescription>Title and tag are enough; description and due date are optional.</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={onCreateTask} className="grid gap-3 md:grid-cols-12">
                <Input
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
                  placeholder="Task title..."
                  className="rounded-full md:col-span-4"
                />
                <Input
                  value={taskDescription}
                  onChange={(event) => setTaskDescription(event.target.value)}
                  placeholder="Description (optional)..."
                  className="rounded-full md:col-span-4"
                />
                <Input
                  value={taskTag}
                  onChange={(event) => setTaskTag(event.target.value)}
                  placeholder="Tag (e.g. homework, exam, project)"
                  className="rounded-full md:col-span-2"
                />
                <div className="md:col-span-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start rounded-full text-left font-normal",
                          !taskDueDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {taskDueDate ? format(new Date(taskDueDate), "MMM d") : <span>No due date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto rounded-3xl p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={taskDueDate ? new Date(taskDueDate) : undefined}
                        onSelect={(date) => setTaskDueDate(date ? date.toISOString().slice(0, 10) : "")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="md:col-span-12 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setTaskDueDate("")}
                    disabled={!taskDueDate}
                    className="rounded-full"
                  >
                    Clear date
                  </Button>
                  <Button type="submit" disabled={busy || !taskTitle.trim()} className="rounded-full px-6">
                    Add task
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {selectedCourseId && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 items-start">
            {groupedTasks.length === 0 ? (
              <Card className="border-dashed bg-transparent shadow-none md:col-span-2 xl:col-span-3">
                <CardContent className="py-10 text-center text-muted-foreground">
                  Create your first task to generate tag-based columns.
                </CardContent>
              </Card>
            ) : (
              groupedTasks.map((group) => (
                <Card key={group.tag} className="border-border/50 shadow-sm">
                  <CardHeader className="border-b bg-muted/10 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{formatTagLabel(group.tag)}</CardTitle>
                        <CardDescription>Tasks tagged with “{group.tag}”</CardDescription>
                      </div>
                      <Badge variant={group.doneCount === group.tasks.length ? "default" : "secondary"} className="px-2 py-0.5 text-sm">
                        {group.doneCount} / {group.tasks.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <TaskList tasks={group.tasks} onToggle={toggleDone} onDelete={onDeleteTask} emptyMessage="No tasks in this tag yet." />
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/15 p-4 text-sm text-destructive">
            <span className="font-medium">Error:</span> {error}
          </div>
        )}
      </div>
    </main>
  );
}

function TaskList({
  tasks,
  onToggle,
  onDelete,
  emptyMessage,
}: {
  tasks: Task[];
  onToggle: (task: Task) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  emptyMessage: string;
}) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed bg-muted/10 py-8 text-center text-muted-foreground">
        <CheckCircle2 className="mb-2 h-8 w-8 opacity-20" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {tasks.map((task) => (
        <li
          key={task.id}
          className={cn(
            "group flex items-center justify-between gap-3 rounded-2xl border p-3 transition-all",
            task.done ? "border-transparent bg-muted/30" : "bg-card shadow-sm hover:border-primary/30",
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Checkbox
              checked={task.done}
              onCheckedChange={() => onToggle(task)}
              id={`task-${task.id}`}
              className="shrink-0"
            />
            <div className="flex min-w-0 flex-col gap-1">
              <label
                htmlFor={`task-${task.id}`}
                className={cn(
                  "cursor-pointer text-sm font-medium leading-tight transition-colors",
                  task.done ? "text-muted-foreground line-through" : "text-foreground",
                )}
              >
                {task.title}
              </label>
              {task.description && (
                <p className="text-xs text-muted-foreground">{task.description}</p>
              )}
              {task.dueDate && (
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarIcon className="h-3 w-3" />
                  <span className={task.done ? "" : "font-medium text-orange-600 dark:text-orange-400"}>
                    Due {format(new Date(task.dueDate), "MMM d")}
                  </span>
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </li>
      ))}
    </ul>
  );
}
