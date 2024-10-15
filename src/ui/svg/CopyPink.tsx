import React from 'react';

interface CopyPinkProps {
  width?: number;
  height?: number;
  color?: string;
}

const CopyPink: React.FC<CopyPinkProps> = ({
  width = 21,
  height = 20,
  color = '#D16B7C',
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 21 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <path
      d="M17.1667 7.5H9.66667C8.74619 7.5 8 8.24619 8 9.16667V16.6667C8 17.5871 8.74619 18.3333 9.66667 18.3333H17.1667C18.0871 18.3333 18.8333 17.5871 18.8333 16.6667V9.16667C18.8333 8.24619 18.0871 7.5 17.1667 7.5Z"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.6665 12.4998H3.83317C3.39114 12.4998 2.96722 12.3242 2.65466 12.0117C2.3421 11.6991 2.1665 11.2752 2.1665 10.8332V3.33317C2.1665 2.89114 2.3421 2.46722 2.65466 2.15466C2.96722 1.8421 3.39114 1.6665 3.83317 1.6665H11.3332C11.7752 1.6665 12.1991 1.8421 12.5117 2.15466C12.8242 2.46722 12.9998 2.89114 12.9998 3.33317V4.1665"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default CopyPink;
