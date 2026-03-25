"use client";

import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Leaf, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "¡Bienvenido de vuelta!",
        description: "Sesión iniciada correctamente.",
      });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de acceso",
        description: "Credenciales inválidas. Verifica tu correo y contraseña.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F5F7F2]">
      
      {/* Tarjeta de Formulario Minimalista */}
      <div className="w-full max-w-[360px] bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-[#F0F4EC]">
        
        {/* Cabecera */}
        <div className="flex flex-col items-center text-center space-y-2 mb-6 mt-1">
          <div className="w-12 h-12 bg-[#F5F7F2] rounded-full flex items-center justify-center mb-1">
            <Leaf className="text-[#2E7D32] w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#1F2937]">Ingresar a la cuenta</h1>
          <p className="text-[#6B7280] text-[13px] font-medium">
            Bienvenido de nuevo a AgroAlerta
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[#374151] font-medium text-[13px] ml-0.5">Correo electrónico</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="ejemplo@agro.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-[48px] bg-white border-[#DCE5D8] rounded-xl px-4 text-[#1F2937] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#8BC34A] focus-visible:border-[#8BC34A] transition-all shadow-sm"
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[#374151] font-medium text-[13px] ml-0.5">Contraseña</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-[48px] bg-white border-[#DCE5D8] rounded-xl px-4 text-[#1F2937] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#8BC34A] focus-visible:border-[#8BC34A] transition-all shadow-sm"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-[48px] rounded-xl text-[14px] font-bold mt-2 bg-[#2E7D32] hover:bg-[#236026] text-white shadow-md shadow-[#2E7D32]/10 transition-all border-none" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </Button>
        </form>

        {/* Pie de página */}
        <div className="mt-6 text-center text-[13px] text-[#6B7280] font-medium">
          ¿No tienes una cuenta aún?{" "}
          <Link href="/register" className="text-[#2E7D32] font-bold hover:text-[#1F5422] transition-colors">
            Regístrate aquí
          </Link>
        </div>

      </div>
    </div>
  );
}
