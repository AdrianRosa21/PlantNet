"use client";

import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { Leaf, Sprout, Droplet, Calendar, MessageSquare, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center relative overflow-hidden font-body selection:bg-primary/20">
      
      {/* Background Decorators - Friendly, premium, light vibe */}
      <div className="absolute top-0 w-full h-[600px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-40 w-[600px] h-[600px] bg-green-300/20 rounded-full blur-3xl pointer-events-none" />

      {/* Navbar / Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md rotate-3 transition-transform hover:rotate-6">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-800 tracking-tight">
            Cultiv<span className="text-primary">IA</span>
          </span>
        </div>
        
        {mounted && !isUserLoading && (
          <div>
            {user ? (
              <Link 
                href="/dashboard"
                className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-slate-200 px-5 py-2.5 rounded-full text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                Ir a mi panel
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  href="/login"
                  className="hidden sm:flex text-sm font-bold text-foreground/70 hover:text-primary transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link 
                  href="/register"
                  className="flex items-center gap-2 bg-primary px-5 py-2.5 rounded-full text-sm font-bold text-primary-foreground hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 transition-all shadow-sm"
                >
                  Crear Cuenta
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-6xl mx-auto px-6 pt-16 pb-24 relative z-10 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-background/80 shadow-sm backdrop-blur-md text-foreground font-bold text-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span>Cultiva con tecnología accesible</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-foreground drop-shadow-sm tracking-tight mb-8 max-w-4xl leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          Tu asistente digital <br className="hidden md:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-800 drop-shadow-sm">para el campo.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-foreground/80 font-medium mb-12 max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          CultivIA acompaña a pequeños y medianos productores, facilitando la identificación de problemas, el registro diario de tus cultivos y recomendaciones prácticas. Todo al alcance de tu mano.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
          <Link
            href={user ? "/dashboard" : "/register"}
            className="w-full sm:w-auto px-10 py-5 bg-primary text-primary-foreground rounded-full font-black text-lg shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:bg-primary/90 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Empezar ahora gratis
            <ChevronRight className="w-6 h-6" />
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-28 w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
          
          <div className="bg-background/80 backdrop-blur-xl border border-primary/10 p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-1 hover:bg-background/90 text-left group">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-inner border border-emerald-100">
              <MessageSquare className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-lg font-black text-foreground tracking-tight mb-2">Consulta Orientativa</h3>
            <p className="text-foreground/70 font-medium text-sm leading-relaxed">Habla o escribe para identificar problemas en tus plantas o para recibir orientación oportuna.</p>
          </div>

          <div className="bg-background/80 backdrop-blur-xl border border-primary/10 p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-1 hover:bg-background/90 text-left group">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-inner border border-blue-100">
              <Sprout className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-lg font-black text-foreground tracking-tight mb-2">Recomendaciones IA</h3>
            <p className="text-foreground/70 font-medium text-sm leading-relaxed">Recibe consejos diarios adaptados al tipo de cultivo y las condiciones climáticas de tu ubicación.</p>
          </div>

          <div className="bg-background/80 backdrop-blur-xl border border-primary/10 p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-1 hover:bg-background/90 text-left group">
            <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-inner border border-sky-100">
              <Droplet className="w-7 h-7 text-sky-500" />
            </div>
            <h3 className="text-lg font-black text-foreground tracking-tight mb-2">Control Visual</h3>
            <p className="text-foreground/70 font-medium text-sm leading-relaxed">Registra de forma intuitiva el riego manual y sigue de cerca la hidratación de tus cultivos cada día.</p>
          </div>

          <div className="bg-background/80 backdrop-blur-xl border border-primary/10 p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-1 hover:bg-background/90 text-left group">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-inner border border-amber-100">
              <Calendar className="w-7 h-7 text-amber-500" />
            </div>
            <h3 className="text-lg font-black text-foreground tracking-tight mb-2">Registro de Notas</h3>
            <p className="text-foreground/70 font-medium text-sm leading-relaxed">Lleva un registro diario de las actividades y eventos importantes utilizando el calendario integrado.</p>
          </div>

        </div>
      </main>

      {/* Footer minimalista */}
      <footer className="w-full text-center py-8 text-slate-400 text-sm mt-auto relative z-10">
        &copy; {new Date().getFullYear()} CultivIA. Simplificando la agricultura.
      </footer>
    </div>
  );
}
