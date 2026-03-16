"use client";

import { useAuth } from "@/context/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PlusCircle, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">¡Hola, {user?.displayName?.split(' ')[0] || 'Productor'}! 👋</h1>
        <p className="text-muted-foreground">Bienvenido a tu control de cultivos.</p>
      </div>

      <div className="grid gap-4">
        <Card className="border-dashed border-2 flex flex-col items-center justify-center py-10 text-center gap-4 bg-transparent">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Sprout className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-lg">No hay cultivos aún</CardTitle>
            <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">
              Comienza registrando tu primer cultivo para monitorearlo.
            </p>
          </div>
          <Button className="gap-2 mt-2">
            <PlusCircle className="w-4 h-4" />
            Registrar Cultivo
          </Button>
        </Card>
      </div>

      {/* Placeholder for real data in Phase 2 */}
      <div className="mt-8 p-4 bg-secondary/10 rounded-2xl border border-secondary/20">
        <h3 className="font-semibold text-secondary-foreground mb-1">MVP Estudiantil</h3>
        <p className="text-xs text-muted-foreground">
          Fase 1 completada: Estructura base, navegación y autenticación funcionando correctamente.
        </p>
      </div>
    </div>
  );
}