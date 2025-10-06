"use client";

import Image from "next/image";

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6 max-w-6xl sm:py-8">
        
        {/* HERO SECTION */}
        <section className="text-center mb-16 sm:mb-24">
          {/* Hero Image Placeholder */}
          <div className="mb-8 sm:mb-12 p-8 sm:p-16 glass-card accent rounded-2xl">
            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl p-12 sm:p-20 border border-purple-500/20">
              <p className="text-gray-400 text-sm sm:text-base italic">
                [Image: A vibrant, hopeful image of a person happily looking at their phone with hairstyle previews floating around them]
              </p>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-4 sm:mb-6 drop-shadow-[0_4px_16px_rgba(0,0,0,0.45)]">
            Stop Guessing. Start Knowing.<br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Your Perfect Haircut Awaits.
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8 sm:mb-10 px-2">
            A great haircut is an investment in yourself. This is your insurance. See your perfect look with your own hair color and texture before you ever sit in the salon chair.
          </p>
          
          <button
            onClick={onGetStarted}
            className="px-8 py-5 sm:px-12 sm:py-6 text-lg sm:text-xl glass-btn-primary rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 touch-manipulation shadow-2xl shadow-purple-500/30"
          >
            Find My Perfect Hairstyle Now
          </button>
        </section>

        {/* PROBLEM/AGITATION SECTION */}
        <section className="mb-16 sm:mb-24">
          <div className="glass-card p-6 sm:p-10 max-w-4xl mx-auto">
            {/* Icon Placeholder */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-red-900/40 to-orange-900/40 rounded-full flex items-center justify-center border border-red-500/30">
                <p className="text-xs text-gray-400 text-center px-2">
                  [Icon: Scissors with question mark]
                </p>
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white text-center mb-6">
              We've All Felt That Salon Chair Anxiety.
            </h2>
            
            <p className="text-base sm:text-lg md:text-xl text-gray-300 text-center max-w-3xl mx-auto mb-4">
              You show your stylist a picture, holding your breath and hoping for the best. But there's always that nagging doubt: <span className="text-red-400 font-semibold">"Will that celebrity haircut actually look good on me?"</span>
            </p>
            
            <p className="text-base sm:text-lg md:text-xl text-gray-300 text-center max-w-3xl mx-auto">
              A bad haircut isn't just a bad look for a few weeks. It's <span className="text-red-400 font-semibold">wasted money, months of regret, and a blow to your confidence.</span> It's a stressful gamble with your time and your hard-earned cash.
            </p>
          </div>
        </section>

        {/* SOLUTION SECTION */}
        <section className="mb-16 sm:mb-24">
          <div className="glass-card accent p-6 sm:p-10 max-w-4xl mx-auto">
            {/* Icon Placeholder */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-900/40 to-teal-900/40 rounded-full flex items-center justify-center border border-green-500/30">
                <p className="text-xs text-gray-400 text-center px-2">
                  [Icon: Hair being scanned → checkmark]
                </p>
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white text-center mb-6">
              Replace the Gamble with a Guarantee.
            </h2>
            
            <p className="text-base sm:text-lg md:text-xl text-gray-300 text-center max-w-3xl mx-auto mb-4">
              AI Hairstylist is your personal style preview tool that puts you in control. Using powerful AI, it shows you with stunning realism how any haircut will look on your face, with your hair.
            </p>
            
            <p className="text-base sm:text-lg md:text-xl text-center max-w-3xl mx-auto">
              <span className="text-green-400 font-semibold">No more hoping. No more guessing.</span> Just the confidence of knowing your new look is the right one, guaranteed.
            </p>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="mb-16 sm:mb-24">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white text-center mb-10 sm:mb-16">
            See Your Future Look in 3 Simple Steps
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12">
            {/* Step 1 */}
            <div className="glass-card p-6 sm:p-8 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shadow-lg shadow-purple-500/50">
                1
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3">
                Upload Your Photo
              </h3>
              <p className="text-gray-300 text-sm sm:text-base">
                Choose a clear, recent photo of yourself. For the most realistic preview, make sure your hair is visible.
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass-card p-6 sm:p-8 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shadow-lg shadow-purple-500/50">
                2
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3">
                Explore Hairstyles
              </h3>
              <p className="text-gray-300 text-sm sm:text-base">
                Browse hundreds of looks, from trending cuts to timeless classics. Find the styles that inspire you.
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass-card p-6 sm:p-8 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shadow-lg shadow-purple-500/50">
                3
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3">
                Get Your Personalized Preview
              </h3>
              <p className="text-gray-300 text-sm sm:text-base">
                This is where the magic happens. See the new style intelligently adapted to your unique hair color and texture.
              </p>
            </div>
          </div>

          {/* Important Note */}
          <div className="max-w-4xl mx-auto p-6 bg-blue-900/20 backdrop-blur-md border border-blue-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-1">💡</span>
              <div>
                <h4 className="text-lg sm:text-xl font-semibold text-blue-300 mb-2">
                  An Important Note: It's Not a Copy, It's a Makeover.
                </h4>
                <p className="text-blue-200 text-sm sm:text-base">
                  Our AI is smart. It deliberately avoids making a 100% copy of the inspiration photo. Instead, it analyzes your hair's unique texture and color to show you how the new cut would look on you. The result is a more realistic, personalized preview of a future you'll love.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* THE INVESTMENT SECTION */}
        <section className="mb-16 sm:mb-24">
          <div className="glass-card accent p-6 sm:p-10 max-w-4xl mx-auto">
            {/* Icon Placeholder */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-yellow-900/40 to-green-900/40 rounded-full flex items-center justify-center border border-yellow-500/30">
                <p className="text-xs text-gray-400 text-center px-2">
                  [Icon: Piggy bank with shield]
                </p>
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white text-center mb-6">
              The Smartest Money You'll Ever Spend on Your Hair.
            </h2>
            
            <p className="text-base sm:text-lg md:text-xl text-gray-300 text-center max-w-3xl mx-auto mb-4">
              Think about it. The salon charges the same price for a haircut you love or one you regret.
            </p>
            
            <p className="text-base sm:text-lg md:text-xl text-center max-w-3xl mx-auto">
              For a tiny fraction of that cost, AI Hairstylist removes all the risk. It's a <span className="text-yellow-400 font-semibold">small, one-time investment to protect the bigger investment</span> you make in your style. It ensures your money is well spent and that you walk out of the salon feeling incredible, every single time.
            </p>
          </div>
        </section>

        {/* FINAL CALL-TO-ACTION SECTION */}
        <section className="text-center mb-16 sm:mb-24">
          <div className="glass-card p-8 sm:p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Find the Look You Were Meant to Have?
            </h2>
            
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
              Stop wondering and start seeing. Your next great haircut is just a click away. End the guesswork, protect your money, and discover a new level of confidence.
            </p>
            
            <button
              onClick={onGetStarted}
              className="px-8 py-5 sm:px-12 sm:py-6 text-lg sm:text-xl glass-btn-primary rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 touch-manipulation shadow-2xl shadow-purple-500/30"
            >
              Try AI Hairstylist and Get Your Preview Now
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
