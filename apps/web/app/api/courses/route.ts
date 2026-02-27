import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const courses = await prisma.course.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
    },
  });

  return Response.json(courses);
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return new Response("Course name is required", { status: 400 });
  }

  const course = await prisma.course.create({
    data: {
      name,
      userId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  return Response.json(course, { status: 201 });
}
