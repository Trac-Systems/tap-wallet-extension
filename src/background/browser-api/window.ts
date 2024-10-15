/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {EventEmitter} from 'events';
import browser from 'webextension-polyfill';

const event = new EventEmitter();

browser.windows.onFocusChanged.addListener(winId => {
  event.emit('windowFocusChange', winId);
});

browser.windows.onRemoved.addListener(winId => {
  event.emit('windowRemoved', winId);
});

const IS_WINDOWS = /windows/i.test(navigator.userAgent);

const BROWSER_HEADER = 80;
const WINDOW_SIZE = {
  width: 400 + (IS_WINDOWS ? 14 : 0),
  height: 600,
};

const browserWindowsGetCurrent = async (
  params?: browser.Windows.GetAllGetInfoType,
) => {
  if (!params) {
    return await browser.windows.getCurrent();
  }
  return await browser.windows.getCurrent(params);
};
const browserWindowsCreate = async (params?: browser.Windows.CreateCreateDataType) => {
  if (!params) {
    return await browser.windows.create();
  }
  return await browser.windows.create(params);
};

const browserWindowsRemove = async (windowId: number) => {
  await browser.windows.remove(windowId);
};

const create = async ({url, ...rest}): Promise<number | undefined> => {
  const {
    top: cTop,
    left: cLeft,
    width,
  } = await browserWindowsGetCurrent({
    windowTypes: ['normal'],
  });

  const top = cTop! + BROWSER_HEADER;
  const left = cLeft! + width! - WINDOW_SIZE.width;

  const currentWindow = await browserWindowsGetCurrent();
  let win;
  if (currentWindow.state === 'fullscreen') {
    // browser.windows.create not pass state to chrome
    win = await browserWindowsCreate({
      focused: true,
      url,
      type: 'popup',
      ...rest,
      width: undefined,
      height: undefined,
      left: undefined,
      top: undefined,
      state: 'fullscreen',
    });
  } else {
    win = await browserWindowsCreate({
      focused: true,
      url,
      type: 'popup',
      top,
      left,
      ...WINDOW_SIZE,
      ...rest,
    });
  }

  return win.id;
};

const remove = async winId => {
  return browserWindowsRemove(winId);
};

const openNotification = ({route = '', ...rest} = {}): Promise<
  number | undefined
> => {
  const url = `notification.html${route && `#${route}`}`;

  return create({url, ...rest});
};

export default {
  openNotification,
  event,
  remove,
};
