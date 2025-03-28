import {defineManifest} from '@crxjs/vite-plugin';
import packageJson from './package.json';
const {version} = packageJson;

// Convert from Semver (example: 0.1.0-beta6)
const [major, minor, patch, label = '0'] = version
  // can only contain digits, dots, or dash
  .replace(/[^\d.-]+/g, '')
  // split into version parts
  .split(/[.-]/);

export default defineManifest(async env => ({
  manifest_version: 3,
  name: 'TAP Wallet',
  // up to four numbers separated by dots
  version: `${major}.${minor}.${patch}.${label}`,
  version_name: version,
  action: {default_popup: 'index.html'},
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  description: "The official wallet of the TAP Protocol project.",
  content_scripts: [
    {
      matches: ['<all_urls>'],
      exclude_matches: ['*://docs.google.com/*'],
      js: ['src/content-script/index.ts'],
      run_at: 'document_start',
      all_frames: true,
    },
  ],
  web_accessible_resources: [
    {
      resources: ['assets/*'],
      matches: ['<all_urls>'],
    },
  ],
  permissions: ['storage', 'unlimitedStorage', 'activeTab'],
  icons: {
    '16': 'images/logo.png',
    '48': 'images/logo.png',
    '128': 'images/logo.png',
  },
}));
