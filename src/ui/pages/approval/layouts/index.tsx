import React from 'react';
import './index.css';

interface ILayoutProps {
  header?: React.ReactNode;
  body?: React.ReactNode;
  footer?: React.ReactNode;
}
const LayoutApprove = (props: ILayoutProps) => {
  const {header, body, footer} = props;
  return (
    <div className="container_ap">
      <header className="header_ap">{header}</header>
      <body className="body_ap">{body}</body>
      <footer className="footer_ap">{footer}</footer>
    </div>
  );
};

export default LayoutApprove;
