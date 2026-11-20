import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { supabase } from "@/infrastructure/database/supabaseClient";
import { useTransactionsQuery } from "@/presentation/hooks/useTransactionsQuery";

vi.mock("@/infrastructure/database/supabaseClient", () => ({
  supabase: { from: vi.fn() },
}));

it("paginates past a server cap and isolates old rows when a different user signs in", async () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const sameDay = "2026-11-20";
  const fixtures = Array.from({ length: 1002 }, (_, index) => ({
    id: String(1002 - index).padStart(4, "0"),
    date: sameDay,
    amount: 1,
  }));
  const requests: string[] = [];
  vi.mocked(supabase.from).mockImplementation(() => {
    let account = "";
    let cursor: string | undefined;
    const builder = {
      select: () => builder,
      eq: (_column: string, id: string) => { account = id; return builder; },
      gte: () => builder,
      order: () => builder,
      limit: () => builder,
      abortSignal: () => builder,
      or: (condition: string) => { cursor = /id\.lt\.(\d+)/.exec(condition)?.[1]; return builder; },
      then: (resolve: (result: unknown) => void) => {
        requests.push(account);
        const data = account === "first"
          ? fixtures.filter(({ id }) => !cursor || id < cursor).slice(0, 300)
          : [];
        resolve({ data, error: null });
      },
    };
    return builder as unknown as ReturnType<typeof supabase.from>;
  });

  const { result, rerender } = renderHook(({ userId }) => useTransactionsQuery(userId), {
    initialProps: { userId: "first" }, wrapper,
  });
  await waitFor(() => expect(result.current.data).toHaveLength(1002));
  expect(new Set(result.current.data!.map(({ id }) => id)).size).toBe(1002);
  expect(requests).toEqual(Array(5).fill("first"));

  rerender({ userId: "second" });
  expect(result.current.data).toBeUndefined();
  await waitFor(() => expect(result.current.data).toEqual([]));
  expect(requests.at(-1)).toBe("second");
});
