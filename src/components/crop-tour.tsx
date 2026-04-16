"use client";
import { useEffect, useRef, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccessibility } from "./accessibility-provider";

export function CropTour() {
  const [mounted, setMounted] = useState(false);
  const driverObj = useRef<any>(null);

  const { isLoading, isAccessibleMode } = useAccessibility();

  useEffect(() => {
    setMounted(true);
    
    let chatTourDescription = "Sube una foto y ve la magia óptica. O envíale comandos de voz como: 'Regué la planta', ¡ella apuntará todo por ti en el calendario! Y si quieres que te hable, dale al ícono 🔊 junto a cada respuesta.";
    let chatTourTitle = "IA Manos Libres y Escáner";

    if (isAccessibleMode) {
      chatTourTitle = "El Botón Gigante (Walkie-Talkie) 🎙️";
      chatTourDescription = "Como activaste el modo fácil, solo mantén pulsado el botón grande verde para hablar, suelta y yo apuntaré lo que pidas y te contestaré hablando.";
    }

    driverObj.current = driver({
      showProgress: true,
      nextBtnText: "Siguiente ✨",
      prevBtnText: "Anterior",
      doneBtnText: "¡Listo!",
      steps: [
        { element: "#tour-water", popover: { title: "Progreso de Riego", description: "Conoce tu objetivo e hidratación diaria para esta planta.", side: "bottom" } },
        { element: "#tour-irrigation", popover: { title: "Control Diario", description: "Usa este botón diariamente para registrar tus riegos. ¡Te avisaremos si el suelo se empieza a ahogar!", side: "top" } },
        { element: "#tour-calendar", popover: { title: "Calendario Histórico", description: "Navega hacia días pasados tocando estas fechas para ver la bitácora anterior en modo 'Solo Lectura'.", side: "bottom" } },
        { element: "#tour-chat", popover: { title: chatTourTitle, description: chatTourDescription, side: "top" } },
        { element: "#tour-tasks", popover: { title: "Tareas del Día", description: "No te olvides de nada importante: anota cuándo cosechar, podar o abonar.", side: "top" } }
      ]
    });
  }, [isAccessibleMode]);

  useEffect(() => {
    if (isLoading || !mounted) return;

    const hasSeenTour = localStorage.getItem("agroalerta-tour-crop");
    if (!hasSeenTour) {
      const checkDOM = setInterval(() => {
        if (document.querySelector("#tour-water") && document.querySelector("#tour-chat")) {
          clearInterval(checkDOM);
          setTimeout(() => {
            driverObj.current?.drive();
            localStorage.setItem("agroalerta-tour-crop", "true");
          }, 300);
        }
      }, 500);
      
      return () => clearInterval(checkDOM);
    }
  }, [isLoading, mounted]);

  if (!mounted) return null;

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="rounded-full text-foreground/80 hover:text-primary hover:bg-primary/10 shrink-0 border-2 border-foreground/20 shadow-sm bg-background/50 backdrop-blur-sm transition-all hover:border-primary/40" 
      onClick={() => driverObj.current?.drive()}
      title="Ver recorrido guiado"
    >
      <HelpCircle className="w-5 h-5 flex-shrink-0" />
    </Button>
  );
}
