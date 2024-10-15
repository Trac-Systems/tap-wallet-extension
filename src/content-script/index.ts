import {nanoid} from 'nanoid';
import BroadcastChannelMessage from '../gateway/message/broadcast-chanel';
import PortMessage from '../gateway/message/port-message';
import browser from 'webextension-polyfill';

const channelName = nanoid();

function injectScript() {
  try {
    const container = document.head || document.documentElement;
    const scriptTag = document.createElement('script');
    scriptTag.setAttribute('async', 'false');
    scriptTag.setAttribute('channel', channelName);
    scriptTag.src = browser.runtime.getURL(
      'assets/tap-script.js',
    )
    container.insertBefore(scriptTag, container.children[0]);
    container.removeChild(scriptTag);

    const pm = new PortMessage().connect();

    const bcm = new BroadcastChannelMessage(channelName).listen(data =>
      pm.request(data),
    );

    // background notification
    pm.on('message', data => {
      bcm.send('message', data);
    });

    document.addEventListener('beforeunload', () => {
      bcm.dispose();
      pm.dispose();
    });
  } catch (error) {
    console.error('Provider injection failed.', error);
  }
}

function doctypeCheck(): boolean {
  const {doctype} = window.document;
  if (doctype) {
    return doctype.name === 'html';
  }
  return true;
}

function suffixCheck() {
  const prohibitedTypes = [/\.xml$/u, /\.pdf$/u];
  const currentUrl = window.location.pathname;
  for (let i = 0; i < prohibitedTypes.length; i++) {
    if (prohibitedTypes[i].test(currentUrl)) {
      return false;
    }
  }
  return true;
}

function documentElementCheck() {
  const documentElement = document.documentElement.nodeName;
  if (documentElement) {
    return documentElement.toLowerCase() === 'html';
  }
  return true;
}

function blockedDomainCheck() {
  const blockedDomains: string[] = [];
  const currentUrl = window.location.href;
  let currentRegex;
  for (let i = 0; i < blockedDomains.length; i++) {
    const blockedDomain = blockedDomains[i].replace('.', '\\.');
    currentRegex = new RegExp(
      `(?:https?:\\/\\/)(?:(?!${blockedDomain}).)*$`,
      'u',
    );
    if (!currentRegex.test(currentUrl)) {
      return true;
    }
  }
  return false;
}

function iframeCheck() {
  const isInIframe = self != top;
  if (isInIframe) {
    return true;
  } else {
    return false;
  }
}

function shouldInjectProvider() {
  return (
    doctypeCheck() &&
    suffixCheck() &&
    documentElementCheck() &&
    !blockedDomainCheck() &&
    !iframeCheck()
  );
}

if (shouldInjectProvider()) {
  injectScript();
}
