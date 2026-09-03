import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.opentrackerfi.app',
  appName: 'OpenTrackerFi',
  webDir: 'dist-mobile',
  android: { allowMixedContent: false },
};

export default config;
