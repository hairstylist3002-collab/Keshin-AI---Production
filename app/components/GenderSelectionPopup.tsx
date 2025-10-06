"use client";

import React, { useState } from 'react';

interface GenderSelectionPopupProps {
  onGenderSelect: (gender: 'male' | 'female' | 'other') => Promise<boolean> | boolean;
  isVisible: boolean;
}

const GenderSelectionPopup: React.FC<GenderSelectionPopupProps> = ({
  onGenderSelect,
  isVisible
}) => {
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | 'other' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isVisible) return null;

  const handleGenderSelect = (gender: 'male' | 'female' | 'other') => {
    setSelectedGender(gender);
  };

  const handleConfirm = async () => {
    if (!selectedGender) return;
    
    try {
      setIsSubmitting(true);
      const result = await onGenderSelect(selectedGender);
      if (result) {
        setSelectedGender(null);
      }
    } catch (error) {
      console.error('Error updating gender:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome!
          </h2>
          <p className="text-gray-300 mb-8">
            To provide you with the best hairstyle recommendations, please select your gender.
          </p>

          <div className="space-y-4 mb-8">
            <button
              onClick={() => handleGenderSelect('male')}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedGender === 'male'
                  ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                  : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
              }`}
            >
              <span className="font-medium">Male</span>
            </button>

            <button
              onClick={() => handleGenderSelect('female')}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedGender === 'female'
                  ? 'border-pink-500 bg-pink-500/20 text-pink-300'
                  : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
              }`}
            >
              <span className="font-medium">Female</span>
            </button>

            <button
              onClick={() => handleGenderSelect('other')}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedGender === 'other'
                  ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                  : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
              }`}
            >
              <span className="font-medium">Other / Prefer not to say</span>
            </button>
          </div>

          <div className="text-sm text-gray-400 mb-6">
            This information helps us provide better hairstyle recommendations for you.
          </div>
          
          <button
            onClick={handleConfirm}
            disabled={!selectedGender || isSubmitting}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
              selectedGender 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            } ${isSubmitting ? 'opacity-70' : ''}`}
          >
            {isSubmitting ? 'Saving...' : 'Confirm Selection'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenderSelectionPopup;
