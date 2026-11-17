const TIMEOUT_MS = 6_000;

export function supabaseFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const userSignal = init?.signal;
  if (userSignal) {
    if (userSignal.aborted) controller.abort();
    else userSignal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  return fetch(input, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timer);
  });
}

export function isAuthNetworkError(message: string | undefined) {
  return /fetch failed|failed to fetch|timeout|aborted|network|ENOTFOUND|ECONN|UND_ERR|could not resolve/i.test(
    message ?? "",
  );
}
