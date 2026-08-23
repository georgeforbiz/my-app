const DEFAULT_ADMIN_QUERY_TIMEOUT_MS = 2_500;

export class AdminQueryTimeoutError extends Error {
  constructor() {
    super("Supabase request timed out.");
    this.name = "AdminQueryTimeoutError";
  }
}

/** Prevent an unreachable Supabase project from freezing an admin page. */
export async function withAdminTimeout<T>(
  operation: PromiseLike<T>,
  timeoutMs = DEFAULT_ADMIN_QUERY_TIMEOUT_MS
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      Promise.resolve(operation),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new AdminQueryTimeoutError()), timeoutMs);
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
