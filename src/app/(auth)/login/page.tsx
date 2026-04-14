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
import { Leaf, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        description: "Iniciando tu entorno de trabajo...",
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

  const handleGoogleLogin = () => {
    toast({
      title: "Próximamente",
      description: "La integración con Google estará lista en la versión final.",
    });
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-background overflow-hidden">
      
      {/* BACKGROUND PREMIUM (Bubbly / Mesh Gradient) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[100px] mix-blend-multiply animate-pulse" />
        <div className="absolute top-[30%] -right-[15%] w-[60%] h-[60%] rounded-full bg-secondary/30 blur-[120px] mix-blend-multiply opacity-70" />
        <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-muted/40 blur-[100px] mix-blend-multiply opacity-50" />
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[50px] z-0" />
      </div>

      {/* Tarjeta Glassmorphic */}
      <div className="relative z-10 w-full max-w-[400px] animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
        <div className="bg-white/70 backdrop-blur-3xl rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/60">
          
          {/* Cabecera WOW */}
          <div className="flex flex-col items-center text-center space-y-3 mb-8 mt-2">
            <div className="relative w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 mb-2 before:absolute before:inset-0 before:bg-white/20 before:rounded-2xl before:scale-105 before:animate-ping before:duration-3000">
              <Leaf className="text-primary-foreground w-8 h-8 relative z-10" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground pb-1">
                AgroAlerta IA
              </h1>
              <p className="text-foreground/70 text-sm font-medium mt-1">
                Tu agrónomo personal impulsado por IA
              </p>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/90 font-semibold text-[13px] ml-1">Correo electrónico</Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="productor@ejemplo.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-11 h-12 bg-white/50 border-white/80 rounded-xl text-foreground placeholder:text-muted-foreground focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all font-medium text-[15px]"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-foreground/90 font-semibold text-[13px]">Contraseña</Label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`pl-11 pr-11 h-12 bg-white/50 border-white/80 rounded-xl text-foreground placeholder:text-muted-foreground placeholder:tracking-normal focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all text-lg ${!showPassword && password.length > 0 ? "tracking-widest" : "tracking-normal"}`}
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-primary focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl text-[15px] font-bold mt-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all border-none relative overflow-hidden group" 
              disabled={isLoading}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin relative z-10" />
                  <span className="relative z-10">Conectando...</span>
                </>
              ) : (
                <span className="relative z-10 flex items-center gap-2">Ingresar Ahora</span>
              )}
            </Button>
          </form>

          {/* Social Auth (WOW Effect Mock) */}
          <div className="mt-6">
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200/70"></div>
              <span className="flex-shrink-0 mx-3 text-foreground/60 text-xs font-medium uppercase tracking-wide">O continuar con</span>
              <div className="flex-grow border-t border-slate-200/70"></div>
            </div>

            <Button 
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full h-12 mt-6 rounded-xl font-semibold bg-white hover:bg-background text-foreground border-slate-200 shadow-sm transition-all"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                <path d="M1 1h22v22H1z" fill="none"/>
              </svg>
              Google
            </Button>
          </div>

          {/* Pie de página */}
          <div className="mt-8 text-center text-[13px] text-foreground/60 font-medium">
            ¿Aún no tienes cuenta?{" "}
            <Link href="/register" className="text-primary font-bold hover:text-primary/80 hover:underline underline-offset-4 transition-all">
              Regístrate y comienza tu huerto
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
