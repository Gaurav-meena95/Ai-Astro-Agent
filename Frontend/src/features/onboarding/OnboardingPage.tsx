import React, { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { Compass, Calendar, Clock, MapPin, Loader2, LogOut } from "lucide-react";

// Standard reliable sample cities to guarantee fast, zero-delay online/offline geocoding matches
const COMMON_CITIES = [
  "New Delhi",
  "London",
  "New York",
  "San Francisco",
  "Tokyo",
  "Sydney",
  "Paris",
  "Berlin",
  "Toronto",
  "Mumbai"
];

export const OnboardingPage: React.FC = () => {
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  
  const { createProfile, isLoading, error, logout } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthDate || !birthTime || !birthPlace) return;
    
    await createProfile(birthDate, birthTime, birthPlace);
  };

  const handleSelectCity = (city: string) => {
    setBirthPlace(city);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-space-950 px-4 relative overflow-hidden">
      {/* Visual glowing nebula background */}
      <div className="absolute top-10 right-10 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header Controls */}
      <button 
        onClick={logout}
        className="absolute top-6 right-6 flex items-center space-x-2 text-xs font-semibold text-gray-400 hover:text-red-400 transition-all border border-purple-500/10 px-3 py-1.5 rounded-lg bg-space-900/40"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Logout</span>
      </button>

      <div className="w-full max-w-lg glass-card rounded-2xl p-8 shadow-2xl relative border border-purple-500/15">
        
        {/* Onboarding Banner */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-purple-950 border border-purple-500/35 flex items-center justify-center mb-3">
            <Compass className="w-5 h-5 text-purple-400 animate-spin" style={{ animationDuration: "12s" }} />
          </div>
          <h2 className="text-xl font-bold text-white">Configure Birth Chart</h2>
          <p className="text-sm text-gray-400 mt-1 text-center max-w-sm">
            Please enter your exact coordinates to align planetary and house cusp transits accurately.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm rounded-lg bg-red-950/50 border border-red-500/20 text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Birth Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Birth Date
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-purple-400" />
                </span>
                <input
                  type="date"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg bg-space-900 border border-purple-900/30 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-transparent text-sm transition-all"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
            </div>

            {/* Birth Time */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Birth Time (Local)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="h-4 w-4 text-purple-400" />
                </span>
                <input
                  type="time"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg bg-space-900 border border-purple-900/30 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-transparent text-sm transition-all"
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Birth Place */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Birth Location (City / Country)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-4 w-4 text-purple-400" />
              </span>
              <input
                type="text"
                required
                className="block w-full pl-10 pr-3 py-2.5 rounded-lg bg-space-900 border border-purple-900/30 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-transparent text-sm transition-all"
                placeholder="e.g. London, United Kingdom"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
              />
            </div>
            
            {/* Sample Cities Quick Select */}
            <div className="mt-3">
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-2">
                Common Reference Cities
              </p>
              <div className="flex flex-wrap gap-2">
                {COMMON_CITIES.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleSelectCity(city)}
                    className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                      birthPlace.toLowerCase().trim() === city.toLowerCase().trim()
                        ? "bg-purple-600/25 border-purple-400 text-white"
                        : "bg-space-900 border-purple-900/25 text-gray-400 hover:text-white hover:border-purple-600/40"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-4 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-950/40"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Computing Natal Coordinates...</span>
              </>
            ) : (
              <span>Generate Natal Blueprint</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
