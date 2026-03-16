"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-white">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <div className="w-12 h-12 bg-primary rounded-xl rotate-45 flex items-center justify-center shadow-lg">
           <span className="text-white text-2xl font-bold -rotate-45">A</span>
        </div>
      </div>
      <h1 className="text-2xl font-bold text-primary mb-2">AgroAlerta IA</h1>
      <p className="text-muted-foreground animate-pulse">Cargando...</p>
    </div>
  );
}