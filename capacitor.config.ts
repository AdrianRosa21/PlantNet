import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cultivia.app',
  appName: 'CultivIA',
  webDir: 'out',
  server: {
    // Para desarrollo local, descomenta esta línea:
    // url: 'http://192.168.1.7:9002',
    // PRODUCCIÓN — dominio de Firebase App Hosting:
    url: 'https://cultivia-app--studio-9525092173-1991a.us-east4.hosted.app',
    cleartext: false
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
    }
  }
};

export default config;
