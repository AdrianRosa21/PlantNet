import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import AdMobProvider from '@/components/admob-provider';

export const metadata: Metadata = {
  title: 'AgroAlerta IA - Asistente Agrícola',
  description: 'App para el monitoreo y cuidado inteligente de cultivos',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-slate-100 min-h-screen">
        <FirebaseClientProvider>
          <AdMobProvider>
            <div className="mobile-container">
              {children}
            </div>
          </AdMobProvider>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
