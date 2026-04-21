import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId as string | undefined;

  if (!tenantId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  if (!orderId) {
    return new Response("Missing orderId", { status: 400 });
  }

  const response = await fetch(
    `${process.env.BOT_API_URL}/api/sessions/${tenantId}/orders/${orderId}/dispatch`,
    {
      method: "POST",
      headers: {
        "x-api-secret": process.env.BOT_API_SECRET || "",
      },
      cache: "no-store",
    }
  );

  return new Response(await response.text(), { status: response.status });
}
