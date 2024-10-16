import React from 'react';

interface BitcoinIconProps {
  width?: number;
  height?: number;
}

const BitcoinIcon: React.FC<BitcoinIconProps> = ({width = 25, height = 24}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 25 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <path
      d="M24.1207 14.9263C22.518 21.3549 16.0069 25.2673 9.57745 23.6642C3.15075 22.0615 -0.761586 15.5499 0.841804 9.1218C2.44379 2.69247 8.95495 -1.22017 15.3824 0.382518C21.8113 1.9852 25.7234 8.49748 24.1205 14.9264L24.1206 14.9263H24.1207Z"
      fill="#F7931A"
    />
    <path
      d="M17.7871 10.2933C18.026 8.69633 16.8102 7.83791 15.1477 7.26526L15.687 5.10207L14.3702 4.77396L13.8452 6.88019C13.499 6.79385 13.1435 6.7125 12.7901 6.63185L13.319 4.51171L12.003 4.18359L11.4634 6.34608C11.1769 6.28086 10.8955 6.2164 10.6226 6.14847L10.6241 6.14167L8.80818 5.68821L8.4579 7.09464C8.4579 7.09464 9.43485 7.31858 9.41426 7.33236C9.9475 7.46545 10.0439 7.81844 10.0279 8.09822L9.41356 10.5626C9.45028 10.5719 9.49791 10.5854 9.55046 10.6065C9.50653 10.5956 9.45978 10.5837 9.41127 10.5721L8.55016 14.0244C8.48499 14.1864 8.31959 14.4295 7.94678 14.3372C7.95997 14.3563 6.98971 14.0983 6.98971 14.0983L6.33594 15.6056L8.04954 16.0328C8.36833 16.1128 8.68073 16.1964 8.98837 16.2751L8.44347 18.4631L9.75874 18.7912L10.2984 16.6264C10.6577 16.724 11.0064 16.8139 11.3478 16.8987L10.81 19.0533L12.1268 19.3814L12.6717 17.1975C14.9171 17.6225 16.6055 17.4512 17.3161 15.4202C17.8888 13.785 17.2876 12.8418 16.1063 12.2268C16.9667 12.0283 17.6148 11.4624 17.7876 10.2934L17.7872 10.2931L17.7871 10.2933ZM14.7785 14.5121C14.3716 16.1473 11.6185 15.2633 10.7258 15.0417L11.4489 12.1429C12.3415 12.3658 15.2039 12.8067 14.7786 14.5121H14.7785ZM15.1858 10.2696C14.8146 11.7569 12.5231 11.0013 11.7798 10.816L12.4353 8.18703C13.1787 8.37232 15.5725 8.71815 15.1859 10.2696H15.1858Z"
      fill="white"
    />
  </svg>
);

export default BitcoinIcon;