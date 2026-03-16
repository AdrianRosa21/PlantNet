"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Droplets, Thermometer, Wind, Sprout, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CropDetailPage() {
  const { cropId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  const cropRef = useMemoFirebase(() => {
    if (!firestore || !user || !cropId) return null;
    return doc(firestore, "users", user.uid, "crops", cropId as string);
  }, [firestore, user, cropId]);

  const { data: crop, isLoading } = useDoc(cropRef);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!crop) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Cultivo no encontrado.</p>
        <Button variant="link" onClick={() => router.back()}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight truncate">{crop.name}</h1>
          <p className="text-sm text-muted-foreground">{crop.type}</p>
        </div>
        <Badge variant={crop.generalStatus === "Saludable" ? "default" : "destructive"}>
          {crop.generalStatus}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-blue-50/50 border-blue-100">
          <CardContent className="p-4 flex flex-col items-center gap-2">
            <Droplets className="w-6 h-6 text-blue-500" />
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-blue-600/70">Riego Hoy</p>
              <p className="text-xl font-bold">{crop.irrigationsToday}/{crop.dailyIrrigationGoal}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50/50 border-orange-100">
          <CardContent className="p-4 flex flex-col items-center gap-2">
            <Thermometer className="w-6 h-6 text-orange-500" />
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-orange-600/70">Temp. Ideal</p>
              <p className="text-xl font-bold">24°C</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sprout className="w-5 h-5 text-primary" />
            Estado del Cultivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tu {crop.type.toLowerCase()} se encuentra en estado <span className="text-primary font-semibold">{crop.generalStatus.toLowerCase()}</span>. 
            No se han detectado anomalías en las últimas 24 horas.
          </p>
          <div className="flex justify-center py-4">
             <Button className="w-full">Registrar Riego Manual</Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
        <h3 className="font-semibold text-primary text-sm mb-1">Próximamente: Análisis IA</h3>
        <p className="text-xs text-muted-foreground">
          En la siguiente fase podrás subir fotos de tus hojas para un diagnóstico por inteligencia artificial.
        </p>
      </div>
    </div>
  );
}
