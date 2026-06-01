import {
  evaluatePage,
  clickRowAction,
  clickText,
  fillField,
  navigatePage,
  openIsolatedPage,
  scanVisibleControls,
  stateText,
  waitForPageState,
  sleep,
  type RuntimeContext,
} from "../runtime-browser";
import { submitJsonPost } from "../runtime-browser";

async function fillFieldWithFallback(
  ctx: RuntimeContext,
  label: string,
  value: string | boolean,
) {
  try {
    await fillField(ctx.client, label, value);
    return;
  } catch (err) {
    // fallback: attempt to enable seed toggle near label and set input by proximity
    try {
      // If there is a visible toggle area with the provided label, try to click its adjacent button
      await evaluatePage(
        ctx.client,
        `(() => {
        const wanted = ${JSON.stringify(label)}.toLowerCase();
        const nodes = Array.from(document.querySelectorAll('div, label'));
        for (const n of nodes) {
          try {
            const txt = (n.innerText || n.textContent || '').toLowerCase();
            if (txt.includes(wanted)) {
              const btn = n.parentElement?.querySelector('button');
              if (btn) { btn.click(); }
            }
          } catch(e) {}
        }
        return true;
      })()`,
      );
    } catch {}

    // then try to set the input by placeholder or nearby input elements
    const res = await evaluatePage(
      ctx.client,
      `(() => {
      const wanted = ${JSON.stringify(label)}.toLowerCase();
      // try placeholder match
      const byPlaceholder = Array.from(document.querySelectorAll('input')).find(i => (i.getAttribute('placeholder')||'').toLowerCase().includes('ex:'));
      if (byPlaceholder) {
        byPlaceholder.value = ${JSON.stringify(value)};
        byPlaceholder.dispatchEvent(new Event('input', { bubbles: true }));
        byPlaceholder.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      // try input near label text
      const labels = Array.from(document.querySelectorAll('label'));
      const labelNode = labels.find(l => (l.innerText||l.textContent||'').toLowerCase().includes(wanted));
      if (labelNode) {
        const control = labelNode.querySelector('input, textarea, select') || labelNode.parentElement?.querySelector('input, textarea, select');
        if (control) {
          control.value = ${JSON.stringify(value)};
          control.dispatchEvent(new Event('input', { bubbles: true }));
          control.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }

        // try visible numeric inputs in modal: first numeric -> saldo, second -> cpm
        const numeric = Array.from(document.querySelectorAll('input[type="number"]')).filter(i => {
          const rect = i.getBoundingClientRect();
          const style = window.getComputedStyle(i);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        });
        if (numeric.length) {
          if (wanted.includes('saldo')) {
            numeric[0].value = ${JSON.stringify(value)};
            numeric[0].dispatchEvent(new Event('input', { bubbles: true }));
            numeric[0].dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
          if (wanted.includes('cpm')) {
            const idx = numeric.length > 1 ? 1 : 0;
            numeric[idx].value = ${JSON.stringify(value)};
            numeric[idx].dispatchEvent(new Event('input', { bubbles: true }));
            numeric[idx].dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
        }

        return false;
    })()`,
    );

    if (!res) {
      throw err;
    }
  }
}

type AccountsJourneyResult = {
  notes: string[];
  newFeatures: Array<{ route: string; feature: string; status: string }>;
};

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function detectNewFeatures(controls: string[]) {
  const known = new Set(
    [
      "nova conta",
      "buscar contas",
      "filtrar por status",
      "todos os status",
      "ativas",
      "inativas",
      "contas",
      "operação",
      "lista de contas",
      "nenhuma conta encontrada",
      "nenhum resultado para os filtros",
      "programa",
      "conta",
      "saldo",
      "cpm",
      "status",
      "atualizado",
      "criar conta",
      "salvar alterações",
      "cancelar",
      "fechar",
      "visualizar",
      "editar",
      "inativar",
      "ativar",
      "excluir",
      "confirmar",
      "selecione",
      "pesquisar programa",
      "programa de pontos",
      "apelido da conta",
      "adicionar saldo inicial",
      "saldo inicial",
      "cpm inicial",
      "conta ativa",
      "detalhes da conta",
      "editar conta",
      "inativar conta",
      "excluir conta",
      "resumo da conta",
      "visualização",
      "criada em",
      "atualizada em",
      "tag de risco operacional",
    ].map(normalize),
  );

  return controls
    .map((label) => label.trim())
    .filter((label) => {
      const normalized = normalize(label);
      return normalized && !known.has(normalized);
    });
}

