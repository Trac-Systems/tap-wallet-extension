import React from 'react';

interface CloseIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const CloseIcon: React.FC<CloseIconProps> = ({
  width = 20,
  height = 20,
  color = '#ffffff',
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    x="0px"
    y="0px"
    width={width}
    height={height}
    viewBox="0 0 256 256">
    <g
      fill={color}
      fillRule="nonzero"
      stroke="none"
      strokeWidth="1"
      strokeLinecap="butt"
      strokeLinejoin="miter"
      strokeMiterlimit="10"
      style={{mixBlendMode: 'normal'}}>
      <g transform="scale(10.66667,10.66667)">
        <path d="M4.70703,3.29297l-1.41406,1.41406l7.29297,7.29297l-7.29297,7.29297l1.41406,1.41406l7.29297,-7.29297l7.29297,7.29297l1.41406,-1.41406l-7.29297,-7.29297l7.29297,-7.29297l-1.41406,-1.41406l-7.29297,7.29297z"></path>
      </g>
    </g>
  </svg>
);

export default CloseIcon;
