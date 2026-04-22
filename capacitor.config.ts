import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cultivia.app',
  appName: 'CultivIA',
  webDir: 'out',
  server: {
    // Al usar "npm run dev:mobile", Next.js corre aquí localmente (ideal para programar):
    url: 'http://192.168.1.7:9002', 
    // Cuando vayas a exportar tu app FINAL para la Play Store, comenta la línea de arriba y descomenta esta:
    // url: 'https://cultivia-app--studio-9525092173-1991a.us-east4.hosted.app',
    cleartext: true
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
    }
  }
};

export default config;
