import React from 'react';

interface DividerProps {
  color?: string;
  thickness?: string;
  margin?: string;
  width?: string;
}

const Divider: React.FC<DividerProps> = ({
  color = '#545454',
  thickness = '1px',
  margin = '10px 0',
  width = '100%',
}) => {
  return (
    <hr
      style={{
        border: 'none',
        borderTop: `${thickness} solid ${color}`,
        margin: margin,
        width: width,
      }}
    />
  );
};

export default Divider;
