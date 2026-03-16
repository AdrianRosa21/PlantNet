"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PlusCircle, Sprout, Loader2, ChevronRight, Droplets, Search, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PLANT_TYPES = [
  "Cactus",
  "Suculentas",
  "Árboles",
  "Plantas subterráneas",
  "Plantas trepadoras",
  "Plantas acuáticas",
  "Plantas ornamentales",
  "Plantas medicinales",
  "Tomate",
  "Lechuga",
  "Chile",
  "Fresa"
];

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [newCrop, setNewCrop] = useState({ name: "", type: "" });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const cropsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users", user.uid, "crops");
  }, [firestore, user]);

  const { data: crops, isLoading } = useCollection(cropsQuery);

  const filteredPlantTypes = useMemo(() => {
    if (!searchQuery) return PLANT_TYPES;
    return PLANT_TYPES.filter((type) =>
      type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Cerrar dropdown si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateCrop = () => {
    if (!user || !firestore || !newCrop.name || !newCrop.type) return;

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
    resetForm();
  };

  const resetForm = () => {
    setNewCrop({ name: "", type: "" });
    setSearchQuery("");
    setIsDropdownOpen(false);
  };

  const handleSelectType = (type: string) => {
    setNewCrop({ ...newCrop, type });
    setSearchQuery(type);
    setIsDropdownOpen(false);
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
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
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

              {/* Selector de Tipo Buscable Personalizado */}
              <div className="grid gap-2 relative" ref={dropdownRef}>
                <Label htmlFor="type-search">Tipo de planta</Label>
                <div className="relative">
                  <Input
                    id="type-search"
                    placeholder="Escribe para buscar tipo..."
                    value={searchQuery}
                    autoComplete="off"
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                      // Si el usuario borra todo, reseteamos el tipo seleccionado
                      if (newCrop.type && e.target.value !== newCrop.type) {
                        setNewCrop(prev => ({ ...prev, type: "" }));
                      }
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    className={cn(
                      "pr-10",
                      newCrop.type && "border-primary ring-1 ring-primary/20 bg-primary/5"
                    )}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {newCrop.type ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Search className="h-4 w-4 opacity-50" />
                    )}
                  </div>
                </div>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 z-[100] mt-1 bg-card border rounded-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <ScrollArea className="h-48">
                      <div className="p-1">
                        {filteredPlantTypes.length > 0 ? (
                          filteredPlantTypes.map((type) => (
                            <button
                              key={type}
                              type="button"
                              className={cn(
                                "flex w-full items-center px-3 py-2 text-sm text-left hover:bg-primary/10 transition-colors rounded-sm",
                                newCrop.type === type && "bg-primary/5 text-primary font-medium"
                              )}
                              onClick={() => handleSelectType(type)}
                            >
                              <Sprout className="mr-2 h-4 w-4 opacity-70" />
                              {type}
                              {newCrop.type === type && <Check className="ml-auto h-4 w-4" />}
                            </button>
                          ))
                        ) : (
                          <div className="py-6 px-4 text-center">
                            <p className="text-xs text-muted-foreground italic">No se encontraron tipos.</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
                
                {!newCrop.type && searchQuery && !isDropdownOpen && (
                  <p className="text-[10px] text-destructive font-medium px-1">
                    Debes seleccionar una opción de la lista.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleCreateCrop} 
                className="w-full h-11"
                disabled={!newCrop.name || !newCrop.type}
              >
                Guardar Cultivo
              </Button>
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
