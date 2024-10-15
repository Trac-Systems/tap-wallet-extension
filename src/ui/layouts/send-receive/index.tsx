import React from 'react';
import './index.css';

interface ILayoutProps {
  header?: React.ReactNode;
  body?: React.ReactNode;
  footer?: React.ReactNode;
}
const LayoutSendReceive = (props: ILayoutProps) => {
  const {header, body, footer} = props;
  return (
    <div className="container_sr">
      <header className="header_sr">{header}</header>
      <body className="body_sr">{body}</body>
      <footer className="footer_sr">{footer}</footer>
    </div>
  );
};

export default LayoutSendReceive;
