import React from 'react';

interface WaringIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const WaringIcon: React.FC<WaringIconProps> = ({
  width = 25,
  height = 24,
  color = '#F4C242',
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 25 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12.5 1C10.3244 1 8.19767 1.64514 6.38873 2.85383C4.57979 4.06253 3.16989 5.78049 2.33733 7.79048C1.50477 9.80047 1.28693 12.0122 1.71137 14.146C2.1358 16.2798 3.18345 18.2398 4.72183 19.7782C6.26021 21.3166 8.22022 22.3642 10.354 22.7886C12.4878 23.2131 14.6995 22.9952 16.7095 22.1627C18.7195 21.3301 20.4375 19.9202 21.6462 18.1113C22.8549 16.3023 23.5 14.1756 23.5 12C23.4966 9.08367 22.3365 6.28778 20.2744 4.22563C18.2122 2.16347 15.4163 1.00344 12.5 1ZM12.5 21C10.72 21 8.97992 20.4722 7.49987 19.4832C6.01983 18.4943 4.86628 17.0887 4.18509 15.4442C3.5039 13.7996 3.32567 11.99 3.67294 10.2442C4.0202 8.49836 4.87737 6.89471 6.13604 5.63604C7.39472 4.37737 8.99836 3.5202 10.7442 3.17293C12.49 2.82567 14.2996 3.0039 15.9442 3.68508C17.5887 4.36627 18.9943 5.51983 19.9832 6.99987C20.9722 8.47991 21.5 10.22 21.5 12C21.4971 14.3861 20.5479 16.6735 18.8608 18.3607C17.1736 20.0479 14.8861 20.9971 12.5 21ZM13.5 8H11.5V6H13.5V8ZM13.5 18H11.5V10H13.5V18Z"
      fill={color}
    />
  </svg>
);

export default WaringIcon;
