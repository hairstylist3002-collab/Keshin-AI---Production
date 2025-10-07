"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { signOut } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import ProfileSkeleton from "../components/ProfileSkeleton";
import ImageSkeleton from "../components/ImageSkeleton";
import ReferralCard from "../components/ReferralCard";

// Add shimmer animation to global styles
const shimmerAnimation = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .shimmer {
    background: linear-gradient(90deg, #1f2937 25%, #374151 50%, #1f2937 75%);
    background-size: 200% 100%;
    animation: shimmer 2s infinite linear;
  }
`;

// Add styles to head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = shimmerAnimation;
  document.head.appendChild(style);
}

export default function HairstylistPage() {
  const router = useRouter();
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [targetImage, setTargetImage] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [targetPreview, setTargetPreview] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSubMessage, setUserSubMessage] = useState<string | null>(null);
  const [currentCredits, setCurrentCredits] = useState<number>(0);
  const [uploadProgress, setUploadProgress] = useState<{source: number, target: number}>({source: 0, target: 0});
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [showReferralModal, setShowReferralModal] = useState(false);

  const sourceInputRef = useRef<HTMLInputElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);

  // Authentication context
  const { user, profile, loading, isAuthenticated, signOut } = useAuthContext();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Authentication guard - redirect if not authenticated or no profile
  useEffect(() => {
    if (loading) {
      return;
    }

    setHasCheckedAuth(true);

    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    console.log('Profile credits sync effect:', {
      profileExists: !!profile,
      profileCredits: profile?.credits,
      currentCredits
    });

    if (profile?.credits !== undefined) {
      console.log(`Syncing credits: ${currentCredits} -> ${profile.credits}`);
      setCurrentCredits(profile.credits);
    } else if (profile && profile.credits === undefined) {
      // User has a profile but no credits field - set default
      console.log('Profile exists but no credits field, setting default to 1');
      setCurrentCredits(1);
    } else if (!profile) {
      // No profile exists - user might need to be created
      console.log('No profile found for user');
      setCurrentCredits(0);
    }
  }, [profile?.credits, profile, currentCredits]);

  // Close dropdown when clicking outside
  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (isDropdownOpen) {
  //       setIsDropdownOpen(false);
  //     }
  //   };

  //   document.addEventListener('mousedown', handleClickOutside);
  //   return () => {
  //     document.removeEventListener('mousedown', handleClickOutside);
  //   };
  // }, [isDropdownOpen]);

  // Show loading while checking authentication or during initial load
  if (loading || !hasCheckedAuth) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#05070d] px-6">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="orb orb--teal"></div>
          <div className="orb orb--purple"></div>
          <div className="orb orb--blue"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center gap-6 text-slate-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-700/60 bg-slate-900/60 p-4 shadow-lg shadow-indigo-900/40">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-400 border-t-transparent"></div>
          </div>
          <div className="text-center">
            <p className="text-base font-semibold tracking-wide text-slate-200">Loading your studio</p>
            <p className="mt-1 text-sm text-slate-400">Fetching your profile and credits...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show nothing if not authenticated - the useEffect will handle the redirect
  if (!isAuthenticated || !profile) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to home page after successful sign out
      router.push("/");
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "source" | "target"
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file (JPG, PNG, WebP)');
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        setUserSubMessage('Please ensure the image is less than 10MB in size.');
        return;
      }
      setError(null);
      setUserSubMessage(null);

      // Set the image and preview immediately
      if (type === "source") {
        setSourceImage(file);
        setSourcePreview(URL.createObjectURL(file));
      } else {
        setTargetImage(file);
        setTargetPreview(URL.createObjectURL(file));
      }

      // Reset upload progress
      setUploadProgress(prev => ({...prev, [type === "source" ? "source" : "target"]: 0}));
    }
  };

  const handleProcess = async () => {
    console.log('HandleProcess called with:', {
      sourceImage: !!sourceImage,
      targetImage: !!targetImage,
      isProcessing,
      currentCredits,
      profileCredits: profile?.credits
    });

    if (!sourceImage || !targetImage) {
      setError("Please upload both images before processing");
      return;
    }

    // Check if user has sufficient credits
    console.log('Credit validation:', {
      currentCredits,
      profileCredits: profile?.credits,
      check: currentCredits <= 0
    });

    if (currentCredits <= 0) {
      setError("Insufficient credits. Please purchase more credits to continue.");
      setUserSubMessage("You need at least 1 credit to generate a hairstyle.");
      return;
    }

    setError(null);
    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      // Simulating processing progress
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Create form data for API request
      // ✅ NEW: Get current session and JWT token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError('Authentication error. Please sign in again.');
        return;
      }

      const formData = new FormData();
      formData.append('sourceImage', sourceImage);
      formData.append('targetImage', targetImage);

      // Add userId to formData for backend credit deduction
      if (user?.id) {
        formData.append('userId', user.id);
        console.log('📤 Sending request with userId:', user.id);
      } else {
        console.error('❌ No user ID available');
        setError('User authentication error. Please sign in again.');
        return;
      }

      // ✅ NEW: Send JWT token in headers
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to process images');
        if (errorData.userSubMessage) {
          setUserSubMessage(errorData.userSubMessage);
        }
        return;
      }

      const result = await response.json();

      setProcessingProgress(100);

      console.log('📥 API Response received:', {
        success: result.success,
        hasImage: !!result.processedImage,
        creditsDeducted: result.creditsDeducted,
        newCredits: result.newCredits,
        currentCredits: result.currentCredits
      });

      // Set the processed image result
      setResultImage(result.processedImage);

      // ✅ Update credits from backend response
      if (result.newCredits !== undefined) {
        console.log(`✅ Updating credits from backend: ${currentCredits} -> ${result.newCredits}`);
        setCurrentCredits(result.newCredits);
        
        if (!result.creditsDeducted) {
          console.warn('⚠️ WARNING: Image generated but credit deduction failed on backend');
          // Could show a warning to the user here
        } else {
          console.log('✅ Credit successfully deducted by backend');
        }
      } else {
        console.warn('⚠️ No credit information in response');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process images. Please try again.');
      console.error('Processing error:', err);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProcessingProgress(0), 1000);
    }
  };

  const resetAll = () => {
    setSourceImage(null);
    setTargetImage(null);
    setSourcePreview(null);
    setTargetPreview(null);
    setResultImage(null);
    setError(null);
    setUploadProgress({source: 0, target: 0});
    setProcessingProgress(0);
    if (sourceInputRef.current) sourceInputRef.current.value = "";
    if (targetInputRef.current) targetInputRef.current.value = "";
  };

  const handleSaveImage = () => {
    if (resultImage) {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = 'ai-hairstylist-result.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShareImage = async () => {
    if (resultImage && navigator.share) {
      try {
        const response = await fetch(resultImage);
        const blob = await response.blob();
        const file = new File([blob], 'ai-hairstylist-result.jpg', { type: 'image/jpeg' });

        await navigator.share({
          title: 'My New AI Hairstyle!',
          text: 'Check out my new hairstyle created with AI Hair Stylist!',
          files: [file]
        });
      } catch (err) {
        console.error('Error sharing:', err);
        // Fallback to copying to clipboard
        if (navigator.clipboard) {
          try {
            await navigator.clipboard.writeText(resultImage);
            alert('Image link copied to clipboard!');
          } catch (clipboardErr) {
            alert('Unable to share. Please save the image and share manually.');
          }
        }
      }
    } else {
      alert('Sharing is not supported on this device. Please save the image and share manually.');
    }
  };

  return (
    <div className="min-h-screen">
      {showReferralModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/90 backdrop-blur-md px-4 py-6">
          <div className="relative w-full max-w-xl">
            <button
              onClick={() => setShowReferralModal(false)}
              className="absolute -top-4 -right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900/90 text-neutral-300 ring-1 ring-white/10 transition hover:text-white"
              aria-label="Close referral dialog"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <ReferralCard />
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6 max-w-6xl sm:py-8">
        {/* Header with User Info */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-fuchsia-500 to-indigo-600 text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
              </svg>
            </div>
            <span className="text-lg font-medium tracking-tight">AI Hairstylist</span>
          </div>

          <div className="flex items-center gap-3">
            {loading ? (
              <ProfileSkeleton />
            ) : user && profile && (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-sm text-neutral-300">
                  {/* Profile Icon with Dropdown */}
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-600 flex items-center justify-center text-xs text-white font-medium">
                        {profile.name?.[0]?.toUpperCase() || user.email?.[0].toUpperCase()}
                      </div>
                      {/* <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="text-neutral-400 hover:text-white transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button> */}
                    </div>

                    {/* Dropdown Menu */}
                    {/* {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg z-50">
                        <div className="py-1">
                          <button
                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
                            onClick={() => {
                              // TODO: Implement delete account logic
                              setIsDropdownOpen(false);
                            }}
                          >
                            Delete Account
                          </button>
                        </div>
                      </div>
                    )} */}
                  </div>
                  <span>{profile.name || user.email}</span>
                  {profile && (
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      currentCredits <= 1
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-fuchsia-500/20 text-fuchsia-300'
                    }`}>
                      {currentCredits} credits
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowReferralModal(true)}
                  className="inline-flex items-center gap-2 rounded-md bg-gradient-to-br from-fuchsia-500 to-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-lg shadow-fuchsia-600/20 ring-1 ring-white/10 transition hover:opacity-95"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l2.286 6.857H21l-5.357 3.929L17.929 21 12 16.929 6.071 21l1.286-7.214L2 9.857h6.714L12 3z" />
                  </svg>
                  Get credits
                </button>
                <button
                  onClick={handleSignOut}
                  className="inline-flex rounded-md px-3 py-2 text-sm font-medium text-neutral-300 hover:text-white cursor-pointer transition"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Header */}
        <header className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-3 sm:mb-4 drop-shadow-[0_4px_16px_rgba(0,0,0,0.45)]">
            AI Hair Stylist
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-xl sm:max-w-2xl mx-auto px-2">
            One smart decision here saves you from months of regretting a bad haircut. Invest a little to protect a lot, and ensure the style you pay for is the style you truly want
          </p>
        </header>

        {/* Low Credit Warning */}
        {profile && currentCredits <= 1 && (
          <div className="mb-6 p-4 bg-red-900/20 backdrop-blur-md border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-red-300">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-medium">Low Credits Warning</p>
                <p className="text-sm text-red-200/80 mt-1">
                  You have {currentCredits} credit{currentCredits === 1 ? '' : 's'} remaining.
                  Purchase more credits to continue generating hairstyles.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-900/20 backdrop-blur-md border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-red-300">
              <span className="text-xl">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
            {userSubMessage && (
              <div className="mt-2 text-sm text-gray-400 pl-8">
                {userSubMessage}
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 sm:mb-12">
          {/* Source Image Upload */}
          <div className="glass-card accent p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3 sm:mb-4">
              Hairstyle Inspiration
            </h2>
            <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
              Upload a photo of the hairstyle you want to copy
            </p>

            <div
              className="glass-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer hover:border-white/40 transition-all duration-300 min-h-[250px] sm:min-h-[300px] flex flex-col items-center justify-center"
              onClick={() => sourceInputRef.current?.click()}
            >
              {uploadProgress.source > 0 && uploadProgress.source < 100 ? (
                <ImageSkeleton progress={uploadProgress.source} />
              ) : sourcePreview ? (
                <div className="relative w-full h-64">
                  <Image
                    src={sourcePreview}
                    alt="Hairstyle inspiration"
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              ) : (
                <>
                  <div className="text-6xl mb-4">+</div>
                  <p className="text-lg font-medium text-gray-200 mb-2">
                    Click to upload hairstyle inspiration
                  </p>
                  <p className="text-sm text-gray-400">
                    Supports JPG, PNG, WebP (max 10MB)
                  </p>
                </>
              )}
            </div>
            <input
              ref={sourceInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "source")}
              className="hidden"
            />
          </div>

          {/* Target Image Upload */}
          <div className="glass-card p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3 sm:mb-4">
              Your Photo
            </h2>
            <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
              Upload your photo to apply the new hairstyle
            </p>

            <div
              className="glass-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer hover:border-white/40 transition-all duration-300 min-h-[250px] sm:min-h-[300px] flex flex-col items-center justify-center"
              onClick={() => targetInputRef.current?.click()}
            >
              {uploadProgress.target > 0 && uploadProgress.target < 100 ? (
                <ImageSkeleton progress={uploadProgress.target} />
              ) : targetPreview ? (
                <div className="relative w-full h-64">
                  <Image
                    src={targetPreview}
                    alt="Your photo"
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              ) : (
                <>
                  <div className="text-6xl mb-4">+</div>
                  <p className="text-lg font-medium text-gray-200 mb-2">
                    Click to upload your photo
                  </p>
                  <p className="text-sm text-gray-400">
                    Supports JPG, PNG, WebP (max 10MB)
                  </p>
                </>
              )}
            </div>
            <input
              ref={targetInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "target")}
              className="hidden"
            />
          </div>
        </div>

        {/* Processing Progress */}
        {isProcessing && (
          <div className="glass-card p-6 mb-8">
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-xl font-semibold text-white mb-6 text-center">
                {processingProgress < 50 ? 'Analyzing your photos...' : 'Generating your new look...'} ✨
              </h3>
              <div className="w-full max-w-md h-64 rounded-xl overflow-hidden relative">
                <ImageSkeleton progress={processingProgress} />
              </div>
              <p className="text-gray-300 mt-4 text-center">
                {processingProgress < 30 
                  ? 'Preparing your images for transformation...'
                  : processingProgress < 70
                    ? 'Applying the hairstyle with AI magic...'
                    : 'Adding final touches to your new look...'
                }
              </p>
            </div>
          </div>
        )}

        {/* Note about AI hairstyle generation */}
        <div className="mb-6 p-4 bg-blue-900/20 backdrop-blur-md border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-2 text-blue-300">
            <span className="text-lg mt-0.5">💡</span>
            <div>
              <p className="font-medium text-sm">The generated hairstyle isn't a 100% copy by design; instead of just pasting a style, our AI uses the hair in your photo to realistically render the new cut with your personal hair color and texture for a truly personalized result.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12">
          <button
            onClick={handleProcess}
            disabled={!sourceImage || !targetImage || isProcessing || currentCredits <= 0}
            className="px-6 py-4 sm:px-8 glass-btn-primary rounded-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 touch-manipulation"
          >
            {isProcessing ? (
              <span>Processing...</span>
            ) : (
              <span>Transform My Look</span>
            )}
          </button>

          <button
            onClick={resetAll}
            disabled={isProcessing}
            className="px-6 py-4 sm:px-8 glass-btn-muted font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 touch-manipulation"
          >
            <span>Reset All</span>
          </button>
        </div>

        {/* Result Section */}
        {resultImage && (
          <div className="glass-card accent p-4 sm:p-6 mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3 sm:mb-4">
              Your New Look
            </h2>
            <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
              Here's your transformed look with the new hairstyle!
            </p>
            <div className="mb-4 sm:mb-6 p-3 bg-yellow-900/20 backdrop-blur-md border border-yellow-500/30 rounded-lg">
              <div className="flex items-start gap-2 text-yellow-300">
                <span className="text-lg mt-0.5">⚠️</span>
                <div>
                  <p className="font-medium text-sm">Here it is! Be sure to download your new hairstyle now.</p>
                  <p className="text-xs text-yellow-200/80 mt-1">To protect your privacy, this image won't be available later, and we'd hate for you to waste a credit re-creating it.</p>
                </div>
              </div>
            </div>

            <div className="relative w-full h-64 sm:h-80 md:h-96 bg-black/20 rounded-xl overflow-hidden border border-gray-600/30">
              <Image
                src={resultImage}
                alt="Your transformed look"
                fill
                className="object-contain"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6">
              <button
                onClick={handleSaveImage}
                className="flex-1 px-4 py-3 sm:px-6 glass-btn-muted font-semibold rounded-xl hover:opacity-90 transition-colors touch-manipulation"
              >
                <span>Save Image</span>
              </button>
              <button
                onClick={handleShareImage}
                className="flex-1 px-4 py-3 sm:px-6 glass-btn-muted font-semibold rounded-xl hover:opacity-90 transition-colors touch-manipulation"
              >
                <span>Share</span>
              </button>
            </div>
          </div>
        )}

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="glass-card p-4 sm:p-6 text-center">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
              AI-Powered
            </h3>
            <p className="text-gray-300 text-sm sm:text-base">
              Advanced AI technology for realistic hair transformation
            </p>
          </div>

          <div className="glass-card p-4 sm:p-6 text-center">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
              Instant Results
            </h3>
            <p className="text-gray-300 text-sm sm:text-base">
              Get your transformed look in seconds, not hours
            </p>
          </div>

          <div className="glass-card p-4 sm:p-6 text-center">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
              Save Money & Time
            </h3>
            <p className="text-gray-300 text-sm sm:text-base">
              See yourself with a new hairstyle instantly before committing to the real haircut
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-400">
          <p>© 2024 AI Hair Stylist. Transform your look with confidence.</p>
        </footer>
      </div>
    </div>
  );
}
