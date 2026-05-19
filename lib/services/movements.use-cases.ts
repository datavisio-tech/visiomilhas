import createDrizzleMovementsRepo from "../repositories/movements.drizzle-repo";
import createMovementService from "./movements";

/**
 * Camada de orquestração (use-cases) para integrar o service puro de movimentos
 * com o MovementsRepo concreto (Drizzle). Todas as operações compostas são
 * executadas dentro de `runInTransaction` para garantir atomicidade.
 */

function getRepoOrDefault(repo?: any) {
  // se repo foi injetado (por testes), use-o; caso contrário, crie um repo Drizzle
  return repo ?? createDrizzleMovementsRepo();
}

export async function acquireMilesUseCase(input: any, repo?: any) {
  const r = getRepoOrDefault(repo);
  return r.runInTransaction(async (tx: any) => {
    // If tx already implements MovementsRepo (tests/mocks may pass the repo), use it directly
    const txRepo = tx && typeof tx.insertEntry === "function" ? tx : createDrizzleMovementsRepo(tx);
    const svc = createMovementService(txRepo);
    return svc.acquireMiles(input);
  });
}

export async function consumeMilesUseCase(input: any, repo?: any) {
  const r = getRepoOrDefault(repo);
  return r.runInTransaction(async (tx: any) => {
    const txRepo = tx && typeof tx.insertEntry === "function" ? tx : createDrizzleMovementsRepo(tx);
    const svc = createMovementService(txRepo);
    return svc.consumeMiles(input);
  });
}

export async function transferMilesUseCase(input: any, repo?: any) {
  const r = getRepoOrDefault(repo);
  return r.runInTransaction(async (tx: any) => {
    const txRepo = tx && typeof tx.insertEntry === "function" ? tx : createDrizzleMovementsRepo(tx);
    const svc = createMovementService(txRepo);
    return svc.transferMiles(input);
  });
}

const exported = {
  acquireMilesUseCase,
  consumeMilesUseCase,
  transferMilesUseCase,
};

export default exported;
