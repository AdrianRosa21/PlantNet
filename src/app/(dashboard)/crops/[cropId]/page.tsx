"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  useUser, 
  useFirestore, 
  useStorage,
  useDoc, 
  useCollection,
  useMemoFirebase, 
  updateDocumentNonBlocking, 
  deleteDocumentNonBlocking,
  addDocumentNonBlocking
} from "@/firebase";
import { doc, collection, query, orderBy } from "firebase/firestore";
import { ChatService } from "@/services/chat-service";
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
  Calendar,
  MessageSquare,
  Send,
  Image as ImageIcon,
  X
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
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";

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
  const storage = useStorage();
  const { toast } = useToast();

  const cropRef = useMemoFirebase(() => {
    if (!firestore || !user || !cropId) return null;
    return doc(firestore, "users", user.uid, "crops", cropId as string);
  }, [firestore, user, cropId]);

  const { data: crop, isLoading } = useDoc(cropRef);

  // Chat Data
  const chatQuery = useMemoFirebase(() => {
    if (!firestore || !user || !cropId) return null;
    return query(
      collection(firestore, "users", user.uid, "crops", cropId as string, "chatMessages"),
      orderBy("timestamp", "asc")
    );
  }, [firestore, user, cropId]);

  const { data: chatMessages } = useCollection(chatQuery);
  const [chatInput, setChatInput] = useState("");
  const [chatImage, setChatImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Notes Data
  const notesQuery = useMemoFirebase(() => {
    if (!firestore || !user || !cropId) return null;
    return query(
      collection(firestore, "users", user.uid, "crops", cropId as string, "notes"),
      orderBy("createdAt", "desc")
    );
  }, [firestore, user, cropId]);

  const { data: notes } = useCollection(notesQuery);
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
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

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
    updateDocumentNonBlocking(cropRef, { irrigationsToday: newCount });
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
  };

  const handleDeleteNote = (noteId: string) => {
    if (!firestore || !user || !cropId) return;
    const noteRef = doc(firestore, "users", user.uid, "crops", cropId as string, "notes", noteId);
    deleteDocumentNonBlocking(noteRef);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setChatImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSendChatMessage = async () => {
    if (!firestore || !user || !cropId || (!chatInput.trim() && !chatImage)) return;
    setIsSendingChat(true);
    try {
      await ChatService.sendMessage(
        firestore,
        storage,
        user.uid,
        cropId as string,
        chatInput,
        chatImage || undefined
      );
      setChatInput("");
      setChatImage(null);
      setImagePreview(null);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Error al enviar",
        description: "No se pudo enviar el mensaje. Inténtalo de nuevo."
      });
    } finally {
      setIsSendingChat(false);
    }
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
        <p className="text-muted-foreground mb-4">Cultivo no encontrado.</p>
        <Button onClick={() => router.push("/dashboard")}>Volver al Panel</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
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

      {/* CHAT IA SECTION */}
      <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-2 bg-primary/5 flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-primary">
            <MessageSquare className="w-5 h-5" />
            Chat con AgroAlerta IA
          </CardTitle>
          <Badge className="bg-primary/20 text-primary border-none text-[10px]">EN VIVO</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[300px] p-4 bg-slate-50/50" ref={chatScrollRef}>
            <div className="space-y-4">
              {chatMessages && chatMessages.length > 0 ? (
                chatMessages.map((msg: any) => (
                  <div key={msg.id} className={cn(
                    "flex flex-col max-w-[85%]",
                    msg.messageType === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}>
                    <div className={cn(
                      "p-3 rounded-2xl text-sm shadow-sm",
                      msg.messageType === 'user' 
                        ? "bg-primary text-white rounded-tr-none" 
                        : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                    )}>
                      {msg.imageUrl && (
                        <div className="relative w-full aspect-square mb-2 rounded-lg overflow-hidden border border-black/5">
                           <Image src={msg.imageUrl} alt="Imagen adjunta" fill className="object-cover" />
                        </div>
                      )}
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                    </div>
                    <span className="text-[9px] text-muted-foreground mt-1 px-1">
                      {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Ahora'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 opacity-50">
                  <Sprout className="w-10 h-10 mx-auto mb-2 text-primary/30" />
                  <p className="text-xs">¡Hola! Sube una foto de tu planta o descríbeme si notas algo extraño.</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-3 bg-white border-t border-slate-100 space-y-3">
            {imagePreview && (
              <div className="relative inline-block">
                <div className="w-16 h-16 rounded-lg overflow-hidden border">
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                </div>
                <button 
                  onClick={() => {setChatImage(null); setImagePreview(null);}}
                  className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex gap-2 items-center">
              <label className="cursor-pointer p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                <ImageIcon className="w-5 h-5" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              </label>
              <Input 
                placeholder="Escribe un mensaje..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                className="rounded-full border-slate-200 h-10 text-sm"
              />
              <Button 
                size="icon" 
                onClick={handleSendChatMessage} 
                disabled={isSendingChat || (!chatInput.trim() && !chatImage)}
                className="rounded-full h-10 w-10 shrink-0 shadow-lg shadow-primary/20"
              >
                {isSendingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="rounded-2xl border-none shadow-sm overflow-hidden bg-white">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
            <div className="relative w-16 h-20">
              <svg viewBox="0 0 30 42" className="w-full h-full drop-shadow-md">
                <path d="M15 2 C15 2 27 18 27 28 A12 12 0 0 1 3 28 C3 18 15 2 15 2 Z" fill="#e2e8f0" />
                <mask id="water-mask">
                  <path d="M15 2 C15 2 27 18 27 28 A12 12 0 0 1 3 28 C3 18 15 2 15 2 Z" fill="white" />
                </mask>
                <rect x="0" y={42 - (42 * irrigationData.percentage / 100)} width="30" height="42" fill="#3b82f6" mask="url(#water-mask)" className="transition-all duration-700 ease-in-out" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center mt-6">
                <span className="text-xs font-bold text-slate-700">{crop.irrigationsToday}/{crop.dailyIrrigationGoal}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Progreso</p>
              <p className="text-xs font-semibold text-blue-600">Riego Hoy</p>
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
            <p className="text-sm text-slate-600 leading-relaxed italic">"{irrigationData.message}"</p>
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

          <Button onClick={handleRegisterIrrigation} className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/10">
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
              placeholder="Añade un recordatorio..." 
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              className="rounded-xl min-h-[80px]"
            />
            <Button onClick={handleAddNote} disabled={!newNoteContent.trim()} variant="secondary" className="w-full gap-2 rounded-xl h-10">
              <Plus className="w-4 h-4" /> Añadir Nota
            </Button>
          </div>
          <div className="space-y-3 mt-2">
            {notes && notes.length > 0 ? (
              notes.map((note) => (
                <div key={note.id} className="p-3 bg-muted/30 rounded-xl relative">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Hoy'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 pr-8">{note.content}</p>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteNote(note.id)} className="h-7 w-7 absolute top-2 right-2 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground italic">No hay notas.</div>
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
          <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <Droplets className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="font-bold text-slate-700">Frecuencia de Riego</p>
              <p className="text-slate-500">Para un(a) {crop.type}, riega temprano en la mañana.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <Thermometer className="w-4 h-4 text-orange-600 mt-0.5" />
            <div>
              <p className="font-bold text-slate-700">Clima Ideal</p>
              <p className="text-slate-500">Mantén tu cultivo alejado de corrientes de aire frío.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" className="flex-1 gap-2 h-11 rounded-xl bg-secondary/20 text-secondary-foreground font-semibold">
              <Pencil className="w-4 h-4" /> Editar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
            <DialogHeader><DialogTitle>Editar Cultivo</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Icono</Label>
                <div className="grid grid-cols-6 gap-2">
                  {CROP_ICONS.map((item) => (
                    <button key={item.name} onClick={() => setEditForm({ ...editForm, icon: item.name })} className={cn("flex items-center justify-center h-10 rounded-lg border-2", editForm.icon === item.name ? "border-primary bg-primary/10" : "border-transparent bg-muted")}><item.icon className="w-5 h-5" /></button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2"><Label htmlFor="edit-name">Nombre</Label><Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} /></div>
              <div className="grid gap-2 relative" ref={dropdownRef}>
                <Label>Tipo</Label>
                <Input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }} placeholder="Buscar tipo..." />
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border rounded-lg shadow-lg max-h-40 overflow-auto">
                    {filteredPlantTypes.map(type => (
                      <button key={type} className="w-full text-left px-4 py-2 hover:bg-muted text-sm" onClick={() => { setEditForm({...editForm, type}); setSearchQuery(type); setIsDropdownOpen(false); }}>{type}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Riegos meta</Label><Input type="number" value={editForm.dailyIrrigationGoal} onChange={(e) => setEditForm({...editForm, dailyIrrigationGoal: e.target.value})} /></div>
                <div className="grid gap-2"><Label>Temp (°C)</Label><Input type="number" value={editForm.idealTemperature} onChange={(e) => setEditForm({...editForm, idealTemperature: e.target.value})} /></div>
              </div>
            </div>
            <DialogFooter><Button onClick={handleUpdateCrop} className="w-full">Guardar</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="secondary" className="flex-1 gap-2 h-11 rounded-xl bg-destructive/10 text-destructive font-semibold">
              <Trash2 className="w-4 h-4" /> Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar cultivo?</AlertDialogTitle>
              <AlertDialogDescription>Esta acción es permanente.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteCrop} className="bg-destructive text-white">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
