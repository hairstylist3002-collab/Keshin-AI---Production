"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/supabase";
import { useAuthContext } from "@/contexts/AuthContext";
import Notification from './Notification';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPageNew({ onGetStarted }: LandingPageProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=900&auto=format&fit=crop");
  
  // Example showcase state
  const [currentExample, setCurrentExample] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  // Image fade feature state
  const [showConfused, setShowConfused] = useState(true);
  const [imageFadeVisible, setImageFadeVisible] = useState(true);

  // Add alternating image effect
  useEffect(() => {
    const interval = setInterval(() => {
      // Start fade out (1 second transition)
      setImageFadeVisible(false);

      // After fade out completes, switch image and fade in
      setTimeout(() => {
        setShowConfused(prev => !prev);
        setImageFadeVisible(true);
      }, 1000); // Match the CSS transition duration
    }, 4000); // Total cycle time: 1s fade out + 1s fade in + 2s pause

    return () => clearInterval(interval);
  }, []);

  // Notification state
  const [notification, setNotification] = useState<{
    isVisible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  } | null>(null);

  // Auth context
  const { user, profile, isAuthenticated } = useAuthContext();

  const examples = [
    {
      id: 1,
      before: "/examples/example-1-in-2.jpg",
      after: "/examples/example-1-out-2.png",
      inspiration: "/examples/example-1-in-1.jpeg",
      title: "Modern Bob Cut",
      description: "Clean, professional bob with textured layers"
    },
    {
      id: 2,
      before: "/examples/example-2-in-2.jpeg",
      after: "/examples/example-2-out-2.png",
      inspiration: "/examples/exapmle-2-in-1.jpg",
      title: "Layered Style",
      description: "Soft layers with face-framing highlights"
    },
    {
      id: 3,
      before: "/examples/example-3-in-2.jpg",
      after: "/examples/example-3-out-2.png",
      inspiration: "/examples/example-3-in-1.jpeg",
      title: "Textured Fringe",
      description: "Choppy fringe with volume and movement"
    }
  ];

  const currentExampleData = examples[currentExample];

  // Automatic slideshow effect
  useEffect(() => {
    let fadeTimeout: ReturnType<typeof setTimeout> | undefined;

    const scheduleNext = () => {
      setIsVisible(false);
      fadeTimeout = setTimeout(() => {
        setCurrentExample((prev) => (prev + 1) % examples.length);
        setIsVisible(true);
      }, 600);
    };

    const interval = setInterval(scheduleNext, 4000);
    scheduleNext();

    return () => {
      clearInterval(interval);
      if (fadeTimeout) {
        clearTimeout(fadeTimeout);
      }
    };
  }, [examples.length]);

  // Notification auto-dismiss effect
  useEffect(() => {
    if (notification?.isVisible && notification?.duration) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  const updatePreviewImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    const nextUrl = URL.createObjectURL(file);

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    previewUrlRef.current = nextUrl;
    setPreviewImage(nextUrl);
  };

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      updatePreviewImage(file);
    }
  };

  const handleGenerateClick = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      handleNavigation();
    }, 1200);
  };

  const handleNavigation = () => {
    if (isNavigating) {
      return;
    }
    setIsNavigating(true);
    onGetStarted();
  };

  const handleDropzoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-fuchsia-500/40');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-fuchsia-500/40');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-fuchsia-500/40');
    const file = e.dataTransfer.files?.[0];
    if (file) {
      updatePreviewImage(file);
    }
  };

  return (
    <>
      {/* Notification */}
      {notification?.isVisible && (
        <Notification
          isVisible={notification.isVisible}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {isNavigating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 backdrop-blur-sm">
          <div className="text-center space-y-4">
            <div className="relative mx-auto h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-neutral-700/40"></div>
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-fuchsia-500 border-r-indigo-500"></div>
              <div className="absolute inset-3 rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-600 opacity-80 blur-sm"></div>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white">Preparing your studio</h3>
              <p className="text-sm text-neutral-400">Loading personalized experience...</p>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        /* Custom scrollbar styling to match dark theme */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #030712;
        }

        ::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }

        ::-webkit-scrollbar-thumb:active {
          background: #6b7280;
        }
      `}</style>
      <div className="min-h-screen bg-neutral-950 text-neutral-100 antialiased selection:bg-fuchsia-500/20 selection:text-fuchsia-200">
      {/* Background accents */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl"></div>
      </div>

      {/* Navbar */}
      <header className="relative">
        <div className="w-full px-4">
          <div className="flex items-center justify-between py-5">
            <div className="flex items-center gap-2">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-fuchsia-500 to-indigo-600 text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                </svg>
              </div>
              <span className="text-lg font-medium tracking-tight">Keshin Shop</span>
            </div>
            <nav className="hidden md:flex items-center gap-8 text-sm text-neutral-300">
              <a href="#how" className="hover:text-white transition">How it works</a>
              <a href="#pricing" className="hover:text-white transition">Why it's smart</a>
              <a href="#pricing" className="hover:text-white transition">Pricing</a>
              <a href="#faq" className="hover:text-white transition">FAQ</a>
            </nav>
            <div className="flex items-center gap-3">
              {isAuthenticated && user ? (
                <button
                  onClick={onGetStarted}
                  className="inline-flex items-center gap-2 rounded-md bg-gradient-to-br from-fuchsia-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-fuchsia-600/20 ring-1 ring-white/10 hover:opacity-95"
                  suppressHydrationWarning
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Go to Hairstylist
                </button>
              ) : (
                <>
                  <div
                    onClick={() => router.push('/signup')}
                    className="inline-flex rounded-md px-3 py-2 text-sm font-medium text-neutral-300 hover:text-white cursor-pointer transition"
                  >
                    Sign in
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      // Show notification
                      setNotification({
                        isVisible: true,
                        type: 'error',
                        title: 'Sign in required',
                        message: 'Please sign in first to get started with Keshin Shop.',
                        duration: 4000
                      });
                    }}
                    disabled={!isAuthenticated}
                    className={`inline-flex items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-white/15 transition-all duration-200 ${
                      !isAuthenticated
                        ? 'opacity-50 cursor-not-allowed hover:bg-white/10'
                        : 'hover:bg-white/15'
                    }`}
                    suppressHydrationWarning
                    onMouseEnter={(e) => {
                      if (!isAuthenticated) {
                        // Show tooltip
                        const tooltip = document.createElement('div');
                        tooltip.className = 'absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-md shadow-lg z-50 whitespace-nowrap';
                        tooltip.textContent = 'Sign in first';
                        e.currentTarget.style.position = 'relative';
                        e.currentTarget.appendChild(tooltip);

                        // Remove tooltip after 2 seconds
                        setTimeout(() => {
                          if (tooltip.parentNode) {
                            tooltip.parentNode.removeChild(tooltip);
                          }
                        }, 2000);
                      }
                    }}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    Get started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="w-full px-4 pt-6 pb-16 md:pb-24">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
            <div>
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">
                Welcome to Virtual Barber Shop. Find out which hairstyle suits you before getting a real haircut
              </h1>
              <p className="mt-5 text-base sm:text-lg text-neutral-300">
                One smart decision here saves you from months of regretting a bad haircut. Invest a little to protect a lot, and ensure the style you pay for is the style you truly want.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={() => router.push('/signup')}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-br from-fuchsia-500 to-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-fuchsia-600/20 ring-1 ring-white/10 hover:opacity-95"
                  suppressHydrationWarning
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Find My Perfect Hairstyle Now
                </button>
              </div>

              <div className="mt-8 flex items-center gap-6">
                <div className="flex -space-x-3">
                  <Image className="h-8 w-8 rounded-full object-cover ring-2 ring-neutral-900" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=128&auto=format&fit=crop" alt="User 1" width={32} height={32} />
                  <Image className="h-8 w-8 rounded-full object-cover ring-2 ring-neutral-900" src="https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=128&auto=format&fit=crop" alt="User 2" width={32} height={32} />
                  <Image className="h-8 w-8 rounded-full object-cover ring-2 ring-neutral-900" src="https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=128&auto=format&fit=crop" alt="User 3" width={32} height={32} />
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-xs text-neutral-300 ring-2 ring-neutral-900">+9k</div>
                </div>
                <p className="text-sm text-neutral-400">Realistic previews loved by thousands</p>
              </div>
            </div>

            {/* Interactive Example Showcase */}
            <div className="relative">
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">See It In Action</h3>
                  <p className="text-sm text-neutral-400">Watch how AI transforms your look with realistic previews</p>
                </div>
                
                
                {/* Automatic Slideshow */}
                <div className="relative max-w-4xl mx-auto px-4">
                  <div className={`transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="flex items-center justify-center gap-3 md:gap-6">
                      {/* Original Image */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="aspect-[3/4] w-24 md:w-32 overflow-hidden rounded-lg ring-1 ring-white/10 relative mb-2">
                          <Image
                            src={currentExampleData.before}
                            alt="Original hairstyle"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="text-xs font-medium text-amber-300 bg-amber-500/20 px-2 py-1 rounded-full whitespace-nowrap">
                          You
                        </span>
                      </div>
                      
                      {/* Arrow 1 */}
                      <div className="text-xl md:text-2xl text-neutral-400 animate-pulse flex-shrink-0">
                        →
                      </div>
                      
                      {/* Inspiration Image */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="aspect-[3/4] w-24 md:w-32 overflow-hidden rounded-lg ring-1 ring-white/10 relative mb-2">
                          <Image
                            src={currentExampleData.inspiration}
                            alt="Inspiration hairstyle"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="text-xs font-medium text-purple-300 bg-purple-500/20 px-2 py-1 rounded-full whitespace-nowrap">
                          Inspiration
                        </span>
                      </div>
                      
                      {/* Arrow 2 */}
                      <div className="text-xl md:text-2xl text-neutral-400 animate-pulse flex-shrink-0">
                        →
                      </div>
                      
                      {/* Result Image */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="aspect-[3/4] w-24 md:w-32 overflow-hidden rounded-lg ring-1 ring-white/10 relative mb-2">
                          <Image
                            src={currentExampleData.after}
                            alt="AI Result hairstyle"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="text-xs font-medium text-emerald-300 bg-emerald-500/20 px-2 py-1 rounded-full whitespace-nowrap">
                          AI Result
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Example Description */}
                  <div className="mt-6 text-center">
                    <h4 className="font-medium text-white">{currentExampleData.title}</h4>
                    <p className="text-sm text-neutral-400 mt-1">{currentExampleData.description}</p>
                  </div>
                </div>
                
                {/* Process Steps */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-fuchsia-500/10 text-fuchsia-300 text-sm font-medium mb-2">1</div>
                    <p className="text-xs text-neutral-400">Upload<br />Your Photo</p>
                  </div>
                  <div className="text-center">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-300 text-sm font-medium mb-2">2</div>
                    <p className="text-xs text-neutral-400">Upload<br />Inspiration</p>
                  </div>
                  <div className="text-center">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300 text-sm font-medium mb-2">3</div>
                    <p className="text-xs text-neutral-400">Get AI<br />Preview</p>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-neutral-400">No uploads are stored without your consent.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / Agitation */}
      <section className="relative border-t border-white/10 bg-neutral-980/20">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold tracking-tight text-white">We've all felt that salon chair anxiety.</h2>
            <p className="mt-3 text-neutral-300">You show a picture and hope for the best. But there's that doubt: "Will that trendy cut actually look good on me?" A bad cut costs money, time, and confidence.</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 text-neutral-200">
                <svg className="h-5 w-5 text-fuchsia-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">Uncertainty</span>
              </div>
              <p className="mt-2 text-sm text-neutral-400">No more guessing if a style fits your face shape and hair texture.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 text-neutral-200">
                <svg className="h-5 w-5 text-fuchsia-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
                <span className="text-sm font-medium">Wasted spend</span>
              </div>
              <p className="mt-2 text-sm text-neutral-400">Protect your time and money from salon regrets.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 text-neutral-200">
                <svg className="h-5 w-5 text-fuchsia-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">Months of recovery</span>
              </div>
              <p className="mt-2 text-sm text-neutral-400">Grow-out shouldn't be your only plan B.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-white">Replace the gamble with a guarantee.</h2>
              <p className="mt-3 text-neutral-300">Your personal style preview tool shows how any haircut will look on your face with your hair—color, density, texture—rendered as if a stylist already finished the cut.</p>
              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/10 ring-1 ring-emerald-400/20">
                    <svg className="h-3.5 w-3.5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-neutral-300">Realistic, texture-aware rendering—not a wig overlay.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/10 ring-1 ring-emerald-400/20">
                    <svg className="h-3.5 w-3.5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-neutral-300">Face-framing analysis for shape, proportions, and balance.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/10 ring-1 ring-emerald-400/20">
                    <svg className="h-3.5 w-3.5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-neutral-300">Shareable previews to bring straight to your stylist.</span>
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 bg-[radial-gradient(1200px_200px_at_50%_-20%,rgba(217,70,239,0.15),transparent)] p-4">
              <div className={`transition-opacity duration-1000 ${imageFadeVisible ? 'opacity-100' : 'opacity-0'}`}>
                {showConfused ? (
                  <div className="overflow-hidden rounded-lg ring-1 ring-white/10">
                    <Image src="/examples/confused man.png" className="w-full object-contain" alt="Confused before" width={800} height={600} />
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg ring-1 ring-white/10">
                    <Image src="/examples/confident man.png" className="w-full object-contain" alt="Confident after" width={800} height={600} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div id="how" className="mt-16 rounded-xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-2xl font-semibold tracking-tight text-white">See your future look in 3 simple steps</h3>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-neutral-900/40 p-5">
                <div className="flex items-center gap-2 text-neutral-200">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/10">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium">1. Upload your photo</span>
                </div>
                <p className="mt-2 text-sm text-neutral-400">Clear, front-facing. Hair visible.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-neutral-900/40 p-5">
                <div className="flex items-center gap-2 text-neutral-200">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/10">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium">2. Upload inspiration</span>
                </div>
                <p className="mt-2 text-sm text-neutral-400">Share your desired haircut as reference.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-neutral-900/40 p-5">
                <div className="flex items-center gap-2 text-neutral-200">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/10">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium">3. Get your preview</span>
                </div>
                <p className="mt-2 text-sm text-neutral-400">Rendered with your color and texture.</p>
              </div>
            </div>
            <div className="mt-6 rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/10 p-4">
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 text-fuchsia-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-fuchsia-100/90">It's not a copy—it's your makeover. We analyze your hair to show how the new cut would look on you.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value / Investment */}
      <section id="pricing" className="relative border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-white">The smartest money you'll ever spend on your hair.</h2>
              <p className="mt-3 text-neutral-300">Salons charge the same for a haircut you love or one you regret. For a fraction of that, remove all risk and walk in with certainty.</p>
              <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <li className="flex items-center gap-2 text-sm text-neutral-300">
                  <svg className="h-4 w-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Risk-free decision
                </li>
                <li className="flex items-center gap-2 text-sm text-neutral-300">
                  <svg className="h-4 w-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Protect your budget
                </li>
                <li className="flex items-center gap-2 text-sm text-neutral-300">
                  <svg className="h-4 w-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Bring preview to salon
                </li>
                <li className="flex items-center gap-2 text-sm text-neutral-300">
                  <svg className="h-4 w-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Confidence you can feel
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-600/10 via-indigo-600/10 to-transparent p-6">
              <div className="mx-auto max-w-2xl text-center">
                <h3 className="text-2xl font-semibold tracking-tight text-white">Try Any Hairstyle Virtually</h3>
                <div className="mt-4 flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold tracking-tight text-white">₹39</span>
                  <span className="text-base text-neutral-300">per credit</span>
                </div>
                <p className="mt-2 text-sm text-neutral-300">One credit generates a brand new virtual hairstyle</p>

                <div className="mt-8 grid gap-3 text-left">
                  <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                      <svg className="h-3 w-3 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Eliminate the Gamble</h4>
                      <p className="mt-0.5 text-xs text-neutral-300">A real haircut is permanent. A virtual preview is your smart, risk-free test before the real thing.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                      <svg className="h-3 w-3 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Stop Wasting Money</h4>
                      <p className="mt-0.5 text-xs text-neutral-300">₹39 is a fraction of a real haircut's cost. Don't pay full price for something you might regret.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                      <svg className="h-3 w-3 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Discover Your Best Look</h4>
                      <p className="mt-0.5 text-xs text-neutral-300">Try styles you'd never dare in real life. Find your signature look before committing to the chair.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                      <svg className="h-3 w-3 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Control Your Style</h4>
                      <p className="mt-0.5 text-xs text-neutral-300">Walk into your appointment with a clear vision. Show your stylist exactly what you want—no miscommunication.</p>
                    </div>
                  </div>
                </div>

                <p className="mt-6 text-xs font-medium text-fuchsia-200">Don't leave your confidence to chance. Invest in certainty.</p>
                <p className="mt-1 text-xs text-neutral-400">Top-ups available anytime • 2 free credits on signup</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h3 className="text-2xl font-semibold tracking-tight text-white">Loved for realism and confidence</h3>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3">
                <Image className="h-9 w-9 rounded-full object-cover ring-2 ring-neutral-900" src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=128&auto=format&fit=crop" alt="Customer" width={36} height={36} />
                <div>
                  <p className="text-sm font-medium">"I walked in certain."</p>
                  <p className="text-xs text-neutral-400">Verified customer</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-neutral-300">The preview matched my final cut shockingly well. Zero anxiety at the salon.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3">
                <Image className="h-9 w-9 rounded-full object-cover ring-2 ring-neutral-900" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=128&auto=format&fit=crop" alt="Customer" width={36} height={36} />
                <div>
                  <p className="text-sm font-medium">"Worth every penny."</p>
                  <p className="text-xs text-neutral-400">Verified customer</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-neutral-300">Spent less than coffee money to avoid a $200 mistake. Easy choice.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3">
                <Image className="h-9 w-9 rounded-full object-cover ring-2 ring-neutral-900" src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=128&auto=format&fit=crop" alt="Customer" width={36} height={36} />
                <div>
                  <p className="text-sm font-medium">"My stylist loved it."</p>
                  <p className="text-xs text-neutral-400">Verified customer</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-neutral-300">Brought the preview to my appointment and we nailed the cut in one go.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h3 className="text-2xl font-semibold tracking-tight text-white">Questions</h3>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <details className="group rounded-lg border border-white/10 bg-white/5 p-4 open:bg-white/[0.08]">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
                How realistic are the results?
                <svg className="h-4 w-4 transition group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-sm text-neutral-300">We render the new cut using your hair's color and texture, so the preview looks like your actual hair styled into the chosen look.</p>
            </details>
            <details className="group rounded-lg border border-white/10 bg-white/5 p-4 open:bg-white/[0.08]">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
                Do I need professional photos?
                <svg className="h-4 w-4 transition group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-sm text-neutral-300">No. A clear, front-facing photo in good lighting works great. Keep hair visible.</p>
            </details>
            <details className="group rounded-lg border border-white/10 bg-white/5 p-4 open:bg-white/[0.08]">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
                Is my photo private?
                <svg className="h-4 w-4 transition group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-sm text-neutral-300">Yes. Nothing is stored without permission. You control what's saved or deleted.</p>
            </details>
            <details className="group rounded-lg border border-white/10 bg-white/5 p-4 open:bg-white/[0.08]">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
                Can I bring this to my stylist?
                <svg className="h-4 w-4 transition group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-sm text-neutral-300">Every preview has a shareable link and printable view designed for salon consultations.</p>
            </details>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="overflow-hidden rounded-2xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-600/20 via-indigo-600/20 to-transparent p-8">
            <div className="grid items-center gap-8 md:grid-cols-2">
              <div>
                <h3 className="text-3xl font-semibold tracking-tight text-white">Ready to find the look you were meant to have?</h3>
                <p className="mt-2 text-neutral-200">End the guesswork, protect your money, and walk in with confidence.</p>
                <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button 
                    onClick={onGetStarted}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-white text-neutral-900 px-5 py-3 text-sm font-medium hover:opacity-95" suppressHydrationWarning
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    Try Keshin Shop now
                  </button>
                  <a href="#pricing" className="inline-flex items-center justify-center gap-2 rounded-md bg-white/10 px-5 py-3 text-sm font-medium text-white ring-1 ring-white/10 hover:bg-white/15">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    See pricing
                  </a>
                </div>
              </div>
              <div className="relative">
                <Image className="h-64 w-full rounded-xl object-cover ring-1 ring-white/10" src="https://images.unsplash.com/photo-1621619856624-42fd193a0661?w=1080&q=80" alt="Confident person with great haircut" width={500} height={256} />
                <div className="absolute -bottom-4 left-6 rounded-md bg-neutral-900/80 px-3 py-2 text-xs text-neutral-200 ring-1 ring-white/10 backdrop-blur">
                  <span className="inline-flex items-center gap-1 text-emerald-300">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg> certainty mode
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/10">
        <div className="w-full px-4 py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-fuchsia-500 to-indigo-600 text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                </svg>
              </div>
              <span className="text-sm font-medium tracking-tight">Keshin Shop</span>
            </div>
            <p className="text-xs text-neutral-500">© {new Date().getFullYear()} Keshin Shop. All rights reserved.</p>
          </div>
        </div>
      </footer>
      </div>

    </>
  );
}
