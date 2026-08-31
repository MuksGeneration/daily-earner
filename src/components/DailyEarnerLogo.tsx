import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  color?: string;
}

export const DailyEarnerLogo: React.FC<LogoProps> = ({ 
  className = "w-8 h-8", 
  size, 
  color = "#059669" 
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg 
      viewBox="0 0 120 140" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      style={style}
    >
      {/* Top Upward Arrow */}
      <path 
        d="M60 10 L34 38 H48 V52 H72 V38 H86 Z" 
        fill="none" 
        stroke={color} 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Robot Head Outline */}
      <path 
        d="M30 62 C30 45 42 38 60 38 C78 38 90 45 90 62 V78 L80 92 H72 V82 L60 68 L48 82 V92 H40 L30 78 Z" 
        fill="none" 
        stroke={color} 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Left Ear / Headphone & Antenna */}
      <line x1="22" y1="46" x2="22" y2="76" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <rect x="16" y="60" width="12" height="20" rx="6" fill={color} stroke={color} strokeWidth="2" />
      
      {/* Right Ear / Headphone & Antenna */}
      <line x1="98" y1="46" x2="98" y2="76" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <rect x="92" y="60" width="12" height="20" rx="6" fill={color} stroke={color} strokeWidth="2" />
      
      {/* Robot Eyes */}
      <rect x="44" y="60" width="8" height="18" rx="4" fill={color} stroke="none" />
      <rect x="68" y="60" width="8" height="18" rx="4" fill={color} stroke="none" />
      
      {/* Bottom Upward Arrow Stem */}
      <path 
        d="M60 74 L74 90 H66 V116 H54 V90 H46 Z" 
        fill="none" 
        stroke={color} 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
};
