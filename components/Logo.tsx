import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "h-8 w-auto" }) => {
  return (
    <svg 
      className={className}
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100" height="100" rx="22" fill="#000000" />
      <text 
        x="50%" 
        y="68" 
        fontFamily="Arial, sans-serif" 
        fontSize="55" 
        fontWeight="900" 
        fill="#4169E1" 
        textAnchor="middle"
        letterSpacing="-2"
      >
        CM
      </text>
      <rect x="15" y="75" width="70" height="4" rx="2" fill="#4169E1" opacity="0.4" />
    </svg>
  );
};

export default Logo;