import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface ReferralRequestBody {
  referralCode?: string;
  newUserId?: string;
}

const getSupabaseAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export async function POST(request: NextRequest) {
  try {
    const body: ReferralRequestBody = await request.json();
    const { referralCode, newUserId } = body;

    if (!referralCode || !newUserId) {
      return NextResponse.json(
        { success: false, error: "Missing referralCode or newUserId" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // Fetch the referrer profile using the referral code
    const { data: referrerProfile, error: referrerError } = await supabaseAdmin
      .from("user_profiles")
      .select("id, credits")
      .eq("referral_code", referralCode)
      .maybeSingle();

    if (referrerError) {
      return NextResponse.json(
        { success: false, error: `Error fetching referrer profile: ${referrerError.message}` },
        { status: 500 }
      );
    }

    if (!referrerProfile) {
      return NextResponse.json(
        { success: false, error: "Referral code not found" },
        { status: 404 }
      );
    }

    if (referrerProfile.id === newUserId) {
      return NextResponse.json(
        { success: false, error: "Self-referrals are not allowed" },
        { status: 400 }
      );
    }

    // Insert referral record to track the relationship
    const { error: referralInsertError } = await supabaseAdmin.from("referrals").insert({
      referrer_id: referrerProfile.id,
      referee_id: newUserId
    });

    if (referralInsertError) {
      return NextResponse.json(
        { success: false, error: `Unable to record referral: ${referralInsertError.message}` },
        { status: 409 }
      );
    }

    // Increment credits for the referrer
    const { error: updateError } = await supabaseAdmin
      .from("user_profiles")
      .update({
        credits: (referrerProfile.credits || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", referrerProfile.id)
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: `Failed to update credits: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Referral handler error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
