import browser from 'webextension-polyfill';

export const EXTENSION_UPDATE_STORAGE_KEY =
  'EXTENSION_UPDATE_AVAILABLE_VERSION';

export const getCurrentExtensionVersion = () => {
  return (
    browser.runtime.getManifest().version_name ??
    browser.runtime.getManifest().version
  );
};

export const getStoredExtensionUpdateVersion = async () => {
  const storedUpdate = await browser.storage.local.get(
    EXTENSION_UPDATE_STORAGE_KEY,
  );

  return storedUpdate?.[EXTENSION_UPDATE_STORAGE_KEY] ?? '';
};

export const requestExtensionUpdateCheck = async () => {
  const [status, details] = await browser.runtime.requestUpdateCheck();

  if (status === 'update_available' && details?.version) {
    await browser.storage.local.set({
      [EXTENSION_UPDATE_STORAGE_KEY]: details.version,
    });
  }

  return {
    status,
    version: details?.version ?? '',
  };
};
