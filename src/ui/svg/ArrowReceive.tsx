import React from 'react';

interface ArrowReceiveIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const ArrowReceiveIcon: React.FC<ArrowReceiveIconProps> = ({
  width = 10,
  height = 14,
  color = 'white',
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 10 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <path
      d="M9.70945 8.97556C9.99511 8.67561 9.98353 8.20088 9.68358 7.91521C9.38364 7.62955 8.9089 7.64112 8.62324 7.94107L9.70945 8.97556ZM4.45657 12.3161C4.17091 12.616 4.18249 13.0908 4.48243 13.3764C4.78238 13.6621 5.25711 13.6505 5.54278 13.3506L4.45657 12.3161ZM4.45657 13.3506C4.74224 13.6505 5.21697 13.6621 5.51692 13.3764C5.81686 13.0908 5.82844 12.616 5.54278 12.3161L4.45657 13.3506ZM1.37611 7.94107C1.09045 7.64112 0.615715 7.62955 0.315767 7.91521C0.0158191 8.20087 0.00424022 8.67561 0.289905 8.97555L1.37611 7.94107ZM4.24968 12.8333C4.24968 13.2475 4.58546 13.5833 4.99968 13.5833C5.41389 13.5833 5.74968 13.2475 5.74968 12.8333L4.24968 12.8333ZM5.74968 1.16665C5.74968 0.752432 5.41389 0.416646 4.99968 0.416646C4.58546 0.416646 4.24968 0.752432 4.24968 1.16665L5.74968 1.16665ZM8.62324 7.94107L4.45657 12.3161L5.54278 13.3506L9.70945 8.97556L8.62324 7.94107ZM5.54278 12.3161L1.37611 7.94107L0.289905 8.97555L4.45657 13.3506L5.54278 12.3161ZM5.74968 12.8333L5.74968 1.16665L4.24968 1.16665L4.24968 12.8333L5.74968 12.8333Z"
      fill={color}
    />
  </svg>
);

export default ArrowReceiveIcon;
