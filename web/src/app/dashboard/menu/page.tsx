import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CategoryForm, ProductForm, DeleteButton } from "./forms";
import {
  createCategoryAction, deleteCategoryAction,
  createProductAction, toggleProductAction, deleteProductAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId as string;

  const categories = await prisma.category.findMany({
    where: { tenantId },
    orderBy: { order: "asc" },
    include: {
      products: { orderBy: { order: "asc" } },
    },
  });

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-1 text-white">Menú / Productos</h1>
      <p className="text-gray-400 mb-8">
        Organiza tu catálogo por categorías. El bot mostrará esto cuando los clientes pregunten.
      </p>

      <section className="bg-[#111827] rounded-2xl border border-gray-800 p-6 mb-6">
        <h2 className="font-semibold mb-4 text-white">➕ Nueva categoría</h2>
        <CategoryForm action={createCategoryAction} />
      </section>

      {categories.length === 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 text-center">
          <div className="text-4xl mb-2">🛒</div>
          <p className="font-medium text-yellow-300">Aún no tienes categorías</p>
          <p className="text-sm text-yellow-400/70 mt-1">Crea tu primera categoría arriba para empezar.</p>
        </div>
      )}

      <div className="space-y-6">
        {categories.map((cat) => (
          <section key={cat.id} className="bg-[#111827] rounded-2xl border border-gray-800 overflow-hidden">
            <header className="flex items-center justify-between p-5 border-b border-gray-800 bg-gray-800/30">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{cat.emoji || "📋"}</span>
                <h3 className="text-lg font-bold text-white">{cat.name}</h3>
                <span className="text-sm text-gray-500">({cat.products.length})</span>
              </div>
              <form action={deleteCategoryAction.bind(null, cat.id)}>
                <DeleteButton label="Eliminar categoría" />
              </form>
            </header>

            <div className="p-5">
              <ProductForm categoryId={cat.id} action={createProductAction} />

              {cat.products.length > 0 && (
                <div className="mt-5 divide-y divide-gray-800">
                  {cat.products.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-200">{p.name}</span>
                          {!p.available && (
                            <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">
                              Agotado
                            </span>
                          )}
                        </div>
                        {p.description && <p className="text-sm text-gray-500">{p.description}</p>}
                      </div>
                      <div className="text-right mr-4">
                        <div className="font-bold text-white">{money(Number(p.price))}</div>
                      </div>
                      <form action={toggleProductAction.bind(null, p.id)} className="mr-2">
                        <button type="submit"
                          className="text-xs px-3 py-1 rounded border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                          {p.available ? "Marcar agotado" : "Disponible"}
                        </button>
                      </form>
                      <form action={deleteProductAction.bind(null, p.id)}>
                        <DeleteButton small />
                      </form>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function money(n: number) {
  return n.toLocaleString("es-DO", { style: "currency", currency: "DOP" });
}
