'use client';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';

interface BannerAdProps {
  position?: 'top' | 'bottom';
  size?: 'BANNER' | 'LARGE_BANNER' | 'MEDIUM_RECTANGLE' | 'FULL_BANNER' | 'LEADERBOARD';
  margin?: number;
}

export default function BannerAd({ position = 'bottom', size = 'BANNER', margin = 0 }: BannerAdProps) {
  const [isBannerVisible, setIsBannerVisible] = useState(false);

  useEffect(() => {
    let adShown = false;

    const showBanner = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        const adSizeMap: Record<string, BannerAdSize> = {
          'BANNER': BannerAdSize.BANNER,
          'LARGE_BANNER': BannerAdSize.LARGE_BANNER,
          'MEDIUM_RECTANGLE': BannerAdSize.MEDIUM_RECTANGLE,
          'FULL_BANNER': BannerAdSize.FULL_BANNER,
          'LEADERBOARD': BannerAdSize.LEADERBOARD,
        };

        const adPositionMap = {
          'top': BannerAdPosition.TOP_CENTER,
          'bottom': BannerAdPosition.BOTTOM_CENTER,
        };

        const options: BannerAdOptions = {
          adId: 'ca-app-pub-3940256099942544/6300978111', // Test Banner ID
          adSize: adSizeMap[size] || BannerAdSize.BANNER,
          position: adPositionMap[position] || BannerAdPosition.BOTTOM_CENTER,
          margin: margin,
          isTesting: true,
        };

        await AdMob.showBanner(options);
        adShown = true;
        setIsBannerVisible(true);
      } catch (err) {
        console.error('Error mostrando AdMob Banner:', err);
      }
    };

    showBanner();

    // Limpieza al desmontar el componente (ej. al cambiar de página)
    return () => {
      if (adShown && Capacitor.isNativePlatform()) {
        AdMob.hideBanner().catch(console.error);
        AdMob.removeBanner().catch(console.error);
      }
    };
  }, [position, size, margin]);

  if (!isBannerVisible) return null;

  // Renderiza un "placeholder" o margen en el DOM web para empujar UI si es bottom,
  // ya que AdMob se dibuja de forma NATIVA (sobre el webview), por lo que sin un margen el banner taparía botones.
  return (
    <div 
      className="w-full flex justify-center items-center pointer-events-none" 
      style={{ height: size === 'BANNER' ? '50px' : '90px' }}
    />
  );
}
