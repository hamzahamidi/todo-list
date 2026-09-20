import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.todo.list',
  appName: 'Todo List',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
    },
    FirebaseAuthentication: {
      // AuthService signs in through the JS SDK with the credential this plugin
      // returns, so the plugin must not establish a native session of its own.
      skipNativeAuth: true,
      providers: ['google.com'],
    },
  },
};

export default config;
