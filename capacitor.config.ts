import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.todo.list',
  appName: 'Todo List',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
    },
  },
};

export default config;
