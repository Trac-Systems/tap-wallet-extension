import React from 'react';

interface SuccessIconProps {
  width?: number;
  height?: number;
}

const SuccessIcon: React.FC<SuccessIconProps> = ({
  width = 100,
  height = 100,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16.6663 12.5H83.333C85.5432 12.5 87.6628 13.378 89.2256 14.9408C90.7884 16.5036 91.6663 18.6232 91.6663 20.8333V45.8333C91.6663 56.884 87.2765 67.4821 79.4625 75.2961C71.6484 83.1101 61.0504 87.5 49.9997 87.5C44.5279 87.5 39.1098 86.4223 34.0545 84.3283C28.9993 82.2344 24.406 79.1652 20.5369 75.2961C12.7229 67.4821 8.33301 56.884 8.33301 45.8333V20.8333C8.33301 18.6232 9.21098 16.5036 10.7738 14.9408C12.3366 13.378 14.4562 12.5 16.6663 12.5V12.5Z"
      stroke="url(#paint0_linear_402_3190)"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M33.333 41.6665L49.9997 58.3332L66.6663 41.6665"
      stroke="url(#paint1_linear_402_3190)"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient
        id="paint0_linear_402_3190"
        x1="49.9997"
        y1="12.5"
        x2="49.9997"
        y2="87.5"
        gradientUnits="userSpaceOnUse">
        <stop stopColor="#F79E6D" />
        <stop offset="0.5" stopColor="#EA5B64" />
        <stop offset="1" stopColor="#C54359" />
      </linearGradient>
      <linearGradient
        id="paint1_linear_402_3190"
        x1="49.9997"
        y1="41.6665"
        x2="49.9997"
        y2="58.3332"
        gradientUnits="userSpaceOnUse">
        <stop stopColor="#F79E6D" />
        <stop offset="0.5" stopColor="#EA5B64" />
        <stop offset="1" stopColor="#C54359" />
      </linearGradient>
    </defs>
  </svg>
);

export default SuccessIcon;
