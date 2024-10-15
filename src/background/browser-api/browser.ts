import browser from 'webextension-polyfill';

export async function createTabs(params: any) {
  return await browser.tabs.create(params);
}
