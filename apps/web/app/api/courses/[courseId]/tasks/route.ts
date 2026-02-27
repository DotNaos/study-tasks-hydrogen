import { TaskSection } from "@prisma/client";

import { getSessionUserId } from "@/lib/auth";
import { toTaskDto } from "@/lib/apiDtos";
import { prisma } from "@/lib/prisma";

type Params = {
  courseId: string;
};

export async function GET(_request: Request, { params }: { params: Promise<Params> }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { courseId } = await params;

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      courseId,
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      courseId: true,
      title: true,
      section: true,
      dueDate: true,
      done: true,
    },
  });

  return Response.json(tasks.map(toTaskDto));
}

export async function POST(request: Request, { params }: { params: Promise<Params> }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { courseId } = await params;

  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      userId,
    },
    select: { id: true },
  });

  if (!course) {
    return new Response("Course not found", { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const section = body?.section;
  const dueDate = typeof body?.dueDate === "string" ? body.dueDate : null;

  if (!title) {
    return new Response("Task title is required", { status: 400 });
  }

  if (section !== "homework" && section !== "submission") {
    return new Response("Invalid task section", { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      userId,
      courseId,
      title,
      section: section as TaskSection,
      dueDate: section === "submission" && dueDate ? new Date(dueDate) : null,
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

  return Response.json(toTaskDto(task), { status: 201 });
}
