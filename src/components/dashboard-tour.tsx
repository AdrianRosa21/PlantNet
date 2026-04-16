"use client";
import { useEffect, useRef, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccessibility } from "@/components/accessibility-provider";

export function DashboardTour() {
  const [mounted, setMounted] = useState(false);
  const driverObj = useRef<any>(null);

  const { isLoading, isAccessibleMode } = useAccessibility();

  useEffect(() => {
    setMounted(true);
    
    // Configurar pasos dinámicamente según el modo
    const steps: any[] = [
      { popover: { title: "¡Bienvenido a AgroAlerta!", description: "Vamos a dar un paseo rápido para que aprendas a cuidar tus cultivos como un profesional." } },
      { element: "#tour-weather", popover: { title: "Clima Inteligente", description: "Nuestra IA cruza tu ubicación con pronósticos meteorológicos en tiempo real para darte sugerencias valiosas.", side: "bottom" } },
      { element: "#tour-add-crop", popover: { title: "Añade tu Cultivo", description: "Todo empieza aquí. Pulsa este botón para añadir tu primera planta o cultivo y aprovechar todas nuestras utilidades.", side: "left" } }
    ];

    if (isAccessibleMode) {
      steps.push({
        popover: { 
          title: "Modo Senior Activado 👓", 
          description: "Notarás letras más grandes y botones accesibles. Además, la IA te hablará por voz automáticamente.",
        }
      });
    }

    driverObj.current = driver({
      showProgress: true,
      nextBtnText: "Siguiente ✨",
      prevBtnText: "Anterior",
      doneBtnText: "¡Empezar!",
      steps: steps
    });
  }, [isAccessibleMode]);

  useEffect(() => {
    if (isLoading || !mounted) return;

    const hasSeenTour = localStorage.getItem("agroalerta-tour-dashboard");
    if (!hasSeenTour) {
      // Usar un intervalo para esperar que el DOM real (clima) se dibuje
      const checkDOM = setInterval(() => {
        if (document.querySelector("#tour-weather") && document.querySelector("#tour-add-crop")) {
          clearInterval(checkDOM);
          setTimeout(() => {
            driverObj.current?.drive();
            localStorage.setItem("agroalerta-tour-dashboard", "true");
          }, 300);
        }
      }, 500);

      // Limpiar timer si desmonta antes
      return () => clearInterval(checkDOM);
    }
  }, [isLoading, mounted]);

  if (!mounted) return null;

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="rounded-full text-slate-400 hover:text-primary hover:bg-primary/10 ml-2 shadow-sm border border-slate-100" 
      onClick={() => driverObj.current?.drive()}
      title="Ver recorrido guiado"
    >
      <HelpCircle className="w-5 h-5" />
    </Button>
  );
}
