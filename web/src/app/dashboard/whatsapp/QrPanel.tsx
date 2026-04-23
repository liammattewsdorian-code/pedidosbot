"use client";

import { useState, useTransition } from "react";

type MetaConfigData = {
  metaPhoneNumberId?: string;
  metaWabaId?: string;
  metaAccessToken?: string;
};

export function MetaConfigPanel({
  initialData,
  onSave,
}: {
  initialData: MetaConfigData;
  onSave: (data: MetaConfigData) => Promise<{ success: boolean; error?: string }>;
}) {
  const [formData, setFormData] = useState<MetaConfigData>(initialData);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await onSave(formData);
      if (result.success) {
        setMessage({
          type: "success",
          text: "Configuracion guardada. El bot ya quedo vinculado a Meta.",
        });
      } else {
        setMessage({
          type: "error",
          text:
            result.error ||
            "La informacion no es correcta. Revisa los IDs y el token en Meta for Developers.",
        });
      }
    });
  };

  return (
    <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-brand/10 p-2 text-2xl text-brand">WA</div>
        <h2 className="text-2xl font-bold text-slate-900">Vincular WhatsApp (Meta API)</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Phone Number ID
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              placeholder="Ej: 109283746509182"
              value={formData.metaPhoneNumberId || ""}
              onChange={(e) =>
                setFormData({ ...formData, metaPhoneNumberId: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              WABA ID
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              placeholder="Ej: 982734651092837"
              value={formData.metaWabaId || ""}
              onChange={(e) => setFormData({ ...formData, metaWabaId: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Token de acceso permanente
            </label>
            <textarea
              className="h-32 w-full rounded-xl border border-slate-200 px-4 py-3 font-mono text-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              placeholder="EAAB..."
              value={formData.metaAccessToken || ""}
              onChange={(e) =>
                setFormData({ ...formData, metaAccessToken: e.target.value })
              }
              required
            />
          </div>
        </div>

        {message && (
          <div
            className={`rounded-xl border p-4 text-sm font-medium ${
              message.type === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-brand px-6 py-4 font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark disabled:opacity-50"
        >
          {isPending ? "Validando..." : "Guardar credenciales"}
        </button>
      </form>
    </div>
  );
}
