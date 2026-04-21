"use client";

import { useRef } from "react";

export function CategoryForm({ action }: { action: (fd: FormData) => Promise<void> }) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      action={async (fd) => {
        await action(fd);
        ref.current?.reset();
      }}
      className="flex flex-wrap gap-3 items-end"
    >
      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs font-medium text-slate-600 mb-1">Nombre</label>
        <input name="name" required placeholder="Ej: Arepas"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Emoji</label>
        <input name="emoji" placeholder="🥙" maxLength={4}
          className="w-20 border border-slate-300 rounded-lg px-3 py-2 text-center" />
      </div>
      <button type="submit"
        className="bg-brand hover:bg-brand-dark text-white px-5 py-2 rounded-lg font-medium">
        Crear
      </button>
    </form>
  );
}

export function ProductForm({
  categoryId, action,
}: {
  categoryId: string;
  action: (fd: FormData) => Promise<void>;
}) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      action={async (fd) => {
        await action(fd);
        ref.current?.reset();
      }}
      className="grid md:grid-cols-12 gap-3 items-end"
    >
      <input type="hidden" name="categoryId" value={categoryId} />
      <div className="md:col-span-5">
        <label className="block text-xs font-medium text-slate-600 mb-1">Producto</label>
        <input name="name" required placeholder="Ej: Arepa Reina Pepiada"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand" />
      </div>
      <div className="md:col-span-4">
        <label className="block text-xs font-medium text-slate-600 mb-1">Descripción (opcional)</label>
        <input name="description" placeholder="Pollo, aguacate y mayo"
          className="w-full border border-slate-300 rounded-lg px-3 py-2" />
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs font-medium text-slate-600 mb-1">Precio RD$</label>
        <input name="price" type="number" min="0" step="0.01" required placeholder="250"
          className="w-full border border-slate-300 rounded-lg px-3 py-2" />
      </div>
      <button type="submit"
        className="md:col-span-1 bg-brand hover:bg-brand-dark text-white px-4 py-2 rounded-lg font-medium">
        +
      </button>
    </form>
  );
}

export function DeleteButton({ label, small }: { label?: string; small?: boolean }) {
  return (
    <button type="submit"
      onClick={(e) => {
        if (!confirm("¿Seguro que quieres eliminar?")) e.preventDefault();
      }}
      className={`text-red-600 hover:bg-red-50 border border-red-200 rounded ${
        small ? "text-xs px-2 py-1" : "text-sm px-3 py-1"
      }`}>
      {label || "Eliminar"}
    </button>
  );
}
