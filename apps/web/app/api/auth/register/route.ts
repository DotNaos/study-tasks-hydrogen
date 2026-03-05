import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

function badRequest(message: string, status = 400) {
  return new Response(message, { status });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!email || !email.includes("@")) {
    return badRequest("Valid email is required");
  }

  if (password.length < 8) {
    return badRequest("Password must be at least 8 characters");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return Response.json(user, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002") {
      return badRequest("Email already exists", 409);
    }
    return badRequest("Failed to register", 500);
  }
}
