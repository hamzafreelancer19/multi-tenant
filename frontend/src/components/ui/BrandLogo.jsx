import React from 'react';

export default function BrandLogo({ className = "", collapsed = false, size = "md", color = "#0F172A", forceShowText = false }) {
  // Sizes mapping
  const sizes = {
    sm: { icon: 24, text: "text-lg" },
    md: { icon: 32, text: "text-2xl" },
    lg: { icon: 48, text: "text-4xl" },
    xl: { icon: 64, text: "text-5xl" }
  };

  const currentSize = sizes[size] || sizes.md;
  const showText = !collapsed || forceShowText;

  return (
    <div className={`flex items-center gap-3 ${className}`} style={{ transition: 'all 0.3s ease' }}>
      
      {/* SVG Icon matching the uploaded logo's vibe */}
      <svg 
        width={currentSize.icon} 
        height={currentSize.icon} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: 'drop-shadow(0 4px 6px rgba(241, 90, 36, 0.2))' }}
      >
        <defs>
          <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF8C42" />
            <stop offset="100%" stopColor="#F15A24" />
          </linearGradient>
          <clipPath id="boxClip">
            <rect width="100" height="100" rx="24" />
          </clipPath>
        </defs>

        {/* Main Base (Orange Gradient) */}
        <rect width="100" height="100" rx="24" fill="url(#orangeGrad)" />
        
        {/* Navy Swoosh at the bottom right */}
        <g clipPath="url(#boxClip)">
          <path d="M 0 100 Q 50 60 100 80 L 100 100 L 0 100 Z" fill="#0F172A" />
        </g>

        {/* Document Lines (White) */}
        <rect x="25" y="35" width="25" height="6" rx="3" fill="#ffffff" />
        <rect x="25" y="50" width="35" height="6" rx="3" fill="#ffffff" />

        {/* Bar Chart (White) */}
        <rect x="65" y="40" width="8" height="35" rx="4" fill="#ffffff" />
        <rect x="80" y="55" width="8" height="20" rx="4" fill="#ffffff" />
        
        {/* Dot over bars */}
        <circle cx="84" cy="35" r="5" fill="#ffffff" />
      </svg>

      {/* Brand Text */}
      {showText && (
        <span 
          className={`${currentSize.text} tracking-tight font-extrabold select-none whitespace-nowrap`}
          style={{ 
            color: color, 
            letterSpacing: '-0.03em',
            fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif"
          }}
        >
          Classora
        </span>
      )}
    </div>
  );
}
