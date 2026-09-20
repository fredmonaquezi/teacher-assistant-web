import { beforeEach, expect, test, vi } from "vitest";
import { useQuery } from "@tanstack/react-query";
import useFeatureQuery from "./useFeatureQuery";

vi.mock("react", () => ({
  useCallback: (callback) => callback,
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test("exposes a repository error with safe empty data", () => {
  const repositoryError = new Error("Database unavailable");
  useQuery.mockReturnValue({
    data: undefined,
    error: repositoryError,
    isError: true,
    refetch: vi.fn(),
  });

  const result = useFeatureQuery({
    queryKey: ["failure-test"],
    queryFn: vi.fn(),
    enabled: true,
    emptyData: [],
    errorMessage: "Could not load records.",
  });

  expect(result.data).toEqual([]);
  expect(result.errorMessage).toBe("Database unavailable");
  expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({
    queryKey: ["failure-test"],
    enabled: true,
  }));
});

test("uses the feature fallback for an unstructured repository error", () => {
  useQuery.mockReturnValue({
    data: undefined,
    error: { code: "PGRST000" },
    isError: true,
    refetch: vi.fn(),
  });

  const result = useFeatureQuery({
    queryKey: ["fallback-test"],
    queryFn: vi.fn(),
    enabled: true,
    emptyData: { rows: [] },
    errorMessage: "Could not load records.",
  });

  expect(result.data).toEqual({ rows: [] });
  expect(result.errorMessage).toBe("Could not load records.");
});

test("refresh rejects so mutation callers cannot report stale data as success", async () => {
  const refreshError = new Error("Refresh failed");
  useQuery.mockReturnValue({
    data: ["initial"],
    error: null,
    refetch: vi.fn().mockResolvedValue({ error: refreshError }),
  });

  const result = useFeatureQuery({
    queryKey: ["refresh-test"],
    queryFn: vi.fn(),
    enabled: true,
    emptyData: [],
    errorMessage: "Could not load records.",
  });

  await expect(result.refresh()).rejects.toThrow("Refresh failed");
});
