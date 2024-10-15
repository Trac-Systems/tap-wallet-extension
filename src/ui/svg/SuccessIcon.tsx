import React from 'react';

interface SendSuccessIconProps {
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

const SendSuccessIcon: React.FC<SendSuccessIconProps> = ({
  width = 100,
  height = 101,
  style,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 100 101"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}>
    <path
      d="M16.6668 13H83.3335C85.5436 13 87.6633 13.878 89.2261 15.4408C90.7889 17.0036 91.6668 19.1232 91.6668 21.3333V46.3333C91.6668 57.384 87.277 67.9821 79.463 75.7961C71.6489 83.6101 61.0509 88 50.0002 88C44.5284 88 39.1103 86.9223 34.055 84.8283C28.9998 82.7344 24.4065 79.6652 20.5374 75.7961C12.7234 67.9821 8.3335 57.384 8.3335 46.3333V21.3333C8.3335 19.1232 9.21147 17.0036 10.7743 15.4408C12.3371 13.878 14.4567 13 16.6668 13V13Z"
      stroke="url(#paint0_linear)"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M33.3335 42.1665L50.0002 58.8332L66.6668 42.1665"
      stroke="url(#paint1_linear)"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient
        id="paint0_linear"
        x1="50.0002"
        y1="13"
        x2="50.0002"
        y2="88"
        gradientUnits="userSpaceOnUse">
        <stop stopColor="#F79E6D" />
        <stop offset="0.5" stopColor="#EA5B64" />
        <stop offset="1" stopColor="#C54359" />
      </linearGradient>
      <linearGradient
        id="paint1_linear"
        x1="50.0002"
        y1="42.1665"
        x2="50.0002"
        y2="58.8332"
        gradientUnits="userSpaceOnUse">
        <stop stopColor="#F79E6D" />
        <stop offset="0.5" stopColor="#EA5B64" />
        <stop offset="1" stopColor="#C54359" />
      </linearGradient>
    </defs>
  </svg>
);

export default SendSuccessIcon;
