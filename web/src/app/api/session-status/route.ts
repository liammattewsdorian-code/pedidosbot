import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request) {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId as string | undefined;
  if (!tenantId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // tenantId siempre viene del JWT, nunca del query string
  const waSession = await prisma.whatsAppSession.findUnique({ where: { tenantId } });
  return NextResponse.json(waSession || { status: "DISCONNECTED" });
}
