import React from 'react';

interface ImageSkeletonProps {
  progress?: number;
}

const ImageSkeleton: React.FC<ImageSkeletonProps> = ({ progress = 0 }) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Shimmer effect container */}
      <div className="absolute inset-0 rounded-xl overflow-hidden bg-gray-800">
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-shimmer"></div>
        
        {/* Percentage display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold text-white/90">{progress}%</span>
        </div>
        
        {/* Shimmer animation */}
        <style jsx>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite linear;
            background-size: 200% 100%;
          }
        `}</style>
      </div>
    </div>
  );
};

export default ImageSkeleton;
