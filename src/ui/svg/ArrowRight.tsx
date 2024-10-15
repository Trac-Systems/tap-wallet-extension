import React from 'react';

interface ArrowIconRightProps {
  width?: number;
  height?: number;
  color?: string;
}

const ArrowIconRight: React.FC<ArrowIconRightProps> = ({
  width = 24,
  height = 18,
  color = 'white',
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 24 18"
    fill="none">
    <path
      d="M9.46875 4.5L15.2812 9L9.46875 13.5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default ArrowIconRight;
