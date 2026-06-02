const testHistory = [
  {
    date: "2026-06-02",
    title: "Rota minima criada",
    detail:
      "Pagina estatica para validar se o deploy entrega HTML padrao, CSS do Next e shell do aplicativo sem tela branca.",
  },
  {
    date: "2026-06-02",
    title: "Teste de CSS basico",
    detail:
      "Usa somente classes utilitarias simples para confirmar que o arquivo CSS correto esta sendo carregado.",
  },
  {
    date: "Proximo passo",
    title: "Incremento controlado",
    detail:
      "Adicionar icones, componentes client e dados reais apenas depois que a rota simples estiver estavel em producao.",
  },
];

const checkpoints = [
  "HTML deve iniciar em modo padrao no navegador.",
  "A pagina deve exibir cards com bordas, espacamento e cores.",
  "Nao deve depender de imagem, favicon, API ou componente client.",
  "Se esta rota abrir e a home ficar branca, o problema esta no fluxo da home.",
];

export default function TestePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
          Diagnostico de producao
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Teste de renderizacao
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Esta pagina existe para validar o caminho mais simples do VisioMilhas:
          rota, layout, CSS e resposta HTML. Ela ajuda a descobrir se a tela
          branca vem do build servido em producao ou de algum componente mais
          especifico.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {checkpoints.map((checkpoint) => (
          <article
            key={checkpoint}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="text-sm font-semibold text-slate-950">
              Checkpoint
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {checkpoint}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          Historico de uso
        </h2>
        <div className="mt-5 grid gap-4">
          {testHistory.map((item) => (
            <article
              key={`${item.date}-${item.title}`}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {item.date}
              </div>
              <h3 className="mt-2 text-base font-semibold text-slate-950">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.detail}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
