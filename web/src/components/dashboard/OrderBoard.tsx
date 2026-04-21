"use client";

import { useEffect, useState, useTransition } from "react";

type OrderItem = {
  id: string;
  name: string;
  price: number | string;
  quantity: number;
};

type Order = {
  id: string;
  orderNumber: number;
  total: number | string;
  status: string;
  paymentMethod: string | null;
  deliveryAddress: string | null;
  notes: string | null;
  customer: { phone: string; name?: string | null };
  items: OrderItem[];
  deliveryZone?: { name: string; fee: number | string } | null;
};

const STATUS_FLOW: Record<string, { label: string; next: string | null; color: string }> = {
  PENDING:           { label: "Pendiente",   next: "CONFIRMED",        color: "bg-amber-500" },
  CONFIRMED:         { label: "Confirmado",  next: "PREPARING",        color: "bg-blue-500" },
  PREPARING:         { label: "Preparando",  next: "READY",            color: "bg-purple-500" },
  READY:             { label: "Listo",       next: "OUT_FOR_DELIVERY", color: "bg-indigo-500" },
  OUT_FOR_DELIVERY:  { label: "En camino",   next: "DELIVERED",        color: "bg-cyan-500" },
  DELIVERED:         { label: "Entregado",   next: null,               color: "bg-green-500" },
  CANCELLED:         { label: "Cancelado",   next: null,               color: "bg-red-400" },
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CARD: "Tarjeta",
  FIAO: "Fiao",
  MIXED: "Mixto",
};

