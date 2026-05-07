"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore } from "@/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, CreditCard, Loader2, Sparkles, ShieldCheck, Crown, ArrowRight, LockKeyhole, AlertCircle } from "lucide-react";
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
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] w-full overflow-hidden bg-slate-50 relative">
        <div className="absolute top-[30%] left-[20%] w-[50%] h-[50%] rounded-full bg-amber-400/20 blur-[130px] mix-blend-multiply opacity-80 animate-pulse" />
        <Loader2 className="w-12 h-12 animate-spin text-amber-500 drop-shadow-lg relative z-10" />
      </div>
    );
  }

  // --- VISTA DEL FORMULARIO DE PAGO (Stripe-like Dark UI) ---
  if (showCheckout) {
    return (
      <div className="relative min-h-[calc(100vh-80px)] w-full overflow-hidden bg-[#0A0A0A] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        
        {/* Luces cibernéticas traseras */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[150px]" />
          <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] rounded-full bg-amber-500/10 blur-[150px]" />
          <div className="absolute inset-0 bg-transparent backdrop-blur-[20px] z-0" />
        </div>

        <div className="relative z-10 w-full max-w-lg mb-4">
          <Button variant="ghost" onClick={() => setShowCheckout(false)} className="text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            ← Abortar operación
          </Button>
        </div>

        <Card className="relative z-10 w-full max-w-lg border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.5)] overflow-hidden rounded-[2.5rem] bg-slate-900/60 backdrop-blur-3xl animate-in zoom-in-95 duration-500">
          <CardHeader className="bg-white/5 border-b border-white/10 pb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <ShieldCheck className="w-48 h-48 transform translate-x-8 -translate-y-8 blur-[2px] rotate-12" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-[1.2rem] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 shadow-inner">
                  <LockKeyhole className="text-emerald-400 w-7 h-7 drop-shadow-sm" />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">Canal Cifrado AES-256</span>
                </div>
              </div>

              <CardTitle className="text-3xl font-black tracking-tight text-white mb-2">Pasarela Segura</CardTitle>
              <CardDescription className="text-slate-400 text-sm max-w-xs leading-relaxed">
                Ingresa a la red élite. Tu suscripción se procesará de forma hiper-segura.
              </CardDescription>
              
              <div className="mt-8 flex justify-between items-center bg-black/40 border border-white/10 p-5 rounded-2xl shadow-inner relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700"></div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg shadow-lg">
                     <Crown className="text-white w-5 h-5 drop-shadow-sm" />
                  </div>
                  <span className="font-bold text-lg text-white tracking-wide">CultivIA PRO</span>
                </div>
                <div className="text-right relative z-10">
                  <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">$1.99 <span className="text-[13px] font-semibold text-slate-500 uppercase tracking-widest block -mt-1">USD / mes</span></span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-8 px-8 pb-10">
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 p-4 rounded-2xl text-[13px] mb-8 flex gap-3 shadow-sm backdrop-blur-md">
              <AlertCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed"><strong>Entorno Simulado:</strong> Esta pasarela es demostrativa. Usa cualquier tarjeta y pasará el cargo visualmente.</p>
            </div>
            
            <form onSubmit={handleSimulatePayment} className="space-y-6">
              <div className="space-y-2.5">
                <Label htmlFor="card" className="text-[11px] uppercase tracking-widest text-slate-400 font-bold ml-1">Número de Tarjeta</Label>
                <div className="relative group">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  <Input 
                    id="card" 
                    placeholder="4000 1234 5678 9010" 
                    required 
                    className="pl-12 h-14 text-lg font-mono tracking-widest rounded-2xl border-white/10 bg-black/40 text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 transition-all shadow-inner"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="expiry" className="text-[11px] uppercase tracking-widest text-slate-400 font-bold ml-1">Vencimiento</Label>
                  <Input 
                    id="expiry" 
                    placeholder="12/28" 
                    required 
                    className="h-14 font-mono text-center text-lg tracking-widest rounded-2xl border-white/10 bg-black/40 text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 transition-all shadow-inner"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="cvv" className="text-[11px] uppercase tracking-widest text-slate-400 font-bold ml-1">Código CVC</Label>
                  <Input 
                    id="cvv" 
                    placeholder="123" 
                    type="password" 
                    maxLength={4} 
                    required 
                    className="h-14 font-mono text-center text-lg tracking-widest rounded-2xl border-white/10 bg-black/40 text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 transition-all shadow-inner"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-6">
                <Button type="submit" size="lg" className="w-full text-base font-black uppercase tracking-wider h-16 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-[0_10px_30px_rgba(16,185,129,0.3)] border-none rounded-2xl group transition-all" disabled={isProcessing || cuenta === 'premium'}>
                  {isProcessing ? (
                    <><Loader2 className="animate-spin mr-3 h-6 w-6" /> Procesando Hash...</>
                  ) : (
                    <span className="flex items-center gap-2">Pagar Ahora <LockKeyhole className="w-4 h-4 opacity-50" /></span>
                  )}
                </Button>
                <div className="flex items-center gap-2 justify-center mt-5 opacity-50">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <p className="text-center text-[11px] text-slate-400 font-bold tracking-widest uppercase">Cancela cuando quieras</p>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- VISTA MATRIZ DE LOS PLANES (Glassmorphism) ---
  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full overflow-hidden bg-slate-50">
      
      {/* MESH GRADIENT BACKGROUND: AMBER/GOLD VIBE */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[0%] -left-[10%] w-[60%] h-[60%] rounded-full bg-amber-400/20 blur-[130px] mix-blend-multiply animate-pulse" />
        <div className="absolute top-[30%] -right-[15%] w-[70%] h-[70%] rounded-full bg-orange-400/20 blur-[150px] mix-blend-multiply opacity-60" />
        <div className="absolute bottom-[0%] left-[20%] w-[50%] h-[50%] rounded-full bg-emerald-400/15 blur-[120px] mix-blend-multiply opacity-50" />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[50px] z-0" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto py-12 px-5 sm:px-6 lg:px-8 pb-28 mb-10 overflow-x-hidden">
        
        {/* Título y Subtítulo Glow */}
        <div className="text-center max-w-3xl mx-auto mb-16 relative z-20 animate-in slide-in-from-top-8 duration-700">
          <h2 className="text-[11px] font-black tracking-[0.2em] uppercase mb-4 flex justify-center items-center gap-2 text-amber-600 bg-amber-100/50 backdrop-blur-sm w-max mx-auto px-4 py-1.5 rounded-full border border-amber-200 shadow-sm">
            <Crown className="w-4 h-4" /> Evolución Botánica
          </h2>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-slate-900 mb-6 leading-[1.15] drop-shadow-sm">
            La IA definitiva para tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 inline-block p-1 filter drop-shadow-md">Invernadero</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Abandona las limitaciones. Controla infinitos cultivos y habla con el núcleo neuronal botánico <b className="text-slate-800">24/7 sin barreras</b>.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 relative z-10 w-full max-w-5xl mx-auto animate-in slide-in-from-bottom-8 duration-700 delay-200">
          
          {/* --- PLAN BÁSICO (Frosted Glass) --- */}
          <Card className={cn(
            "border border-white/60 relative flex flex-col bg-white/50 backdrop-blur-xl transition-all duration-300 rounded-[2.5rem] overflow-hidden", 
            cuenta === 'gratuita' ? "shadow-[0_8px_32px_rgba(0,0,0,0.05)]" : "shadow-sm opacity-90 scale-[0.98]"
          )}>
            <div className="absolute -left-10 top-1/4 w-32 h-32 bg-slate-300/30 rounded-full blur-3xl pointer-events-none"></div>
            {cuenta === 'gratuita' && (
              <div className="bg-slate-200/50 backdrop-blur-md text-slate-600 text-[10px] font-black tracking-widest uppercase py-2.5 text-center w-full block border-b border-white/40">
                Tu Licencia Actual
              </div>
            )}
            <CardContent className="p-8 md:p-10 flex flex-col flex-1 h-full relative z-10">
              <div className="mb-6">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Semilla</h3>
                <p className="text-slate-500 text-sm font-semibold leading-relaxed h-10">El punto de partida. Para novatos con huertos diminutos.</p>
              </div>
              
              <div className="mb-8 flex items-baseline text-slate-800">
                <span className="text-6xl font-black tracking-tighter">$0</span>
                <span className="text-sm text-slate-400 ml-2 font-bold uppercase tracking-widest">/mes</span>
              </div>

              <ul className="space-y-4.5 mb-10 flex-1">
                <li className="flex items-start gap-4"><div className="bg-emerald-100 p-1 rounded-full shrink-0"><Check className="text-emerald-500 w-4 h-4" /></div> <span className="text-slate-600 font-bold text-[15px]">3 slots de Cultivo</span></li>
                <li className="flex items-start gap-4"><div className="bg-emerald-100 p-1 rounded-full shrink-0"><Check className="text-emerald-500 w-4 h-4" /></div> <span className="text-slate-600 font-bold text-[15px]">Agro-Journal básico</span></li>
                <li className="flex items-start gap-4"><div className="bg-emerald-100 p-1 rounded-full shrink-0"><Check className="text-emerald-500 w-4 h-4" /></div> <span className="text-slate-600 font-bold text-[15px]">5 prompts de IA al mes</span></li>
                <li className="flex items-start gap-4 opacity-40"><div className="bg-slate-200 p-1 rounded-full shrink-0"><X className="text-slate-400 w-4 h-4" /></div> <span className="text-slate-400 font-semibold text-[15px] line-through">Memoria de red infinita</span></li>
                <li className="flex items-start gap-4 opacity-40"><div className="bg-slate-200 p-1 rounded-full shrink-0"><X className="text-slate-400 w-4 h-4" /></div> <span className="text-slate-400 font-semibold text-[15px] line-through">Alerta de Plagas en vivo</span></li>
              </ul>

              <Button variant="ghost" className="w-full h-14 text-[13px] font-black uppercase tracking-widest rounded-2xl border-2 border-slate-300 text-slate-500 bg-white/30 hover:bg-white disabled:opacity-100" disabled={true}>
                {cuenta === 'gratuita' ? "Activo Localmente" : "Restringido"}
              </Button>
            </CardContent>
          </Card>

          {/* --- PLAN PREMIUM (PRO - Aura Glassmorphism) --- */}
          <div className="relative group">
            {/* Ambient Aura Neón */}
            <div className="absolute -inset-1.5 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 rounded-[3rem] blur-xl opacity-40 group-hover:opacity-60 group-hover:blur-2xl transition-all duration-700 tilt-in"></div>

            <Card className={cn(
              "border border-white/20 relative flex flex-col shadow-2xl overflow-hidden rounded-[2.5rem] transform min-h-full",
              cuenta === 'premium' ? "bg-gradient-to-br from-amber-500 to-orange-600" : "bg-slate-900/90 backdrop-blur-3xl"
            )}>
              {cuenta !== 'premium' && (
                <div className="absolute top-0 inset-x-0 h-[100px] bg-gradient-to-b from-amber-500/20 to-transparent pointer-events-none"></div>
              )}

              {/* Badge Recomendado Flotante */}
              {cuenta !== 'premium' && (
                <div className="absolute -top-1.5 inset-x-0 flex justify-center z-30">
                  <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black tracking-[0.2em] uppercase py-2 px-6 rounded-b-2xl shadow-lg shadow-amber-500/40 flex items-center gap-2 border-x border-b border-white/30">
                    <Crown className="w-4 h-4" /> Permiso Absoluto
                  </span>
                </div>
              )}

              <div className="absolute top-0 right-0 p-8 opacity-20 transform group-hover:scale-125 transition-transform duration-1000 pointer-events-none z-0">
                <Sparkles className={cn("w-48 h-48 -mr-16 -mt-16", cuenta === 'premium' ? "text-white" : "text-amber-500")} />
              </div>

              <CardContent className={cn("p-8 md:p-10 flex flex-col flex-1 h-full z-10 relative", cuenta === "premium" ? "text-white" : "text-white")}>
                <div className="mb-6 flex justify-between items-start pt-4">
                  <div>
                    <h3 className="text-3xl font-black mb-2 flex items-center gap-2 tracking-tight text-white drop-shadow-md">
                      Bóveda PRO <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
                    </h3>
                    <p className={cn("text-sm font-semibold leading-relaxed h-10", cuenta === "premium" ? "text-amber-100" : "text-slate-400")}>Monitoreo comercial. Toda la IA al servicio de tu flora, sin censura.</p>
                  </div>
                </div>
                
                <div className="mb-8 flex items-baseline">
                  <span className={cn("text-7xl font-black tracking-tighter drop-shadow-lg", cuenta === "premium" ? "text-white" : "text-transparent bg-clip-text bg-gradient-to-br from-amber-100 to-amber-500")}>$1.99</span>
                  <span className={cn("text-sm ml-2 font-bold uppercase tracking-widest", cuenta === "premium" ? "text-amber-200" : "text-slate-500")}>/mes</span>
                </div>

                <ul className="space-y-4.5 mb-10 flex-1 z-10">
                  <li className="flex items-start gap-4"><div className="bg-amber-400/20 p-1 rounded-full shrink-0 border border-amber-400/30"><Check className="text-amber-300 w-4 h-4" /></div> <span className="font-bold text-[15px] text-white">Cultivos y Parcelas 100% Ilimitadas</span></li>
                  
                  <li className={cn("flex items-start gap-4 p-4 rounded-2xl border backdrop-blur-md shadow-inner transform hover:-translate-y-1 transition-transform", cuenta === "premium" ? "bg-white/10 border-white/20" : "bg-amber-500/10 border-amber-400/20")}>
                    <div className="bg-amber-400/20 p-1 rounded-full shrink-0 border border-amber-400/50"><Sparkles className="w-4 h-4 text-amber-300" /></div> 
                    <span className="font-black text-[15px] text-amber-100">Consultas de IA Botánica Ilimitadas</span>
                  </li>
                  
                  <li className="flex items-start gap-4"><div className="bg-amber-400/20 p-1 rounded-full shrink-0 border border-amber-400/30"><Check className="text-amber-300 w-4 h-4" /></div> <span className="font-bold text-[15px] text-white">Meteorología Predictiva Premium</span></li>
                  <li className="flex items-start gap-4"><div className="bg-amber-400/20 p-1 rounded-full shrink-0 border border-amber-400/30"><Check className="text-amber-300 w-4 h-4" /></div> <span className="font-bold text-[15px] text-white">Cero anuncios, velocidad IA Prioritaria</span></li>
                </ul>

                {cuenta === 'premium' ? (
                  <Button variant="outline" className="w-full h-16 text-[15px] font-black text-amber-900 bg-white hover:bg-amber-50 shadow-xl cursor-default border-none rounded-2xl uppercase tracking-widest transition-transform hover:scale-[1.02]">
                    <Crown className="w-5 h-5 mr-2" /> Soberanía PRO Activa
                  </Button>
                ) : (
                  <Button onClick={() => setShowCheckout(true)} className="relative w-full h-16 text-[15px] font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-[0_8px_30px_rgba(245,158,11,0.4)] border-none group transition-all duration-300 rounded-2xl tracking-widest uppercase overflow-hidden">
                    <span className="absolute inset-0 bg-white/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                    <span className="relative z-10 flex items-center justify-center">Evolucionar ADN <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" /></span>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
