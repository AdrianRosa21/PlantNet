'use client';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { useAdMob } from '@/components/admob-provider';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

interface BannerAdProps {
  position?: 'top' | 'bottom';
  size?: 'BANNER' | 'LARGE_BANNER' | 'MEDIUM_RECTANGLE' | 'FULL_BANNER' | 'LEADERBOARD';
  margin?: number;
}

export default function BannerAd({ position = 'bottom', size = 'BANNER', margin = 0 }: BannerAdProps) {
  // Desactivado por petición del usuario: los anuncios se ven mal.
  return null;
}
