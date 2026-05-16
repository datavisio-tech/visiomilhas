import Link from "next/link";

export default function AppSidebar() {
  return (
    <aside className="w-64 bg-white border-r p-4 h-screen fixed">
      <div className="mb-6">
        <div className="text-xl font-bold text-indigo-600">VisioMilhas</div>
        <div className="text-sm text-gray-500">Workspace Demo</div>
      </div>
      <nav className="space-y-2 text-sm">
        <Link
          href="/app/dashboard"
          className="block py-2 px-2 rounded hover:bg-gray-100"
        >
          Dashboard
        </Link>
        <Link
          href="/app/programs"
          className="block py-2 px-2 rounded hover:bg-gray-100"
        >
          Programas
        </Link>
        <Link
          href="/app/accounts"
          className="block py-2 px-2 rounded hover:bg-gray-100"
        >
          Contas
        </Link>
        <Link
          href="/app/entries"
          className="block py-2 px-2 rounded hover:bg-gray-100"
        >
          Lançamentos
        </Link>
        <Link
          href="/app/purchases"
          className="block py-2 px-2 rounded hover:bg-gray-100"
        >
          Compras
        </Link>
        <Link
          href="/app/sales"
          className="block py-2 px-2 rounded hover:bg-gray-100"
        >
          Vendas
        </Link>
        <Link
          href="/app/transfers"
          className="block py-2 px-2 rounded hover:bg-gray-100"
        >
          Transferências
        </Link>
        <Link
          href="/app/clubs"
          className="block py-2 px-2 rounded hover:bg-gray-100"
        >
          Clubes
        </Link>
        <Link
          href="/app/settings"
          className="block py-2 px-2 rounded hover:bg-gray-100"
        >
          Configurações
        </Link>
      </nav>
    </aside>
  );
}
