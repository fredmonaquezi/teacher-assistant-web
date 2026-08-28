import { Suspense, lazy, useEffect, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { supabase } from "./supabaseClient";
import { APP_PATHS, isTeacherAssistantPath } from "./config/paths";
import LandingPage from "./pages/LandingPage";

const AuthForm = lazy(() => import("./components/auth/AuthForm"));
const TeacherWorkspaceApp = lazy(() => import("./TeacherWorkspaceApp"));
const LEGACY_PASSWORD_RECOVERY_PATH = "/reset-password";

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
      const nextPath = [
        APP_PATHS.teacherAssistantResetPassword,
        LEGACY_PASSWORD_RECOVERY_PATH,
      ].includes(window.location.pathname)
        ? APP_PATHS.teacherAssistantHome
        : window.location.pathname;
      window.history.replaceState({}, document.title, nextPath);
    }
  };

  const showRecovery = authMode === "reset";
  const pathname = typeof window === "undefined" ? APP_PATHS.home : window.location.pathname;
  const showTeacherAssistant =
    isTeacherAssistantPath(pathname) || pathname === LEGACY_PASSWORD_RECOVERY_PATH;

  if (!showTeacherAssistant) {
    return <LandingPage user={user} />;
  }

  return (
    <div className="page teacher-assistant-page">
      {user && !showRecovery ? (
          <Suspense fallback={<WorkspaceFallback />}>
            <TeacherWorkspaceApp user={user} onSignOut={handleSignOut} />
          </Suspense>
        ) : (
          <div className="auth-page-shell">
            <a className="auth-home-link" href={APP_PATHS.home}>← Teacher Codex</a>
            {statusMessage && <div className="status">{statusMessage}</div>}
            <Suspense fallback={<WorkspaceFallback />}>
              <AuthForm
                onSuccess={setStatusMessage}
                forcedMode={showRecovery ? "reset" : undefined}
                onPasswordResetComplete={handlePasswordResetComplete}
              />
            </Suspense>
          </div>
        )}
    </div>
  );
}

export default App;