export function OrderBoard({
  initialOrders,
  updateStatus,
}: {
  initialOrders: Order[];
  updateStatus: (orderId: string, status: string) => Promise<void>;
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const eventSource = new EventSource("/api/proxy/events");
    eventSource.onmessage = (event) => {
      const newOrder = JSON.parse(event.data) as Order;
      setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
      setNewOrderAlert(true);
      new Audio("/sounds/cash-register.mp3").play().catch(() => {});
      window.setTimeout(() => setNewOrderAlert(false), 5000);
    };
    return () => eventSource.close();
  }, []);

  const handleStatusChange = (orderId: string, newStatus: string) => {
    startTransition(async () => {
      await updateStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status: newStatus } : null);
      }
    });
  };

  const handleCancel = (orderId: string) => {
    if (!confirm("¿Seguro que quieres cancelar este pedido?")) return;
    handleStatusChange(orderId, "CANCELLED");
  };

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    if (order.status === "PENDING") {
      fetch(`/api/proxy/seen?orderId=${order.id}`, { method: "POST" }).catch(() => {});
    }
  };

  const pending  = orders.filter((o) => o.status === "PENDING");
  const active   = orders.filter((o) => ["CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"].includes(o.status));
  const done     = orders.filter((o) => ["DELIVERED", "CANCELLED"].includes(o.status));

  return (
    <div className="space-y-6">
      {newOrderAlert && (
        <div className="animate-pulse rounded-xl bg-brand p-4 text-center text-lg font-bold text-white">
          Nuevo pedido recibido
        </div>
      )}

      {/* Modal de detalle */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl max-h-[90vh]">
            <div className="flex items-center justify-between border-b p-6">
              <h2 className="text-xl font-bold">
                Pedido #{String(selectedOrder.orderNumber).padStart(3, "0")}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Estado actual */}
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold text-white ${
                    STATUS_FLOW[selectedOrder.status]?.color ?? "bg-slate-400"
                  }`}
                >
                  {STATUS_FLOW[selectedOrder.status]?.label ?? selectedOrder.status}
                </span>
                {selectedOrder.paymentMethod && (
                  <span className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600">
                    {PAYMENT_LABELS[selectedOrder.paymentMethod] ?? selectedOrder.paymentMethod}
                  </span>
                )}
              </div>

              {/* Cliente */}
              <div className="rounded-xl bg-slate-50 p-4 space-y-1 text-sm">
                <div className="font-semibold text-slate-800">
                  {selectedOrder.customer.name || "Sin nombre"}
                </div>
                <div className="text-slate-500">{selectedOrder.customer.phone}</div>
                {selectedOrder.deliveryAddress && (
                  <div className="text-slate-600">{selectedOrder.deliveryAddress}</div>
                )}
                {selectedOrder.deliveryZone && (
                  <div className="text-slate-500">
                    Zona: {selectedOrder.deliveryZone.name} · Delivery: {money(Number(selectedOrder.deliveryZone.fee))}
                  </div>
                )}
                {selectedOrder.notes && (
                  <div className="mt-2 italic text-slate-500">"{selectedOrder.notes}"</div>
                )}
              </div>

              {/* Items */}
              <div className="space-y-2">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between rounded-lg border border-slate-100 px-4 py-3">
                    <span className="font-medium">
                      {item.quantity}× {item.name}
                    </span>
                    <span className="font-mono text-slate-700">
                      {money(Number(item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between rounded-xl bg-slate-900 px-4 py-3 text-white">
                  <span className="font-bold">Total</span>
                  <span className="font-bold font-mono">{money(Number(selectedOrder.total))}</span>
                </div>
              </div>

              {/* Acciones de estado */}
              {selectedOrder.status !== "DELIVERED" && selectedOrder.status !== "CANCELLED" && (
                <div className="space-y-2 pt-2">
                  {STATUS_FLOW[selectedOrder.status]?.next && (
                    <button
                      disabled={isPending}
                      onClick={() =>
                        handleStatusChange(
                          selectedOrder.id,
                          STATUS_FLOW[selectedOrder.status].next!
                        )
                      }
                      className="w-full rounded-xl bg-brand py-3 font-bold text-white disabled:opacity-50 hover:opacity-90 transition"
                    >
                      {isPending ? "Actualizando..." : nextActionLabel(selectedOrder.status)}
                    </button>
                  )}
                  <button
                    disabled={isPending}
                    onClick={() => handleCancel(selectedOrder.id)}
                    className="w-full rounded-xl border border-red-200 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                  >
                    Cancelar pedido
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Kanban */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Column title="Pendientes" color="bg-amber-500" orders={pending} onSelect={handleViewOrder} />
        <Column title="En proceso" color="bg-blue-500"  orders={active}  onSelect={handleViewOrder} />
        <Column title="Finalizados" color="bg-green-500" orders={done}   onSelect={handleViewOrder} />
      </div>
    </div>
  );
}

function Column({
  title, color, orders, onSelect,
}: {
  title: string;
  color: string;
  orders: Order[];
  onSelect: (o: Order) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-700">
        <span className={`h-3 w-3 rounded-full ${color}`} />
        {title} ({orders.length})
      </h2>
      <div className="space-y-3">
        {orders.map((order) => (
          <button
            key={order.id}
            onClick={() => onSelect(order)}
            className="w-full rounded-xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:border-brand hover:shadow-md"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="font-bold text-slate-900">
                #{String(order.orderNumber).padStart(3, "0")}
              </span>
              <span className="font-semibold text-brand">{money(Number(order.total))}</span>
            </div>
            <p className="text-sm text-slate-600">
              {order.customer.name || order.customer.phone}
            </p>
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  STATUS_FLOW[order.status]?.color ?? "bg-slate-300"
                }`}
              />
              <span className="text-xs text-slate-400">
                {STATUS_FLOW[order.status]?.label ?? order.status}
              </span>
            </div>
          </button>
        ))}
        {orders.length === 0 && (
          <p className="py-10 text-center text-sm italic text-slate-400">Sin pedidos</p>
        )}
      </div>
    </div>
  );
}

function money(n: number) {
  return n.toLocaleString("es-DO", { style: "currency", currency: "DOP" });
}

function nextActionLabel(status: string) {
  return (
    {
      PENDING:          "Confirmar pedido",
      CONFIRMED:        "Marcar en preparación",
      PREPARING:        "Marcar como listo",
      READY:            "Marcar en camino",
      OUT_FOR_DELIVERY: "Marcar como entregado",
    }[status] ?? "Avanzar estado"
  );
}
