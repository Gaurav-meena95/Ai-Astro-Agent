import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";

function App() {
  const { token, isOnboarded, fetchProfile } = useAuthStore();

  useEffect(() => {
    if (token) {
      fetchProfile().catch(() => {});
    }
  }, [token, fetchProfile]);

  if (!token) return <AuthPage />;
  if (!isOnboarded) return <OnboardingPage />;
  return <DashboardPage />;
}

export default App;
