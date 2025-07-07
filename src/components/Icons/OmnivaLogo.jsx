import React from 'react';

const OmnivaLogo = ({ className = '', width = 24, height = 24 }) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 910 910" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M156.132 753.867V156.133H753.869C545.694 -52.0407 208.175 -52.0407 0 156.133H156.13C-52.0428 364.307 -52.0423 701.825 156.132 909.998V753.868C364.31 962.044 701.825 962.045 910 753.867H156.132ZM753.869 0.000244141V753.867C962.044 545.693 962.044 208.178 753.869 0.000244141Z" fill="currentColor"/>
    </svg>
  );
};

export default OmnivaLogo;