import React from 'react';

const InstallLogo = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        className="w-full h-full"
      >
        {/* 메인 설치 아이콘 */}
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
        />
        {/* 추가적인 설치 관련 요소들 */}
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={1.5} 
          d="M12 2v4M12 18v4"
          className="opacity-60"
        />
        <circle 
          cx="12" 
          cy="12" 
          r="2" 
          strokeWidth={1.5}
          className="opacity-40"
        />
      </svg>
    </div>
  );
};

export default InstallLogo; 