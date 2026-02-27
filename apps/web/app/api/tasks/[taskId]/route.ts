import { getSessionUserId } from "@/lib/auth";
import { toTaskDto } from "@/lib/apiDtos";
import { prisma } from "@/lib/prisma";

type Params = {
  taskId: string;
};

export async function PATCH(request: Request, { params }: { params: Promise<Params> }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { taskId } = await params;

  const existingTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      userId,
    },
    select: { id: true },
  });

  if (!existingTask) {
    return new Response("Task not found", { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : undefined;
  const done = typeof body?.done === "boolean" ? body.done : undefined;
  const dueDate = typeof body?.dueDate === "string" ? body.dueDate : body?.dueDate === null ? null : undefined;

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(done !== undefined ? { done } : {}),
      ...(dueDate !== undefined
        ? {
            dueDate: dueDate ? new Date(dueDate) : null,
          }
        : {}),
    },
    select: {
      id: true,
      courseId: true,
      title: true,
      section: true,
      dueDate: true,
      done: true,
    },
  });

  return Response.json(toTaskDto(task));
}

export async function DELETE(_request: Request, { params }: { params: Promise<Params> }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { taskId } = await params;

  const result = await prisma.task.deleteMany({
    where: {
      id: taskId,
      userId,
    },
  });

  if (result.count === 0) {
    return new Response("Task not found", { status: 404 });
  }

  return new Response(null, { status: 204 });
}
