import { Task } from "@/lib/api";

export function toTaskDto(task: {
  id: string;
  courseId: string;
  title: string;
  section: "homework" | "submission";
  dueDate: Date | null;
  done: boolean;
}): Task {
  return {
    id: task.id,
    courseId: task.courseId,
    title: task.title,
    section: task.section,
    dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null,
    done: task.done,
  };
}
