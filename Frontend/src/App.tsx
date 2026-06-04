import { useState, useEffect } from "react";
import { useAuthStore } from "./store/authStore";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";

type View = "landing" | "auth" | "onboarding" | "dashboard";

export default function App() {
  const { token, isOnboarded, fetchProfile } = useAuthStore();
  const [view, setView] = useState<View>("landing");
  const [isLoadingProfile, setIsLoadingProfile] = useState(!!token);

  useEffect(() => {
    if (token) {
      setIsLoadingProfile(true);
      fetchProfile()
        .catch((err) => {
          if (err.response?.status === 401) {
            useAuthStore.getState().logout();
          }
        })
        .finally(() => {
          setIsLoadingProfile(false);
        });
    } else {
      setIsLoadingProfile(false);
    }
  }, [token, fetchProfile]);

  useEffect(() => {
    if (isLoadingProfile) return;
    if (!token) {
      setView("landing");
      return;
    }
    if (isOnboarded) setView("dashboard");
    else setView("onboarding");
  }, [token, isOnboarded, isLoadingProfile]);

  if (isLoadingProfile) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        color: "var(--gold)",
        fontFamily: "Cinzel",
        fontSize: "16px",
        gap: "12px",
        letterSpacing: "2px"
      }}>
        <div style={{ fontSize: "28px", animation: "shimmer 2s infinite" }}>✦</div>
        <span>CONNECTING TO ALIGNMENTS...</span>
      </div>
    );
  }

  if (view === "landing") {
    return (
      <>
        <div className="stars-bg" />
        <LandingPage onGetStarted={() => setView("auth")} />
      </>
    );
  }
  if (view === "auth") {
    return (
      <>
        <div className="stars-bg" />
        <AuthPage onSuccess={() => {
          const onboarded = useAuthStore.getState().isOnboarded;
          setView(onboarded ? "dashboard" : "onboarding");
        }} />
      </>
    );
  }
  if (view === "onboarding") {
    return (
      <>
        <div className="stars-bg" />
        <OnboardingPage onComplete={() => setView("dashboard")} />
      </>
    );
  }
  return (
    <>
      <div className="stars-bg" />
      <DashboardPage />
    </>
  );
}
