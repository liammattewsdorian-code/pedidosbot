"use client";

import { useEffect, useRef, useState, useTransition } from "react";

type Status = "DISCONNECTED" | "QR_PENDING" | "CONNECTING" | "CONNECTED" | "AUTH_FAILED";

const TIMEOUT_SECONDS = 90;

export function QrPanel({
  initialStatus, initialQr, phoneNumber, startAction, stopAction,
}: {
  initialStatus: Status;
  initialQr: string | null;
  phoneNumber: string | null;
  startAction: () => Promise<void>;
  stopAction: () => Promise<void>;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [qr, setQr] = useState<string | null>(initialQr);
  const [phone, setPhone] = useState<string | null>(phoneNumber);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [isPending, startTransition] = useTransition();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Polling cuando está esperando QR o conectando
  useEffect(() => {
    if (status !== "QR_PENDING" && status !== "CONNECTING") return;

    // Timeout de 90 segundos
    timeoutRef.current = setTimeout(() => setTimedOut(true), TIMEOUT_SECONDS * 1000);

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/session-status");
        if (!res.ok) return;
        const data = await res.json();
        setStatus(data.status);
        setQr(data.qrCode || null);
        setPhone(data.phoneNumber || null);
      } catch {}
    }, 2000);

    return () => {
      clearInterval(interval);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [status]);

  const handleStart = () => {
    setError(null);
    setTimedOut(false);
    startTransition(async () => {
      try {
        await startAction();
        setStatus("CONNECTING");
      } catch (e: any) {
        setError(e?.message || "Error al iniciar sesión");
      }
    });
  };

  const handleStop = () => {
    setTimedOut(false);
    startTransition(async () => {
      await stopAction();
      setStatus("DISCONNECTED");
      setQr(null);
      setPhone(null);
    });
  };

  const isWaiting = status === "CONNECTING" || (status === "QR_PENDING" && !qr);

  return (
    <div>
      <StatusBadge status={status} />

      {/* Conectado */}
      {status === "CONNECTED" && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">
          <div className="font-semibold text-green-900">Bot conectado y listo</div>
          {phone && (
            <div className="mt-1 text-sm text-green-800">
              Número activo: <span className="font-mono">{phone}</span>
            </div>
          )}
          <p className="mt-2 text-sm text-green-800">
            Escríbele al número desde otro celular para probar el bot.
          </p>
          <button
            onClick={handleStop}
            disabled={isPending}
            className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Desconectar
          </button>
        </div>
      )}

      {/* QR listo para escanear */}
      {status === "QR_PENDING" && qr && (
        <div className="mt-6 text-center">
          <p className="mb-4 text-sm text-slate-600">
            Abre WhatsApp en tu celular → Dispositivos vinculados → Vincular dispositivo
          </p>
          <img
            src={qr}
            alt="QR WhatsApp"
            className="mx-auto h-72 w-72 rounded-xl border-4 border-brand"
          />
          <p className="mt-3 text-xs text-slate-400">
            El código expira en ~60 segundos y se renueva automáticamente.
          </p>
          <button
            onClick={handleStop}
            disabled={isPending}
            className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Cargando / esperando QR */}
      {isWaiting && !timedOut && (
        <div className="mt-6 text-center">
          <div className="inline-block animate-spin text-3xl">⏳</div>
          <p className="mt-3 text-sm font-medium text-slate-700">
            Iniciando Chrome y cargando WhatsApp Web...
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Esto puede tardar hasta {TIMEOUT_SECONDS} segundos la primera vez.
          </p>
          <button
            onClick={handleStop}
            disabled={isPending}
            className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Timeout */}
      {isWaiting && timedOut && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
          <p className="font-semibold text-amber-900">
            Está tardando más de lo normal
          </p>
          <p className="mt-1 text-sm text-amber-700">
            Chrome puede estar bloqueado por un antivirus o firewall. Revisa la terminal del bot para ver el error exacto.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={handleStart}
              disabled={isPending}
              className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Reintentar
            </button>
            <button
              onClick={handleStop}
              disabled={isPending}
              className="rounded-lg border border-slate-200 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Desconectado / fallo auth */}
      {(status === "DISCONNECTED" || status === "AUTH_FAILED") && (
        <div className="mt-6">
          {status === "AUTH_FAILED" && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              La autenticación falló. Intenta de nuevo.
            </div>
          )}
          <button
            onClick={handleStart}
            disabled={isPending}
            className="rounded-lg bg-brand px-6 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Iniciando..." : "📱 Conectar WhatsApp"}
          </button>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { label: string; className: string }> = {
    DISCONNECTED: { label: "Desconectado",          className: "bg-slate-100 text-slate-700" },
    QR_PENDING:   { label: "Esperando escaneo",     className: "bg-amber-100 text-amber-800" },
    CONNECTING:   { label: "Conectando...",          className: "bg-blue-100 text-blue-800" },
    CONNECTED:    { label: "🟢 Conectado",           className: "bg-green-100 text-green-800" },
    AUTH_FAILED:  { label: "Autenticación fallida", className: "bg-red-100 text-red-800" },
  };
  const { label, className } = map[status];
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${className}`}>
      {label}
    </span>
  );
}
