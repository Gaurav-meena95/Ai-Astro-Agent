import React, { useEffect } from "react";
import { useAuthStore } from "./store/authStore";
import { AuthPage } from "./features/auth/AuthPage";
import { OnboardingPage } from "./features/onboarding/OnboardingPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { Loader2 } from "lucide-react";

export const App: React.FC = () => {
  const { isAuthenticated, isOnboarded, fetchProfile, isLoading } = useAuthStore();

  // On initial mount, fetch the profile if the user already has a saved token in localStorage
  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated, fetchProfile]);

  if (isLoading && !isOnboarded) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-space-950 text-gray-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        <span className="text-xs uppercase font-bold tracking-widest text-purple-400 animate-pulse">
          Aligning Cosmic Vectors...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  if (!isOnboarded) {
    return <OnboardingPage />;
  }

  return <DashboardPage />;
};

export default App;
