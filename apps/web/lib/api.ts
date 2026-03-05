export type Course = {
  id: string;
  name: string;
};

export type Task = {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  tag: string;
  dueDate: string | null;
  done: boolean;
};

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function listCourses() {
  return apiFetch<Course[]>("/courses");
}

export function createCourse(name: string) {
  return apiFetch<Course>("/courses", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function listTasks(courseId: string) {
  return apiFetch<Task[]>(`/courses/${courseId}/tasks`);
}

export function createTask(
  courseId: string,
  payload: { title: string; description?: string | null; tag?: string; dueDate?: string | null },
) {
  return apiFetch<Task>(`/courses/${courseId}/tasks`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTask(
  taskId: string,
  payload: { title?: string; description?: string | null; tag?: string; done?: boolean; dueDate?: string | null },
) {
  return apiFetch<Task>(`/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteTask(taskId: string) {
  return apiFetch<void>(`/tasks/${taskId}`, {
    method: "DELETE",
  });
}
