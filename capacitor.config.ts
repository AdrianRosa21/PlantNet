import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cultivia.app',
  appName: 'CultivIA',
  webDir: 'out',
  server: {
    // Al usar "npm run dev:mobile", Next.js corre aquí localmente:
    url: 'http://192.168.1.7:9002', 
    cleartext: true
  }
};

export default config;
