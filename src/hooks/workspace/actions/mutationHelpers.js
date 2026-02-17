function resolveError(resultOrError, fallbackErrorMessage) {
  const directError = resultOrError?.error;
  if (directError) {
    return directError;
  }
  if (resultOrError instanceof Error) {
    return resultOrError;
  }
  return new Error(fallbackErrorMessage);
}

export function applyOptimisticState(setState, updater) {
  let snapshot;
  let hasSnapshot = false;

  setState((currentState) => {
    snapshot = currentState;
    hasSnapshot = true;
    return updater(currentState);
  });

  return () => {
    if (hasSnapshot) {
      setState(snapshot);
    }
  };
}

export async function runMutation({
  setFormError,
  execute,
  refresh,
  onError,
  fallbackErrorMessage = "Operation failed.",
}) {
  if (typeof setFormError === "function") {
    setFormError("");
  }

  try {
    const result = await execute();
    if (result?.error) {
      const error = resolveError(result, fallbackErrorMessage);
      if (typeof onError === "function") {
        onError(error);
      }
      if (typeof setFormError === "function") {
        setFormError(error.message || fallbackErrorMessage);
      }
      return false;
    }

    if (typeof refresh === "function") {
      await refresh();
    }

    return true;
  } catch (thrownError) {
    const error = resolveError(thrownError, fallbackErrorMessage);
    if (typeof onError === "function") {
      onError(error);
    }
    if (typeof setFormError === "function") {
      setFormError(error.message || fallbackErrorMessage);
    }
    return false;
  }
}

export async function runOptimisticMutation({
  setFormError,
  applyOptimistic,
  execute,
  refresh,
  onError,
  fallbackErrorMessage = "Operation failed.",
}) {
  let rollback;
  return runMutation({
    setFormError,
    execute: async () => {
      if (typeof applyOptimistic === "function") {
        rollback = applyOptimistic();
      }
      return execute();
    },
    refresh,
    onError: (error) => {
      if (typeof rollback === "function") {
        rollback();
      }
      if (typeof onError === "function") {
        onError(error);
      }
    },
    fallbackErrorMessage,
  });
}
