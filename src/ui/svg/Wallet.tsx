import React from 'react';

interface WalletIconProps {
  width?: number;
  height?: number;
  //   color?: string;
}

const WalletIcon: React.FC<WalletIconProps> = ({width = 100, height = 100}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 100 100"
    fill="none">
    <path
      d="M90 49.6667C90 47.0145 88.9464 44.471 87.0711 42.5956C85.1957 40.7202 82.6522 39.6667 80 39.6667H63.3333C63.3333 43.2029 61.9286 46.5943 59.4281 49.0948C56.9276 51.5952 53.5362 53 50 53C46.4638 53 43.0724 51.5952 40.5719 49.0948C38.0714 46.5943 36.6667 43.2029 36.6667 39.6667H20C17.3478 39.6667 14.8043 40.7202 12.9289 42.5956C11.0536 44.471 10 47.0145 10 49.6667M90 49.6667V76.3333C90 78.9855 88.9464 81.529 87.0711 83.4044C85.1957 85.2798 82.6522 86.3333 80 86.3333H20C17.3478 86.3333 14.8043 85.2798 12.9289 83.4044C11.0536 81.529 10 78.9855 10 76.3333V49.6667M90 49.6667V36.3333M10 49.6667V36.3333M90 36.3333C90 33.6812 88.9464 31.1376 87.0711 29.2623C85.1957 27.3869 82.6522 26.3333 80 26.3333H20C17.3478 26.3333 14.8043 27.3869 12.9289 29.2623C11.0536 31.1376 10 33.6812 10 36.3333M90 36.3333V23C90 20.3478 88.9464 17.8043 87.0711 15.9289C85.1957 14.0536 82.6522 13 80 13H20C17.3478 13 14.8043 14.0536 12.9289 15.9289C11.0536 17.8043 10 20.3478 10 23V36.3333"
      stroke="url(#paint0_linear_701_4470)"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient
        id="paint0_linear_701_4470"
        x1="50"
        y1="13"
        x2="50"
        y2="86.3333"
        gradientUnits="userSpaceOnUse">
        <stop stopColor="#F79E6D" />
        <stop offset="0.5" stopColor="#EA5B64" />
        <stop offset="1" stopColor="#C54359" />
      </linearGradient>
    </defs>
  </svg>
);

export default WalletIcon;
