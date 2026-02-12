import React from 'react';

interface ActivityIconProps {
  fillColor?: string;
  size?: number;
}

const ActivityIcon: React.FC<ActivityIconProps> = ({ fillColor = 'white', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Clock/Activity icon - simple design */}
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
        fill={fillColor}
      />
      <path
        d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"
        fill={fillColor}
      />
    </svg>
  );
};

export default ActivityIcon;
