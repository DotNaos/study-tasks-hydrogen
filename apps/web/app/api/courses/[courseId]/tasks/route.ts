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
      description: true,
      tag: true,
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
  const descriptionRaw = typeof body?.description === "string" ? body.description.trim() : "";
  const description = descriptionRaw ? descriptionRaw : null;
  const tagRaw = typeof body?.tag === "string" ? body.tag.trim() : "";
  const tag = tagRaw || "general";
  const dueDate = typeof body?.dueDate === "string" ? body.dueDate : null;

  if (!title) {
    return new Response("Task title is required", { status: 400 });
  }

  if (!tag) {
    return new Response("Task tag is required", { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      userId,
      courseId,
      title,
      description,
      tag,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
    select: {
      id: true,
      courseId: true,
      title: true,
      description: true,
      tag: true,
      dueDate: true,
      done: true,
    },
  });

  return Response.json(toTaskDto(task), { status: 201 });
}
