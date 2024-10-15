import React from 'react';
import './index.css';
interface ILayoutProps {
  body?: React.ReactNode;
  navbar?: React.ReactNode;
}
const LayoutScreenHome = (props: ILayoutProps) => {
  const {body, navbar} = props;
  return (
    <div className="container_home">
      <body className="body_home">{body}</body>
      <footer className="footer_home">{navbar}</footer>
    </div>
  );
};

export default LayoutScreenHome;
