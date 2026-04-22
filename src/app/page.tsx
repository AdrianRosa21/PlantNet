"use client";

import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { Leaf, Sprout, Droplet, Calendar, MessageSquare, ChevronRight, Globe2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Auto-redirección si ya está logueado
    if (!isUserLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isUserLoading, router]);

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
      <main className="w-full max-w-6xl mx-auto px-6 pt-4 pb-20 relative z-10 flex flex-col items-center text-center">
        
        <h1 className="text-[3.5rem] md:text-[5.5rem] leading-[1.05] font-black text-foreground drop-shadow-sm tracking-tighter mb-6 max-w-4xl animate-in fade-in slide-in-from-bottom-6 duration-700">
          Tu asistente digital <br className="hidden md:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-800 drop-shadow-sm">para el campo.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-foreground/80 font-medium mb-10 max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          Identifica problemas, registra tus cultivos y recibe recomendaciones prácticas con Inteligencia Artificial. Todo al alcance de tu mano.
        </p>

        {/* Botón HASTA EL TOPE */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
          <Link
            href={user ? "/dashboard" : "/register"}
            className="w-full sm:w-auto px-12 py-5 bg-primary text-primary-foreground rounded-full font-black text-xl shadow-2xl shadow-primary/40 hover:shadow-primary/60 hover:bg-primary/90 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Empezar ahora gratis
            <ChevronRight className="w-6 h-6" />
          </Link>
        </div>

        {/* Feature Cards Grid (ESTETICO Y BREVE) */}
        <div className="w-full max-w-4xl bg-white/70 backdrop-blur-2xl border border-primary/20 rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-blue-500/5 to-amber-500/5 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
          
          <h3 className="text-xl font-black text-foreground tracking-tight mb-8 relative z-10">4 herramientas en 1 sola app:</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
            <div className="flex flex-col items-center text-center gap-3 group/item">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-[1.5rem] group-hover/item:scale-110 group-hover/item:bg-emerald-100 transition-all shadow-sm"><MessageSquare className="w-7 h-7"/></div>
              <span className="text-sm font-bold text-foreground/80 leading-tight">Consultas IA</span>
            </div>
            <div className="flex flex-col items-center text-center gap-3 group/item">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-[1.5rem] group-hover/item:scale-110 group-hover/item:bg-blue-100 transition-all shadow-sm"><Sprout className="w-7 h-7"/></div>
              <span className="text-sm font-bold text-foreground/80 leading-tight">Clima y Cuidados</span>
            </div>
            <div className="flex flex-col items-center text-center gap-3 group/item">
              <div className="p-4 bg-sky-50 text-sky-500 rounded-[1.5rem] group-hover/item:scale-110 group-hover/item:bg-sky-100 transition-all shadow-sm"><Droplet className="w-7 h-7"/></div>
              <span className="text-sm font-bold text-foreground/80 leading-tight">Control de Riego</span>
            </div>
            <div className="flex flex-col items-center text-center gap-3 group/item">
              <div className="p-4 bg-amber-50 text-amber-500 rounded-[1.5rem] group-hover/item:scale-110 group-hover/item:bg-amber-100 transition-all shadow-sm"><Calendar className="w-7 h-7"/></div>
              <span className="text-sm font-bold text-foreground/80 leading-tight">Diario de Notas</span>
            </div>
          </div>
        </div>

        {/* ODS Section */}
        <div className="w-full mt-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 via-emerald-500/10 to-sky-500/10 blur-3xl rounded-[3rem] -z-10" />
          
          <div className="bg-background/60 backdrop-blur-2xl border border-primary/10 rounded-[3rem] p-8 md:p-12 shadow-[0_8px_30px_rgba(0,0,0,0.04)] text-center animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-background/80 text-foreground/80 font-bold text-sm mb-6 shadow-sm">
              <Globe2 className="w-4 h-4 text-blue-500" />
              <span>Impacto Global</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-4">
              Alineados con los <br className="md:hidden" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">Objetivos de Desarrollo Sostenible</span>
            </h2>
            <p className="text-foreground/70 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
              CultivIA no solo es tecnología, es una herramienta diseñada para crear un impacto real en el mundo, apoyando directamente la agenda 2030 de la ONU.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              
              {/* ODS 2: Hambre Cero */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-6 bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-[2rem] border border-amber-200/50 hover:shadow-xl hover:shadow-amber-500/10 transition-all hover:-translate-y-1 text-left group">
                <img src="/images/ods-2.png" alt="ODS 2 Hambre Cero" className="w-20 h-20 shrink-0 rounded-2xl shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform object-cover bg-[#dda63a]" />
                <div>
                  <h3 className="text-xl font-black text-amber-900 mb-2 tracking-tight">Hambre Cero</h3>
                  <p className="text-amber-900/70 text-sm font-medium leading-relaxed">
                    Al empoderar a los agricultores con IA, aumentamos el rendimiento de los cultivos y reducimos las pérdidas por plagas, asegurando una mayor disponibilidad de alimentos.
                  </p>
                </div>
              </div>

              {/* ODS 13: Acción por el Clima */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-6 bg-gradient-to-br from-emerald-50 to-green-50/50 rounded-[2rem] border border-emerald-200/50 hover:shadow-xl hover:shadow-emerald-500/10 transition-all hover:-translate-y-1 text-left group">
                <img src="/images/ods-13.png" alt="ODS 13 Acción por el Clima" className="w-20 h-20 shrink-0 rounded-2xl shadow-lg shadow-emerald-700/30 group-hover:scale-105 transition-transform object-cover bg-[#3f7e44]" />
                <div>
                  <h3 className="text-xl font-black text-emerald-900 mb-2 tracking-tight">Acción por el Clima</h3>
                  <p className="text-emerald-900/70 text-sm font-medium leading-relaxed">
                    Fomentamos prácticas agrícolas sostenibles y la optimización de recursos, ayudando al campo a adaptarse y mitigar los efectos del cambio climático.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Botón POR ÚLTIMO */}
        <div className="mt-16 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-700 w-full flex justify-center">
          <Link
            href={user ? "/dashboard" : "/register"}
            className="px-10 py-5 bg-slate-800 text-white rounded-full font-black text-lg shadow-2xl shadow-slate-800/30 hover:-translate-y-1 hover:shadow-slate-800/50 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Únete a la evolución agrícola
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

      </main>

      {/* Footer minimalista */}
      <footer className="w-full text-center py-8 text-slate-400 text-sm mt-auto relative z-10">
        &copy; {new Date().getFullYear()} CultivIA. Simplificando la agricultura.
      </footer>
    </div>
  );
}
