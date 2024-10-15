import React from 'react';

interface EditIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const EditIcon: React.FC<EditIconProps> = ({
  width = 24,
  height = 24,
  color = 'white',
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12.75 21.25H21.25M2.75 17V21.25H7L21.25 7L17 2.75L2.75 17Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default EditIcon;
