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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
    <div className="space-y-6 pb-24">
      {/* Header Visual */}
      <div className="relative rounded-3xl bg-gradient-to-br from-primary to-emerald-600 p-6 text-white shadow-lg overflow-hidden border border-primary/20">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Leaf className="w-32 h-32 transform rotate-12" />
        </div>
        <div className="relative z-10 flex flex-col items-center text-center space-y-3">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-4 border-white/30 shadow-inner">
            <UserIcon className="w-12 h-12 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{user.displayName || "Productor"}</h1>
            <p className="text-primary-foreground/90 flex items-center justify-center gap-1.5 text-sm mt-1 font-medium">
              <Mail className="w-4 h-4" />
              {user.email}
            </p>
          </div>
          
          <Badge className={cn("mt-3 text-xs py-1.5 px-4 shadow-sm font-semibold tracking-wider uppercase", isPremium ? "bg-amber-400 text-amber-950 border-amber-300" : "bg-white/20 text-white border-white/20")}>
            {isPremium ? (
              <span className="flex items-center gap-1.5"><Crown className="w-4 h-4" /> Plan Premium PRO</span>
            ) : "Plan Gratuito Básico"}
          </Badge>
        </div>
      </div>

      {/* Uso de la Cuenta (Stats) */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 px-1 mb-3">Tu Huerto Digital</h2>
        <div className="grid grid-cols-2 gap-4">
          <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden relative group">
            <CardContent className="p-5 flex flex-col items-center text-center space-y-2">
              <div className={cn("w-14 h-14 rounded-full flex items-center justify-center mb-1 transition-colors", isPremium ? "bg-emerald-50 text-emerald-600" : "bg-primary/10 text-primary")}>
                <Sprout className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-black text-slate-800">{cropsCount} <span className="text-sm font-semibold text-slate-400">/ {maxCrops}</span></p>
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Cultivos Instanciados</p>
              </div>
              {/* Progress bar */}
              {!isPremium && (
                <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden shadow-inner">
                  <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${Math.min((cropsCount / 3) * 100, 100)}%` }} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden relative group">
            <CardContent className="p-5 flex flex-col items-center text-center space-y-2">
              <div className={cn("w-14 h-14 rounded-full flex items-center justify-center mb-1 transition-colors", isPremium ? "bg-amber-50 text-amber-500" : "bg-blue-50 text-blue-500")}>
                <MessageSquare className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-black text-slate-800">{isPremium ? "∞" : queriesDone} <span className="text-sm font-semibold text-slate-400">{!isPremium && `/ ${maxQueries}`}</span></p>
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Consultas de IA</p>
              </div>
              {/* Progress bar */}
              {!isPremium && (
                <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden shadow-inner">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min((queriesDone / 5) * 100, 100)}%` }} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upgrade Card (if free) */}
      {!isPremium && (
        <Card className="rounded-3xl border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-400/20 rounded-full blur-2xl"></div>
          <CardContent className="p-5 flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-full bg-amber-200/50 flex flex-shrink-0 items-center justify-center border border-amber-300/50 shadow-inner">
              <Sparkles className="w-7 h-7 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 text-base mb-1">Mejora a Premium</h3>
              <p className="text-[11px] text-amber-700/90 leading-relaxed font-medium">Libera restricciones genéticas, añade cultivos ilimitados y usa la IA sin límites de chat mensuales.</p>
            </div>
            <Button onClick={() => router.push('/premium')} className="rounded-2xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30 shrink-0 h-12 px-5 font-bold">
              Ver Planes
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Settings Options */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 px-1 mb-3 mt-8">Configuración</h2>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex flex-col p-1">
            <button className="flex items-center justify-between p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors rounded-2xl w-full text-left group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all"><ShieldCheck className="w-5 h-5 text-slate-600" /></div>
                <span className="text-sm font-semibold text-slate-700">Privacidad y Seguridad</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
            </button>
            
            <button className="flex items-center justify-between p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors rounded-2xl w-full text-left group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all"><UserIcon className="w-5 h-5 text-slate-600" /></div>
                <span className="text-sm font-semibold text-slate-700">Editar Información</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
            </button>

            <button onClick={handleLogout} className="flex items-center justify-between p-4 hover:bg-red-50 transition-colors rounded-2xl w-full text-left group mt-1">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-500 transition-colors shadow-inner border border-red-100"><LogOut className="w-5 h-5 text-red-600 group-hover:text-white" /></div>
                <span className="text-sm font-bold text-red-600">Cerrar Sesión Segura</span>
              </div>
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}
