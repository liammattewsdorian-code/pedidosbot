import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId as string | undefined;

  if (!tenantId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const response = await fetch(
    `${process.env.BOT_API_URL}/api/sessions/${tenantId}/events`,
    {
      headers: {
        "x-api-secret": process.env.BOT_API_SECRET || "",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return new Response("Bot service unavailable", { status: 503 });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
