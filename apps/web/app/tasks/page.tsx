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
  TaskSection,
  createCourse,
  createTask,
  deleteTask,
  listCourses,
  listTasks,
  updateTask,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function TasksPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courseName, setCourseName] = useState("");
  const [homeworkTitle, setHomeworkTitle] = useState("");
  const [submissionTitle, setSubmissionTitle] = useState("");
  const [submissionDueDate, setSubmissionDueDate] = useState("");
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
      if (!nextCourseId) { setTasks([]); return; }
      setTasks(await listTasks(nextCourseId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
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
    setBusy(true); setError(null);
    try {
      const course = await createCourse(courseName.trim());
      setCourseName(""); setSelectedCourseId(course.id);
      await loadCoursesAndTasks();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to create course"); }
    finally { setBusy(false); }
  }

  async function onCreateTask(section: TaskSection) {
    if (!selectedCourseId) return;
    const title = section === "homework" ? homeworkTitle.trim() : submissionTitle.trim();
    if (!title) return;
    setBusy(true); setError(null);
    try {
      await createTask(selectedCourseId, { title, section, dueDate: section === "submission" ? submissionDueDate || null : null });
      if (section === "homework") setHomeworkTitle(""); else setSubmissionTitle("");
      await refreshTasks();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to create task"); }
    finally { setBusy(false); }
  }

  async function toggleDone(task: Task) { await updateTask(task.id, { done: !task.done }); await refreshTasks(); }
  async function onDeleteTask(id: string) { await deleteTask(id); await refreshTasks(); }
  async function onSignOut() { await signOut({ callbackUrl: "/login" }); }

  const homeworkTasks = useMemo(() => tasks.filter((t) => t.section === "homework"), [tasks]);
  const submissionTasks = useMemo(() => tasks.filter((t) => t.section === "submission"), [tasks]);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground font-medium">Loading your workspace...</p>
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <main className="min-h-screen bg-muted/30 pb-12">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Study Tasks</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline-block">
              {session?.user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={onSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline-block">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl px-4 py-8 flex flex-col gap-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Your Courses</h2>
            <p className="text-sm text-muted-foreground">Manage your study materials and assignments.</p>
          </div>

          <form onSubmit={onCreateCourse} className="flex w-full sm:max-w-sm gap-2">
            <Input
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="New course name…"
              className="bg-background rounded-full"
            />
            <Button type="submit" disabled={busy || !courseName.trim()} className="shrink-0 rounded-full">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </form>
        </section>

        {courses.length > 0 ? (
          <div className="w-full sm:max-w-xs">
            <Select value={selectedCourseId} onValueChange={async (v) => { setSelectedCourseId(v); setTasks(v ? await listTasks(v) : []); }}>
              <SelectTrigger className="bg-background h-12 text-base font-medium rounded-full px-5">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {courses.map((c) => <SelectItem key={c.id} value={c.id} className="rounded-xl">{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <Card className="border-dashed bg-transparent shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No courses yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Create your first course above to start tracking your homework and submissions.
              </p>
            </CardContent>
          </Card>
        )}

        {selectedCourseId && (
          <div className="grid gap-6 md:grid-cols-2 items-start">
            <Card className="shadow-sm border-border/50">
              <CardHeader className="pb-4 border-b bg-muted/10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Homework
                    </CardTitle>
                    <CardDescription>Regular study tasks and reading</CardDescription>
                  </div>
                  {homeworkTasks.length > 0 && (
                    <Badge variant={homeworkTasks.every(t => t.done) ? "default" : "secondary"} className="text-sm px-2 py-0.5">
                      {homeworkTasks.filter((t) => t.done).length} / {homeworkTasks.length}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 flex flex-col gap-4">
                <div className="flex gap-2">
                  <Input
                    value={homeworkTitle}
                    onChange={(e) => setHomeworkTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    onKeyDown={(e) => { if (e.key === 'Enter' && homeworkTitle.trim()) { e.preventDefault(); onCreateTask("homework"); } }}
                    className="rounded-full"
                  />
                  <Button disabled={busy || !homeworkTitle.trim()} onClick={() => onCreateTask("homework")} size="icon" className="shrink-0 rounded-full">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <TaskList tasks={homeworkTasks} onToggle={toggleDone} onDelete={onDeleteTask} emptyMessage="No homework tasks yet." />
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/50">
              <CardHeader className="pb-4 border-b bg-muted/10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Submissions
                    </CardTitle>
                    <CardDescription>Graded assignments and projects</CardDescription>
                  </div>
                  {submissionTasks.length > 0 && (
                    <Badge variant={submissionTasks.every(t => t.done) ? "default" : "secondary"} className="text-sm px-2 py-0.5">
                      {submissionTasks.filter((t) => t.done).length} / {submissionTasks.length}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Input
                    value={submissionTitle}
                    onChange={(e) => setSubmissionTitle(e.target.value)}
                    placeholder="Assignment title..."
                    className="rounded-full"
                  />
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal rounded-full",
                            !submissionDueDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {submissionDueDate ? format(new Date(submissionDueDate), "PPP") : <span>Pick a due date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-3xl" align="start">
                        <Calendar
                          mode="single"
                          selected={submissionDueDate ? new Date(submissionDueDate) : undefined}
                          onSelect={(date) => setSubmissionDueDate(date ? date.toISOString() : "")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Button disabled={busy || !submissionTitle.trim()} onClick={() => onCreateTask("submission")} className="shrink-0 px-6 rounded-full">
                      Add
                    </Button>
                  </div>
                </div>
                <TaskList tasks={submissionTasks} onToggle={toggleDone} onDelete={onDeleteTask} emptyMessage="No submissions due." />
              </CardContent>
            </Card>
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-destructive/15 p-4 text-sm text-destructive border border-destructive/20 flex items-center gap-2">
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
  emptyMessage
}: {
  tasks: Task[];
  onToggle: (task: Task) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  emptyMessage: string;
}) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground border-2 border-dashed rounded-3xl bg-muted/10">
        <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {tasks.map((task) => (
        <li
          key={task.id}
          className={`group flex items-center justify-between gap-3 rounded-2xl border p-3 transition-all ${
            task.done ? "bg-muted/30 border-transparent" : "bg-card hover:border-primary/30 shadow-sm"
          }`}
        >
          <div className="flex items-start gap-3 min-w-0 flex-1 pt-0.5">
            <Checkbox
              checked={task.done}
              onCheckedChange={() => onToggle(task)}
              id={`task-${task.id}`}
              className="mt-0.5"
            />
            <div className="flex flex-col gap-1 min-w-0">
              <label
                htmlFor={`task-${task.id}`}
                className={`text-sm font-medium leading-none cursor-pointer transition-colors ${
                  task.done ? "line-through text-muted-foreground" : "text-foreground"
                }`}
              >
                {task.title}
              </label>
              {task.section === "submission" && task.dueDate && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
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
            className="shrink-0 h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
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
