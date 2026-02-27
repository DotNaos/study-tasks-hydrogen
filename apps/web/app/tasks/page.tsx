"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TasksPage() {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courseName, setCourseName] = useState("");
  const [homeworkTitle, setHomeworkTitle] = useState("");
  const [submissionTitle, setSubmissionTitle] = useState("");
  const [submissionDueDate, setSubmissionDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ensureSession = useCallback(async () => {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    if (!response.ok) {
      router.replace("/login");
      return null;
    }
    setAuthorized(true);
    return true;
  }, [router]);

  const loadCoursesAndTasks = useCallback(async () => {
    const nextCourses = await listCourses();
    setCourses(nextCourses);
    const nextCourseId = selectedCourseId || nextCourses[0]?.id || "";
    setSelectedCourseId(nextCourseId);
    if (!nextCourseId) { setTasks([]); return; }
    setTasks(await listTasks(nextCourseId));
  }, [selectedCourseId]);

  useEffect(() => {
    ensureSession()
      .then((ok) => { if (ok) return loadCoursesAndTasks(); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load data"));
  }, [ensureSession, loadCoursesAndTasks]);

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
  async function onSignOut() { await fetch("/api/auth/logout", { method: "POST" }); router.replace("/login"); }

  const homeworkTasks = useMemo(() => tasks.filter((t) => t.section === "homework"), [tasks]);
  const submissionTasks = useMemo(() => tasks.filter((t) => t.section === "submission"), [tasks]);

  if (!authorized) {
    return <main className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Checking session…</p></main>;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">My course tasks</h1>
        <Button variant="outline" size="sm" onClick={onSignOut}>Sign out</Button>
      </header>

      <form onSubmit={onCreateCourse} className="flex gap-2">
        <Input value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="New course name…" />
        <Button type="submit" disabled={busy}>Add course</Button>
      </form>

      {courses.length > 0 && (
        <Select value={selectedCourseId} onValueChange={async (v) => { setSelectedCourseId(v); setTasks(v ? await listTasks(v) : []); }}>
          <SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger>
          <SelectContent>
            {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {selectedCourseId && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Homework
                {homeworkTasks.length > 0 && <Badge variant="secondary" className="ml-2">{homeworkTasks.filter((t) => t.done).length}/{homeworkTasks.length}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex gap-2">
                <Input value={homeworkTitle} onChange={(e) => setHomeworkTitle(e.target.value)} placeholder="Add homework task…" />
                <Button disabled={busy} onClick={() => onCreateTask("homework")}>Add</Button>
              </div>
              <TaskList tasks={homeworkTasks} onToggle={toggleDone} onDelete={onDeleteTask} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Submission
                {submissionTasks.length > 0 && <Badge variant="secondary" className="ml-2">{submissionTasks.filter((t) => t.done).length}/{submissionTasks.length}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input value={submissionTitle} onChange={(e) => setSubmissionTitle(e.target.value)} placeholder="Add submission task…" />
                <Input value={submissionDueDate} onChange={(e) => setSubmissionDueDate(e.target.value)} type="date" className="sm:w-40" />
                <Button disabled={busy} onClick={() => onCreateTask("submission")}>Add</Button>
              </div>
              <TaskList tasks={submissionTasks} onToggle={toggleDone} onDelete={onDeleteTask} />
            </CardContent>
          </Card>
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </main>
  );
}

function TaskList({ tasks, onToggle, onDelete }: { tasks: Task[]; onToggle: (task: Task) => Promise<void>; onDelete: (taskId: string) => Promise<void> }) {
  if (tasks.length === 0) return <p className="text-sm text-muted-foreground">No tasks yet.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {tasks.map((task) => (
        <li key={task.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
          <div className="flex items-center gap-3 min-w-0">
            <Checkbox checked={task.done} onCheckedChange={() => onToggle(task)} id={`task-${task.id}`} />
            <label htmlFor={`task-${task.id}`} className={`text-sm cursor-pointer ${task.done ? "line-through text-muted-foreground" : ""}`}>{task.title}</label>
            {task.section === "submission" && task.dueDate && <Badge variant="outline" className="text-xs shrink-0">due {task.dueDate}</Badge>}
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 text-destructive hover:text-destructive" onClick={() => onDelete(task.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
