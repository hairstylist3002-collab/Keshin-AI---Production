"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import LandingPage from "./components/LandingPageNew";
import { useAuthContext } from "@/contexts/AuthContext";

export default function Home() {
  const router = useRouter();
  const [showLandingPage, setShowLandingPage] = useState(true);

  // Authentication context
  const { isAuthenticated, loading } = useAuthContext();

  // Auto-redirect authenticated users to AI hairstylist
  useEffect(() => {
    // Only auto-redirect if we're not on the auth callback page
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/callback')) {
      if (isAuthenticated && !loading) {
        // Redirect to hairstylist page for authenticated users
        router.push("/Hairstylist");
      }
    }
  }, [isAuthenticated, loading, router]);

  const handleGetStarted = () => {
    router.push("/Hairstylist");
  };

  const handleBackToLanding = () => {
    setShowLandingPage(true);
  };

  // Show landing page if user hasn't started yet
  if (showLandingPage) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  return null;
}
