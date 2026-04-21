"use client";

import { useEffect, useState } from "react";

interface Order {
  id: string;
  orderNumber: number;
  total: number;
  status: string;
  customer: { phone: string; name?: string };
  items: any[];
}

export function OrderBoard({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    // Conexión SSE al proxy que creamos
    const eventSource = new EventSource("/api/proxy/events");

    eventSource.onmessage = (event) => {
      const newOrder = JSON.parse(event.data);
      setOrders((prev) => [newOrder, ...prev]);
      setNewOrderAlert(true);
      
      // Sonido de notificación tipo caja registradora
      const audio = new Audio("/sounds/cash-register.mp3");
      audio.play().catch(() => {});

      setTimeout(() => setNewOrderAlert(false), 5000);
    };

    return () => eventSource.close();
  }, []);

  const handleDispatch = async (orderId: string) => {
    setLoading(orderId);
    console.log("Despachando orden:", orderId);
    try {
      const res = await fetch(`/api/proxy/dispatch?orderId=${orderId}`, { method: 'POST' });
      if (res.ok) {
        setOrders(prev => prev.map(o => 
          o.id === orderId ? { ...o, status: 'SHIPPED' } : o
        ));
      } else {
        console.error("Fallo al despachar:", await res.text());
      }
    } catch (err) {
      console.error("Error al despachar:", err);
    } finally {
      setLoading(null);
    }
  };

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    console.log("Viendo orden:", order.id);
    
    // Si el pedido es nuevo (PENDING), avisamos al cliente que ya lo estamos viendo
    if (order.status === 'PENDING') {
      try {
        const res = await fetch(`/api/proxy/seen?orderId=${order.id}`, { method: 'POST' });
        if (!res.ok) console.error("Fallo al marcar como visto");
      } catch (err) {
        console.error("No se pudo enviar la notificación de visto:", err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {newOrderAlert && (
        <div className="bg-brand text-white p-4 rounded-lg animate-bounce text-center font-bold">
          🔔 ¡Ha llegado un nuevo pedido!
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Detalle Pedido #{selectedOrder.orderNumber}</h2>
            <div className="space-y-3 mb-6">
              {selectedOrder.items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between border-b pb-2">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="font-mono">RD${(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedOrder(null)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold">Cerrar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <OrderList 
          title="Pendientes" 
          color="bg-orange-500" 
          orders={orders.filter(o => o.status === 'PENDING')} 
          onDispatch={handleDispatch}
          onSelect={handleViewOrder}
          loadingId={loading}
        />
        <OrderList 
          title="En Camino / Completados" 
          color="bg-blue-500" 
          orders={orders.filter(o => o.status !== 'PENDING')} 
          onSelect={handleViewOrder}
        />
      </div>
    </div>
  );
}

function OrderList({ title, color, orders, onDispatch, onSelect, loadingId }: any) {
  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
      <h2 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
        <span className={`w-3 h-3 ${color} rounded-full`}></span>
        {title} ({orders.length})
      </h2>
      
      <div className="space-y-4">
        {orders.map((order: any) => (
          <div key={order.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 transition-all">
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-lg">#{String(order.orderNumber).padStart(3, '0')}</span>
              <span className="text-brand font-semibold">RD${order.total.toLocaleString()}</span>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              👤 {order.customer.name || order.customer.phone}
            </p>
            <div className="flex gap-2">
              {onDispatch && (
                <button 
                  onClick={() => onDispatch(order.id)}
                  disabled={loadingId === order.id}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white py-2 rounded text-sm font-medium transition"
                >
                  {loadingId === order.id ? '...' : 'Despachar'}
                </button>
              )}
              <button 
                onClick={() => onSelect(order)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 rounded transition text-sm"
              >
                Ver Detalle
              </button>
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <p className="text-center text-slate-400 py-10 text-sm italic">Cero órdenes aquí</p>
        )}
      </div>
    </div>
  );
}