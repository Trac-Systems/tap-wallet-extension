import BigNumber from 'bignumber.js';

export const copyToClipboard = (textToCopy: string | number) => {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(textToCopy.toString());
  } else {
    // Fallback for older browsers or non-secure contexts
    const textArea = document.createElement('textarea');
    textArea.value = textToCopy.toString();
    textArea.style.position = 'absolute';
    textArea.style.opacity = '0';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    return new Promise<void>((res, rej) => {
      try {
        // Note: execCommand is deprecated but necessary for backward compatibility
        const successful = document.execCommand('copy');
        if (successful) {
          res();
        } else {
          rej(new Error('Copy command was unsuccessful'));
        }
      } catch (err) {
        rej(err);
      } finally {
        textArea.remove();
      }
    });
  }
};

export function formatArray(arr: number[]) {
  if (arr.length === 0) return '';
  if (arr.length === 1) return `${arr[0]}`;
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  return `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`;
}

export function shortAddress(address?: string, len = 5) {
  if (!address) return '';
  if (address.length <= len * 2) return address;
  return address.slice(0, len) + '...' + address.slice(address.length - len);
}

export function satoshisToAmount(val: number = 0): string {
  const num = new BigNumber(val);
  return num.dividedBy(100000000).toFixed(8);
}

export const linkDetail = 'https://www.tapalytics.xyz/unat'
