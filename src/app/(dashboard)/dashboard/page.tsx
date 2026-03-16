"use client";

import React, { useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { PlusCircle, Sprout, Loader2, ChevronRight, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCrop, setNewCrop] = useState({ name: "", type: "Tomate" });

  const cropsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users", user.uid, "crops");
  }, [firestore, user]);

  const { data: crops, isLoading } = useCollection(cropsQuery);

  const handleCreateCrop = () => {
    if (!user || !firestore || !newCrop.name) return;

    const cropsRef = collection(firestore, "users", user.uid, "crops");
    const cropData = {
      userId: user.uid,
      name: newCrop.name,
      type: newCrop.type,
      generalStatus: "Saludable",
      dailyIrrigationGoal: 2,
      irrigationsToday: 0,
      createdAt: new Date().toISOString(),
    };

    addDocumentNonBlocking(cropsRef, cropData);
    setIsDialogOpen(false);
    setNewCrop({ name: "", type: "Tomate" });
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
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">¡Hola, {user?.displayName?.split(' ')[0] || 'Productor'}! 👋</h1>
          <p className="text-muted-foreground text-sm">Gestiona tus cultivos inteligentes.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-full shadow-lg">
              <PlusCircle className="w-6 h-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nuevo Cultivo</DialogTitle>
              <DialogDescription>
                Registra un nuevo cultivo para comenzar el monitoreo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre del cultivo</Label>
                <Input 
                  id="name" 
                  placeholder="Ej. Huerto Norte" 
                  value={newCrop.name}
                  onChange={(e) => setNewCrop({...newCrop, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo de planta</Label>
                <Select value={newCrop.type} onValueChange={(value) => setNewCrop({...newCrop, type: value})}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tomate">Tomate</SelectItem>
                    <SelectItem value="Lechuga">Lechuga</SelectItem>
                    <SelectItem value="Chile">Chile</SelectItem>
                    <SelectItem value="Fresa">Fresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateCrop} disabled={!newCrop.name}>Guardar Cultivo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {crops && crops.length > 0 ? (
          crops.map((crop) => (
            <Link key={crop.id} href={`/crops/${crop.id}`}>
              <Card className="overflow-hidden hover:border-primary/50 transition-colors group">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Sprout className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{crop.name}</h3>
                      <Badge variant="secondary" className="text-[10px] h-5">{crop.type}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-blue-500" />
                        {crop.irrigationsToday}/{crop.dailyIrrigationGoal} riegos
                      </span>
                      <span className="text-green-600 font-medium">{crop.generalStatus}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <Card className="border-dashed border-2 flex flex-col items-center justify-center py-12 text-center gap-4 bg-transparent">
            <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center">
              <Sprout className="w-8 h-8 text-primary/40" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg">No hay cultivos</CardTitle>
              <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">
                Toca el botón "+" para registrar tu primer cultivo.
              </p>
            </div>
          </Card>
        )}
      </div>

      <div className="p-4 bg-secondary/10 rounded-2xl border border-secondary/20">
        <h3 className="font-semibold text-secondary-foreground text-sm mb-1">Monitoreo Inteligente</h3>
        <p className="text-xs text-muted-foreground">
          AgroAlerta analiza la salud de tus plantas usando IA para detectar problemas temprano.
        </p>
      </div>
    </div>
  );
}
