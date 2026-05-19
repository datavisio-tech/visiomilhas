import createDrizzleMovementsRepo from "../repositories/movements.drizzle-repo";
import createMovementService from "./movements";

/**
 * Camada de orquestração (use-cases) para integrar o service puro de movimentos
 * com o MovementsRepo concreto (Drizzle). Todas as operações compostas são
 * executadas dentro de `runInTransaction` para garantir atomicidade.
 */

const defaultRepo = createDrizzleMovementsRepo();

export async function acquireMilesUseCase(input: Parameters<typeof createMovementService>[0] extends any ? any : any, repo = defaultRepo) {
  return repo.runInTransaction(async (tx: any) => {
    const txRepo = createDrizzleMovementsRepo(tx);
    const svc = createMovementService(txRepo);
    return svc.acquireMiles(input);
  });
}

export async function consumeMilesUseCase(input: any, repo = defaultRepo) {
  return repo.runInTransaction(async (tx: any) => {
    const txRepo = createDrizzleMovementsRepo(tx);
    const svc = createMovementService(txRepo);
    return svc.consumeMiles(input);
  });
}

export async function transferMilesUseCase(input: any, repo = defaultRepo) {
  return repo.runInTransaction(async (tx: any) => {
    const txRepo = createDrizzleMovementsRepo(tx);
    const svc = createMovementService(txRepo);
    return svc.transferMiles(input);
  });
}

export default {
  acquireMilesUseCase,
  consumeMilesUseCase,
  transferMilesUseCase,
};
