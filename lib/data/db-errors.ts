/**
 * Helper to detect Postgres 'relation does not exist' errors (42P01).
 * Use in development fallbacks only — do not swallow other errors in production.
 */
export function isMissingRelationError(err: any): boolean {
  return !!(
    err &&
    (err.code === "42P01" || /relation .* does not exist/i.test(err.message))
  );
}

export default { isMissingRelationError };
