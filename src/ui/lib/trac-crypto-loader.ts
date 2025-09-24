// Runtime shim to avoid platform detection crashes inside the browser bundle
const g: any = globalThis as any;
if (typeof g.process !== 'object' || !g.process) {
  g.process = { platform: 'browser', arch: 'unknown', versions: {} };
} else {
  if (typeof g.process.platform === 'undefined') g.process.platform = 'browser';
  if (typeof g.process.arch === 'undefined') g.process.arch = 'unknown';
  if (typeof g.process.versions === 'undefined') g.process.versions = {};
}

(async () => {
  try {
    // @ts-ignore dynamic import is supported by bundler
    const mod = await import('trac-crypto-api/dist/trac-crypto-api.browser.js');
    const api = (mod as any).default ?? (mod as any);
    const w = window as unknown as Record<string, any>;
    if (!w.TracCryptoApi) w.TracCryptoApi = api;
  } catch (e) {
    console.error('Failed to load trac-crypto-api bundle', e);
  }
})();

export {};


