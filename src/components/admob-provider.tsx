'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { Capacitor } from '@capacitor/core';
import { AdMob } from '@capacitor-community/admob';

interface AdMobContextType {
  isInitialized: boolean;
}

const AdMobContext = createContext<AdMobContextType>({ isInitialized: false });

export const useAdMob = () => useContext(AdMobContext);

export default function AdMobProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  return (
    <AdMobContext.Provider value={{ isInitialized }}>
      {children}
    </AdMobContext.Provider>
  );
}
