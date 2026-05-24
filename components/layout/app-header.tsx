import { resolveControlledSessionContext } from "../../lib/server/controlled-session";

export default async function AppHeader() {
  const sessionContext = await resolveControlledSessionContext({
    source: "app.header",
    allowFallback: false,
  });

  const email = sessionContext?.auth?.email;

  return (
    <header className="w-full bg-white border-b p-4 flex items-center justify-between">
      <div className="text-lg font-semibold">VisioMilhas</div>
      <div className="text-sm text-gray-600">
        {email ? (
          <>
            {email} — <a href="/api/auth/signout" className="text-blue-600">Sair</a>
          </>
        ) : (
          <a href="/api/auth?provider=google" className="text-blue-600">Entrar com Google</a>
        )}
      </div>
    </header>
  );
}
