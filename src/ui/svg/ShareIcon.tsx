import React from 'react';

interface ShareIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const ShareIcon: React.FC<ShareIconProps> = ({
  width = 21,
  height = 20,
  color = 'white',
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 21 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.7544 5.36081L13.3603 5.54602L7.4303 8.33269L7.0788 8.49787L6.8318 8.19816C6.46063 7.74781 5.95946 7.42306 5.39677 7.26829C4.83408 7.11352 4.23732 7.13627 3.68805 7.33345C3.13878 7.53063 2.66379 7.8926 2.32801 8.36991C1.99222 8.84722 1.81201 9.41657 1.81201 10.0002C1.81201 10.5838 1.99222 11.1531 2.32801 11.6304C2.66379 12.1077 3.13878 12.4697 3.68805 12.6669C4.23732 12.8641 4.83408 12.8868 5.39677 12.732C5.95946 12.5773 6.46063 12.2525 6.8318 11.8022L7.0788 11.5025L7.4303 11.6676L13.3603 14.4543L13.7544 14.6395L13.6251 15.0553C13.5462 15.3088 13.5042 15.5722 13.5001 15.8376C13.4992 16.4935 13.7252 17.1295 14.1397 17.6378C14.5549 18.1469 15.1337 18.4964 15.7775 18.6268C16.4213 18.7572 17.0904 18.6606 17.671 18.3533C18.2516 18.0461 18.7079 17.5471 18.9621 16.9414C19.2163 16.3357 19.2528 15.6606 19.0654 15.031C18.878 14.4014 18.4782 13.8562 17.9341 13.4881C17.39 13.12 16.7352 12.9518 16.0811 13.012C15.427 13.0723 14.8139 13.3573 14.3463 13.8186L14.0981 14.0634L13.7825 13.9152L7.72503 11.0694L7.3688 10.902L7.44782 10.5164C7.51759 10.1761 7.51759 9.82509 7.44782 9.48472L7.3688 9.09919L7.72498 8.93181L13.7825 6.08514L14.0987 5.93652L14.347 6.18244C14.8756 6.70604 15.5895 6.99989 16.3335 7.00016L13.7544 5.36081ZM13.7544 5.36081L13.6251 4.94499M13.7544 5.36081L13.6251 4.94499M13.6251 4.94499C13.5463 4.69172 13.5042 4.42847 13.5001 4.16327C13.5008 3.60413 13.667 3.05767 13.9776 2.59272C14.289 2.12678 14.7315 1.76362 15.2492 1.54917C15.7669 1.33472 16.3366 1.27861 16.8862 1.38794C17.4358 1.49726 17.9407 1.76711 18.3369 2.16336C18.7332 2.55961 19.003 3.06446 19.1124 3.61408C19.2217 4.16369 19.1656 4.73338 18.9511 5.2511C18.7367 5.76882 18.3735 6.21133 17.9076 6.52266C17.4417 6.83396 16.894 7.00013 16.3336 7.00016L13.6251 4.94499ZM17.5372 2.36531C17.1809 2.12724 16.762 2.00016 16.3335 2.00016C15.7588 2.00016 15.2077 2.22844 14.8014 2.63477C14.3951 3.04109 14.1668 3.5922 14.1668 4.16683C14.1668 4.59536 14.2939 5.01426 14.532 5.37057C14.77 5.72687 15.1084 6.00458 15.5043 6.16857C15.9002 6.33256 16.3359 6.37547 16.7562 6.29187C17.1765 6.20826 17.5625 6.00191 17.8655 5.6989C18.1686 5.39588 18.3749 5.00982 18.4585 4.58953C18.5421 4.16923 18.4992 3.73359 18.3352 3.33768C18.1712 2.94178 17.8935 2.60339 17.5372 2.36531ZM3.46307 11.8017C3.81938 12.0398 4.23828 12.1668 4.66681 12.1668C5.24144 12.1668 5.79254 11.9386 6.19887 11.5322C6.6052 11.1259 6.83348 10.5748 6.83348 10.0002C6.83348 9.57164 6.7064 9.15273 6.46833 8.79643C6.23025 8.44012 5.89186 8.16242 5.49596 7.99843C5.10005 7.83443 4.66441 7.79153 4.24411 7.87513C3.82382 7.95873 3.43776 8.16509 3.13474 8.4681C2.83173 8.77111 2.62538 9.15718 2.54177 9.57747C2.45817 9.99776 2.50108 10.4334 2.66507 10.8293C2.82906 11.2252 3.10677 11.5636 3.46307 11.8017ZM17.5372 14.032C17.1809 13.7939 16.762 13.6668 16.3335 13.6668C15.7588 13.6668 15.2077 13.8951 14.8014 14.3014C14.3951 14.7078 14.1668 15.2589 14.1668 15.8335C14.1668 16.262 14.2939 16.6809 14.532 17.0372C14.77 17.3935 15.1084 17.6712 15.5043 17.8352C15.9002 17.9992 16.3359 18.0421 16.7562 17.9585C17.1765 17.8749 17.5625 17.6685 17.8655 17.3655C18.1686 17.0625 18.3749 16.6764 18.4585 16.2561C18.5421 15.8358 18.4992 15.4001 18.3352 15.0042C18.1712 14.6083 17.8935 14.2699 17.5372 14.032ZM13.6251 15.0553L13.7544 14.6395M13.6251 15.0553L13.7544 14.6395M13.6251 15.0553L13.7544 14.6395M13.6251 15.0553L13.7544 14.6395Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default ShareIcon;
