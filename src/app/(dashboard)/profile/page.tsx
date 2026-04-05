"use client";

import React, { useMemo } from "react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, useAuth } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, User as UserIcon, Mail, Sparkles, Sprout, MessageSquare, LogOut, ChevronRight, ShieldCheck, Crown, Leaf } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();

  // User Doc
  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  
  const { data: userData, isLoading: isLoadingUser } = useDoc(userRef);

  // Crops Collection
  const cropsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users", user.uid, "crops");
  }, [firestore, user]);
  
  const { data: crops, isLoading: isLoadingCrops } = useCollection(cropsQuery);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push("/login");
  };

  if (isLoadingUser || isLoadingCrops) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user || !userData) {
    return null;
  }

  const isPremium = userData.tipo_cuenta === 'premium';
  const cropsCount = crops?.length || 0;
  const maxCrops = isPremium ? "Ilimitados" : 3;
  const queriesDone = userData.consultas_ia_mes || 0;
  const maxQueries = isPremium ? "Ilimitadas" : 5;

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full overflow-hidden bg-slate-50">
      
      {/* MESH GRADIENT BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[0%] -left-[10%] w-[60%] h-[60%] rounded-full bg-emerald-400/20 blur-[130px] mix-blend-multiply animate-pulse" />
        <div className="absolute top-[30%] -right-[15%] w-[70%] h-[70%] rounded-full bg-amber-200/20 blur-[150px] mix-blend-multiply opacity-60" />
        <div className="absolute bottom-[0%] left-[20%] w-[50%] h-[50%] rounded-full bg-teal-400/15 blur-[120px] mix-blend-multiply opacity-50" />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[50px] z-0" />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto space-y-8 pt-6 pb-24 px-4 sm:px-6">
        
        {/* Header Visual Holográfico */}
        <div className="relative rounded-[2.5rem] bg-white/40 backdrop-blur-3xl p-8 shadow-[0_16px_40px_rgba(0,0,0,0.08)] overflow-hidden border border-white/60 animate-in slide-in-from-top-8 duration-700 ease-out group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/80 to-teal-600/80 z-0"></div>
          {/* Luz ambiental brillante */}
          <div className="absolute top-0 right-0 w-[150%] h-[150%] bg-white/10 blur-[50px] mix-blend-overlay pointer-events-none transform rotate-12 -translate-y-1/4 translate-x-1/4"></div>
          <div className="absolute -top-10 -right-10 p-4 opacity-15 mix-blend-overlay transition-transform duration-[20s] group-hover:rotate-180">
            <Leaf className="w-56 h-56" />
          </div>
          
          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            <div className="w-28 h-28 bg-white/20 rounded-[2rem] flex items-center justify-center backdrop-blur-xl border border-white/50 shadow-[inset_0_4px_24px_rgba(255,255,255,0.4),0_8px_32px_rgba(0,0,0,0.1)] relative">
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/30 to-transparent"></div>
              <UserIcon className="w-14 h-14 text-white drop-shadow-md z-10" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md mb-1">{user.displayName || "Comandante Botánico"}</h1>
              <p className="text-emerald-50 flex items-center justify-center gap-2 text-sm font-semibold tracking-wide bg-white/10 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-md shadow-inner mx-auto w-max">
                <Mail className="w-4 h-4 opacity-80" />
                {user.email}
              </p>
            </div>
            
            <Badge className={cn(
              "mt-5 text-[11px] py-1.5 px-5 shadow-xl font-black tracking-widest uppercase relative overflow-hidden", 
              isPremium 
                ? "bg-gradient-to-r from-amber-400 to-orange-400 text-amber-950 border-none hover:rotate-1 hover:scale-105 transition-transform" 
                : "bg-black/30 backdrop-blur-md text-white border border-white/20 shadow-inner"
            )}>
              {isPremium ? (
                <span className="flex items-center gap-1.5"><Crown className="w-4 h-4 drop-shadow-sm" /> Rango PRO Activo</span>
              ) : (
                <span className="flex items-center gap-1.5 relative z-10 text-white/90">Permiso Básico</span>
              )}
            </Badge>
          </div>
        </div>

        {/* Uso de la Cuenta (Stats) */}
        <div className="animate-in slide-in-from-bottom-8 duration-700 delay-200 ease-out">
          <h2 className="text-xl font-black text-slate-800 px-3 mb-4 tracking-tight">Estatus de Terreno</h2>
          <div className="grid grid-cols-2 gap-4">
            <Card className="rounded-[2rem] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] bg-white/60 backdrop-blur-xl hover:bg-white/70 transition-all overflow-hidden relative group">
              <div className="absolute inset-x-0 -bottom-10 h-20 bg-emerald-400/20 blur-2xl group-hover:bg-emerald-400/30 transition-all pointer-events-none"></div>
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3 relative z-10">
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center border border-white shadow-inner transition-colors", isPremium ? "bg-emerald-50 text-emerald-600" : "bg-white text-emerald-500 shadow-emerald-500/10")}>
                  <Sprout className="w-8 h-8 drop-shadow-sm" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-3xl font-black text-slate-800">{cropsCount} <span className="text-sm font-semibold text-slate-400">/ {maxCrops}</span></p>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Plantas Activas</p>
                </div>
                {/* Progress bar Neumórfica */}
                {!isPremium && (
                  <div className="w-full h-2.5 bg-slate-200/50 rounded-full mt-3 overflow-hidden shadow-inner border border-white/40">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(52,211,153,0.8)]" style={{ width: `${Math.min((cropsCount / 3) * 100, 100)}%` }} />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] bg-white/60 backdrop-blur-xl hover:bg-white/70 transition-all overflow-hidden relative group">
              <div className="absolute inset-x-0 -bottom-10 h-20 bg-blue-400/20 blur-2xl group-hover:bg-blue-400/30 transition-all pointer-events-none"></div>
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3 relative z-10">
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center border border-white shadow-inner transition-colors", isPremium ? "bg-blue-50 text-blue-600" : "bg-white text-blue-500 shadow-blue-500/10")}>
                  <MessageSquare className="w-8 h-8 drop-shadow-sm" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-3xl font-black text-slate-800">{isPremium ? "∞" : queriesDone} <span className="text-sm font-semibold text-slate-400">{!isPremium && `/ ${maxQueries}`}</span></p>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Mente Colmena IA</p>
                </div>
                {/* Progress bar Neumórfica */}
                {!isPremium && (
                  <div className="w-full h-2.5 bg-slate-200/50 rounded-full mt-3 overflow-hidden shadow-inner border border-white/40">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(96,165,250,0.8)]" style={{ width: `${Math.min((queriesDone / 5) * 100, 100)}%` }} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Upgrade Card Holográfica (if free) */}
        {!isPremium && (
          <div className="animate-in slide-in-from-bottom-8 duration-700 delay-300 ease-out">
            <Card className="rounded-[2rem] border border-amber-300/40 bg-white/70 backdrop-blur-2xl shadow-[0_16px_40px_rgba(245,158,11,0.15)] overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 z-0 opacity-50"></div>
              {/* Animación del radar trasero */}
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-400 rounded-full blur-3xl opacity-30 animate-pulse pointer-events-none"></div>
              
              <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-5 relative z-10 text-center sm:text-left">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-400 rounded-full blur-lg opacity-40 group-hover:scale-125 transition-transform duration-500"></div>
                  <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-amber-200 to-amber-100 flex flex-shrink-0 items-center justify-center border-2 border-white shadow-xl relative z-10 rotate-3 group-hover:rotate-12 transition-transform duration-500">
                    <Sparkles className="w-8 h-8 text-amber-600 drop-shadow-sm" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-amber-900 text-xl tracking-tight mb-1 bg-clip-text text-transparent bg-gradient-to-r from-amber-700 to-orange-600">ADN Ilimitado (PRO)</h3>
                  <p className="text-[13px] text-amber-900/70 leading-relaxed font-semibold">Desata todo el poder botánico. Cultiva sin fronteras y conecta con la IA sin grilletes limitantes mensuales.</p>
                </div>
                <Button onClick={() => router.push('/premium')} className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xl shadow-amber-500/40 shrink-0 h-14 px-6 text-[15px] font-black border-none hover:-translate-y-1 active:scale-95 transition-all w-full sm:w-auto">
                  Ascender Ahora
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Settings Options (Cápsulas Flotantes) */}
        <div className="animate-in slide-in-from-bottom-8 duration-700 delay-500 ease-out">
          <h2 className="text-xl font-black text-slate-800 px-3 mb-4 mt-8 tracking-tight">Protocolos</h2>
          <div className="bg-white/50 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.03)] border border-white/60 p-2 space-y-1">
            
            <button className="flex items-center justify-between p-4 bg-transparent hover:bg-white hover:shadow-sm border border-transparent hover:border-white/80 transition-all rounded-[1.5rem] w-full text-left group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100/50 flex items-center justify-center group-hover:bg-teal-50 group-hover:scale-105 transition-all border border-transparent group-hover:border-teal-100 shadow-inner">
                  <ShieldCheck className="w-6 h-6 text-slate-500 group-hover:text-teal-600 drop-shadow-sm" />
                </div>
                <div>
                  <span className="text-[15px] block font-bold text-slate-700 group-hover:text-teal-900 transition-colors">Privacidad y Defensa</span>
                  <span className="text-[11px] font-semibold text-slate-400">Cifrado de datos botánicos</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
            </button>
            
            <button className="flex items-center justify-between p-4 bg-transparent hover:bg-white hover:shadow-sm border border-transparent hover:border-white/80 transition-all rounded-[1.5rem] w-full text-left group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100/50 flex items-center justify-center group-hover:bg-emerald-50 group-hover:scale-105 transition-all border border-transparent group-hover:border-emerald-100 shadow-inner">
                  <UserIcon className="w-6 h-6 text-slate-500 group-hover:text-emerald-600 drop-shadow-sm" />
                </div>
                <div>
                  <span className="text-[15px] block font-bold text-slate-700 group-hover:text-emerald-900 transition-colors">Modificar Registro</span>
                  <span className="text-[11px] font-semibold text-slate-400">Apodo, contraseña y métricas</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
            </button>

            <button onClick={handleLogout} className="flex items-center justify-between p-4 bg-transparent hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/20 border border-transparent hover:-translate-y-1 active:scale-95 transition-all rounded-[1.5rem] w-full text-left group mt-2 overflow-hidden relative">
              <div className="absolute inset-0 bg-red-400 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-inner transition-all border border-red-100 group-hover:border-transparent">
                  <LogOut className="w-6 h-6 text-red-500 group-hover:text-red-600 drop-shadow-sm" />
                </div>
                <div>
                  <span className="text-[15px] block font-black text-red-600 group-hover:text-white transition-colors tracking-tight">Desconexión Táctica</span>
                  <span className="text-[11px] font-semibold text-red-400 group-hover:text-red-200">Cerrar el panel protector</span>
                </div>
              </div>
            </button>
            
          </div>
        </div>
        
      </div>
    </div>
  );
}
