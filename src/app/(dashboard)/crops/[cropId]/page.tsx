"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  useUser, 
  useFirestore, 
  useDoc, 
  useCollection,
  useMemoFirebase, 
  updateDocumentNonBlocking, 
  deleteDocumentNonBlocking,
  addDocumentNonBlocking
} from "@/firebase";
import { doc, collection, query, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Droplets, 
  Thermometer, 
  Sprout, 
  Loader2, 
  Leaf, 
  Flower2, 
  TreePine, 
  Shrub, 
  Wheat, 
  Pencil, 
  Trash2, 
  AlertTriangle, 
  Info, 
  StickyNote, 
  Plus,
  Calendar
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

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

const NEED_WATER_MESSAGES = [
  "¡Tu planta tiene sed!",
  "Un poco de agua le vendría bien.",
  "¡Hora de hidratar!",
  "¡No te olvides de regar!",
  "¿Ya le diste de beber?",
  "El suelo se ve algo seco.",
  "¡Un traguito de agua, por favor!",
  "Mantén la humedad ideal.",
  "Agua es vida para tu brote.",
  "¡Es momento de cuidar tus raíces!"
];

const OVERWATER_MESSAGES = [
  "¡CUIDADO! Estás regando de más.",
  "¡DETENTE! Podrías ahogar a tu planta. 🛑",
  "Riegos en exceso detectados.",
  "Demasiada agua puede ser mala.",
  "Tu planta ya no puede beber más."
];

export default function CropDetailPage() {
  const { cropId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const cropRef = useMemoFirebase(() => {
    if (!firestore || !user || !cropId) return null;
    return doc(firestore, "users", user.uid, "crops", cropId as string);
  }, [firestore, user, cropId]);

  const { data: crop, isLoading } = useDoc(cropRef);

  const notesQuery = useMemoFirebase(() => {
    if (!firestore || !user || !cropId) return null;
    return query(
      collection(firestore, "users", user.uid, "crops", cropId as string, "notes"),
      orderBy("createdAt", "desc")
    );
  }, [firestore, user, cropId]);

  const { data: notes, isLoading: isLoadingNotes } = useCollection(notesQuery);
  const [newNoteContent, setNewNoteContent] = useState("");

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

  useEffect(() => {
    if (crop && isEditDialogOpen) {
      setEditForm({
        name: crop.name || "",
        type: crop.type || "",
        icon: crop.icon || "Sprout",
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
    updateDocumentNonBlocking(cropRef, {
      name: editForm.name,
      type: editForm.type,
      icon: editForm.icon,
      dailyIrrigationGoal: Number(editForm.dailyIrrigationGoal) || 1,
      idealTemperature: Number(editForm.idealTemperature) || 24,
    });
    setIsEditDialogOpen(false);
  };

  const handleDeleteCrop = () => {
    if (!cropRef) return;
    deleteDocumentNonBlocking(cropRef);
    router.push("/dashboard");
  };

  const handleRegisterIrrigation = () => {
    if (!cropRef || !crop) return;
    const newCount = (crop.irrigationsToday || 0) + 1;
    
    updateDocumentNonBlocking(cropRef, {
      irrigationsToday: newCount
    });

    if (newCount > (crop.dailyIrrigationGoal || 0)) {
      toast({
        variant: "destructive",
        title: "¡Advertencia de exceso!",
        description: "Estás superando la meta. Ten cuidado de no ahogar las raíces.",
      });
    } else if (newCount === crop.dailyIrrigationGoal) {
      toast({
        title: "¡Meta alcanzada!",
        description: "Has completado los riegos del día. ¡Excelente trabajo!",
      });
    }
  };

  const handleAddNote = () => {
    if (!firestore || !user || !cropId || !newNoteContent.trim()) return;
    const notesRef = collection(firestore, "users", user.uid, "crops", cropId as string, "notes");
    addDocumentNonBlocking(notesRef, {
      userId: user.uid,
      cropId: cropId,
      content: newNoteContent,
      createdAt: new Date().toISOString()
    });
    setNewNoteContent("");
    toast({
      title: "Nota guardada",
      description: "Tu nota ha sido agregada correctamente.",
    });
  };

  const handleDeleteNote = (noteId: string) => {
    if (!firestore || !user || !cropId) return;
    const noteRef = doc(firestore, "users", user.uid, "crops", cropId as string, "notes", noteId);
    deleteDocumentNonBlocking(noteRef);
    toast({
      title: "Nota eliminada",
      description: "La nota ha sido removida.",
    });
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

  const irrigationData = useMemo(() => {
    if (!crop) return { status: "Bajo", message: "", percentage: 0 };
    const current = crop.irrigationsToday || 0;
    const goal = crop.dailyIrrigationGoal || 1;
    const percentage = Math.min((current / goal) * 100, 100);

    let status = "Riego Bajo";
    let message = NEED_WATER_MESSAGES[current % NEED_WATER_MESSAGES.length];

    if (current === goal) {
      status = "Riego Óptimo";
      message = "¡Perfecto! Has llegado a la meta. ✨";
    } else if (current > goal) {
      status = "Sobre-regado";
      message = OVERWATER_MESSAGES[(current - goal - 1) % OVERWATER_MESSAGES.length];
    }

    return { status, message, percentage };
  }, [crop]);

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
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">{crop.name}</h1>
          <p className="text-sm text-muted-foreground">{crop.type}</p>
        </div>
        <Badge variant={irrigationData.status === "Riego Óptimo" ? "default" : irrigationData.status === "Sobre-regado" ? "destructive" : "secondary"}>
          {irrigationData.status}
        </Badge>
      </div>

      <div className="flex gap-2">
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" className="flex-1 gap-2 h-11 rounded-xl bg-secondary/20 text-secondary-foreground hover:bg-secondary/30 transition-colors border-none shadow-none">
              <Pencil className="w-4 h-4" />
              Editar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Editar Cultivo</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Icono</Label>
                <div className="grid grid-cols-6 gap-2">
                  {CROP_ICONS.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => setEditForm({ ...editForm, icon: item.name })}
                      className={cn(
                        "flex items-center justify-center h-10 rounded-lg border-2 transition-all",
                        editForm.icon === item.name ? "border-primary bg-primary/10" : "border-transparent bg-muted"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nombre</Label>
                <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
              </div>
              <div className="grid gap-2 relative" ref={dropdownRef}>
                <Label>Tipo de planta</Label>
                <Input
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Buscar tipo..."
                />
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border rounded-lg shadow-lg max-h-40 overflow-auto">
                    {filteredPlantTypes.map(type => (
                      <button
                        key={type}
                        className="w-full text-left px-4 py-2 hover:bg-muted text-sm"
                        onClick={() => { setEditForm({...editForm, type}); setSearchQuery(type); setIsDropdownOpen(false); }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Riegos meta</Label>
                  <Input type="number" value={editForm.dailyIrrigationGoal} onChange={(e) => setEditForm({...editForm, dailyIrrigationGoal: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label>Temp (°C)</Label>
                  <Input type="number" value={editForm.idealTemperature} onChange={(e) => setEditForm({...editForm, idealTemperature: e.target.value})} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdateCrop} className="w-full">Guardar Cambios</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="flex-1 gap-2 h-11 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="w-4 h-4" />
              Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
              <AlertDialogDescription>Esta acción no se puede deshacer. Perderás todo el historial de este cultivo.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>No, cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteCrop} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sí, eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="rounded-2xl border-none shadow-sm overflow-hidden bg-white">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
            <div className="relative w-16 h-20">
              <svg viewBox="0 0 30 42" className="w-full h-full drop-shadow-md">
                <path
                  d="M15 2 C15 2 27 18 27 28 A12 12 0 0 1 3 28 C3 18 15 2 15 2 Z"
                  fill="#e2e8f0"
                />
                <mask id="water-mask-v2">
                  <path d="M15 2 C15 2 27 18 27 28 A12 12 0 0 1 3 28 C3 18 15 2 15 2 Z" fill="white" />
                </mask>
                <rect
                  x="0"
                  y={42 - (42 * irrigationData.percentage / 100)}
                  width="30"
                  height="42"
                  fill="#3b82f6"
                  mask="url(#water-mask-v2)"
                  className="transition-all duration-700 ease-in-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center mt-6">
                <span className="text-xs font-bold text-slate-700">{crop.irrigationsToday}/{crop.dailyIrrigationGoal}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Riego Hoy</p>
              <p className="text-xs font-semibold text-blue-600">Progreso</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-white">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center">
              <Thermometer className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Temp. Ideal</p>
              <p className="text-xl font-bold">{crop.idealTemperature ?? 24}°C</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-sm border-none bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            {getCropIcon(crop.icon || "Sprout", "w-6 h-6 text-primary")}
            Estado Actual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
            <p className="text-sm font-medium text-primary mb-1">{irrigationData.status}</p>
            <p className="text-sm text-slate-600 leading-relaxed italic">
              "{irrigationData.message}"
            </p>
          </div>
          
          {crop.irrigationsToday > crop.dailyIrrigationGoal && (
            <Alert variant="destructive" className="rounded-xl border-destructive/20 bg-destructive/5">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-xs font-bold uppercase">¡Peligro de Ahogo!</AlertTitle>
              <AlertDescription className="text-xs">
                Has excedido los riegos recomendados. El exceso de humedad puede pudrir las raíces.
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleRegisterIrrigation}
            className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/10"
          >
            Registrar Riego Manual
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm border-none bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <StickyNote className="w-6 h-6 text-secondary" />
            Notas Personales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <Textarea 
              placeholder="Añade un recordatorio sobre este cultivo..." 
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              className="rounded-xl border-muted min-h-[80px]"
            />
            <Button 
              onClick={handleAddNote}
              disabled={!newNoteContent.trim()}
              variant="secondary"
              className="w-full gap-2 rounded-xl h-10"
            >
              <Plus className="w-4 h-4" />
              Añadir Nota
            </Button>
          </div>

          <div className="space-y-3 mt-2">
            {notes && notes.length > 0 ? (
              notes.map((note) => (
                <div key={note.id} className="p-3 bg-muted/30 rounded-xl relative group">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Recién añadida'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 pr-8">{note.content}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteNote(note.id)}
                    className="h-7 w-7 absolute top-2 right-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-muted-foreground italic">No hay notas registradas aún.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm border-none bg-white overflow-hidden">
        <CardHeader className="bg-secondary/10 pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-secondary-foreground">
            <Info className="w-5 h-5" />
            Recomendaciones de Cuidado
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Droplets className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-slate-700">Frecuencia de Riego</p>
              <p className="text-slate-500">Para un(a) {crop.type}, es mejor regar temprano en la mañana para evitar hongos.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
              <Thermometer className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-slate-700">Clima Ideal</p>
              <p className="text-slate-500">Mantén tu cultivo lejos de corrientes de aire directas si la temperatura baja de 15°C.</p>
            </div>
          </div>
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