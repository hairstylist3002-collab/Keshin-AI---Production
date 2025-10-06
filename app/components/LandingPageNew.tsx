"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { signOut } from "@/lib/supabase";
import { handleEmailSignup, handleEmailSignin, handleGoogleSignin } from "@/lib/authHandler";
import { useAuthContext } from "@/contexts/AuthContext";
import { getAuthErrorMessage, validateEmail, validatePassword, validateName } from "@/utils/auth-utils";

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPageNew({ onGetStarted }: LandingPageProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string>("https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=900&auto=format&fit=crop");
  
  // Example showcase state
  const [currentExample, setCurrentExample] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  // Image fade feature state
  const [showConfused, setShowConfused] = useState(true);
  const [imageFadeVisible, setImageFadeVisible] = useState(true);
  
  // Authentication state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  
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
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentExample((prev) => (prev + 1) % examples.length);
        setIsVisible(true);
      }, 1000); // Wait for fade out
    }, 4000); // Show each example for 4 seconds

    return () => clearInterval(interval);
  }, []);

  // Image fade effect for confused/confident images
  useEffect(() => {
    const interval = setInterval(() => {
      setImageFadeVisible(false);
      setTimeout(() => {
        setShowConfused(prev => !prev);
        setImageFadeVisible(true);
      }, 1000); // Wait for fade out
    }, 3000); // Show each image for 3 seconds

    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviewImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateClick = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      onGetStarted();
    }, 1200);
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
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreviewImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = async () => {
    setAuthError('');
    
    // Validation
    if (!validateEmail(email)) {
      setAuthError('Please enter a valid email address');
      return;
    }
    
    if (!validatePassword(password).isValid) {
      setAuthError(validatePassword(password).message || 'Invalid password');
      return;
    }
    
    setAuthLoading(true);
    
    try {
      const result = await handleEmailSignin(email, password);
      
      if (!result.success) {
        const authError = getAuthErrorMessage({ message: result.error } as any);
        setAuthError(authError.message);
      } else {
        // Successful login - redirect to AI hairstylist
        setShowLoginModal(false);
        setEmail('');
        setPassword('');
        
        // Call the onGetStarted function to show the AI hairstylist interface
        setTimeout(() => {
          onGetStarted();
        }, 500); // Small delay to ensure auth state is updated
      }
    } catch (error) {
      setAuthError('An unexpected error occurred');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async () => {
    setAuthError('');
    
    // Validation
    if (!validateName(name).isValid) {
      setAuthError(validateName(name).message || 'Invalid name');
      return;
    }
    
    if (!validateEmail(email)) {
      setAuthError('Please enter a valid email address');
      return;
    }
    
    if (!validatePassword(password).isValid) {
      setAuthError(validatePassword(password).message || 'Invalid password');
      return;
    }
    
    if (!gender) {
      setAuthError('Please select your gender');
      return;
    }
    
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }
    
    setAuthLoading(true);
    
    try {
      const result = await handleEmailSignup(email, password, name, gender);
      
      if (!result.success) {
        const authError = getAuthErrorMessage({ message: result.error } as any);
        setAuthError(authError.message);
      } else {
        // Successful signup - redirect to AI hairstylist
        setShowSignupModal(false);
        setName('');
        setEmail('');
        setPassword('');
        setGender('');
        setConfirmPassword('');
        
        // Call the onGetStarted function to show the AI hairstylist interface
        setTimeout(() => {
          onGetStarted();
        }, 500); // Small delay to ensure auth state is updated
      }
    } catch (error) {
      setAuthError('An unexpected error occurred');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
      // Redirect happens automatically via auth state change
      // The main page will handle the landing page redirect
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setAuthLoading(true);
    
    try {
      const result = await handleGoogleSignin();
      if (!result.success) {
        const authError = getAuthErrorMessage({ message: result.error } as any);
        setAuthError(authError.message);
      }
      // Note: OAuth redirect will happen automatically, no need to close modal
    } catch (error) {
      setAuthError('An unexpected error occurred with Google sign-in');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <>
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
              <span className="text-lg font-medium tracking-tight">AI Hairstylist</span>
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
                    onClick={() => setShowLoginModal(true)}
                    className="hidden sm:inline-flex rounded-md px-3 py-2 text-sm font-medium text-neutral-300 hover:text-white cursor-pointer transition"
                  >
                    Sign in
                  </div>
                  <button
                    onClick={onGetStarted}
                    className="inline-flex items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-white/15 hover:bg-white/15"
                    suppressHydrationWarning
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
                Stop Guessing. Start Knowing. Your Perfect Haircut Awaits.
              </h1>
              <p className="mt-5 text-base sm:text-lg text-neutral-300">
                A great haircut is an investment in yourself. This is your insurance. See your perfect look with your own hair color and texture before you ever sit in the salon chair.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button 
                  onClick={onGetStarted}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-br from-fuchsia-500 to-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-fuchsia-600/20 ring-1 ring-white/10 hover:opacity-95"
                  suppressHydrationWarning
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Find My Perfect Hairstyle Now
                </button>
                <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" className="inline-flex items-center justify-center gap-2 rounded-md bg-white/5 px-5 py-3 text-sm font-medium text-white ring-1 ring-white/10 hover:bg-white/10">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Watch demo
                </a>
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
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-neutral-900/40 p-5">
                  <h4 className="text-lg font-medium tracking-tight text-white">Single Preview</h4>
                  <p className="mt-1 text-sm text-neutral-400">Perfect for a one-time decision.</p>
                  <p className="mt-4 text-3xl font-semibold tracking-tight">$9</p>
                  <button className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/10 hover:bg-white/15" suppressHydrationWarning>Choose</button>
                  <ul className="mt-4 space-y-2 text-sm text-neutral-400">
                    <li className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg> 1 style preview
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg> Salon-ready share link
                    </li>
                  </ul>
                </div>
                <div className="relative rounded-lg border border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-500/10 to-indigo-600/10 p-5 ring-1 ring-inset ring-fuchsia-500/20">
                  <div className="absolute -top-3 right-3 rounded-full bg-fuchsia-500/20 px-2 py-1 text-[10px] font-medium text-fuchsia-200 ring-1 ring-fuchsia-400/30">Most popular</div>
                  <h4 className="text-lg font-medium tracking-tight text-white">Unlimited Month</h4>
                  <p className="mt-1 text-sm text-neutral-300">Experiment freely. Find "the one."</p>
                  <p className="mt-4 text-3xl font-semibold tracking-tight">$19</p>
                  <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-br from-fuchsia-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/10 hover:opacity-95" suppressHydrationWarning>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg> Choose
                  </button>
                  <ul className="mt-4 space-y-2 text-sm text-neutral-300">
                    <li className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg> Unlimited previews
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg> Priority rendering
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg> Save & compare looks
                    </li>
                  </ul>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-neutral-400">Cancel anytime. 7-day satisfaction promise.</p>
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
                    Try AI Hairstylist now
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
              <span className="text-sm font-medium tracking-tight">AI Hairstylist</span>
            </div>
            <p className="text-xs text-neutral-500">© {new Date().getFullYear()} AI Hairstylist. All rights reserved.</p>
          </div>
        </div>
      </footer>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-xl border border-white/10 bg-neutral-900 p-4 shadow-2xl">
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-white transition"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center">
              <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-600 text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-white">Welcome back</h3>
              <p className="mt-1 text-sm text-neutral-400">Sign in to your account</p>
            </div>
            
            {authError && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                <p className="text-sm text-red-400">{authError}</p>
              </div>
            )}
            
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder-neutral-500 focus:border-fuchsia-500/30 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20"
                  placeholder="you@example.com"
                  disabled={authLoading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder-neutral-500 focus:border-fuchsia-500/30 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20"
                  placeholder="••••••••"
                  disabled={authLoading}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-neutral-400">
                  <input type="checkbox" className="rounded border-white/10 bg-neutral-800 text-fuchsia-500 focus:ring-fuchsia-500/20" />
                  Remember me
                </label>
                <a href="#" className="text-xs text-fuchsia-400 hover:text-fuchsia-300 transition">Forgot password?</a>
              </div>
              
              <button 
                onClick={handleLogin}
                disabled={authLoading}
                className="w-full rounded-lg bg-gradient-to-br from-fuchsia-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-neutral-900 px-4 text-neutral-400">Or continue with</span>
                </div>
              </div>
              
              <button 
                onClick={handleGoogleSignIn}
                disabled={authLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {authLoading ? 'Connecting...' : 'Continue with Google'}
              </button>
              
              <div className="text-center">
                <p className="text-sm text-neutral-400">
                  Don't have an account?{' '}
                  <button 
                    onClick={() => {
                      setShowLoginModal(false);
                      setShowSignupModal(true);
                    }}
                    className="text-fuchsia-400 hover:text-fuchsia-300 transition font-medium"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sign Up Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
            <button 
              onClick={() => setShowSignupModal(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-white transition"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center">
              <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-600 text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-white">Create account</h3>
              <p className="mt-1 text-sm text-neutral-400">Get started today</p>
            </div>
            
            {authError && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                <p className="text-sm text-red-400">{authError}</p>
              </div>
            )}
            
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder-neutral-500 focus:border-fuchsia-500/30 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 disabled:opacity-50"
                  placeholder="John Doe"
                  disabled={authLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white focus:border-fuchsia-500/30 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 disabled:opacity-50"
                  disabled={authLoading}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder-neutral-500 focus:border-fuchsia-500/30 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 disabled:opacity-50"
                  placeholder="you@example.com"
                  disabled={authLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder-neutral-500 focus:border-fuchsia-500/30 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 disabled:opacity-50"
                  placeholder="••••••••"
                  disabled={authLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder-neutral-500 focus:border-fuchsia-500/30 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 disabled:opacity-50"
                  placeholder="••••••••"
                  disabled={authLoading}
                />
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-white/10 bg-neutral-800 text-fuchsia-500 focus:ring-fuchsia-500/20" />
                <label className="text-sm text-neutral-400">
                  I agree to the{' '}
                  <a href="#" className="text-fuchsia-400 hover:text-fuchsia-300 transition">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-fuchsia-400 hover:text-fuchsia-300 transition">Privacy Policy</a>
                </label>
              </div>
              
              <button
                onClick={handleSignup}
                disabled={authLoading}
                className="w-full rounded-lg bg-gradient-to-br from-fuchsia-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </div>
                ) : (
                  'Create account'
                )}
              </button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-neutral-900 px-4 text-neutral-400">Or continue with</span>
                </div>
              </div>
              
              <button 
                onClick={handleGoogleSignIn}
                disabled={authLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {authLoading ? 'Connecting...' : 'Continue with Google'}
              </button>
              
              <div className="text-center">
                <p className="text-sm text-neutral-400">
                  Already have an account?{' '}
                  <button 
                    onClick={() => {
                      setShowSignupModal(false);
                      setShowLoginModal(true);
                    }}
                    className="text-fuchsia-400 hover:text-fuchsia-300 transition font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
