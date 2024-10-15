import BroadcastChannelMessage from './message/broadcast-chanel';
import PortMessage from './message/port-message';
import browser from 'webextension-polyfill';

export const Message = {
  BroadcastChannelMessage,
  PortMessage,
};

export const sendReadyMessageToTabs = async () => {
  const tabs = await browser.tabs
    .query({
      url: '<all_urls>',
      windowType: 'normal',
    })
    .then((result: any) => {
      return result;
    })
    .catch((e: any) => {
      console.error(e);
      throw e;
    });

  /** @todo we should only sendMessage to dapp tabs, not all tabs. */
  for (const tab of tabs) {
    if (tab.id != null) {
      browser.tabs
        .sendMessage(tab.id, {
          name: 'EXTENSION_MESSAGES.READY',
        })
        .then(() => {
          // console.log('sendReadyMessageToTabs', tab);
        })
        .catch((error: any) => {
          console.log('🚀 ~ sendReadyMessageToTabs ~ error:', error);
        });
    }
  }
};
