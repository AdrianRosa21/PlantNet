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
    if (code <= 1) return <Sun className={className} />;
    if (code === 2 || code === 3 || code === 45 || code === 48) return <Cloud className={className} />;
    if (code >= 51 && code <= 67) return <CloudRain className={className} />;
    if (code >= 71) return <Snowflake className={className} />;
    return <Sun className={className} />; 
  };

  const getCropWeatherAlert = (idealTemp: number) => {
    if (!weather) return null;
    const diff = weather.temp - idealTemp;
    if (diff > 5) return { type: "heat", text: "¡Mucho Calor!", icon: Flame, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" };
    if (diff < -5) return { type: "cold", text: "¡Mucho Frío!", icon: Snowflake, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" };
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
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            ¡Hola, {user?.displayName?.split(' ')[0] || 'Productor'}! 👋
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-muted-foreground text-sm hidden sm:block">Gestiona tus cultivos inteligentes.</p>
            <Link href="/premium">
              <Badge variant="outline" className="text-xs py-1 px-3 bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border-amber-300 hover:from-amber-200 hover:to-amber-100 cursor-pointer shadow-sm transition-all rounded-full flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Explorar Planes PRO
              </Badge>
            </Link>
          </div>
        </div>
        
        <Button 
          onClick={handleAddCropClick}
          className="rounded-full w-14 h-14 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          size="icon"
        >
          <Plus className="w-8 h-8" />
        </Button>
      </div>

      {/* CLIMA WIDGET (OPEN METEO) */}
      {weatherLoading ? (
        <div className="h-28 bg-slate-100 animate-pulse rounded-3xl" />
      ) : weather ? (
        <Card className="rounded-3xl border-none shadow-md overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 text-white relative">
          <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4">
            {getWeatherIcon(weather.code, "w-32 h-32 text-white")}
          </div>
          <CardContent className="p-6 flex flex-col justify-between relative z-10">
            <div className="flex items-center gap-2 mb-2 opacity-90 text-sm font-medium">
              <MapPin className="w-4 h-4" />
              {weather.city || "Tu Ubicación"}
            </div>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-extrabold tracking-tighter shadow-sm">{Math.round(weather.temp)}°</span>
              <div className="flex flex-col pb-1">
                <span className="font-semibold text-lg leading-tight">{weather.code <= 1 ? "Soleado" : "Nublado/Lluvia"}</span>
                <span className="text-xs opacity-80">Condiciones en tiempo real</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* LISTA DE CULTIVOS */}
      <div className="grid gap-4">
        {crops && crops.length > 0 ? (
          crops.map((crop) => {
            const tempAlert = getCropWeatherAlert(crop.idealTemperature || 24);
            return (
              <Link key={crop.id} href={`/crops/${crop.id}`}>
                <Card className="overflow-hidden hover:border-primary/50 transition-all group active:scale-[0.98] border border-slate-100 shadow-sm bg-white">
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        {getCropIconComponent(crop.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg truncate text-foreground">{crop.name}</h3>
                          <Badge variant="secondary" className="text-[10px] h-5 bg-secondary/20 text-secondary-foreground border-none uppercase tracking-wider">{crop.type}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Droplets className="w-3.5 h-3.5 text-blue-500" />
                            {crop.dailyIrrigationGoal} / día
                          </span>
                          <span className="flex items-center gap-1.5 font-medium">
                            <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                            {crop.idealTemperature}°C Ideal
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    
                    {/* ALERTA DE CLIMA INTEGRADA */}
                    {tempAlert && (
                      <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold animate-in fade-in", tempAlert.bg, tempAlert.color, tempAlert.border)}>
                        <tempAlert.icon className="w-4 h-4" />
                        {tempAlert.text} Revisa tu planta para protegerla.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })
        ) : (
          <Card className="border-dashed border-2 flex flex-col items-center justify-center py-16 text-center gap-4 bg-transparent border-primary/20 shadow-none">
            <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center">
              <Sprout className="w-10 h-10 text-primary/30" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold text-primary/40">Sin cultivos aún</CardTitle>
              <p className="text-sm text-muted-foreground max-w-[240px] mx-auto">
                Toca el botón "+" para que la IA registre tu primer cultivo inteligente.
              </p>
            </div>
          </Card>
        )}
      </div>

      <div className="p-5 bg-primary/5 rounded-3xl border border-primary/10 flex items-start gap-4 shadow-inner">
        <div className="mt-1 bg-white p-2 rounded-full shadow-sm">
          <Leaf className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-primary text-sm mb-1">El clima importa</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Hemos cruzado los datos ambientales con las temperaturas ideales sugeridas por la IA para alertarte si debes hidratar más o resguardar del frío a tus cultivos.
          </p>
        </div>
      </div>

      {/* DIALOG DE CREACIÓN IA */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!isVerifying) {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Leaf className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-center">Nuevo Cultivo Inteligente</DialogTitle>
            <DialogDescription className="text-center">
              Dinos el nombre de tu planta y la IA de AgroAlerta autocompletará mágicamente su temperatura y riegos ideales.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Selecciona un icono</Label>
              <div className="grid grid-cols-6 gap-2">
                {CROP_ICONS.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    disabled={isVerifying}
                    onClick={() => setNewCrop({ ...newCrop, icon: item.name })}
                    className={cn(
                      "flex items-center justify-center h-10 rounded-lg border-2 transition-all",
                      newCrop.icon === item.name 
                        ? "border-primary bg-primary/10 text-primary scale-110 shadow-sm" 
                        : "border-transparent bg-slate-50 hover:bg-slate-100",
                      isVerifying && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Nombre de la plántula</Label>
              <Input 
                id="name" 
                placeholder="Ej. Tomate Cherry, Lavanda..." 
                value={newCrop.name}
                disabled={isVerifying}
                onChange={(e) => setNewCrop({...newCrop, name: e.target.value})}
                className="h-12 bg-slate-50 border-slate-200"
                autoComplete="off"
              />
            </div>
            
            {isVerifying && (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-3 opacity-90">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-1">
                   <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                </div>
                <div>
                   <p className="text-sm font-bold text-primary">Analizando botánicamente...</p>
                   <p className="text-[11px] text-muted-foreground mt-1">Calculando temperatura y riegos óptimos</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              onClick={handleCreateCrop} 
              className="w-full h-12 text-base font-bold transition-all shadow-lg hover:shadow-primary/25"
              disabled={!newCrop.name || isVerifying}
            >
              {isVerifying ? "Generando cultivo..." : "Magia con IA ✨"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Paywall Modal Premium */}
      <Dialog open={showPremiumModal} onOpenChange={setShowPremiumModal}>
        <DialogContent className="sm:max-w-[400px] text-center p-6 border-amber-200">
          <DialogHeader className="flex flex-col items-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 border-4 border-amber-50">
              <Sparkles className="w-8 h-8 text-amber-500" />
            </div>
            <DialogTitle className="text-2xl text-slate-800 font-bold mb-2">¡Límite Alcanzado!</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-slate-600 mb-4">
              Tu cuenta gratuita solo permite monitorear un <strong>máximo de 3 cultivos</strong> simultáneamente. 
              <br/><br/>
              Actualiza a la versión PRO para tener huertos ilimitados y aprovechar toda la potencia de la IA.
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-col gap-2 w-full mt-2">
            <Button 
              onClick={() => router.push("/premium")} 
              className="w-full h-12 text-base font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25 border-none"
            >
              Ver Planes Premium
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setShowPremiumModal(false)}
              className="w-full text-slate-500 hover:text-slate-800"
            >
              Quizás más tarde
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
