"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirebase } from "@/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Calendar, Smartphone, BrainCircuit, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OnboardingPage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [nivel, setNivel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    
    // Check if we actually need onboarding
    const checkProfile = async () => {
      try {
        const userRef = doc(firestore, "users", user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.fecha_nacimiento && data.nivel_tecnologico) {
            router.push("/dashboard");
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    checkProfile();
  }, [user, isUserLoading, firestore, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaNacimiento || !nivel) {
      toast({
        variant: "destructive",
        title: "Faltan datos",
        description: "Por favor, completa ambos campos para continuar."
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const userRef = doc(firestore, "users", user!.uid);
      await setDoc(userRef, {
        fecha_nacimiento: fechaNacimiento,
        nivel_tecnologico: nivel
      }, { merge: true });
      
      toast({
        title: "¡Todo listo!",
        description: "Tu experiencia ha sido personalizada."
      });
      
      setTimeout(() => router.push("/dashboard"), 500);
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive", 
        title: "Error al guardar",
        description: "No se pudieron guardar tus preferencias."
      });
      setIsSubmitting(false);
    }
  };

  if (isUserLoading || isLoadingProfile) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[100px] mix-blend-multiply animate-pulse" />
        <div className="absolute top-[30%] -right-[15%] w-[60%] h-[60%] rounded-full bg-secondary/30 blur-[120px] mix-blend-multiply opacity-70" />
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[40px]" />
      </div>

      <div className="relative z-10 w-full max-w-[450px] animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
        <div className="bg-background/80 backdrop-blur-3xl rounded-[2rem] p-8 shadow-[0_16px_40px_rgba(0,0,0,0.08)] border border-white/60">
          
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-foreground tracking-tight mb-2 flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Personaliza tu Experiencia
            </h1>
            <p className="text-foreground/60 text-sm font-medium">
              AgroAlerta se adaptará a lo que te parezca más cómodo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label className="text-foreground/80 font-bold text-sm tracking-wide">1. Fecha de Nacimiento</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input 
                  type="date"
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                  className="pl-11 h-12 bg-background/60 border-primary/20 rounded-xl text-foreground focus-visible:ring-primary shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-foreground/80 font-bold text-sm tracking-wide">2. ¿Qué tanta experiencia tienes con apps?</Label>
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => setNivel("basico")}
                  className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden group ${nivel === "basico" ? "border-primary bg-primary/10 shadow-sm" : "border-transparent bg-muted/60 hover:bg-muted/90"}`}
                >
                  <div className="flex items-center gap-3 relative z-10">
                    <Smartphone className={`w-6 h-6 flex-shrink-0 ${nivel === "basico" ? "text-primary drop-shadow-sm" : "text-muted-foreground"}`} />
                    <div>
                      <h3 className={`font-bold ${nivel === "basico" ? "text-primary flex items-center gap-1.5" : "text-foreground/80"}`}>
                        Básica (Quiero el modo fácil)
                        {nivel === "basico" && <span className="flex h-2 w-2 ml-1"><span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span></span>}
                      </h3>
                      <p className="text-xs text-foreground/60 mt-1 font-medium">Textos más grandes, alto contraste y respuestas por voz.</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setNivel("avanzado")}
                  className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden group ${nivel === "avanzado" ? "border-secondary bg-secondary/10 shadow-sm" : "border-transparent bg-muted/60 hover:bg-muted/90"}`}
                >
                  <div className="flex items-center gap-3 relative z-10">
                    <BrainCircuit className={`w-6 h-6 flex-shrink-0 ${nivel === "avanzado" ? "text-secondary drop-shadow-sm" : "text-muted-foreground"}`} />
                    <div>
                      <h3 className={`font-bold ${nivel === "avanzado" ? "text-secondary flex items-center gap-1.5" : "text-foreground/80"}`}>
                        Avanzada (Soy experto)
                        {nivel === "avanzado" && <span className="flex h-2 w-2 ml-1"><span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-secondary opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span></span>}
                      </h3>
                      <p className="text-xs text-foreground/60 mt-1 font-medium">Interfaz moderna e información técnica detallada.</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting || !nivel || !fechaNacimiento}
              className="w-full h-14 rounded-xl text-[15px] font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/25 disabled:shadow-none transition-all hover:-translate-y-0.5 active:scale-95"
            >
              {isSubmitting ? <Loader2 className="mr-2 animate-spin w-5 h-5" /> : "Continuar al Dashboard"}
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
}
