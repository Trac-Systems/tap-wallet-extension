import React from 'react';

interface DeleteWalletIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const DeleteWalletIcon: React.FC<DeleteWalletIconProps> = ({
  width = 25,
  height = 24,
  color = '#EB5757',
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 25 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3.5 5C2.94772 5 2.5 5.44772 2.5 6C2.5 6.55228 2.94772 7 3.5 7V5ZM21.5 7C22.0523 7 22.5 6.55228 22.5 6C22.5 5.44772 22.0523 5 21.5 5V7ZM11.5 11C11.5 10.4477 11.0523 10 10.5 10C9.94772 10 9.5 10.4477 9.5 11H11.5ZM9.5 16C9.5 16.5523 9.94772 17 10.5 17C11.0523 17 11.5 16.5523 11.5 16H9.5ZM15.5 11C15.5 10.4477 15.0523 10 14.5 10C13.9477 10 13.5 10.4477 13.5 11H15.5ZM13.5 16C13.5 16.5523 13.9477 17 14.5 17C15.0523 17 15.5 16.5523 15.5 16H13.5ZM15.4056 6.24926C15.5432 6.78411 16.0884 7.1061 16.6233 6.96844C17.1581 6.83078 17.4801 6.28559 17.3424 5.75074L15.4056 6.24926ZM4.50221 6.06652L5.37775 19.1996L7.37332 19.0665L6.49779 5.93348L4.50221 6.06652ZM8.37111 22H16.6289V20H8.37111V22ZM19.6222 19.1996L20.4978 6.06652L18.5022 5.93348L17.6267 19.0665L19.6222 19.1996ZM19.5 5H5.5V7H19.5V5ZM3.5 7H5.5V5H3.5V7ZM19.5 7H21.5V5H19.5V7ZM16.6289 22C18.2083 22 19.5172 20.7754 19.6222 19.1996L17.6267 19.0665C17.5917 19.5918 17.1554 20 16.6289 20V22ZM5.37775 19.1996C5.48281 20.7754 6.79171 22 8.37111 22V20C7.84464 20 7.40834 19.5918 7.37332 19.0665L5.37775 19.1996ZM9.5 11V16H11.5V11H9.5ZM13.5 11V16H15.5V11H13.5ZM12.5 4C13.8965 4 15.0725 4.95512 15.4056 6.24926L17.3424 5.75074C16.7874 3.59442 14.8312 2 12.5 2V4ZM9.59447 6.24926C9.92756 4.95512 11.1035 4 12.5 4V2C10.1688 2 8.2126 3.59442 7.6576 5.75074L9.59447 6.24926Z"
      fill={color}
    />
  </svg>
);

export default DeleteWalletIcon;
