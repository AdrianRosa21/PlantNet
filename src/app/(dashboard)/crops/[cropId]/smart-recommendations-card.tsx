'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, Info, Lightbulb } from 'lucide-react';
import { RecommendationService } from '@/services/recommendation-service';
import { useToast } from '@/hooks/use-toast';
import { Firestore } from 'firebase/firestore';

interface SmartRecommendationsCardProps {
  db: Firestore;
  userId: string;
  cropId: string;
  crop: {
    name: string;
    type: string;
    dailyIrrigationGoal: number;
    contexto_agricola?: {
      etapa_crecimiento?: string;
      ubicacion?: string;
      ultima_recomendacion_ia?: {
        texto: string;
        tip: string;
      };
    };
  };
  onLimitReached: () => void;
}

export function SmartRecommendationsCard({
  db,
  userId,
  cropId,
  crop,
  onLimitReached
}: SmartRecommendationsCardProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [growthStage, setGrowthStage] = useState(crop.contexto_agricola?.etapa_crecimiento || '');
  const [lightCondition, setLightCondition] = useState(crop.contexto_agricola?.ubicacion || '');

  const hasContext = !!(crop.contexto_agricola?.etapa_crecimiento && crop.contexto_agricola?.ubicacion);
  const lastRecommendation = crop.contexto_agricola?.ultima_recomendacion_ia;

  const handleGenerate = async (finalGrowthStage?: string, finalLightCondition?: string) => {
    setIsLoading(true);
    setShowWizard(false);
    
    const stage = finalGrowthStage || crop.contexto_agricola?.etapa_crecimiento || growthStage;
    const light = finalLightCondition || crop.contexto_agricola?.ubicacion || lightCondition;

    try {
      const response = await RecommendationService.generateRecommendation(
        db,
        userId,
        cropId,
        crop.name,
        crop.type,
        crop.dailyIrrigationGoal,
        stage,
        light
      );

      if (!response.success) {
        if (response.limitReached) {
          onLimitReached();
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: response.error || "No se pudo generar la recomendación."
          });
        }
      } else {
        toast({
          title: "¡Recomendación lista!",
          description: "AgroAlerta IA ha generado nuevos consejos para ti."
        });
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error interno al conectar con IA."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onGenerateClick = () => {
    if (hasContext) {
      // Direct generation
      handleGenerate();
    } else {
      // Ask context
      setShowWizard(true);
    }
  };

  return (
    <>
      <Card className="rounded-2xl shadow-sm border-none bg-gradient-to-br from-green-50 to-emerald-50/20 overflow-hidden relative">
        <CardHeader className="pb-3 border-b border-green-100/50 bg-white/50 backdrop-blur-sm flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-emerald-800">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            Recomendaciones IA
          </CardTitle>
          <Button 
            onClick={onGenerateClick} 
            disabled={isLoading}
            size="sm" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
            Actualizar
          </Button>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-6 text-emerald-600 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm font-medium animate-pulse">Analizando tu {crop.name}...</p>
            </div>
          )}

          {!isLoading && lastRecommendation && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
                <p className="text-sm text-slate-700 leading-relaxed">
                  {lastRecommendation.texto}
                </p>
              </div>
              <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-3 border border-amber-100">
                <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-0.5">Tip Rápido</p>
                  <p className="text-sm text-amber-900 leading-snug">{lastRecommendation.tip}</p>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !lastRecommendation && (
            <div className="text-center py-6 px-2">
              <Info className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
              <p className="text-sm text-slate-600">Presiona "Actualizar" para conseguir un plan de cuidado hiper-personalizado por IA.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-emerald-100 pb-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-800">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              Personaliza tu recomendación
            </DialogTitle>
            <DialogDescription>
              Para darte un mejor consejo, cuéntame un poco más sobre tu {crop.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-2">
            <div className="grid gap-2">
              <Label>¿En qué etapa de crecimiento está?</Label>
              <Select value={growthStage} onValueChange={setGrowthStage}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecciona una etapa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semilla/Brote">Semilla / Brote</SelectItem>
                  <SelectItem value="Plántula">Pequeña (Plántula)</SelectItem>
                  <SelectItem value="Crecimiento Vegetativo">Crecimiento (Hojas)</SelectItem>
                  <SelectItem value="Floración">Floración</SelectItem>
                  <SelectItem value="Producción/Cosecha">Producción / Cosecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>¿Qué nivel de luz recibe?</Label>
              <Select value={lightCondition} onValueChange={setLightCondition}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecciona la iluminación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sol directo (todo el día)">Sol directo (+6 hrs)</SelectItem>
                  <SelectItem value="Sol parcial (mañana/tarde)">Sol parcial</SelectItem>
                  <SelectItem value="Sombra luminosa">Luz indirecta brillante</SelectItem>
                  <SelectItem value="Sombra/Interior bajo">Interior oscuro / Sombra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button 
              onClick={() => handleGenerate(growthStage, lightCondition)} 
              disabled={!growthStage || !lightCondition || isLoading}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/20"
            >
              Generar Diagnóstico
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
