import { NextRequest, NextResponse } from 'next/server';
import { performHairstyleTransfer } from '../../lib/hairstyleService';
import { createClient } from '@supabase/supabase-js';

const getSupabaseAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase admin environment variables.');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Ensure this route uses the Node.js runtime (Buffers, SDK compatibility)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdminClient();

  try {
    const formData = await request.formData();
    const sourceImage = formData.get('sourceImage') as File;
    const targetImage = formData.get('targetImage') as File;
    const userId = formData.get('userId') as string;

    // ✅ NEW: Extract JWT token from request headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication token required' },
        { status: 401 }
      );
    }

    // ✅ Verify token using service role (admin) client
    const { data: tokenUser, error: tokenError } = await supabaseAdmin.auth.getUser(token);

    console.log('🔐 Token verification result:', {
      tokenError: tokenError?.message,
      tokenUserId: tokenUser?.user?.id,
      providedUserId: userId,
      authMatches: tokenUser?.user?.id === userId
    });

    if (tokenError || !tokenUser?.user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    if (!userId || tokenUser.user.id !== userId) {
      return NextResponse.json(
        { error: 'User mismatch detected' },
        { status: 403 }
      );
    }
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!sourceImage || !targetImage) {
      return NextResponse.json(
        { error: 'Both source and target images are required' },
        { status: 400 }
      );
    }

    // Check image sizes
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (sourceImage.size > maxSize || targetImage.size > maxSize) {
      return NextResponse.json(
        { error: 'Image size must be less than 10MB' },
        { status: 400 }
      );
    }

    // ✅ STEP 1: Check user credits BEFORE processing
    console.log('💳 Checking user credits...');
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Failed to get user profile:', profileError.message);
      return NextResponse.json(
        { error: 'Failed to retrieve user profile. Please try again.' },
        { status: 500 }
      );
    }

    if (!profileData) {
      console.error('❌ User profile not found for user:', userId);
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const currentCredits = profileData.credits;
    console.log(`💰 User has ${currentCredits} credits`);

    if (currentCredits <= 0) {
      console.log('❌ Insufficient credits');
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          userSubMessage: 'You need at least 1 credit to generate a hairstyle.',
          currentCredits: 0
        },
        { status: 402 } // Payment Required
      );
    }

    // ✅ STEP 2: Process the hairstyle transformation
    console.log('🎨 Starting hairstyle transformation...');
    
    // Read image buffers for service call
    const sourceImageBuffer = Buffer.from(await sourceImage.arrayBuffer());
    const targetImageBuffer = Buffer.from(await targetImage.arrayBuffer());

    // Call the two-step hairstyle transfer service
    const result = await performHairstyleTransfer(
      sourceImageBuffer,
      sourceImage.type || 'image/png',
      targetImageBuffer,
      targetImage.type || 'image/png'
    );

    console.log('🎨 Hairstyle transformation result:', {
      success: result.success,
      hasImage: !!result.imageBase64
    });

    if (!result.success) {
      console.error('❌ Hairstyle transformation failed:', result.error);
      const response: any = { 
        error: result.error || 'Failed to generate the new hairstyle image.',
        currentCredits // Return current credits (not deducted on failure)
      };
      
      // Add user sub-message if available
      if (result.userSubMessage) {
        response.userSubMessage = result.userSubMessage;
      }
      
      return NextResponse.json(response, { status: 500 });
    }

    // ✅ STEP 3: Deduct credit AFTER successful image generation
    console.log('💳 Deducting 1 credit from user account...');
    const newCredits = Math.max(0, currentCredits - 1);
    
    const { data: updatedProfile, error: creditUpdateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, credits')
      .maybeSingle();

    const creditUpdateSucceeded = !creditUpdateError && !!updatedProfile;

    if (!creditUpdateSucceeded) {
      console.error('❌ Failed to deduct credit:', creditUpdateError?.message);
      console.warn('⚠️ WARNING: Credit deduction failed but image was generated');
    } else {
      console.log('✅ Credit deducted successfully. New balance:', updatedProfile.credits);
    }

    const processedImageDataUrl = `data:${result.mimeType};base64,${result.imageBase64}`;

    return NextResponse.json({
      success: true,
      processedImage: processedImageDataUrl,
      message: 'Hair style transformation completed successfully',
      creditsDeducted: creditUpdateSucceeded,
      currentCredits: creditUpdateSucceeded ? updatedProfile?.credits ?? newCredits : currentCredits,
      newCredits: creditUpdateSucceeded ? updatedProfile?.credits ?? newCredits : currentCredits
    });

  } catch (error) {
    console.error('❌ Unexpected processing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process images. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Keshin Shop Processing API',
    endpoints: {
      'POST /api/process': 'Process hair style transformation'
    },
    usage: {
      'sourceImage': 'Image file containing the hairstyle to copy',
      'targetImage': 'Image file of the person to apply the hairstyle to'
    }
  });
}
