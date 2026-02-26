import { Suspense, lazy, useEffect, useState } from "react";
import AuthForm from "./components/auth/AuthForm";
import { queryClient } from "./lib/queryClient";
import { supabase } from "./supabaseClient";
import "./App.css";

const TeacherWorkspaceApp = lazy(() => import("./TeacherWorkspaceApp"));
const PASSWORD_RECOVERY_PATH = "/reset-password";

function getInitialAuthMode() {
  if (typeof window === "undefined") return "signin";

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);
  const isRecoveryLink =
    hashParams.get("type") === "recovery" || searchParams.get("type") === "recovery";

  return isRecoveryLink ? "reset" : "signin";
}

function WorkspaceFallback() {
  return (
    <section className="panel">
      <p className="muted">Loading workspace...</p>
    </section>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [authMode, setAuthMode] = useState(getInitialAuthMode);

  useEffect(() => {
    let isMounted = true;

    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (isMounted) setUser(data.session?.user ?? null);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setAuthMode("reset");
        setStatusMessage("");
      }

      if (!session) {
        queryClient.clear();
      }

      if (event === "SIGNED_OUT") {
        setAuthMode("signin");
      }

      if (isMounted) setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
  };

  const handlePasswordResetComplete = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    setAuthMode("signin");
    if (typeof window !== "undefined") {
      const nextPath =
        window.location.pathname === PASSWORD_RECOVERY_PATH ? "/" : window.location.pathname;
      window.history.replaceState({}, document.title, nextPath);
    }
  };

  const showRecovery = authMode === "reset";

  return (
    <div className="page">
      {statusMessage && <div className="status">{statusMessage}</div>}
      {user && !showRecovery ? (
        <Suspense fallback={<WorkspaceFallback />}>
          <TeacherWorkspaceApp user={user} onSignOut={handleSignOut} />
        </Suspense>
      ) : (
        <AuthForm
          onSuccess={setStatusMessage}
          forcedMode={showRecovery ? "reset" : undefined}
          onPasswordResetComplete={handlePasswordResetComplete}
        />
      )}
    </div>
  );
}

export default App;
