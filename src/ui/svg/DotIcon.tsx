import React from 'react';

interface DotIconProps {
  width?: number;
  height?: number;
  color?: string;
  strokeColor?: string;
}

const DotIcon: React.FC<DotIconProps> = ({
  width = 24,
  height = 24,
  color = 'white',
  strokeColor = 'white',
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="4" width="4" height="4" rx="2" fill={color} />
    <circle cx="12" cy="6" r="1.5" stroke={strokeColor} />
    <rect x="10" y="10" width="4" height="4" rx="2" fill={color} />
    <circle cx="12" cy="12" r="1.5" stroke={strokeColor} />
    <rect x="10" y="16" width="4" height="4" rx="2" fill={color} />
    <circle cx="12" cy="18" r="1.5" stroke={strokeColor} />
  </svg>
);

export default DotIcon;
