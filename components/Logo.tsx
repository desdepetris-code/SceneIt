import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "h-8 w-auto" }) => {
  return (
    <svg 
      className={className}
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* 4-Stop Gradient: North (Blues) */}
        <linearGradient id="grad-n" x1="50" y1="2" x2="50" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="33%" stopColor="#3B82F6" />
          <stop offset="66%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#DBEAFE" />
        </linearGradient>

        {/* 4-Stop Gradient: East (Purples/Magendas) */}
        <linearGradient id="grad-e" x1="98" y1="50" x2="75" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4C1D95" />
          <stop offset="33%" stopColor="#8B5CF6" />
          <stop offset="66%" stopColor="#D946EF" />
          <stop offset="100%" stopColor="#F5D0FE" />
        </linearGradient>

        {/* 4-Stop Gradient: South (Darker Reds) */}
        <linearGradient id="grad-s" x1="50" y1="98" x2="50" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#450a0a" />
          <stop offset="33%" stopColor="#7f1d1d" />
          <stop offset="66%" stopColor="#991b1b" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>

        {/* 4-Stop Gradient: West (Indigo/Slate/Violet - Different Colors) */}
        <linearGradient id="grad-w" x1="2" y1="50" x2="25" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="33%" stopColor="#312e81" />
          <stop offset="66%" stopColor="#4338ca" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>

        {/* 7-Stop Dark Mixing Gradient for Inner Ring (Blues, Maroon, Darks) */}
        <linearGradient id="grad-dark-ring-complex" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#020617" />   {/* Obsidian */}
          <stop offset="15%" stopColor="#1e1b4b" />  {/* Deep Navy */}
          <stop offset="30%" stopColor="#450a0a" />  {/* Dark Maroon */}
          <stop offset="50%" stopColor="#0f172a" />  {/* Slate Black */}
          <stop offset="65%" stopColor="#312e81" />  {/* Indigo */}
          <stop offset="85%" stopColor="#2e1065" />  {/* Dark Plum */}
          <stop offset="100%" stopColor="#000000" /> {/* Black */}
        </linearGradient>

        {/* 5-Stop Text Gradient: Navy -> Royal -> Teal (Middle) -> Blue -> Dark Blue */}
        <linearGradient id="grad-text-cm-complex" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a8a" />   {/* Navy */}
          <stop offset="25%" stopColor="#2563eb" />  {/* Royal Blue */}
          <stop offset="50%" stopColor="#2dd4bf" />  {/* Teal - Middle */}
          <stop offset="75%" stopColor="#1d4ed8" />  {/* Royal Blue */}
          <stop offset="100%" stopColor="#1e1b4b" /> {/* Navy */}
        </linearGradient>
      </defs>

      {/* Outer Lens Housing */}
      <circle cx="50" cy="50" r="48" fill="black" stroke="#111" strokeWidth="1" />
      
      {/* Compass Direction Arrows */}
      <path d="M50 2L64 28H36L50 2Z" fill="url(#grad-n)" />
      <path d="M98 50L72 64V36L98 50Z" fill="url(#grad-e)" />
      <path d="M50 98L36 72H64L50 98Z" fill="url(#grad-s)" />
      <path d="M2 50L28 36V64L2 50Z" fill="url(#grad-w)" />
      
      {/* Inner Ring - Complex Mixing Gradient */}
      <circle cx="50" cy="50" r="33" fill="black" stroke="url(#grad-dark-ring-complex)" strokeWidth="4" />
      
      {/* CM Monogram - Multi-Blue Teal Center Gradient */}
      <text 
        x="50%" 
        y="61" 
        fontFamily="Arial Black, sans-serif" 
        fontSize="26" 
        fontWeight="900" 
        fill="url(#grad-text-cm-complex)" 
        textAnchor="middle"
        letterSpacing="-1.5"
      >
        CM
      </text>
      
      {/* Lens Flare Highlight */}
      <circle cx="35" cy="35" r="3" fill="white" opacity="0.2" />
    </svg>
  );
};

export default Logo;