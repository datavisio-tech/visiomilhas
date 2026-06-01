import {
  clickText,
  navigatePage,
  signOutCurrentPage,
  submitJsonPost,
  waitForNetworkText,
  waitForPageState,
  type RuntimeContext,
} from "../runtime-browser";

export async function runAuthJourney(ctx: RuntimeContext) {
  const notes: string[] = [];
  const { client, baseUrl, user } = ctx;

  await navigatePage(client, `${baseUrl}/sign-in`);
  await waitForPageState(client, ["Entrar com e-mail", "Criar conta"], 30_000);

  const signInResult = await submitJsonPost(client, "/api/auth/sign-in/email", {
    email: user.email,
    password: user.password,
    callbackURL: "/app/dashboard",
    rememberMe: true,
  });

  if (signInResult?.ok) {
    notes.push(
      "Existing test user detected; reused login path in auth journey",
    );
  } else {
    const signUpResult = await submitJsonPost(
      client,
      "/api/auth/sign-up/email",
      {
        name: user.name,
        email: user.email,
        password: user.password,
        callbackURL: "/subscribe",
        rememberMe: true,
      },
    );

    if (!signUpResult?.ok) {
      if (
        signUpResult?.body?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
      ) {
        const retryLogin = await submitJsonPost(
          client,
          "/api/auth/sign-in/email",
          {
            email: user.email,
            password: user.password,
            callbackURL: "/app/dashboard",
            rememberMe: true,
          },
        );

        if (!retryLogin?.ok) {
          throw new Error(
            `Login request failed: ${JSON.stringify(retryLogin)}`,
          );
        }

        notes.push(
          "Existing test user detected; reused login path in auth journey",
        );
      } else {
        throw new Error(
          `Sign-up request failed: ${JSON.stringify(signUpResult)}`,
        );
      }
    } else {
      notes.push("Test user created during auth journey");
    }
  }

  await navigatePage(client, `${baseUrl}/app/dashboard`);
  const dashboardState = await waitForPageState(
    client,
    ["Saldo consolidado", "Resultado operacional", "CPM médio", "Margem média"],
    30_000,
  ).catch(() => null);

  if (!dashboardState || !dashboardState.pathname.includes("/app")) {
    const subscribeState = await waitForPageState(
      client,
      ["Trial grátis disponível", "Ir para o dashboard"],
      30_000,
    ).catch(() => null);

    if (!subscribeState) {
      throw new Error("Authenticated landing state was not reachable");
    }

    await clickText(client, "Ativar trial grátis");
    await waitForNetworkText(
      client,
      /POST\s+http:\/\/localhost:3000\/api\/subscription\/activate-trial\s+\[200\]/,
      60_000,
    ).catch(() => undefined);
    await navigatePage(client, `${baseUrl}/app/dashboard`);
    await waitForPageState(
      client,
      [
        "Saldo consolidado",
        "Resultado operacional",
        "CPM médio",
        "Margem média",
      ],
      60_000,
    );
  }

  await signOutCurrentPage(client);
  await navigatePage(client, `${baseUrl}/sign-in`);
  await waitForPageState(client, ["Entrar com e-mail", "Criar conta"], 30_000);

  await navigatePage(client, `${baseUrl}/app/dashboard`);
  const blockedState = await waitForPageState(
    client,
    ["Entrar com e-mail", "callbackUrl=/app/dashboard", "Criar conta"],
    30_000,
  );

  if (!blockedState.pathname.includes("/sign-in")) {
    throw new Error("Dashboard was not blocked after logout");
  }

  const reloginResult = await submitJsonPost(
    client,
    "/api/auth/sign-in/email",
    {
      email: user.email,
      password: user.password,
      callbackURL: "/app/dashboard",
      rememberMe: true,
    },
  );

  if (!reloginResult?.ok) {
    throw new Error(`Relogin request failed: ${JSON.stringify(reloginResult)}`);
  }

  await navigatePage(client, `${baseUrl}/app/dashboard`);
  await waitForPageState(
    client,
    ["Saldo consolidado", "Resultado operacional", "CPM médio", "Margem média"],
    30_000,
  );

  return { notes };
}
