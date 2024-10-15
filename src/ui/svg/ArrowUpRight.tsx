import React from 'react';

interface ArrowUpRightProps {
  width?: number;
  height?: number;
  color?: string;
}

const ArrowUpRight: React.FC<ArrowUpRightProps> = ({
  width = 65,
  height = 64,
  color = '#EB5757',
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 65 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <path
      d="M19.1665 45.3332L45.8332 18.6665"
      stroke={color}
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.1665 18.6665H45.8332V45.3332"
      stroke={color}
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default ArrowUpRight;
