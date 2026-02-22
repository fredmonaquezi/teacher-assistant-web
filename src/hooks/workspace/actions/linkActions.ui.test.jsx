import { expect, test, vi } from "vitest";
import createLinkActions from "./linkActions";

vi.mock("../../../supabaseClient", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

test("rejects link creation when URL is not https", async () => {
  const setFormError = vi.fn();
  const actions = createLinkActions({
    usefulLinks: [],
    setUsefulLinks: vi.fn(),
    setFormError,
    refreshUsefulLinksData: vi.fn(),
  });

  const didCreate = await actions.handleCreateUsefulLink({
    title: "Portal",
    url: "http://insecure.example.com",
    description: "invalid protocol",
  });

  expect(didCreate).toBe(false);
  expect(setFormError).toHaveBeenLastCalledWith("URL must start with https://");
});
