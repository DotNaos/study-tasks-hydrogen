import bcrypt from "bcryptjs";

import { setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function unauthorized(message: string) {
  return new Response(message, { status: 401 });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return unauthorized("Invalid credentials");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
    },
  });

  if (!user) {
    return unauthorized("Invalid credentials");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return unauthorized("Invalid credentials");
  }

  await setSessionCookie(user.id);

  return Response.json({
    id: user.id,
    email: user.email,
    name: user.name,
  });
}
