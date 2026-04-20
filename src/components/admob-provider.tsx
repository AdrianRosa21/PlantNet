'use client';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { AdMob } from '@capacitor-community/admob';

export default function AdMobProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Solo inicializa AdMob si realmente estamos en el celular
    if (Capacitor.isNativePlatform()) {
      const initAdMob = async () => {
        try {
          await AdMob.initialize({
            testingDevices: ['2077ef9a63d2b398840261c8221a0c9b'], // Puedes quitar esto después
            initializeForTesting: true,
          });
          console.log('AdMob inicializado exitosamente');
          setIsInitialized(true);
        } catch (err) {
          console.error('Error al inicializar AdMob:', err);
        }
      };
      
      initAdMob();
    } else {
      console.log('El entorno web estándar de navegador (Chrome/Edge en la compu) ignora AdMob.');
    }
  }, []);

  return <>{children}</>;
}
