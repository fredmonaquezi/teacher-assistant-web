import { supabase } from "../../../supabaseClient";
import { applyOptimisticState, runOptimisticMutation } from "./mutationHelpers";

const HTTPS_URL_REGEX = /^https:\/\/.+/i;

function isHttpsUrl(value) {
  if (typeof value !== "string") return false;
  return HTTPS_URL_REGEX.test(value.trim());
}

function createLinkActions({
  usefulLinks,
  setUsefulLinks,
  setFormError,
  refreshUsefulLinksData,
}) {
  const createTempId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const handleCreateUsefulLink = async ({ title, url, description }) => {
    const normalizedTitle = (title || "").trim();
    const normalizedUrl = (url || "").trim();
    const normalizedDescription = (description || "").trim();

    if (!normalizedTitle) {
      setFormError("Link title is required.");
      return false;
    }
    if (!isHttpsUrl(normalizedUrl)) {
      setFormError("URL must start with https://");
      return false;
    }

    const maxSortOrder = usefulLinks.reduce(
      (maxValue, item) => Math.max(maxValue, Number(item.sort_order ?? -1)),
      -1
    );
    const payload = {
      title: normalizedTitle,
      url: normalizedUrl,
      description: normalizedDescription || null,
      sort_order: maxSortOrder + 1,
    };
    const nowIso = new Date().toISOString();
    const optimisticLink = {
      ...payload,
      id: createTempId("useful-link"),
      created_at: nowIso,
      updated_at: nowIso,
    };

    return runOptimisticMutation({
      setFormError,
      applyOptimistic: () =>
        applyOptimisticState(setUsefulLinks, (currentLinks) => [...currentLinks, optimisticLink]),
      execute: () => supabase.from("useful_links").insert(payload),
      refresh: refreshUsefulLinksData,
      fallbackErrorMessage: "Failed to create useful link.",
    });
  };

  const handleUpdateUsefulLink = async (linkId, { title, url, description }) => {
    if (!linkId) return false;
    const normalizedTitle = (title || "").trim();
    const normalizedUrl = (url || "").trim();
    const normalizedDescription = (description || "").trim();

    if (!normalizedTitle) {
      setFormError("Link title is required.");
      return false;
    }
    if (!isHttpsUrl(normalizedUrl)) {
      setFormError("URL must start with https://");
      return false;
    }

    const payload = {
      title: normalizedTitle,
      url: normalizedUrl,
      description: normalizedDescription || null,
      updated_at: new Date().toISOString(),
    };

    return runOptimisticMutation({
      setFormError,
      applyOptimistic: () =>
        applyOptimisticState(setUsefulLinks, (currentLinks) =>
          currentLinks.map((link) => (link.id === linkId ? { ...link, ...payload } : link))
        ),
      execute: () => supabase.from("useful_links").update(payload).eq("id", linkId),
      refresh: refreshUsefulLinksData,
      fallbackErrorMessage: "Failed to update useful link.",
    });
  };

  const handleDeleteUsefulLink = async (linkId) => {
    if (!linkId) return false;

    return runOptimisticMutation({
      setFormError,
      applyOptimistic: () =>
        applyOptimisticState(setUsefulLinks, (currentLinks) =>
          currentLinks.filter((link) => link.id !== linkId)
        ),
      execute: () => supabase.from("useful_links").delete().eq("id", linkId),
      refresh: refreshUsefulLinksData,
      fallbackErrorMessage: "Failed to delete useful link.",
    });
  };

  const handleSwapUsefulLinkSortOrder = async (links, draggedId, targetId) => {
    if (!Array.isArray(links) || !draggedId || !targetId || draggedId === targetId) return false;

    const fromIndex = links.findIndex((item) => item.id === draggedId);
    const toIndex = links.findIndex((item) => item.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return false;

    const reordered = [...links];
    const [movedLink] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, movedLink);

    const reorderedWithSortOrder = reordered.map((item, index) => ({
      ...item,
      sort_order: index,
    }));

    const changedUpdates = reorderedWithSortOrder
      .map((item) => ({
        id: item.id,
        sort_order: item.sort_order,
      }))
      .filter((update) => {
        const original = links.find((item) => item.id === update.id);
        return Number(original?.sort_order ?? 0) !== update.sort_order;
      });

    if (!changedUpdates.length) return true;

    return runOptimisticMutation({
      setFormError,
      applyOptimistic: () => applyOptimisticState(setUsefulLinks, () => reorderedWithSortOrder),
      execute: async () => {
        const updateResults = await Promise.all(
          changedUpdates.map((update) =>
            supabase
              .from("useful_links")
              .update({
                sort_order: update.sort_order,
                updated_at: new Date().toISOString(),
              })
              .eq("id", update.id)
          )
        );
        const firstError = updateResults.find((result) => result?.error)?.error;
        return firstError ? { error: firstError } : { data: true };
      },
      refresh: refreshUsefulLinksData,
      fallbackErrorMessage: "Failed to reorder useful links.",
    });
  };

  return {
    handleCreateUsefulLink,
    handleUpdateUsefulLink,
    handleDeleteUsefulLink,
    handleSwapUsefulLinkSortOrder,
  };
}

export default createLinkActions;
