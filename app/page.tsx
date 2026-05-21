export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b p-6 flex items-center justify-between">
        <div className="text-2xl font-bold text-indigo-600">VisioMilhas</div>
        <nav className="space-x-4">
          <a href="#features" className="text-gray-700">
            Recursos
          </a>
          <a href="#pricing" className="text-gray-700">
            Preços
          </a>
          <a href="/app/dashboard" className="text-indigo-600 font-semibold">
            Entrar
          </a>
        </nav>
      </header>

      <section className="max-w-5xl mx-auto p-8">
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold mb-4">
            Controle suas milhas, custos e vendas em um só lugar.
          </h1>
          <p className="text-gray-600 mb-6">
            Acompanhe saldos, calcule o custo médio do milheiro, registre
            compras, vendas e transferências e entenda seu lucro real.
          </p>
          <div className="space-x-3">
            <a
              href="/app/dashboard"
              className="px-4 py-2 bg-indigo-600 text-white rounded"
            >
              Começar teste grátis de 15 dias
            </a>
            <a href="/app/dashboard" className="px-4 py-2 border rounded">
              Ver demonstração
            </a>
          </div>
        </div>

        <section id="features" className="grid grid-cols-3 gap-4 mb-12">
          <div className="bg-gray-50 p-6 rounded">Controle de saldo</div>
          <div className="bg-gray-50 p-6 rounded">Custo médio do milheiro</div>
          <div className="bg-gray-50 p-6 rounded">Compra e venda de milhas</div>
        </section>

        <section id="modules" className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Módulos</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded border">Dashboard</div>
            <div className="bg-white p-4 rounded border">Programas</div>
            <div className="bg-white p-4 rounded border">Contas</div>
            <div className="bg-white p-4 rounded border">Lançamentos</div>
            <div className="bg-white p-4 rounded border">Compras</div>
            <div className="bg-white p-4 rounded border">Vendas</div>
            <div className="bg-white p-4 rounded border">Transferências</div>
            <div className="bg-white p-4 rounded border">Clubes</div>
          </div>
        </section>

        <section id="pricing" className="text-center p-8 bg-indigo-50 rounded">
          <h3 className="text-xl font-semibold mb-2">Trial full por 15 dias</h3>
          <p className="text-gray-700">
            Experimente o PRO por 15 dias. Depois, plano PRO ou versão Free
            limitada.
          </p>
          <div className="mt-4">
            <a
              href="/app/dashboard"
              className="px-4 py-2 bg-indigo-600 text-white rounded"
            >
              Começar teste grátis
            </a>
          </div>
        </section>
      </section>
    </main>
  );
}
