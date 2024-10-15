import React from 'react';
import './index.css';

interface ILayoutProps {
  header?: React.ReactNode;
  body?: React.ReactNode;
  footer?: React.ReactNode;
}
const LayoutTap = (props: ILayoutProps) => {
  const {header, body, footer} = props;
  return (
    <div className="container_tap">
      <header className="header_tap">{header}</header>
      <body className="body_tap">{body}</body>
      <footer className="footer_tap">{footer}</footer>
    </div>
  );
};

export default LayoutTap;
