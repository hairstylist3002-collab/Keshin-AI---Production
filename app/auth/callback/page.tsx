"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { handleOAuthCallback } from "@/lib/authHandler";

export default function AuthCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle OAuth callback and store user data
        const result = await handleOAuthCallback();

        if (!result.success) {
          console.warn('OAuth callback had issues, but authentication may have succeeded:', result.error);
          // Don't show error to user, just log and redirect
          // The user can still use the app even if profile creation failed
        }

        // Redirect to home page - the main page will handle the authenticated state
        router.push("/");

      } catch (err) {
        console.error('Auth callback error:', err);
        setError("An unexpected error occurred during sign in. Please try again.");
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 border-4 border-neutral-800 border-t-fuchsia-500 rounded-full animate-spin mb-4"></div>
          <p className="text-neutral-400">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Authentication Error</h2>
          <p className="text-neutral-400 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center px-4 py-2 bg-fuchsia-500 text-white rounded-lg hover:bg-fuchsia-600 transition"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
}
