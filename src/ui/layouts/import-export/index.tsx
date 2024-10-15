import React from 'react';
import './index.css';

interface ILayoutProps {
  header?: React.ReactNode;
  body?: React.ReactNode;
  footer?: React.ReactNode;
}
const LayoutScreenImport = (props: ILayoutProps) => {
  const {header, body, footer} = props;
  return (
    <div className="container">
      <div
        className="full_screen"
        style={{
          backgroundImage: 'url(./images/bg.png)',
          backgroundSize : 'cover',
        }}>
        <header className="header">{header}</header>
        <body className="body">{body}</body>
        <footer className="footer">{footer}</footer>
      </div>
    </div>
  );
};

export default LayoutScreenImport;
