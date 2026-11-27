const UPDATE_TIMEOUT_MS = 30_000;

function waitForActivation(worker: ServiceWorker, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const onStateChange = () => {
      if (worker.state === "activated") {
        worker.removeEventListener("statechange", onStateChange);
        resolve();
      } else if (worker.state === "redundant") {
        worker.removeEventListener("statechange", onStateChange);
        reject(new Error("The app update could not be installed."));
      }
    };

    worker.addEventListener("statechange", onStateChange, { signal });
    onStateChange();
  });
}

async function prepareUpdate(signal: AbortSignal) {
  const base = new URL(import.meta.env.BASE_URL, window.location.origin);
  const registration = await navigator.serviceWorker?.getRegistration(base.href);
  if (registration?.scope === base.href) {
    // Workbox activates the new worker after it finishes precaching the app.
    const previousActive = registration.active;
    const pending = registration.installing ?? registration.waiting;
    await registration.update();
    const active = registration.active;
    const worker = registration.installing ?? registration.waiting
      ?? (active !== previousActive ? active : pending) ?? active;
    if (worker) await waitForActivation(worker, signal);
    return;
  }

  // Check connectivity before leaving the current page in browsers without a worker.
  const page = new URL("index.html", base);
  page.searchParams.set("nix-update", String(Date.now()));
  const response = await fetch(page, { cache: "no-store", signal });
  if (!response.ok) throw new Error("The app could not be reached.");
}

export async function refreshWebVersion(): Promise<void> {
  const abort = new AbortController();
  const timeout = window.setTimeout(() => abort.abort(), UPDATE_TIMEOUT_MS);
  const cancelled = new Promise<never>((_, reject) => {
    abort.signal.addEventListener("abort", () => reject(abort.signal.reason), { once: true });
  });

  try {
    await Promise.race([prepareUpdate(abort.signal), cancelled]);
  } finally {
    window.clearTimeout(timeout);
    abort.abort();
  }

  const current = new URL(window.location.href);
  current.searchParams.set("nix-update", String(Date.now()));
  window.location.replace(current.href);
}