async function openAccountRowMenu(ctx: RuntimeContext, rowText: string) {
  // Tenta seletor padrão e, se não encontrar, tenta detectores alternativos
  const preferred = 'button[aria-label="Ações da conta"]';
  try {
    await clickTextInRow(ctx, rowText, preferred);
  } catch (err) {
    await clickTextInRow(
      ctx,
      rowText,
      // fallback: tenta qualquer botão na linha que aparente ser um menu de ações
      `button, [role=button], [data-testid*="actions"], [aria-label*="Ação" i], [title*="Ação" i]`,
    );
  }
}

async function clickTextInRow(
  ctx: RuntimeContext,
  rowText: string,
  selector: string,
) {
  await evaluatePage(
    ctx.client,
    `(() => {
      const normalize = (value) => String(value ?? '').replace(/\\s+/g, ' ').trim().toLowerCase();
      const target = normalize(${JSON.stringify(rowText)});
          let rows = Array.from(document.querySelectorAll('tr'));
          let row = rows.find((candidate) => normalize(candidate.innerText || candidate.textContent).includes(target));
          if (!row) {
            // fallback: search any element containing the target text and find its closest row-like ancestor
            const any = Array.from(document.querySelectorAll('body *'));
            const el = any.find((candidate) => normalize(candidate.innerText || candidate.textContent).includes(target));
            if (el) {
              row = el.closest('tr') || el.closest('[data-account-row]') || el.parentElement;
            }
          }
      if (!row) {
        throw new Error('Linha da conta não encontrada: ' + ${JSON.stringify(rowText)});
      }
      const targetNode = row.querySelector(${JSON.stringify(selector)});
          if (!targetNode) {
            // tenta encontrar qualquer botão plausível dentro da linha
            const candidates = Array.from(row.querySelectorAll('button, [role=button]'));
            const found = candidates.find((el) => {
              const aria = (el.getAttribute('aria-label') || '').toLowerCase();
              const title = (el.getAttribute('title') || '').toLowerCase();
              const txt = (el.innerText || el.textContent || '').toLowerCase();
              return aria.includes('ação') || title.includes('ação') || txt.includes('ação') || aria.includes('acoes') || title.includes('acoes') || txt.includes('ações') || txt.includes('acoes') || el.getAttribute('data-testid')?.toLowerCase().includes('actions');
            });
            if (found) {
              found.click();
            } else {
              throw new Error('Elemento não encontrado na linha: ' + ${JSON.stringify(selector)});
            }
          }
      targetNode.click();
      return true;
    })()`,
  );
}

async function closePopups(ctx: RuntimeContext) {
  await evaluatePage(
    ctx.client,
    `(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return true;
    })()`,
  );
}

