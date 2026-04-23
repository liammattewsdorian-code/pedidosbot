import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MetaPanel } from "./MetaPanel";
import { saveMetaCredentialsAction, disconnectMetaAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function WhatsappPage() {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId as string;

  const waSession = await prisma.whatsAppSession.findFirst({
    where: { tenantId },
    select: {
      status: true,
      phoneNumber: true,
      metaPhoneNumberId: true,
      metaWabaId: true,
      lastConnectedAt: true,
    },
  });

  const botBaseUrl = process.env.NEXT_PUBLIC_BOT_WEBHOOK_URL
    ? null
    : (process.env.BOT_API_URL || process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  const webhookUrl = process.env.NEXT_PUBLIC_BOT_WEBHOOK_URL ?? `${botBaseUrl}/webhook`;

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="mb-1 text-3xl font-bold">Conectar WhatsApp</h1>
      <p className="mb-8 text-slate-500">
        Usa la API Oficial de Meta — sin riesgo de ban, gratis hasta 1,000 conversaciones/mes.
      </p>

      <MetaPanel
        initialStatus={waSession?.status ?? "DISCONNECTED"}
        phoneNumber={waSession?.phoneNumber ?? null}
        phoneNumberId={waSession?.metaPhoneNumberId ?? null}
        webhookUrl={webhookUrl}
        saveAction={saveMetaCredentialsAction}
        disconnectAction={disconnectMetaAction}
      />
    </main>
  );
}
