import { useContext } from "react";
import WorkspaceContext from "../context/workspaceContextObject";

export function useWorkspaceContext() {
  const value = useContext(WorkspaceContext);
  if (!value) {
    throw new Error("useWorkspaceContext must be used within a WorkspaceProvider.");
  }
  return value;
}

export function useWorkspaceSelector(selector) {
  if (typeof selector !== "function") {
    throw new Error("useWorkspaceSelector requires a selector function.");
  }
  return selector(useWorkspaceContext());
}
