"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, CreditCard, Loader2, Sparkles, ShieldCheck, Crown, ArrowRight, LockKeyhole } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function PremiumPage() {
  const [cuenta, setCuenta] = useState<string>("cargando...");
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Fake Card Details
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      if (auth?.currentUser && firestore) {
        const userRef = doc(firestore, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setCuenta(userSnap.data().tipo_cuenta || "gratuita");
        }
      }
    };
    fetchUser();
  }, [auth?.currentUser, firestore]);

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.currentUser || !firestore) return;
    
    setIsProcessing(true);

    // Simulando el delay de procesar con el banco
    setTimeout(async () => {
      try {
        const userRef = doc(firestore, "users", auth.currentUser!.uid);
        
        await updateDoc(userRef, {
          tipo_cuenta: "premium",
          premium_since: new Date().toISOString()
        });

        toast({
          title: "¡Pago exitoso! Bienvenido a Premium 🌟",
          description: "Tu cuenta ha sido actualizada. Disfruta de la IA sin límites.",
        });
        
        setCuenta("premium");
        setShowCheckout(false);
        // Recargar el caché de las rutas en el background
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error al actualizar",
          description: "Hubo un problema procesando el pago en la base de datos.",
        });
      } finally {
        setIsProcessing(false);
      }
    }, 2500); // 2.5s simulando Stripe
  };

  if (cuenta === "cargando...") {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  // --- VISTA DEL FORMULARIO DE PAGO ---
  if (showCheckout) {
    return (
      <div className="max-w-xl mx-auto py-12 px-6 pb-24 animate-in fade-in zoom-in-95 duration-500">
        <Button variant="ghost" onClick={() => setShowCheckout(false)} className="mb-6 hover:bg-slate-100 text-slate-500 font-medium">
          ← Volver a los planes
        </Button>
        <Card className="border-0 shadow-2xl overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl">
          <CardHeader className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-b-0 pb-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <ShieldCheck className="w-40 h-40 transform translate-x-8 -translate-y-8 blur-sm rotate-6" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                  <LockKeyhole className="text-emerald-400 w-6 h-6" />
                </div>
                <CardTitle className="text-3xl font-bold tracking-tight">Pago Seguro</CardTitle>
              </div>
              <CardDescription className="text-slate-300 text-base max-w-sm">
                Cifraremos tu información en tránsito. Estás a un paso de la IA ilimitada.
              </CardDescription>
              
              <div className="mt-8 flex justify-between items-center bg-white/10 border border-white/20 backdrop-blur-md p-5 rounded-2xl shadow-inner">
                <div className="flex items-center gap-3">
                  <Sparkles className="text-amber-400 w-5 h-5" />
                  <span className="font-bold text-lg">AgroAlerta PRO</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-white">$1.99 <span className="text-sm font-semibold text-slate-300">/ mes</span></span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8 px-6 pb-8">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm mb-8 flex gap-3 shadow-sm">
              <span className="text-amber-500 text-lg">⚠️</span>
              <p className="leading-relaxed"><strong>Modo Simulación:</strong> Esta es una pasarela de prueba integrada. Ingresa cualquier tarjeta ficticia para simular el éxito del pago Auth.</p>
            </div>
            <form onSubmit={handleSimulatePayment} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="card" className="text-slate-700 font-bold ml-1">Número de Tarjeta</Label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input 
                    id="card" 
                    placeholder="4000 1234 5678 9010" 
                    required 
                    className="pl-12 h-14 text-lg font-mono tracking-wider rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-colors"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="expiry" className="text-slate-700 font-bold ml-1">Vencimiento</Label>
                  <Input 
                    id="expiry" 
                    placeholder="12/28" 
                    required 
                    className="h-14 font-mono text-center text-lg tracking-widest rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="cvv" className="text-slate-700 font-bold ml-1">Código CVC</Label>
                  <Input 
                    id="cvv" 
                    placeholder="123" 
                    type="password" 
                    maxLength={4} 
                    required 
                    className="h-14 font-mono text-center text-lg tracking-widest rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                  />
                </div>
              </div>
              <div className="pt-4">
                <Button type="submit" size="lg" className="w-full text-lg font-bold h-16 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-xl shadow-emerald-500/25 border-none rounded-xl" disabled={isProcessing}>
                  {isProcessing ? (
                    <><Loader2 className="animate-spin mr-3 h-6 w-6" /> Autorizando...</>
                  ) : (
                    "Pagar $1.99 y Activar Premium"
                  )}
                </Button>
                <p className="text-center text-xs text-slate-400 mt-4 font-medium">✨ Cancelación en cualquier momento. Sin contratos a largo plazo.</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- VISTA MATRIZ DE LOS PLANES ---
  return (
    <div className="max-w-6xl mx-auto py-12 px-5 sm:px-6 lg:px-8 pb-28 mb-10 overflow-x-hidden">
      
      {/* Título y Subtítulo Glow */}
      <div className="text-center max-w-3xl mx-auto mb-16 relative z-20">
        <h2 className="text-amber-600 font-extrabold tracking-widest uppercase text-xs mb-4 flex justify-center items-center gap-2">
          <Crown className="w-4 h-4 fill-amber-500/20" /> Planes de Suscripción 
        </h2>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-6 leading-[1.15]">
          Lleva tu cosecha al <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 inline-block p-1">Siguiente Nivel</span>
        </h1>
        <p className="text-lg text-slate-600/90 max-w-2xl mx-auto font-medium leading-relaxed">
          Desbloquea Inteligencia Artificial avanzada sin restricciones y cuida a tus plantas con exactitud micrométrica.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 relative z-10 w-full max-w-4xl mx-auto">
        
        {/* Glow Effects de Fondo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-amber-400/5 rounded-[100%] blur-[120px] -z-10 pointer-events-none" />

        {/* --- PLAN BÁSICO (GRATIS) --- */}
        <Card className={cn(
          "border-2 relative flex flex-col bg-white/95 backdrop-blur-xl transition-all duration-300 rounded-3xl overflow-hidden", 
          cuenta === 'gratuita' ? "border-slate-300 shadow-xl" : "border-slate-100/50 shadow-sm hover:shadow-md hover:border-slate-200"
        )}>
          {cuenta === 'gratuita' && (
            <div className="bg-slate-100 text-slate-500 text-[10px] font-bold tracking-widest uppercase py-2 text-center w-full block border-b border-slate-200">
              Plan Actual en Uso
            </div>
          )}
          <CardContent className="p-8 md:p-10 flex flex-col flex-1 h-full">
            <div className="mb-6">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Básico</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed h-10">Perfecto para pruebas cortas, estudiantes o huertos caseros.</p>
            </div>
            
            <div className="mb-8 flex items-baseline text-slate-900">
              <span className="text-5xl font-black tracking-tighter">$0</span>
              <span className="text-lg text-slate-400 ml-1.5 font-bold">/mes</span>
            </div>

            <ul className="space-y-4.5 mb-8 flex-1">
              <li className="flex items-start gap-3.5"><Check className="text-emerald-500 w-5 h-5 shrink-0" /> <span className="text-slate-700 font-semibold text-sm">Máximo 3 cultivos en la Nube</span></li>
              <li className="flex items-start gap-3.5"><Check className="text-emerald-500 w-5 h-5 shrink-0" /> <span className="text-slate-700 font-semibold text-sm">Agro-Journal y checklist diario</span></li>
              <li className="flex items-start gap-3.5"><Check className="text-emerald-500 w-5 h-5 shrink-0" /> <span className="text-slate-700 font-semibold text-sm">5 diagnósticos de IA por mes</span></li>
              <li className="flex items-start gap-3.5 opacity-50"><X className="text-slate-400 w-5 h-5 shrink-0" /> <span className="text-slate-500 font-medium text-sm line-through">Clima 24/7 y Alertas Termales</span></li>
              <li className="flex items-start gap-3.5 opacity-50"><X className="text-slate-400 w-5 h-5 shrink-0" /> <span className="text-slate-500 font-medium text-sm line-through">Prioridad en red servidor</span></li>
            </ul>

            <Button variant={cuenta === 'gratuita' ? "outline" : "secondary"} className={cn("w-full h-14 text-sm font-bold rounded-2xl border-2 tracking-wide", cuenta === 'gratuita' ? "border-slate-800 text-slate-800" : "")} disabled={cuenta === 'gratuita'}>
              {cuenta === 'gratuita' ? "Plan Básico Activado" : "Bajar a Básico"}
            </Button>
          </CardContent>
        </Card>

        {/* --- PLAN PREMIUM (PRO) --- */}
        <Card className={cn(
          "border-0 relative flex flex-col shadow-2xl transform lg:-translate-y-4 overflow-visible rounded-3xl",
          cuenta === 'premium' ? "bg-amber-500" : "bg-slate-900"
        )}>
          {/* Badge Recomendado Flotante */}
          {cuenta !== 'premium' && (
            <div className="absolute -top-5 inset-x-0 flex justify-center z-30">
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black tracking-widest uppercase py-2 px-6 rounded-full shadow-xl shadow-amber-500/40 flex items-center gap-2 border border-white/20">
                <Crown className="w-4 h-4" /> La Mejor Opción
              </span>
            </div>
          )}

          <div className={cn("h-full w-full rounded-3xl overflow-hidden relative border", cuenta === "premium" ? "border-amber-400" : "border-slate-800 text-white")}>
            <div className="absolute top-0 right-0 p-6 opacity-30 transform hover:scale-110 hover:opacity-50 transition-all duration-700 pointer-events-none">
              <Sparkles className={cn("w-48 h-48 -mr-16 -mt-16", cuenta === 'premium' ? "text-amber-100" : "text-amber-500/40")} />
            </div>

            <CardContent className={cn("p-8 md:p-10 flex flex-col flex-1 h-full z-10 relative", cuenta === "premium" ? "text-white" : "text-slate-200")}>
              <div className="mb-6 flex justify-between items-start">
                <div>
                  <h3 className={cn("text-2xl font-black mb-2 flex items-center gap-2 tracking-tight", cuenta === "premium" ? "text-white" : "text-white")}>
                    AgroAlerta PRO <Sparkles className={cn("w-5 h-5", cuenta === "premium" ? "text-amber-100" : "text-amber-400")} />
                  </h3>
                  <p className={cn("text-sm font-medium leading-relaxed h-10", cuenta === "premium" ? "text-amber-100/90" : "text-slate-400")}>Para el agricultor serio y comercial que busca la perfección métrica.</p>
                </div>
              </div>
              
              <div className="mb-8 flex items-baseline">
                <span className={cn("text-6xl font-black tracking-tighter", cuenta === "premium" ? "text-white" : "text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400")}>$1.99</span>
                <span className={cn("text-lg ml-1.5 font-bold", cuenta === "premium" ? "text-amber-100/80" : "text-slate-500")}>/mes</span>
              </div>

              <ul className="space-y-4.5 mb-8 flex-1 z-10">
                <li className="flex items-start gap-3.5"><Check className={cn("w-5 h-5 shrink-0", cuenta === "premium" ? "text-amber-200" : "text-amber-500")} /> <span className="font-semibold text-sm text-white">Cultivos y Parcelas 100% Ilimitadas</span></li>
                <li className={cn("flex items-start gap-3.5 p-3.5 rounded-2xl border", cuenta === "premium" ? "bg-amber-600/30 border-amber-300/30" : "bg-white/5 border-white/10")}>
                  <Sparkles className={cn("w-5 h-5 shrink-0", cuenta === "premium" ? "text-white" : "text-amber-400")} /> 
                  <span className={cn("font-bold text-sm", cuenta === "premium" ? "text-white" : "text-amber-100")}>Consultas IA Ilimitadas 24/7</span>
                </li>
                <li className="flex items-start gap-3.5"><Check className={cn("w-5 h-5 shrink-0", cuenta === "premium" ? "text-amber-200" : "text-amber-500")} /> <span className="font-semibold text-sm text-white">Poderoso Motor de Clima Integrado</span></li>
                <li className="flex items-start gap-3.5"><Check className={cn("w-5 h-5 shrink-0", cuenta === "premium" ? "text-amber-200" : "text-amber-500")} /> <span className="font-semibold text-sm text-white">Soporte prioritario y cero anuncios</span></li>
              </ul>

              {cuenta === 'premium' ? (
                <Button variant="outline" className="w-full h-14 text-sm font-black text-amber-900 bg-white hover:bg-amber-50 shadow-xl cursor-default border-none rounded-2xl uppercase tracking-wider">
                  <Check className="w-5 h-5 mr-2" /> Eres Premium PRO 
                </Button>
              ) : (
                <Button onClick={() => setShowCheckout(true)} className="w-full h-14 text-sm font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-xl shadow-amber-500/20 border-none group transition-all rounded-2xl tracking-wide uppercase">
                  Pasar a Premium <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1.5 transition-transform" />
                </Button>
              )}
            </CardContent>
          </div>
        </Card>

      </div>
    </div>
  );
}
