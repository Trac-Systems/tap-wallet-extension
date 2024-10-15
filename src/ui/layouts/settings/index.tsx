import React from 'react';
import './index.css';

interface ILayoutProps {
  header?: React.ReactNode;
  body?: React.ReactNode;
  footer?: React.ReactNode;
}
const LayoutScreenSettings = (props: ILayoutProps) => {
  const {header, body, footer} = props;
  return (
    <div className="container_setting">
      <header className="header_setting">{header}</header>
      <body className="body_setting">{body}</body>
      <footer className="footer_setting">{footer}</footer>
    </div>
  );
};

export default LayoutScreenSettings;
