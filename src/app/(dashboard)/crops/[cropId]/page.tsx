
"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Droplets, Thermometer, Sprout, Loader2, Leaf, Flower2, TreePine, Shrub, Wheat, Pencil, Trash2, Check, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const PLANT_TYPES = [
  "Cactus", "Suculentas", "Árboles", "Plantas subterráneas", "Plantas trepadoras", "Plantas acuáticas", "Plantas ornamentales", "Plantas medicinales", "Tomate", "Lechuga", "Chile", "Fresa"
];

const CROP_ICONS = [
  { name: "Sprout", icon: Sprout },
  { name: "Leaf", icon: Leaf },
  { name: "Flower2", icon: Flower2 },
  { name: "TreePine", icon: TreePine },
  { name: "Shrub", icon: Shrub },
  { name: "Wheat", icon: Wheat },
];

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

  // Estados para Edición
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    type: "",
    icon: "Sprout",
    dailyIrrigationGoal: "2",
    idealTemperature: "24"
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Inicializar formulario al abrir edición
  useEffect(() => {
    if (crop && isEditDialogOpen) {
      setEditForm({
        name: crop.name || "",
        type: crop.type || "",
        icon: crop.icon || "Sprout",
        // Añadimos seguridad con ?? para evitar errores de toString() si el campo es undefined
        dailyIrrigationGoal: (crop.dailyIrrigationGoal ?? 2).toString(),
        idealTemperature: (crop.idealTemperature ?? 24).toString()
      });
      setSearchQuery(crop.type || "");
    }
  }, [crop, isEditDialogOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUpdateCrop = () => {
    if (!cropRef || !editForm.name || !editForm.type) return;

    const updatedData = {
      name: editForm.name,
      type: editForm.type,
      icon: editForm.icon,
      dailyIrrigationGoal: Number(editForm.dailyIrrigationGoal) || 1,
      idealTemperature: Number(editForm.idealTemperature) || 24,
    };

    updateDocumentNonBlocking(cropRef, updatedData);
    setIsEditDialogOpen(false);
  };

  const handleDeleteCrop = () => {
    if (!cropRef) return;
    deleteDocumentNonBlocking(cropRef);
    router.push("/dashboard");
  };

  const filteredPlantTypes = useMemo(() => {
    if (!searchQuery) return PLANT_TYPES;
    return PLANT_TYPES.filter((type) =>
      type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const getCropIcon = (iconName: string, className = "w-5 h-5 text-primary") => {
    const iconObj = CROP_ICONS.find(i => i.name === iconName) || CROP_ICONS[0];
    const IconComponent = iconObj.icon;
    return <IconComponent className={className} />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!crop) {
    return (
      <div className="text-center py-20 px-6">
        <p className="text-muted-foreground mb-4">Cultivo no encontrado o ha sido eliminado.</p>
        <Button onClick={() => router.push("/dashboard")}>Volver al Panel</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">{crop.name}</h1>
          <p className="text-sm text-muted-foreground">{crop.type}</p>
        </div>
        <Badge variant={crop.generalStatus === "Saludable" ? "default" : "destructive"}>
          {crop.generalStatus}
        </Badge>
      </div>

      <div className="flex gap-2">
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1 gap-2 h-11 rounded-xl">
              <Pencil className="w-4 h-4" />
              Editar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Editar Cultivo</DialogTitle>
              <DialogDescription>Modifica los parámetros de tu cultivo inteligente.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Selecciona un icono</Label>
                <div className="grid grid-cols-6 gap-2">
                  {CROP_ICONS.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, icon: item.name })}
                      className={cn(
                        "flex items-center justify-center h-10 rounded-lg border-2 transition-all",
                        editForm.icon === item.name 
                          ? "border-primary bg-primary/10 text-primary" 
                          : "border-transparent bg-muted hover:bg-muted/80"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nombre del cultivo</Label>
                <Input 
                  id="edit-name" 
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="h-11"
                />
              </div>

              <div className="grid gap-2 relative" ref={dropdownRef}>
                <Label htmlFor="edit-type">Tipo de planta</Label>
                <div className="relative">
                  <Input
                    id="edit-type"
                    value={searchQuery}
                    autoComplete="off"
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                      if (editForm.type && e.target.value !== editForm.type) {
                        setEditForm(prev => ({ ...prev, type: "" }));
                      }
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    className={cn(
                      "pr-10 h-11 transition-all",
                      editForm.type && "border-primary ring-1 ring-primary/20 bg-primary/5"
                    )}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {editForm.type ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Search className="h-4 w-4 opacity-50" />
                    )}
                  </div>
                </div>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 z-[100] mt-2 bg-card border rounded-xl shadow-2xl overflow-hidden">
                    <ScrollArea className="h-56">
                      <div className="p-2 space-y-1">
                        {filteredPlantTypes.map((type) => (
                          <button
                            key={type}
                            type="button"
                            className={cn(
                              "flex w-full items-center px-3 py-2.5 text-sm text-left hover:bg-primary/10 transition-colors rounded-lg",
                              editForm.type === type && "bg-primary/5 text-primary font-bold"
                            )}
                            onClick={() => {
                              setEditForm({ ...editForm, type });
                              setSearchQuery(type);
                              setIsDropdownOpen(false);
                            }}
                          >
                            <Sprout className="mr-3 h-4 w-4 opacity-70 text-primary" />
                            {type}
                            {editForm.type === type && <Check className="ml-auto h-4 w-4" />}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-irrigation">Riegos diarios</Label>
                  <Input 
                    id="edit-irrigation" 
                    type="number"
                    value={editForm.dailyIrrigationGoal}
                    onChange={(e) => setEditForm({...editForm, dailyIrrigationGoal: e.target.value})}
                    className="h-11"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-temp">Temp. Ideal (°C)</Label>
                  <Input 
                    id="edit-temp" 
                    type="number"
                    value={editForm.idealTemperature}
                    onChange={(e) => setEditForm({...editForm, idealTemperature: e.target.value})}
                    className="h-11"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdateCrop} className="w-full h-12" disabled={!editForm.name || !editForm.type}>
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="flex-1 gap-2 h-11 rounded-xl">
              <Trash2 className="w-4 h-4" />
              Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminarán permanentemente los datos de "{crop.name}" de nuestros servidores.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteCrop} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Eliminar para siempre
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-blue-50/50 border-blue-100 rounded-2xl">
          <CardContent className="p-4 flex flex-col items-center gap-2">
            <Droplets className="w-6 h-6 text-blue-500" />
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-blue-600/70">Riego Hoy</p>
              <p className="text-xl font-bold">{crop.irrigationsToday}/{crop.dailyIrrigationGoal ?? 1}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50/50 border-orange-100 rounded-2xl">
          <CardContent className="p-4 flex flex-col items-center gap-2">
            <Thermometer className="w-6 h-6 text-orange-500" />
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-orange-600/70">Temp. Ideal</p>
              <p className="text-xl font-bold">{crop.idealTemperature ?? 24}°C</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-sm border-none bg-white">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {getCropIcon(crop.icon || "Sprout", "w-6 h-6 text-primary")}
            Estado Actual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tu {(crop.type || "planta").toLowerCase()} se encuentra en estado <span className="text-primary font-bold">{(crop.generalStatus || "Saludable").toLowerCase()}</span>. 
            El sistema está monitoreando las condiciones ambientales para asegurar el crecimiento óptimo.
          </p>
          <Button className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/10">
            Registrar Riego Manual
          </Button>
        </CardContent>
      </Card>
      
      <div className="p-5 bg-primary/5 rounded-3xl border border-primary/10 flex items-start gap-3">
        <div className="mt-1 bg-primary/20 p-2 rounded-xl">
          <Leaf className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-primary text-sm mb-1">Próximamente: Diagnóstico IA</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Muy pronto podrás subir fotos de las hojas para detectar enfermedades automáticamente con visión artificial.
          </p>
        </div>
      </div>
    </div>
  );
}
