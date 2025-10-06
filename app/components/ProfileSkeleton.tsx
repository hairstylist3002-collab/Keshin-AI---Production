import React from 'react';

const ProfileSkeleton = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex items-center gap-2 text-sm">
        {/* Skeleton for profile icon */}
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
          <div className="h-4 w-4 text-neutral-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        {/* Skeleton for user name */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          {/* Skeleton for credits */}
          <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      {/* Skeleton for sign out button */}
      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
    </div>
  );
};

export default ProfileSkeleton;
