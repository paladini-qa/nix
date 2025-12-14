import React, { useState } from "react";
import { Sparkles, ArrowRight, Lock, Mail, AlertCircle } from "lucide-react";
import { supabase } from "../services/supabaseClient";

const LoginView: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage(
          "Account created! Check your email to confirm (or log in if confirmation is disabled)."
        );
        setIsSignUp(false); // Switch back to login for UX
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // Auth state change is handled in App.tsx
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 dark:bg-slate-900 transition-colors duration-500 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md p-4 relative z-10">
        <div className="bg-white dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl dark:shadow-indigo-500/10 border border-gray-200 dark:border-white/10 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/30 mb-6">
              <span className="text-white font-bold text-2xl leading-none">
                SF
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm">
              Access your smart financial dashboard.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-lg flex items-center gap-2">
                <Sparkles size={16} />
                <span>{message}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                Email
              </label>
              <div className="relative group">
                <Mail
                  className="absolute left-3 top-3 text-gray-400 group-focus-within:text-indigo-500 transition-colors"
                  size={18}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                Password
              </label>
              <div className="relative group">
                <Lock
                  className="absolute left-3 top-3 text-gray-400 group-focus-within:text-indigo-500 transition-colors"
                  size={18}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isSignUp ? "Sign Up" : "Sign In"}</span>
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setMessage(null);
                }}
                className="text-sm text-gray-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {isSignUp
                  ? "Already have an account? Sign in here."
                  : "Don't have an account? Sign up."}
              </button>
            </div>
          </form>

          <div className="bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-white/5 px-8 py-4 text-center">
            <p className="text-xs text-gray-500 dark:text-slate-400">
              <span className="flex items-center justify-center gap-1">
                <Sparkles size={12} className="text-indigo-500" />
                Financial analysis powered by Gemini AI
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
