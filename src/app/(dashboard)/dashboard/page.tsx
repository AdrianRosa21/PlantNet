"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Sprout, Loader2, ChevronRight, Droplets, Leaf, Flower2, TreePine, Shrub, Wheat, Thermometer, Sparkles, MapPin, Sun, Cloud, CloudRain, Snowflake, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { verifyCropCreation } from "@/ai/flows/verify-crop-creation";
import { DashboardTour } from "@/components/dashboard-tour";
import BannerAd from "@/components/mobile/banner-ad";

const CROP_ICONS = [
  { name: "Sprout", icon: Sprout },
  { name: "Leaf", icon: Leaf },
  { name: "Flower2", icon: Flower2 },
  { name: "TreePine", icon: TreePine },
  { name: "Shrub", icon: Shrub },
  { name: "Wheat", icon: Wheat },
];

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [newCrop, setNewCrop] = useState({ name: "", icon: "Sprout" });

  // Weather State
  const [weather, setWeather] = useState<{ temp: number, code: number, city?: string } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  // User Profile for Limits
  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc(userRef);

  // User Crops
  const cropsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users", user.uid, "crops");
  }, [firestore, user]);
  const { data: crops, isLoading } = useCollection(cropsQuery);

  // Fetch Weather
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
            const data = await res.json();
            setWeather({ temp: data.current_weather.temperature, code: data.current_weather.weathercode, city: "Ubicación Local" });
          } catch (e) {
            console.error("Error fetching weather:", e);
          } finally {
            setWeatherLoading(false);
          }
        },
        (error) => {
          console.warn("Geolocation denied or error:", error);
          // Fallback a un clima genérico (ej. Ciudad de México / San Salvador)
          setWeather({ temp: 28, code: 0, city: "Clima Estimado" });
          setWeatherLoading(false);
        }
      );
    } else {
      setWeatherLoading(false);
    }
  }, []);

  const getWeatherIcon = (code: number, className: string) => {
    // Si className trae text-primary-foreground, lo limpiamos para que brille el amarillo libremente sin mezcla
    const cleanClass = className.replace("text-primary-foreground", "");
    if (code <= 1) return <Sun className={cn(cleanClass, "text-yellow-300 fill-yellow-400/30")} />;
    if (code === 2 || code === 3 || code === 45 || code === 48) return <Cloud className={className} />;
    if (code >= 51 && code <= 67) return <CloudRain className={className} />;
    if (code >= 71) return <Snowflake className={className} />;
    return <Sun className={cn(cleanClass, "text-yellow-300 fill-yellow-400/30")} />; 
  };

  const getCropWeatherAlert = (idealTemp: number) => {
    if (!weather) return null;
    const diff = weather.temp - idealTemp;
    if (diff > 5) return { type: "heat", text: "¡Mucho Calor!", icon: Flame, badgeColor: "bg-red-500", glow: "shadow-red-500/40", textCol: "text-red-700", bgCol: "bg-red-50/80" };
    if (diff < -5) return { type: "cold", text: "¡Mucho Frío!", icon: Snowflake, badgeColor: "bg-blue-500", glow: "shadow-blue-500/40", textCol: "text-blue-700", bgCol: "bg-blue-50/80" };
    return null;
  };

  const handleAddCropClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (userData?.tipo_cuenta === 'gratuita' && crops && crops.length >= 3) {
      setShowPremiumModal(true);
      return;
    }
    setIsDialogOpen(true);
  };

  const handleCreateCrop = async () => {
    if (!user || !firestore || !newCrop.name) return;
    setIsVerifying(true);

    try {
      const aiAnalysis = await verifyCropCreation({ cropName: newCrop.name });

      if (!aiAnalysis.isValidPlant) {
        toast({
          variant: "destructive",
          title: "Nombre Inválido",
          description: aiAnalysis.reason || "Por favor ingresa un cultivo o planta real.",
        });
        setIsVerifying(false);
        return; 
      }

      const cropsRef = collection(firestore, "users", user.uid, "crops");
      const cropData = {
        userId: user.uid,
        name: newCrop.name,
        type: aiAnalysis.suggestedType || "Planta Genérica",
        icon: newCrop.icon,
        generalStatus: "Saludable",
        dailyIrrigationGoal: aiAnalysis.dailyIrrigationGoal || 1,
        idealTemperature: aiAnalysis.idealTemperature || 24,
        createdAt: new Date().toISOString(),
      };

      addDocumentNonBlocking(cropsRef, cropData);
      setIsDialogOpen(false);
      resetForm();
      
      toast({
        title: "Cultivo Creado ✨",
        description: `La IA configuró tu ${newCrop.name} como "${cropData.type}" automáticamente.`
      });

    } catch (error: any) {
      console.error("Error verificando cultivo: ", error);
      toast({
        variant: "destructive",
        title: "Error de IA",
        description: "Hubo un problema verificando tu cultivo. Intenta más tarde."
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const resetForm = () => {
    setNewCrop({ name: "", icon: "Sprout" });
  };

  const getCropIconComponent = (iconName: string) => {
    const iconObj = CROP_ICONS.find(i => i.name === iconName) || CROP_ICONS[0];
    const IconComponent = iconObj.icon;
    return <IconComponent className="w-7 h-7 text-primary" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full overflow-hidden bg-background">
      
      {/* MESH GRADIENT BACKGROUND (Efecto Terrario Vivo) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 -left-[10%] w-[60%] h-[50%] rounded-full bg-primary/20 blur-[120px] mix-blend-multiply animate-pulse" />
        <div className="absolute top-[20%] -right-[15%] w-[70%] h-[60%] rounded-full bg-secondary/30 blur-[140px] mix-blend-multiply opacity-60" />
        <div className="absolute top-[60%] left-[20%] w-[50%] h-[50%] rounded-full bg-muted/40 blur-[100px] mix-blend-multiply opacity-50" />
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[40px]" />
      </div>

      <div className="relative z-10 w-full space-y-6 max-w-3xl mx-auto p-4 sm:p-6 pb-28 pt-6">
        
        {/* HEADER WOW */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 animate-in slide-in-from-left-4 duration-700 ease-out">
              <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight text-foreground">
                <span>¡Hola, {user?.displayName?.split(' ')[0] || 'Productor'}!</span> 
                <span className="drop-shadow-sm inline-block">👋</span>
              </h1>
              <div className="ml-1 sm:ml-2">
                <DashboardTour />
              </div>
            </div>
            <div className="flex items-center gap-3 animate-in slide-in-from-left-4 duration-1000 ease-out">
              <p className="text-foreground/70 font-medium text-sm hidden sm:block">Panel central de tus cultivos inteligentes.</p>
              <Link href="/premium">
                <Badge variant="outline" className="text-xs py-1 px-3 bg-secondary text-secondary-foreground border-secondary/50 hover:bg-secondary/80 cursor-pointer shadow-sm shadow-secondary/10 transition-all rounded-full flex items-center gap-1 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Planes PRO
                </Badge>
              </Link>
            </div>
          </div>
          
          <Button 
            id="tour-add-crop"
            onClick={handleAddCropClick}
            className="flex-shrink-0 relative rounded-2xl w-14 h-14 bg-primary text-primary-foreground border-none shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 active:scale-95 transition-all outline-none group animate-in zoom-in duration-500"
            size="icon"
          >
            <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <Plus className="w-7 h-7 text-primary-foreground" strokeWidth={2.5} />
          </Button>
        </div>

        {/* CLIMA WIDGET (Ventana Atmosférica Glassmorphism) */}
        {weatherLoading ? (
          <div className="h-32 bg-white/30 backdrop-blur-md animate-pulse border border-white/40 rounded-3xl" />
        ) : weather ? (
          <div className="animate-in slide-in-from-bottom-8 duration-700 ease-out delay-100">
            <Card id="tour-weather" className="rounded-[2rem] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.06)] overflow-hidden bg-primary/90 backdrop-blur-xl text-primary-foreground relative">
              <div className="absolute top-0 right-0 p-4 opacity-90 transform translate-x-4 -translate-y-4 pointer-events-none drop-shadow-2xl">
                {getWeatherIcon(weather.code, "w-36 h-36 drop-shadow-xl text-primary-foreground")}
              </div>
              <CardContent className="p-6 md:p-8 flex flex-col justify-between relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 bg-background/20 backdrop-blur-md py-1.5 px-3 rounded-full text-xs font-semibold shadow-inner border border-background/10 text-primary-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    {weather.city || "Tu Ubicación"}
                  </div>
                  <div className="flex items-center gap-1.5 text-primary-foreground">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-background opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-background"></span>
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-90">Tiempo Real</span>
                  </div>
                </div>
                <div className="flex items-end gap-3 mt-2">
                  <span className="text-6xl font-black tracking-tighter drop-shadow-md text-primary-foreground">{Math.round(weather.temp)}°</span>
                  <div className="flex flex-col pb-2 text-primary-foreground">
                    <span className="font-bold text-xl leading-tight drop-shadow-md">{weather.code <= 1 ? "Soleado" : "Lluvia / Nubosidad"}</span>
                    <span className="text-xs font-medium opacity-80 uppercase tracking-widest mt-1">Clima Estimado</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* LISTA DE CULTIVOS (Floating Glass Cards) */}
        <div className="grid gap-4 mt-2">
          {crops && crops.length > 0 ? (
            crops.map((crop, index) => {
              const tempAlert = getCropWeatherAlert(crop.idealTemperature || 24);
              return (
                <div key={crop.id} className="animate-in slide-in-from-bottom-8 duration-700 ease-out" style={{ animationDelay: `${200 + index * 100}ms` }}>
                  <Link href={`/crops/${crop.id}`}>
                    <Card className="rounded-[1.5rem] overflow-hidden hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:bg-background/80 transition-all group active:scale-[0.98] border border-white/60 shadow-sm bg-background/60 backdrop-blur-xl relative">
                      <CardContent className="p-4 md:p-5 flex flex-col gap-3">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-muted transition-colors shadow-inner border border-primary/5">
                            {getCropIconComponent(crop.icon)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <h3 className="font-black text-xl truncate text-foreground">{crop.name}</h3>
                              <Badge variant="secondary" className="text-[9px] h-5 bg-muted text-foreground border border-primary/10 uppercase tracking-widest font-bold hidden sm:inline-flex">{crop.type}</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-foreground/70 mt-1 font-semibold">
                              <span className="flex items-center gap-1.5">
                                <Droplets className="w-4 h-4 text-primary drop-shadow-sm" />
                                {crop.dailyIrrigationGoal} / día
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Thermometer className="w-4 h-4 text-secondary drop-shadow-sm" />
                                {crop.idealTemperature}°C Ideal
                              </span>
                            </div>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-background/50 flex items-center justify-center group-hover:bg-muted transition-colors">
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                        
                        {/* ALERTA DE CLIMA INTEGRADA (Pill Radar) */}
                        {tempAlert && (
                          <div className={cn("flex items-center gap-2.5 px-4 py-2.5 rounded-xl border font-semibold mt-1", tempAlert.bgCol, tempAlert.textCol, "border-transparent shadow-sm backdrop-blur-sm")}>
                            <span className="relative flex h-3 w-3">
                              <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", tempAlert.badgeColor)}></span>
                              <span className={cn("relative inline-flex rounded-full h-3 w-3 shadow-inner", tempAlert.badgeColor)}></span>
                            </span>
                            <div className="flex items-center gap-1.5">
                              <tempAlert.icon className="w-4 h-4" />
                              <span className="text-xs uppercase tracking-wider">{tempAlert.text}</span>
                            </div>
                            <span className="text-xs opacity-80 hidden sm:inline-block ml-auto">- Peligro en salud vegetal. Revisa hoy.</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              );
            })
          ) : (
            <div className="animate-in fade-in duration-1000">
              <Card className="rounded-[2rem] border-dashed border-2 flex flex-col items-center justify-center py-20 text-center gap-5 bg-background/40 backdrop-blur-sm border-primary/20 shadow-none">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-20 animate-pulse" />
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border border-primary/10 shadow-inner relative z-10">
                    <Sprout className="w-12 h-12 text-primary drop-shadow-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-foreground tracking-tight">Tu huerto está vacío</h3>
                  <p className="text-sm font-medium text-foreground/60 max-w-[260px] mx-auto text-balance">
                    Toca el botón magnífico <span className="text-primary font-bold">+</span> arriba para que nuestra IA registre tu primera obra botánica.
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* PIE "El clima importa" (Glass Footer) */}
        <div className="mt-8 animate-in slide-in-from-bottom-4 duration-1000 delay-300">
          <div className="p-6 bg-background/50 backdrop-blur-xl rounded-3xl border border-white/60 flex items-start gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.03)] relative overflow-hidden group hover:bg-background/60 transition-colors">
             <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />
             <div className="shrink-0 mt-1 bg-muted p-2.5 rounded-2xl shadow-sm border border-primary/10 relative z-10">
              <Leaf className="w-6 h-6 text-primary drop-shadow-sm" />
            </div>
            <div className="relative z-10">
              <h3 className="font-bold text-foreground text-sm uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                Inteligencia Ambiental <Sparkles className="w-3.5 h-3.5 text-primary" />
              </h3>
              <p className="text-xs text-foreground/70 font-medium leading-relaxed max-w-[90%]">
                Analizamos los grados diarios 24/7 y los cruzamos con la biometría óptima recomendada por tu asistente IA (Gemini) para brindarte alertas termales oportunas.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* DIALOG DE CREACIÓN IA (Ahora con Glassmorphism modal base) */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!isVerifying) {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[425px] overflow-hidden max-h-[90vh] bg-background/90 backdrop-blur-2xl border-white shadow-2xl rounded-3xl">
          <DialogHeader className="pt-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-3 shadow-inner border border-primary/10 relative">
              <Leaf className="w-8 h-8 text-primary z-10" />
              <div className="absolute inset-0 border border-primary/20 rounded-2xl animate-ping opacity-50 duration-3000"></div>
            </div>
            <DialogTitle className="text-center font-black text-2xl text-foreground tracking-tight">Nueva Planta</DialogTitle>
            <DialogDescription className="text-center font-medium text-foreground/60 text-[13px] px-2 pt-1">
              La IA calculará térmicamente su cuidado base e identificará su familia botánica en segundos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="grid gap-2.5">
              <Label className="font-bold text-foreground/80 text-xs uppercase tracking-wider ml-1">Icono representativo</Label>
              <div className="grid grid-cols-6 gap-2">
                {CROP_ICONS.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    disabled={isVerifying}
                    onClick={() => setNewCrop({ ...newCrop, icon: item.name })}
                    className={cn(
                      "flex items-center justify-center h-12 rounded-xl border-2 transition-all",
                      newCrop.icon === item.name 
                        ? "border-primary bg-muted text-primary scale-105 shadow-md shadow-primary/10" 
                        : "border-transparent bg-background text-foreground/50 hover:bg-muted/50 hover:text-foreground/80",
                      isVerifying && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <item.icon className="w-5 h-5 drop-shadow-sm" />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2.5">
              <Label htmlFor="name" className="font-bold text-foreground/80 text-xs uppercase tracking-wider ml-1">¿Qué vamos a cuidar?</Label>
              <Input 
                id="name" 
                placeholder="Ej. Tomate Cherry Mágico..." 
                value={newCrop.name}
                disabled={isVerifying}
                onChange={(e) => setNewCrop({...newCrop, name: e.target.value})}
                className="h-14 bg-background/80 border-slate-200 rounded-xl font-medium text-[15px] focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground shadow-sm text-foreground"
                autoComplete="off"
              />
            </div>
            
            {isVerifying && (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 opacity-90 animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-2 relative shadow-inner border border-primary/10">
                   <div className="absolute inset-0 border-[3px] border-primary border-t-transparent rounded-full animate-spin"></div>
                   <Sparkles className="w-7 h-7 text-primary animate-pulse drop-shadow-sm" />
                </div>
                <div>
                   <p className="text-base font-black text-primary tracking-tight">Analizando ADN vegetal</p>
                   <p className="text-[12px] font-medium text-foreground/60 mt-1 tracking-wide">Invocando el poder de Gemini...</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="pb-2">
            <Button 
              onClick={handleCreateCrop} 
              className={cn(
                "w-full h-14 text-[15px] font-black transition-all shadow-xl rounded-xl border-none",
                !newCrop.name || isVerifying 
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                  : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-95"
              )}
              disabled={!newCrop.name || isVerifying}
            >
              {isVerifying ? "Contactando Servidores..." : "Desplegar Magia IA ✨"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Paywall Modal Premium */}
      <Dialog open={showPremiumModal} onOpenChange={setShowPremiumModal}>
        <DialogContent className="sm:max-w-[400px] text-center p-8 bg-white/90 backdrop-blur-2xl border-amber-200/50 shadow-2xl rounded-[2rem]">
          <DialogHeader className="flex flex-col items-center">
            <div className="relative mb-5">
              <div className="absolute inset-0 bg-secondary rounded-full blur-xl opacity-30 animate-pulse"></div>
              <div className="relative w-20 h-20 bg-secondary/20 rounded-3xl flex items-center justify-center border-2 border-white shadow-lg rotate-3">
                <Sparkles className="w-10 h-10 text-secondary drop-shadow-sm" />
              </div>
            </div>
            <DialogTitle className="text-3xl text-foreground font-black tracking-tighter pb-1">¡Nivel 1 Superado!</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm font-medium text-foreground/80 mb-4 leading-relaxed">
              Tu versión gratuita admite monitorear <strong>3 cultivos simultáneos</strong> con IA. Has llegado a tu límite actual. 
              <br/><br/>
              Desbloquea el huerto infinito y sube de nivel tu producción aliándote con Premium.
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-col gap-3 w-full mt-3">
            <Button 
              onClick={() => router.push("/premium")} 
              className="w-full h-14 rounded-xl text-[15px] font-black bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-xl shadow-secondary/25 border-none hover:-translate-y-1 active:scale-95 transition-all"
            >
              Conocer Planes PRO
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setShowPremiumModal(false)}
              className="w-full text-foreground/60 hover:text-foreground font-bold hover:bg-background/80 rounded-xl h-12"
            >
              Quizás más tarde
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Banner de AdMob */}
      <BannerAd position="bottom" margin={64} />
    </div>
  );
}
