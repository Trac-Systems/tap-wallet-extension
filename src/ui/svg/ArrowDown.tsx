import React from 'react';

interface ArrowDownIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const ArrowDownIcon: React.FC<ArrowDownIconProps> = ({
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
      d="M18 9L12 15L6 9"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default ArrowDownIcon;
