import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { reportErrorToEndpoint } from "../../utils/errorReporting";

describe("errorReporting", () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = import.meta.env;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  });

  afterEach(() => {
    vi.stubGlobal("fetch", originalFetch);
    Object.assign(import.meta.env, originalEnv);
  });

  it("does not call fetch when VITE_ERROR_REPORT_URL is unset", () => {
    (import.meta.env as { VITE_ERROR_REPORT_URL?: string }).VITE_ERROR_REPORT_URL = "";
    reportErrorToEndpoint({
      message: "test",
      url: "",
      userAgent: "",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("POSTs payload when VITE_ERROR_REPORT_URL is set", async () => {
    (import.meta.env as { VITE_ERROR_REPORT_URL?: string }).VITE_ERROR_REPORT_URL =
      "https://example.com/report";
    reportErrorToEndpoint({
      message: "boom",
      stack: "stack",
      componentStack: "stack2",
      url: "https://app.test/",
      userAgent: "vitest",
    });
    expect(fetch).toHaveBeenCalledWith(
      "https://example.com/report",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
    const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.message).toBe("boom");
    expect(body.stack).toBe("stack");
  });
});
