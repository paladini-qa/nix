import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nix.finance',
  appName: 'Nix',
  webDir: 'dist',
  android: {
    backgroundColor: '#ffffff',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
  },
};

export default config;

