let cacheMap = new Map();
import browser from 'webextension-polyfill';

const get = async (prop: string) => {
  if (!chrome?.storage) {
    console.log('Storage are not working');
    return;
  }
  if (cacheMap && cacheMap[prop]) {
    return cacheMap.get(prop);
  }
  const result: any = await new Promise((resolve, reject) => {
    browser.storage.local
      .get(null)
      .then(res => {
        cacheMap = new Map(Object.entries(res).map(([k, v]) => [k, v]));
        const result = res[prop];
        resolve(result);
      })
      .catch(e => {
        reject(e);
      });
  });

  return result;
};

const set = async (prop: string, value): Promise<void> => {
  if (!browser?.storage) {
    console.log('Storage are not working');
    return;
  }
  await browser.storage.local.set({[prop]: value});
  cacheMap.set(prop, value);
};

export default {
  get,
  set,
};
