import React, { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { Sparkles, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, signup, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    if (isLogin) {
      await login(email, password);
    } else {
      await signup(email, password);
    }
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setPassword("");
    clearError();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-space-950 px-4 relative overflow-hidden">
      {/* Decorative ambient glowing orbits */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-900/15 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-md glass-card rounded-2xl p-8 shadow-2xl relative border border-purple-500/15">
        
        {/* Banner Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-900/50 mb-3 animate-pulse">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Astro<span className="text-purple-400">Agent</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1 text-center">
            Conversational Vedic Intelligence & Celestial Placements
          </p>
        </div>

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 text-sm rounded-lg bg-red-950/50 border border-red-500/20 text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-500" />
              </span>
              <input
                type="email"
                required
                className="block w-full pl-10 pr-3 py-2.5 rounded-lg bg-space-900 border border-purple-900/30 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-transparent text-sm transition-all"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-500" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                className="block w-full pl-10 pr-10 py-2.5 rounded-lg bg-space-900 border border-purple-900/30 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-transparent text-sm transition-all"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-purple-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-950/40"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>{isLogin ? "Sign In" : "Create Account"}</span>
            )}
          </button>
        </form>

        {/* Toggle Account Creation */}
        <div className="mt-6 text-center text-sm">
          <span className="text-gray-400">
            {isLogin ? "New to AstroAgent?" : "Already have an account?"}
          </span>{" "}
          <button
            onClick={handleToggleMode}
            disabled={isLoading}
            className="text-purple-400 font-semibold hover:text-purple-300 hover:underline transition-all"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </div>

      </div>
    </div>
  );
};
