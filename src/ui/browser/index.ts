import {isEmpty} from 'lodash';
import {useCallback} from 'react';
import {createTabs} from '../../background/browser-api/browser';
import browser from 'webextension-polyfill';

export const useIsTabOpen = () => {
  return useCallback(async () => {
    const tabs = await browser.tabs.getCurrent();
    if (isEmpty(tabs)) {
      return false;
    }
    return true;
  }, []);
};

export const useOpenInTab = () => {
  return useCallback(async () => {
    const url = browser.runtime.getURL('index.html');
    await createTabs({url});
    window.close();
  }, []);
};
