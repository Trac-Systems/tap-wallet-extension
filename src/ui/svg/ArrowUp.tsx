import React from 'react';

interface ArrowUpIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const ArrowUpIcon: React.FC<ArrowUpIconProps> = ({
  width = 24,
  height = 24,
  color = 'white',
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6 15L12 9L18 15"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default ArrowUpIcon;
