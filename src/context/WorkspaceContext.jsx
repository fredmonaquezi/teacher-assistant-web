import WorkspaceContext from "./workspaceContextObject";

export function WorkspaceProvider({ value, children }) {
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
