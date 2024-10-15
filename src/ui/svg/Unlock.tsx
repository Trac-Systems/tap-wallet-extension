import React from 'react';

interface UnlockIconProps {
  width?: number;
  height?: number;
}

const UnlockIcon: React.FC<UnlockIconProps> = ({width = 100, height = 100}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <path
      d="M79.1667 45.8335H20.8333C16.231 45.8335 12.5 49.5645 12.5 54.1668V83.3335C12.5 87.9359 16.231 91.6668 20.8333 91.6668H79.1667C83.769 91.6668 87.5 87.9359 87.5 83.3335V54.1668C87.5 49.5645 83.769 45.8335 79.1667 45.8335Z"
      stroke="url(#paint0_linear)"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M29.1665 45.8335V29.1668C29.1613 24.0004 31.076 19.0163 34.5389 15.1821C38.0018 11.3479 42.7658 8.93725 47.9061 8.41802C53.0464 7.8988 58.1963 9.30808 62.356 12.3723C66.5157 15.4365 69.3884 19.937 70.4165 25.0001"
      stroke="url(#paint1_linear)"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient
        id="paint0_linear"
        x1="50"
        y1="45.8335"
        x2="50"
        y2="91.6668"
        gradientUnits="userSpaceOnUse">
        <stop stopColor="#F79E6D" />
        <stop offset="0.5" stopColor="#EA5B64" />
        <stop offset="1" stopColor="#C54359" />
      </linearGradient>
      <linearGradient
        id="paint1_linear"
        x1="49.7915"
        y1="8.3125"
        x2="49.7915"
        y2="45.8335"
        gradientUnits="userSpaceOnUse">
        <stop stopColor="#F79E6D" />
        <stop offset="0.5" stopColor="#EA5B64" />
        <stop offset="1" stopColor="#C54359" />
      </linearGradient>
    </defs>
  </svg>
);

export default UnlockIcon;
