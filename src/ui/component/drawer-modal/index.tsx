import React, { useEffect } from 'react';
import Drawer from 'react-modern-drawer';
import 'react-modern-drawer/dist/index.css';

interface IDrawerProps {
  direction?: 'bottom' | 'left' | 'right' | 'top';
  onClose: () => void;
  open: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}
const DrawerCustom = (props: IDrawerProps) => {
  const {
    direction = 'bottom',
    onClose,
    open,
    children,
    style,
    className,
  } = props;

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <Drawer
      lockBackgroundScroll
      style={style}
      duration={300}
      overlayOpacity={0.6}
      open={open}
      onClose={onClose}
      direction={direction}
      className={className}>
      {children}
    </Drawer>
  );
};

export default DrawerCustom;
