import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin Client for secure, server-side operations
const getSupabaseAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase admin environment variables.");
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey);
};

export async function POST(request: NextRequest) {
  const { referralCode, newUserId } = await request.json();

  console.log('[ReferralAPI] Incoming request', { referralCode, newUserId });

  if (!referralCode || !newUserId) {
    console.warn('[ReferralAPI] Missing referral code or new user id');
    return NextResponse.json({ success: false, error: "Missing referral code or new user ID." }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdminClient();

  try {
    // Find the user who made the referral (the referrer)
    const { data: referrer, error: referrerError } = await supabaseAdmin
      .from("user_profiles")
      .select("id, credits")
      .eq("referral_code", referralCode)
      .single();

    console.log('[ReferralAPI] Referrer lookup result', {
      hasReferrer: !!referrer,
      referrerId: referrer?.id,
      referrerCredits: referrer?.credits,
      referrerError: referrerError?.message
    });

    if (referrerError || !referrer) {
      return NextResponse.json({ success: false, error: "Referral code not found." }, { status: 404 });
    }

    // A user cannot refer themselves.
    if (referrer.id === newUserId) {
      console.warn('[ReferralAPI] Self-referral detected', { referrerId: referrer.id, newUserId });
      return NextResponse.json({ success: false, error: "Self-referrals are not allowed." }, { status: 400 });
    }

    // Rule #3: Log the referral in the 'referrals' table.
    // This will fail if the new user has already been referred, thanks to the unique constraint.
    const { data: referralInsertData, error: referralInsertError } = await supabaseAdmin.from("referrals").insert({
      referrer_id: referrer.id,
      referee_id: newUserId
    }).select('id, referrer_id, referee_id').maybeSingle();

    console.log('[ReferralAPI] Referral insert result', {
      referralInsertError: referralInsertError?.message,
      referralInsertData
    });

    if (referralInsertError) {
      if (referralInsertError.code === '23505') { // unique_violation
        return NextResponse.json({ success: false, error: "This user has already been referred." }, { status: 409 });
      }
      throw referralInsertError; // For other unexpected database errors.
    }

    // Rule #1 (Referrer Bonus): Award +1 credit to the referrer.
    const { data: updatedReferrer, error: updateError } = await supabaseAdmin
      .from("user_profiles")
      .update({ credits: (referrer.credits || 0) + 1 })
      .eq("id", referrer.id)
      .select('id, credits')
      .maybeSingle();

    console.log('[ReferralAPI] Credit update result', {
      updateError: updateError?.message,
      updatedReferrer
    });

    if (updateError) {
      throw updateError;
    }

    console.log('[ReferralAPI] Referral processing complete', {
      referrerId: referrer.id,
      newUserId,
      awardedCredits: (referrer.credits || 0) + 1
    });

    return NextResponse.json({ success: true, message: "Referrer credited successfully." });

  } catch (error) {
    console.error("Referral processing error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ success: false, error: `Internal Server Error: ${errorMessage}`  }, { status: 500 });
  }
}
