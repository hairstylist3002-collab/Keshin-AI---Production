"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { handleOAuthCallback } from "@/lib/authHandler";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const finalizeAuth = async () => {
      try {
        const result = await handleOAuthCallback();
        console.log("[AuthCallback] OAuth callback result", result);

        const referralCode = searchParams.get("ref");
        console.log("[AuthCallback] Referral code in callback", referralCode);

        if (result.success && referralCode && result.userData?.id) {
          try {
            const response = await fetch("/api/handle-referral", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                referralCode,
                newUserId: result.userData.id
              })
            });

            const payload = await response.json().catch(() => ({}));
            console.log("[AuthCallback] Referral API response", {
              status: response.status,
              ok: response.ok,
              payload
            });
          } catch (referralError) {
            console.error("[AuthCallback] Referral API call failed", referralError);
          }
        }

        router.replace("/Hairstylist");
      } catch (error) {
        console.error("[AuthCallback] Error finalizing OAuth callback", error);
        router.replace("/Hairstylist");
      }
    };

    finalizeAuth();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 border-4 border-neutral-800 border-t-fuchsia-500 rounded-full animate-spin mb-4"></div>
        <p className="text-neutral-400">Finalizing session, please wait...</p>
      </div>
    </div>
  );
}
