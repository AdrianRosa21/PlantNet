"use client";

import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Pantalla de inicio de la aplicación.
 * Redirige automáticamente al panel si el usuario está autenticado,
 * o a la pantalla de inicio de sesión en caso contrario.
 */
export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Solo redirigimos cuando Firebase ha terminado de verificar el estado inicial
    if (!isUserLoading) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [user, isUserLoading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-white">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <div className="w-12 h-12 bg-primary rounded-xl rotate-45 flex items-center justify-center shadow-lg">
           <span className="text-white text-2xl font-bold -rotate-45">A</span>
        </div>
      </div>
      <h1 className="text-2xl font-bold text-primary mb-2">AgroAlerta IA</h1>
      <p className="text-muted-foreground animate-pulse">Iniciando sistema agrícola...</p>
    </div>
  );
}