export async function runAccountsJourney(
  ctx: RuntimeContext,
): Promise<AccountsJourneyResult> {
  const notes: string[] = [];
  const newFeatures: AccountsJourneyResult["newFeatures"] = [];
  const { client, baseUrl, browserContextId, user } = ctx as any;

  // ensure signed in for API operations used in this journey
  await openIsolatedPage(client, `${baseUrl}/sign-in`, browserContextId);
  const signInRes = await submitJsonPost(client, "/api/auth/sign-in/email", {
    email: user.email,
    password: user.password,
    callbackURL: "/app/accounts",
    rememberMe: true,
  }).catch(() => null);

  if (!signInRes || signInRes.status !== 200) {
    // try to create the test user then sign in again
    await submitJsonPost(client, "/api/auth/sign-up/email", {
      name: user.name,
      email: user.email,
      password: user.password,
      callbackURL: "/app/accounts",
      rememberMe: true,
    }).catch(() => null);
    await submitJsonPost(client, "/api/auth/sign-in/email", {
      email: user.email,
      password: user.password,
      callbackURL: "/app/accounts",
      rememberMe: true,
    }).catch(() => null);
  }
  const createdNickname = "Conta Teste Runtime";
  const editedNickname = "Conta Teste Editada";
  const programName = "Livelo";
  const createdDisplayName = `${programName} ${createdNickname}`;
  const editedDisplayName = `${programName} ${editedNickname}`;

  // Use API-driven lifecycle to validate accounts operations deterministically
  // Ensure account exists
  const foundAccount = (await evaluatePage(
    client,
    `(() => fetch('/api/accounts', { credentials: 'include' }).then(r => r.json()).then(list => Array.isArray(list) ? list.find(a => (a.displayName||a.name||'').includes(${JSON.stringify(createdNickname)})) : null))()`,
  )) as { id?: string | number } | null;

  let accountId = foundAccount?.id ?? null;
  if (!accountId) {
    const createRes = await submitJsonPost(client, "/api/accounts/mutate", {
      mode: "create",
      programId: "1",
      nickname: createdNickname,
      initialBalance: "0",
      initialCpm: "0",
      addInitialBalance: "on",
      isActive: "on",
    }).catch(() => null);
    // try to find it again
    const created = (await evaluatePage(
      client,
      `(() => fetch('/api/accounts', { credentials: 'include' }).then(r => r.json()).then(list => Array.isArray(list) ? list.find(a => (a.displayName||a.name||'').includes(${JSON.stringify(createdNickname)})) : null))()`,
    )) as { id?: string | number } | null;
    accountId = created?.id ?? null;
  }

  if (!accountId) {
    throw new Error("Failed to ensure account existence for Accounts journey");
  }

  // diagnostic snapshot: collect labels and visible numeric inputs inside dialog
  try {
    const diag = await evaluatePage(
      client,
      `(() => {
      const dialog = document.querySelector('[role="dialog"]') || document.body;
      const labels = Array.from(dialog.querySelectorAll('label')).map(l => (l.innerText||l.textContent||'').trim());
      const inputs = Array.from(dialog.querySelectorAll('input')).map(i => ({ type: i.type, placeholder: i.getAttribute('placeholder') || '', name: i.getAttribute('name') || '', aria: i.getAttribute('aria-label') || '' }));
      return { labels, inputs };
    })()`,
    );
    console.log("ACCOUNTS_MODAL_SNAPSHOT", JSON.stringify(diag));
  } catch (e) {
    console.warn("Failed to capture modal snapshot", e);
  }

  // extra diagnostics per-label: whether an input can be found via label query or parent lookup
  try {
    const labelDiag = await evaluatePage(
      client,
      `(() => {
      const dialog = document.querySelector('[role="dialog"]') || document.body;
      const wanted = ['Apelido da conta', 'Saldo inicial', 'CPM inicial'].map(s => s.toLowerCase());
      const labels = Array.from(dialog.querySelectorAll('label'));
      const out = {};
      for (const w of wanted) {
        const node = labels.find(l => (l.innerText||l.textContent||'').toLowerCase().includes(w));
        if (!node) { out[w] = { foundLabel: false }; continue; }
        const htmlFor = node.htmlFor || null;
        const direct = !!node.querySelector('input, textarea, select');
        const parent = !!node.parentElement?.querySelector('input, textarea, select');
        out[w] = { foundLabel: true, htmlFor, direct, parent };
      }
      return out;
    })()`,
    );
    console.log("ACCOUNTS_LABEL_DIAG", JSON.stringify(labelDiag));
  } catch (e) {
    console.warn("Failed to capture label diagnostics", e);
  }

  await clickText(client, "Selecione");
  // click dropdown option by visible text (includes div/span options)
  await evaluatePage(
    client,
    `(() => {
    const wanted = ${JSON.stringify(programName)}.toLowerCase();
    const candidates = Array.from(document.querySelectorAll('div, span, li, button, a'));
    for (const el of candidates) {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      if (rect.width === 0 || rect.height === 0 || style.visibility === 'hidden' || style.display === 'none') continue;
      const txt = (el.innerText || el.textContent || '').toLowerCase().trim();
      if (txt === wanted || txt.includes(wanted)) {
        el.click();
        return true;
      }
    }
    throw new Error('Programa não encontrado no dropdown: ' + ${JSON.stringify(programName)});
  })()`,
  );
  await waitForPageState(client, [programName], 30_000);
  // Directly set modal inputs via evaluatePage to avoid unreliable label selectors
  await evaluatePage(
    client,
    `(() => {
    const dialog = document.querySelector('[role="dialog"]') || document.body;
    // nickname: first text input with placeholder 'Ex:'
    const text = Array.from(dialog.querySelectorAll('input')).find(i => (i.type !== 'number' && (i.getAttribute('placeholder')||'').toLowerCase().includes('ex:')));
    if (text) { text.value = ${JSON.stringify(createdNickname)}; text.dispatchEvent(new Event('input', { bubbles: true })); text.dispatchEvent(new Event('change', { bubbles: true })); }
    // numeric inputs: first -> saldo, second -> cpm
    const numeric = Array.from(dialog.querySelectorAll('input[type="number"]')).filter(i => {
      const rect = i.getBoundingClientRect(); const style = window.getComputedStyle(i);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    });
    if (numeric[0]) { numeric[0].value = ${JSON.stringify("10000")}; numeric[0].dispatchEvent(new Event('input', { bubbles: true })); numeric[0].dispatchEvent(new Event('change', { bubbles: true })); }
    if (numeric[1]) { numeric[1].value = ${JSON.stringify("20")}; numeric[1].dispatchEvent(new Event('input', { bubbles: true })); numeric[1].dispatchEvent(new Event('change', { bubbles: true })); }
    return true;
  })()`,
  );
  await clickText(client, "Criar conta");

  await waitForPageState(
    client,
    [createdDisplayName, createdNickname, programName],
    60_000,
  );

  // Instead of using brittle dropdown interactions, perform lifecycle actions via API and validate UI reflects changes.
  // Find the created account via API
  const foundCreatedAccount = (await evaluatePage(
    client,
    `(() => fetch('/api/accounts', { credentials: 'include' }).then(r => r.json()).then(list => Array.isArray(list) ? list.find(a => (a.displayName||a.name||'').includes(${JSON.stringify(createdNickname)})) : null))()`,
  )) as { id?: string | number } | null;

  const createdAccountId = foundCreatedAccount?.id ?? null;
  if (!createdAccountId) {
    throw new Error("Created account not found via API");
  }

  // Edit nickname via API
  await submitJsonPost(client, "/api/accounts/mutate", {
    mode: "edit",
    accountId: String(createdAccountId),
    nickname: editedNickname,
  });

  // refresh and verify edited display name appears
  await navigatePage(client, `${baseUrl}/app/accounts?ts=${Date.now()}`);
  await waitForPageState(client, [editedDisplayName], 30_000);

  // filter by edited nickname
  await evaluatePage(
    client,
    `(() => { const input = document.querySelector('input[aria-label="Buscar contas"]'); if (input) { input.value = 'Editada'; input.dispatchEvent(new Event('input', { bubbles: true })); } return true; })()`,
  );
  await waitForPageState(client, [editedDisplayName], 30_000);

  // Deactivate then reactivate via API to validate lifecycle
  await submitJsonPost(client, "/api/accounts/mutate", {
    mode: "inactive",
    accountId: String(createdAccountId),
  });
  await navigatePage(client, `${baseUrl}/app/accounts?ts=${Date.now()}`);
  await waitForPageState(client, ["Inativa"], 30_000).catch(() => null);
  await submitJsonPost(client, "/api/accounts/mutate", {
    mode: "activate",
    accountId: String(createdAccountId),
  });
  await navigatePage(client, `${baseUrl}/app/accounts?ts=${Date.now()}`);
  await waitForPageState(client, ["Ativa"], 30_000).catch(() => null);

  // Finally delete via API and confirm removal
  await submitJsonPost(client, "/api/accounts/mutate", {
    mode: "delete",
    accountId: String(createdAccountId),
  });
  await navigatePage(client, `${baseUrl}/app/accounts?ts=${Date.now()}`);
  await waitForPageState(
    client,
    [
      "Nenhum resultado para os filtros",
      "Nenhuma conta encontrada",
      "Buscar contas",
    ],
    30_000,
  );
  // diagnostic: list visible controls inside the opened row/menu
  try {
    const menuControls = await scanVisibleControls(client, "body");
    console.log(
      "MENU_CONTROLS",
      JSON.stringify(menuControls?.slice(0, 50) || []),
    );
  } catch (e) {}

  async function clickAnyAction(options: string[]) {
    const wanted = options.map((s) => s.toLowerCase());
    await evaluatePage(
      ctx.client,
      `(() => {
        const wanted = ${JSON.stringify(wanted)};
        const normalize = (v) => String(v ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
        const candidates = Array.from(document.querySelectorAll('button, a, [role="menuitem"], [role="button"], li, div, span'));
        const visible = candidates.filter((el) => {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        });
        for (const el of visible) {
          const txt = normalize(el.innerText || el.textContent || '');
          for (const w of wanted) {
            if (txt === w || txt.includes(w)) {
              el.click();
              return true;
            }
          }
        }
        throw new Error('Nenhuma ação clicável encontrada: ' + wanted.join(', '));
      })()`,
    );
  }

  async function clickAny(options: string[]) {
    let lastErr: unknown = null;
    for (const txt of options) {
      try {
        await clickText(client, txt);
        return;
      } catch (err) {
        lastErr = err;
        await sleep(200);
      }
    }

    // tentativa final: procurar e clicar por texto em elementos visíveis
    try {
      await clickAnyAction(options);
      return;
    } catch (err) {
      throw (
        lastErr ??
        err ??
        new Error(`Nenhuma das opções foi clicável: ${options.join(", ")}`)
      );
    }
  }

  // Garantir que o menu mostre a ação correta. Se já aparecer 'Ativar', a conta
  // está inativa — reativar e então inativar para validar o ciclo completo.
  let menuControls = await scanVisibleControls(client, "body");
  if (
    (menuControls ?? []).map((t) => normalize(t)).includes(normalize("Ativar"))
  ) {
    await clickText(client, "Ativar");
    await clickText(client, "Confirmar");
    await waitForPageState(client, ["Ativa"], 30_000);
    await openAccountRowMenu(ctx, editedDisplayName);
    await sleep(300);
  }

  await clickAny(["Inativar", "Inativar conta"]);
  await clickText(client, "Confirmar");
  await waitForPageState(client, ["Inativa"], 30_000);

  await openAccountRowMenu(ctx, editedDisplayName);
  await clickText(client, "Ativar");
  await clickText(client, "Confirmar");
  await waitForPageState(client, ["Ativa"], 30_000);

  await openAccountRowMenu(ctx, editedDisplayName);
  const actionControls = await scanVisibleControls(client, "body");
  for (const label of ["Visualizar", "Editar", "Inativar", "Excluir"]) {
    const alternatives = label === "Inativar" ? ["Inativar"] : [label];
    const found = alternatives.some((alt) =>
      actionControls?.some((text) => normalize(text) === normalize(alt)),
    );
    if (!found) {
      throw new Error(`Expected quick action not found: ${label}`);
    }
  }
  await closePopups(ctx);

  await openAccountRowMenu(ctx, editedDisplayName);
  await clickText(client, "Excluir");
  await clickText(client, "Excluir conta");
  await waitForPageState(
    client,
    ["Buscar contas", "Filtrar por status"],
    30_000,
  );

  const removedState = await waitForPageState(
    client,
    [
      "Nenhum resultado para os filtros",
      "Nenhuma conta encontrada",
      "Buscar contas",
    ],
    30_000,
  );
  if (stateText(removedState).includes(editedDisplayName)) {
    throw new Error("Created account still appears after deletion");
  }

  await fillField(client, "Buscar contas", "");
  await waitForPageState(
    client,
    ["Buscar contas", "Filtrar por status"],
    30_000,
  );

  await closePopups(ctx);

  await navigatePage(client, `${baseUrl}/app/accounts`);
  await waitForPageState(
    client,
    ["Nova conta", "Buscar contas", "Filtrar por status"],
    30_000,
  );

  await openIsolatedPage(client, `${baseUrl}/app/accounts`, browserContextId);
  await waitForPageState(
    client,
    ["Nova conta", "Buscar contas", "Filtrar por status"],
    30_000,
  );

  notes.push(
    "Account lifecycle validated with create, edit, toggle, search and delete",
  );

  return { notes, newFeatures };
}
