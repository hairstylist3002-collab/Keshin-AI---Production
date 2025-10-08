import { NextRequest, NextResponse } from 'next/server';
import { performHairstyleTransfer } from '../../lib/hairstyleService';
import { supabase } from '@/lib/supabase';
import { updateUserCredits, getUserProfile } from '@/lib/userService';
import { createServerClient } from '@supabase/ssr';

// Ensure this route uses the Node.js runtime (Buffers, SDK compatibility)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
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

    // ✅ NEW: Create authenticated Supabase client with SSR
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) { return null; },
          set(name, value, options) { },
          remove(name, options) { },
        },
      }
    );

    // ✅ NEW: Set the session using the JWT token for RLS
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: '',
    });

    console.log('🔐 Session setup:', {
      sessionError: sessionError?.message,
      hasSession: !!sessionData?.session,
      userId: sessionData?.session?.user?.id
    });

    // ✅ Verify authentication context
    const { data: { user: authUser } } = await supabase.auth.getUser();
    console.log('🔑 Auth context after session setup:', {
      authUserId: authUser?.id,
      authUserEmail: authUser?.email,
      providedUserId: userId,
      authMatches: authUser?.id === userId
    });
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
    const profileResult = await getUserProfile(userId);
    
    if (!profileResult.success || !profileResult.data) {
      console.error('❌ Failed to get user profile:', profileResult.error);
      return NextResponse.json(
        { error: 'Failed to retrieve user profile. Please try again.' },
        { status: 500 }
      );
    }

    const currentCredits = profileResult.data.credits;
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
    
    const creditUpdateResult = await updateUserCredits(userId, newCredits);
    
    if (!creditUpdateResult.success) {
      console.error('❌ Failed to deduct credit:', creditUpdateResult.error);
      // IMPORTANT: Image was generated successfully, so we still return it
      // but log the credit deduction failure
      console.warn('⚠️ WARNING: Credit deduction failed but image was generated');
      
      // We could implement a retry mechanism or queue here for production
      // For now, return the image with a warning
    } else {
      console.log(`✅ Credit deducted successfully. New balance: ${newCredits} credits`);
    }

    const processedImageDataUrl = `data:${result.mimeType};base64,${result.imageBase64}`;

    return NextResponse.json({
      success: true,
      processedImage: processedImageDataUrl,
      message: 'Hair style transformation completed successfully',
      creditsDeducted: creditUpdateResult.success,
      currentCredits: creditUpdateResult.success ? newCredits : currentCredits,
      newCredits: creditUpdateResult.success ? newCredits : currentCredits
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
