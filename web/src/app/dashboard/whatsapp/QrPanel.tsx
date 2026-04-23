"use client";

import { useState, useTransition } from "react";

export function MetaConfigPanel({
  initialData,
  onSave,
}: {
  initialData: {
    metaPhoneNumberId?: string;
    metaWabaId?: string;
    metaAccessToken?: string;
  };
  onSave: (data: any) => Promise<{ success: boolean; error?: string }>;
}) {
  const [formData, setFormData] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await onSave(formData);
      if (result.success) {
        setMessage({ type: "success", text: "¡Configuración guardada! El bot ahora está vinculado a Meta." });
      } else {
        setMessage({ type: "error", text: result.error || "La información no es correcta. Revisa los IDs y el Token en Meta for Developers." });
      }
    });
  };

  return (
    <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-brand/10 p-2 rounded-lg text-brand text-2xl">📱</div>
        <h2 className="text-2xl font-bold text-slate-900">Vincular WhatsApp (Meta API)</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number ID</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition"
              placeholder="Ej: 109283746509182"
              value={formData.metaPhoneNumberId || ""}
              onChange={(e) => setFormData({ ...formData, metaPhoneNumberId: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">WABA ID (WhatsApp Business Account)</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition"
              placeholder="Ej: 982734651092837"
              value={formData.metaWabaId || ""}
              onChange={(e) => setFormData({ ...formData, metaWabaId: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Token de Acceso Permanente</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition h-32 font-mono text-xs"
              placeholder="EAAB..."
              value={formData.metaAccessToken || ""}
              onChange={(e) => setFormData({ ...formData, metaAccessToken: e.target.value })}
              required
            />
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-sm font-medium border ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          />
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-4 px-6 rounded-xl transition shadow-lg shadow-brand/20 disabled:opacity-50"
        >
          {isPending ? "Validando..." : "Guardar Credenciales"}
        </button>
      </form>
    </div>
  );
}
