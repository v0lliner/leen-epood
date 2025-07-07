import React from 'react';

const ShopIcon = ({ className = '', width = 24, height = 24 }) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M3 11H21V21C21 21.5523 20.5523 22 20 22H4C3.44772 22 3 21.5523 3 21V11Z" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinejoin="round"
      />
      <path 
        d="M4 11V7C4 6.44772 4.44772 6 5 6H19C19.5523 6 20 6.44772 20 7V11" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinejoin="round"
      />
      <path 
        d="M15 16H9V22H15V16Z" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinejoin="round"
      />
      <path 
        d="M12 6V2" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ShopIcon;