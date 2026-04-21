"use client";

import { useState, useTransition } from "react";

interface MetaPanelProps {
  initialStatus: string;
  phoneNumber: string | null;
  phoneNumberId: string | null;
  webhookUrl: string;
  saveAction: (formData: FormData) => Promise<any>;
  disconnectAction: () => Promise<void>;
}

export function MetaPanel({
  initialStatus,
  phoneNumber,
  phoneNumberId,
  webhookUrl,
  saveAction,
  disconnectAction,
}: MetaPanelProps) {
  const [status, setStatus] = useState(initialStatus);
  const [phone, setPhone] = useState(phoneNumber);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isConnected = status === "CONNECTED";

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const result = await saveAction(formData);
        setStatus("CONNECTED");
        setPhone(result.phoneNumber ?? null);
        setSuccess(`Conectado: ${result.phoneNumber}${result.verifiedName ? ` (${result.verifiedName})` : ""}`);
      } catch (err: any) {
        const msg = err.message ?? "";
        if (msg.includes("inválidas") || msg.includes("Phone Number") || msg.includes("Access Token")) {
          setError(msg);
        } else {
          setError("No se pudo guardar la configuración. Verifica los datos e intenta de nuevo.");
        }
      }
    });
  }

  async function handleDisconnect() {
    setError(null);
    startTransition(async () => {
      try {
        await disconnectAction();
        setStatus("DISCONNECTED");
        setPhone(null);
        setSuccess(null);
      } catch (err: any) {
        setError(err.message ?? "Error al desconectar");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Status card */}
      <div className={`rounded-xl border p-5 flex items-center gap-4 ${isConnected ? "border-green-200 bg-green-50" : "border-slate-200 bg-slate-50"}`}>
        <span className={`w-3 h-3 rounded-full flex-shrink-0 ${isConnected ? "bg-green-500" : "bg-slate-400"}`} />
        <div className="flex-1">
          <p className="font-semibold text-sm">
            {isConnected ? "Conectado a Meta Cloud API" : "Sin conexión"}
          </p>
          {isConnected && phone && (
            <p className="text-sm text-slate-600">{phone}</p>
          )}
        </div>
        {isConnected && (
          <button
            onClick={handleDisconnect}
            disabled={isPending}
            className="text-sm text-red-600 hover:underline disabled:opacity-50"
          >
            Desconectar
          </button>
        )}
      </div>

      {/* Feedback */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Credential form — show always so user can update */}
      {!isConnected && (
        <form onSubmit={handleSave} className="space-y-4">
          <h2 className="text-lg font-semibold">Credenciales de Meta</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Phone Number ID <span className="text-red-500">*</span></label>
            <input
              name="phoneNumberId"
              defaultValue={phoneNumberId ?? ""}
              required
              placeholder="123456789012345"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-slate-500">En Meta for Developers → Tu App → WhatsApp → Configuración de la API</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Access Token <span className="text-red-500">*</span></label>
            <input
              name="accessToken"
              type="password"
              required
              placeholder="EAAxxxxxxx..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-slate-500">Token permanente del System User (no el temporal de 24 h)</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">WABA ID <span className="text-slate-400 font-normal">(opcional)</span></label>
            <input
              name="wabaId"
              placeholder="WhatsApp Business Account ID"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 text-sm disabled:opacity-50 transition-colors"
          >
            {isPending ? "Verificando..." : "Conectar"}
          </button>
        </form>
      )}

      {isConnected && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Actualizar credenciales</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number ID</label>
              <input
                name="phoneNumberId"
                defaultValue={phoneNumberId ?? ""}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Access Token</label>
              <input
                name="accessToken"
                type="password"
                required
                placeholder="Ingresa token nuevo para actualizar"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">WABA ID</label>
              <input
                name="wabaId"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 text-sm disabled:opacity-50 transition-colors"
            >
              {isPending ? "Actualizando..." : "Actualizar credenciales"}
            </button>
          </form>
        </div>
      )}

      {/* Webhook config */}
      <div className="rounded-xl border border-slate-200 p-5 space-y-3">
        <h2 className="text-lg font-semibold">Configurar Webhook en Meta</h2>
        <ol className="list-decimal list-inside space-y-1.5 text-sm text-slate-600">
          <li>Ve a <strong>Meta for Developers</strong> → Tu App → WhatsApp → Configuración</li>
          <li>En <strong>Webhook</strong>, pega la URL de abajo y el token de verificación de tu <code>.env</code></li>
          <li>Suscribe los campos: <code>messages</code></li>
          <li>Guarda y verifica</li>
        </ol>
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">URL del Webhook</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-slate-100 rounded px-3 py-2 text-xs break-all">{webhookUrl}</code>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(webhookUrl)}
              className="text-xs text-blue-600 hover:underline whitespace-nowrap"
            >
              Copiar
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Token de verificación: el valor de <code>META_WEBHOOK_VERIFY_TOKEN</code> en tu <code>bot/.env</code>
        </p>
      </div>
    </div>
  );
}
