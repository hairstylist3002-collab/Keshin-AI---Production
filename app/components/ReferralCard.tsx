"use client";

import { useMemo, useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

const ReferralCard: React.FC = () => {
  const { profile, loading } = useAuthContext();
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const referralBaseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

  const referralCode = profile?.referral_code ?? "";

  const referralLink = useMemo(() => {
    return referralCode ? `${referralBaseUrl}/signup?ref=${referralCode}` : "";
  }, [referralBaseUrl, referralCode]);

  const isLoading = loading && !profile;

  const handleCopyLink = async () => {
    if (!referralLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus(null), 2500);
    } catch (error) {
      console.error("Failed to copy referral link:", error);
      setCopyStatus("Copy failed");
      setTimeout(() => setCopyStatus(null), 2500);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 p-6 shadow-xl shadow-fuchsia-900/20">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-16 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute -bottom-28 -left-10 h-60 w-60 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-white tracking-tight">Invite friends, earn credits</h2>
          <p className="text-sm text-neutral-400">
            {profile?.name ? `Hey ${profile.name.split(" ")[0]},` : ""} Share your unique link. Friends who join with it unlock 1 bonus credits for you.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-neutral-900/70 p-4 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">Your referral code</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-2xl font-semibold text-white tracking-wide">
              {isLoading ? "— — —" : referralCode || "Unavailable"}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.32em] text-neutral-500">Shareable link</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 rounded-lg border border-white/10 bg-neutral-900/80 px-4 py-3 text-sm text-neutral-300">
              {isLoading ? "Loading your link..." : referralLink || "Unable to generate link"}
            </div>
            <button
              onClick={handleCopyLink}
              disabled={!referralLink || isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-fuchsia-600/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy Link
            </button>
          </div>
          {copyStatus && (
            <p className="text-xs text-emerald-400 transition-opacity duration-200">{copyStatus}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferralCard;
