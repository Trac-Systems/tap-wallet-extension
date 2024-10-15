import React from 'react';

interface PenIconProps {
  width?: number;
  height?: number;
}

const PenIcon: React.FC<PenIconProps> = ({width = 101, height = 100}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 101 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <path
      d="M50.5 83.3335H88"
      stroke="url(#paint0_linear_402_3106)"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M69.25 14.5835C70.9076 12.9259 73.1558 11.9946 75.5 11.9946C76.6607 11.9946 77.8101 12.2233 78.8825 12.6674C79.9549 13.1116 80.9292 13.7627 81.75 14.5835C82.5708 15.4042 83.2218 16.3786 83.666 17.451C84.1102 18.5234 84.3388 19.6727 84.3388 20.8335C84.3388 21.9942 84.1102 23.1436 83.666 24.2159C83.2218 25.2883 82.5708 26.2627 81.75 27.0835L29.6667 79.1668L13 83.3335L17.1667 66.6668L69.25 14.5835Z"
      stroke="url(#paint1_linear_402_3106)"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient
        id="paint0_linear_402_3106"
        x1="69.25"
        y1="83.3335"
        x2="69.25"
        y2="84.3335"
        gradientUnits="userSpaceOnUse">
        <stop stopColor="#F79E6D" />
        <stop offset="0.5" stopColor="#EA5B64" />
        <stop offset="1" stopColor="#C54359" />
      </linearGradient>
      <linearGradient
        id="paint1_linear_402_3106"
        x1="48.6694"
        y1="11.9946"
        x2="48.6694"
        y2="83.3335"
        gradientUnits="userSpaceOnUse">
        <stop stopColor="#F79E6D" />
        <stop offset="0.5" stopColor="#EA5B64" />
        <stop offset="1" stopColor="#C54359" />
      </linearGradient>
    </defs>
  </svg>
);

export default PenIcon;
