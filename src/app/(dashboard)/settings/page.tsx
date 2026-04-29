import { Settings, Clock } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
        <Clock className="w-12 h-12 text-primary" />
      </div>
      <h1 className="text-3xl font-black text-foreground mb-4 tracking-tight">
        Próximamente
      </h1>
      <p className="text-muted-foreground text-lg max-w-md font-medium">
        Estamos trabajando en nuevas opciones de configuración para mejorar tu experiencia en CultivIA. ¡Mantente atento!
      </p>
    </div>
  );
}
