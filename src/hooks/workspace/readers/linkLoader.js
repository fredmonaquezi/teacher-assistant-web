const USEFUL_LINK_COLUMNS = [
  "id",
  "title",
  "url",
  "description",
  "sort_order",
  "created_at",
  "updated_at",
].join(",");

export async function loadLinkWorkspaceRows(supabaseClient) {
  const { data: linkRows, error: linkError } = await supabaseClient
    .from("useful_links")
    .select(USEFUL_LINK_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return {
    rows: {
      linkRows: linkRows ?? [],
    },
    errors: {
      linkError,
    },
  };
}
