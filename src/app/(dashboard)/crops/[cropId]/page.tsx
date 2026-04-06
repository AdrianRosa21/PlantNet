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
import { doc, collection, query, orderBy, setDoc } from "firebase/firestore";
import { AgroVision } from "@/components/agro-vision";
import { SmartRecommendationsCard } from "./smart-recommendations-card";
import { CropTour } from "@/components/crop-tour";
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
  X,
  Sparkles,
  Check,
  Mic,
  MicOff,
  ListChecks
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const { data: crop, isLoading: isLoadingCrop } = useDoc(cropRef);

  // --- START DIARIO / CALENDARIO STATE ---
  const [weekDays, setWeekDays] = useState<{date: Date, str: string, dayName: string, dayNum: number}[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');

  useEffect(() => {
    const generated = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    const dayNames = ['D', 'L', 'M', 'X', 'J', 'V', 'S']; 
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const str = `${yyyy}-${mm}-${dd}`;
      generated.push({ date: d, str, dayName: dayNames[d.getDay()], dayNum: d.getDate() });
    }
    setWeekDays(generated);
    setSelectedDateStr(generated[generated.length - 1].str);
  }, []);

  const isToday = useMemo(() => {
    if (!selectedDateStr || weekDays.length === 0) return true;
    return selectedDateStr === weekDays[weekDays.length - 1].str;
  }, [selectedDateStr, weekDays]);

  // DAILY LOG DATA
  const dailyLogRef = useMemoFirebase(() => {
    if (!firestore || !user || !cropId || !selectedDateStr) return null;
    return doc(firestore, "users", user.uid, "crops", cropId as string, "dailyLogs", selectedDateStr);
  }, [firestore, user, cropId, selectedDateStr]);
  const { data: dailyLog } = useDoc(dailyLogRef);

  // TASKS DATA (per day)
  const tasksQuery = useMemoFirebase(() => {
    if (!firestore || !user || !cropId || !selectedDateStr) return null;
    return query(
      collection(firestore, "users", user.uid, "crops", cropId as string, "dailyLogs", selectedDateStr, "tasks"),
      orderBy("createdAt", "asc")
    );
  }, [firestore, user, cropId, selectedDateStr]);
  const { data: tasks } = useCollection(tasksQuery);
  const [newNoteContent, setNewNoteContent] = useState("");
  // --- END DIARIO / CALENDARIO STATE ---


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
  const [showPremiumModal, setShowPremiumModal] = useState(false);
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

  // --- DIARIO HANDLERS ---
  const handleRegisterIrrigation = async () => {
    if (!dailyLogRef || !isToday || !firestore) return;
    const newCount = (dailyLog?.irrigations || 0) + 1;
    await setDoc(dailyLogRef, { irrigations: newCount, date: selectedDateStr }, { merge: true });
  };

  const handleAddTask = () => {
    if (!firestore || !user || !cropId || !newNoteContent.trim() || !selectedDateStr || !isToday) return;
    const tasksRef = collection(firestore, "users", user.uid, "crops", cropId as string, "dailyLogs", selectedDateStr, "tasks");
    addDocumentNonBlocking(tasksRef, {
      content: newNoteContent,
      completed: false,
      createdAt: new Date().toISOString()
    });
    setNewNoteContent("");
  };

  const handleToggleTask = (taskId: string, currentStatus: boolean) => {
    if (!firestore || !user || !cropId || !selectedDateStr || !isToday) return;
    const taskRef = doc(firestore, "users", user.uid, "crops", cropId as string, "dailyLogs", selectedDateStr, "tasks", taskId);
    updateDocumentNonBlocking(taskRef, { completed: !currentStatus });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!firestore || !user || !cropId || !selectedDateStr || !isToday) return;
    const taskRef = doc(firestore, "users", user.uid, "crops", cropId as string, "dailyLogs", selectedDateStr, "tasks", taskId);
    deleteDocumentNonBlocking(taskRef);
  };
  // --- END DIARIO HANDLERS ---

  

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
    // SE USA EL DATO HISTORICO DE ESTA FECHA EN VEZ DE CROP:
    const current = dailyLog?.irrigations || 0;
    const goal = crop.dailyIrrigationGoal || 1;
    const percentage = Math.min((current / goal) * 100, 100);

    let status = "Riego Bajo";
    let message = NEED_WATER_MESSAGES[current % NEED_WATER_MESSAGES.length];

    if (current === goal) {
      status = "Riego Óptimo";
      message = "¡Perfecto! Has llegado a la meta de este día. ✨";
    } else if (current > goal) {
      status = "Sobre-regado";
      message = OVERWATER_MESSAGES[(current - goal - 1) % OVERWATER_MESSAGES.length];
    }

    return { status, message, percentage };
  }, [crop, dailyLog]);

  if (isLoadingCrop) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!crop || !user) {
    return (
      <div className="text-center py-20 px-6">
        <p className="text-muted-foreground mb-4">Cultivo no encontrado.</p>
        <Button onClick={() => router.push("/dashboard")}>Volver al Panel</Button>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full overflow-hidden bg-slate-50">
      
      {/* MESH GRADIENT BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[0%] -left-[10%] w-[60%] h-[60%] rounded-full bg-emerald-400/20 blur-[130px] mix-blend-multiply animate-pulse" />
        <div className="absolute top-[30%] -right-[15%] w-[70%] h-[70%] rounded-full bg-amber-200/20 blur-[150px] mix-blend-multiply opacity-60" />
        <div className="absolute bottom-[0%] left-[20%] w-[50%] h-[50%] rounded-full bg-teal-400/15 blur-[120px] mix-blend-multiply opacity-50" />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[50px] z-0" />
      </div>

      <div className="relative z-10 w-full max-w-3xl mx-auto space-y-6 pt-5 pb-28 px-4 sm:px-6">

        {/* HEADER PRINCIPAL */}
        <div className="flex items-center gap-4 animate-in slide-in-from-top-4 duration-700 ease-out">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-white/50 backdrop-blur-md shadow-sm border border-white/60 hover:-translate-y-1 hover:shadow-md transition-all text-slate-500 hover:text-emerald-600 flex-shrink-0">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <div className="flex-1 truncate">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight truncate bg-clip-text text-transparent bg-gradient-to-r from-emerald-800 to-teal-600 pb-1">{crop.name}</h1>
              <p className="text-sm font-semibold text-emerald-600/80 uppercase tracking-widest">{crop.type}</p>
            </div>
            <CropTour />
          </div>
        </div>

        {/* CALENDARIO BURBUJAS */}
        {weekDays.length > 0 && (
          <div id="tour-calendar" className="flex items-center justify-between bg-white/50 backdrop-blur-xl rounded-[2rem] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/60 animate-in slide-in-from-bottom-4 duration-700 delay-100 ease-out">
            {weekDays.map((day, i) => {
              const isSelected = selectedDateStr === day.str;
              const isTodayNode = i === weekDays.length - 1;
              return (
                <button 
                  key={day.str}
                  onClick={() => setSelectedDateStr(day.str)}
                  className={cn(
                    "flex flex-col items-center justify-center w-[13%] sm:w-[12%] aspect-[3/4] rounded-2xl transition-all duration-300",
                    isSelected 
                      ? "bg-gradient-to-b from-emerald-500 to-teal-400 text-white shadow-xl shadow-emerald-500/30 scale-105 -translate-y-1" 
                      : "text-slate-500 hover:bg-white/60 hover:shadow-sm"
                  )}
                >
                  <span className={cn("text-[10px] sm:text-xs font-bold uppercase", isSelected ? "text-emerald-50" : "text-slate-400")}>{day.dayName}</span>
                  <span className={cn("text-lg sm:text-xl font-black mt-0.5", isSelected ? "text-white drop-shadow-sm" : "text-slate-700")}>{day.dayNum}</span>
                  {isTodayNode && <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shadow-sm", isSelected ? "bg-white animate-pulse" : "bg-emerald-400")} />}
                </button>
              )
            })}
          </div>
        )}

        {/* MODO HISTORIAL WARNING */}
        {!isToday && (
          <Alert className="bg-amber-500/10 backdrop-blur-md border-amber-500/20 text-amber-800 rounded-3xl animate-in zoom-in duration-500 shadow-inner">
            <AlertTitle className="text-[13px] font-black flex items-center gap-2 uppercase tracking-widest text-amber-900">
              <Calendar className="w-4 h-4" />
              Modo Historial
            </AlertTitle>
            <AlertDescription className="text-sm mt-1.5 font-medium text-amber-800/90">
              Estás visualizando la bitácora del <strong className="font-black text-amber-900 bg-amber-500/20 px-1 py-0.5 rounded">{selectedDateStr}</strong>. Los registros pasados son de lectura estricta.
            </AlertDescription>
          </Alert>
        )}

        {/* WIDGETS DE AGUA Y TEMP */}
        <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-8 duration-700 delay-200 ease-out">
          
          <Card id="tour-water" className="rounded-[2rem] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] overflow-hidden bg-white/60 backdrop-blur-xl relative group hover:bg-white/70 transition-all">
            <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-3 relative z-10">
              <div className="relative w-20 h-24">
                <svg viewBox="0 0 30 42" className="w-full h-full drop-shadow-xl transition-transform duration-700 group-hover:scale-105 group-hover:-translate-y-1">
                  <path d="M15 2 C15 2 27 18 27 28 A12 12 0 0 1 3 28 C3 18 15 2 15 2 Z" fill="rgba(255,255,255,0.7)" className="stroke-slate-200" strokeWidth="0.5" />
                  <mask id="water-mask-new">
                    <path d="M15 2 C15 2 27 18 27 28 A12 12 0 0 1 3 28 C3 18 15 2 15 2 Z" fill="white" />
                  </mask>
                  <rect x="0" y={42 - (42 * irrigationData.percentage / 100)} width="30" height="42" fill="url(#blue-grad)" mask="url(#water-mask-new)" className="transition-all duration-1000 ease-out" />
                  <defs>
                    <linearGradient id="blue-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center mt-7">
                  <span className="text-sm font-black text-white drop-shadow-md">{dailyLog?.irrigations || 0}/{crop.dailyIrrigationGoal}</span>
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{isToday ? "Progreso" : "Registro"}</p>
                <p className="text-sm font-black text-blue-600/90 tracking-tight">Riegos {isToday ? "Hoy" : "Ese Día"}</p>
              </div>
            </CardContent>
            {/* Ambient Water Glow */}
            <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[50%] bg-blue-500/20 blur-2xl z-0 pointer-events-none group-hover:bg-blue-500/30 transition-all opacity-80" />
          </Card>

          <Card className="rounded-[2rem] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] bg-white/60 backdrop-blur-xl relative group hover:bg-white/70 transition-all">
            <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-4 h-full relative z-10">
              <div className="relative">
                <div className="absolute inset-0 bg-orange-400 rounded-full blur-xl opacity-30 group-hover:scale-125 transition-transform duration-700" />
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-50 rounded-2xl flex items-center justify-center border border-white shadow-inner relative z-10 transform group-hover:-translate-y-1 transition-all duration-500">
                  <Thermometer className="w-8 h-8 text-orange-500 drop-shadow-sm" />
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Temperatura</p>
                <p className="text-2xl font-black text-slate-800 tracking-tighter">{crop.idealTemperature ?? 24}°C <span className="text-sm text-slate-400 font-bold">Ideal</span></p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ALERTA RADAR (Peligro de Ahogo) */}
        {((dailyLog?.irrigations || 0) > crop.dailyIrrigationGoal) && (
          <div className="animate-in zoom-in duration-500 flex items-center gap-3 px-5 py-4 rounded-3xl bg-red-50/80 backdrop-blur-md shadow-sm border border-transparent shadow-red-500/10 group mt-4 relative overflow-hidden">
             {/* Destello de fondo de alerta */}
             <div className="absolute -left-10 h-full w-24 bg-red-500/10 blur-xl skew-x-12" />
             <span className="relative flex h-4 w-4 shrink-0">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-4 w-4 shadow-inner bg-red-500"></span>
             </span>
             <div>
               <h4 className="text-sm font-black text-red-700 uppercase tracking-widest">Peligro Botánico</h4>
               <p className="text-xs font-semibold text-red-900/80">Ahogo inminente. Se excedieron los riegos recomendados de hoy.</p>
             </div>
          </div>
        )}

        {/* CONTROL DE RIEGO MANUAL */}
        <Card id="tour-irrigation" className="rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.03)] border border-white/60 bg-white/50 backdrop-blur-xl animate-in slide-in-from-bottom-8 duration-700 delay-300 ease-out">
          <CardContent className="p-5 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 flex items-center gap-4 w-full">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0 border border-white shadow-inner relative overflow-hidden">
                 <div className="absolute inset-0 bg-blue-400 opacity-20 blur-xl"></div>
                 <Droplets className="w-7 h-7 text-blue-500 drop-shadow-sm relative z-10" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge variant="outline" className={cn("text-[9px] uppercase tracking-widest font-black border-transparent shadow-sm", irrigationData.status === "Riego Óptimo" ? "bg-emerald-50 text-emerald-700" : irrigationData.status === "Sobre-regado" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700")}>
                    {irrigationData.status}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-slate-600 leading-tight">"{irrigationData.message}"</p>
              </div>
            </div>
            
            <Button 
              onClick={handleRegisterIrrigation} 
              disabled={!isToday} 
              className={cn(
                "w-full sm:w-auto px-6 h-14 rounded-2xl text-[15px] font-black shadow-xl transition-all border-none focus:outline-none flex-shrink-0 group overflow-hidden relative",
                isToday 
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-1 active:scale-95" 
                  : "bg-slate-200 text-slate-400 shadow-none cursor-not-allowed"
              )}
            >
              {isToday && <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300"></div>}
              {isToday ? (
                <span className="relative z-10 flex items-center gap-2"><Droplets className="w-5 h-5 fill-white/20" /> Trago de Agua</span>
              ) : (
                "Riego Bloqueado"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* TAREAS ACRÍLICAS */}
        <Card id="tour-tasks" className="rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.03)] border border-white/60 bg-white/50 backdrop-blur-xl animate-in slide-in-from-bottom-8 duration-700 delay-500 ease-out">
          <CardHeader className="pb-3 px-6 pt-6">
            <CardTitle className="text-xl font-black flex items-center justify-between text-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center border border-white shadow-inner">
                  <StickyNote className="w-5 h-5 text-amber-500 drop-shadow-sm" />
                </div>
                Bitácora Táctica
              </div>
              {!isToday && <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest bg-slate-200 text-slate-500">Archivo</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            {isToday && (
              <div className="flex gap-2 relative group mt-1">
                <Input 
                  placeholder="Escribe un nuevo objetivo agroecológico..." 
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  className="rounded-2xl h-14 bg-white/80 border-white/60 pr-16 text-[15px] font-medium placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 shadow-sm transition-all group-hover:bg-white"
                />
                <Button onClick={handleAddTask} disabled={!newNoteContent.trim()} size="icon" className="rounded-xl h-10 w-10 absolute right-2 top-2 bg-slate-800 hover:bg-slate-900 border-none shadow-md hover:-translate-y-0.5 transition-all text-white active:scale-95">
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            )}

            <div className="space-y-2 mt-4">
              {tasks && tasks.length > 0 ? (
                tasks.map((task) => (
                  <div key={task.id} className={cn("flex items-center justify-between p-4 rounded-2xl border transition-all duration-300", task.completed ? "bg-white/40 border-white/30" : "bg-white/80 border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:-translate-y-0.5 hover:shadow-sm")}>
                    <div className="flex items-center gap-4 overflow-hidden">
                      <button 
                        onClick={() => isToday && handleToggleTask(task.id, task.completed)}
                        disabled={!isToday}
                        className={cn("flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300", task.completed ? "bg-emerald-500 border-emerald-500 text-white shadow-inner" : "border-slate-300 bg-slate-50/50 hover:border-emerald-400")}
                      >
                        {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>
                      <span className={cn("text-[15px] truncate transition-colors duration-300", task.completed ? "line-through text-slate-400 font-medium" : "text-slate-700 font-bold")}>{task.content}</span>
                    </div>
                    {isToday && (
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)} className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 shrink-0 rounded-full transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center py-8 opacity-70">
                  <ListChecks className="w-10 h-10 text-slate-300 mb-2" />
                  <span className="text-sm font-semibold text-slate-400">{isToday ? "Diario en blanco. ¡Registra una acción!" : "No hubo reportes tácticos este día."}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <AgroVision cropId={cropId as string} onLimitReached={() => setShowPremiumModal(true)} />

        {/* RECOMENDACIONES IA V3 */}
        <div className="mt-8 animate-in slide-in-from-bottom-8 duration-700 delay-1000 ease-out">
          <SmartRecommendationsCard 
            db={firestore as any} 
            userId={user.uid} 
            cropId={cropId as string} 
            crop={crop as any} 
            onLimitReached={() => setShowPremiumModal(true)} 
          />
        </div>

        <div className="flex gap-3 mt-8 animate-in slide-in-from-bottom-4 duration-700 delay-1000">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="flex-1 gap-2 h-14 rounded-2xl bg-white/70 backdrop-blur-md border border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.03)] text-slate-600 font-bold hover:bg-white hover:text-emerald-600 transition-all">
                <Pencil className="w-4 h-4" /> Modificar Flora
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] overflow-hidden max-h-[90vh] bg-white/90 backdrop-blur-3xl border border-white/60 shadow-2xl rounded-3xl">
              <DialogHeader className="pt-4 pb-2">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl flex items-center justify-center mb-3 shadow-inner border border-emerald-100 relative">
                  <Pencil className="w-7 h-7 text-emerald-600 drop-shadow-sm relative z-10" />
                  <div className="absolute inset-0 border border-emerald-400/20 rounded-2xl animate-ping opacity-50 duration-3000"></div>
                </div>
                <DialogTitle className="text-center font-black text-2xl tracking-tight text-slate-800">ADN del Cultivo</DialogTitle>
              </DialogHeader>
              <div className="grid gap-5 py-4 px-2">
                <div className="grid gap-2.5">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Genotipo Gráfico</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {CROP_ICONS.map((item) => (
                      <button key={item.name} onClick={() => setEditForm({ ...editForm, icon: item.name })} className={cn("flex items-center justify-center h-12 rounded-xl border-2 transition-all", editForm.icon === item.name ? "border-emerald-500 bg-emerald-50 text-emerald-600 shadow-sm" : "border-transparent bg-slate-100 hover:bg-slate-200 text-slate-400")}>
                        <item.icon className="w-5 h-5 drop-shadow-sm" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-2.5">
                  <Label htmlFor="edit-name" className="text-[11px] font-black uppercase tracking-widest text-slate-400">Alías de Planta</Label>
                  <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="h-12 bg-white rounded-xl border-slate-200 shadow-sm text-[15px] font-medium focus-visible:ring-emerald-500" />
                </div>
                <div className="grid gap-2.5 relative" ref={dropdownRef}>
                  <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Familia Botánica</Label>
                  <Input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }} placeholder="Ej: Arbusto, Suculenta..." className="h-12 bg-white rounded-xl border-slate-200 shadow-sm text-[15px] font-medium focus-visible:ring-emerald-500" />
                  {isDropdownOpen && (
                    <div className="absolute top-[70px] left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-auto py-1">
                      {filteredPlantTypes.map(type => (
                        <button key={type} className="w-full text-left px-5 py-3 hover:bg-emerald-50 hover:text-emerald-700 text-sm font-medium transition-colors" onClick={() => { setEditForm({...editForm, type}); setSearchQuery(type); setIsDropdownOpen(false); }}>{type}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2.5">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Agua Diaria</Label>
                    <Input type="number" value={editForm.dailyIrrigationGoal} onChange={(e) => setEditForm({...editForm, dailyIrrigationGoal: e.target.value})} className="h-12 bg-white rounded-xl shadow-sm text-center font-bold text-lg text-blue-600 focus-visible:ring-blue-500" />
                  </div>
                  <div className="grid gap-2.5">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Temp IDEAL (°C)</Label>
                    <Input type="number" value={editForm.idealTemperature} onChange={(e) => setEditForm({...editForm, idealTemperature: e.target.value})} className="h-12 bg-white rounded-xl shadow-sm text-center font-bold text-lg text-orange-500 focus-visible:ring-orange-500" />
                  </div>
                </div>
              </div>
              <DialogFooter className="pb-2">
                <Button onClick={handleUpdateCrop} className="w-full h-14 rounded-xl text-[15px] font-black bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white shadow-xl shadow-emerald-500/20 active:scale-95 transition-transform border-none">Aplicar Mutación</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="secondary" className="flex-1 gap-2 h-14 rounded-2xl bg-white/70 backdrop-blur-md border border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.03)] text-red-500 font-bold hover:bg-red-50 hover:text-red-700 hover:border-red-100 transition-all">
                <Trash2 className="w-4 h-4" /> Erradicar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white/95 backdrop-blur-3xl border-transparent shadow-2xl rounded-[2rem] p-8">
              <AlertDialogHeader className="items-center pb-2">
                <div className="relative mb-3">
                  <div className="absolute inset-0 bg-red-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
                  <div className="relative w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center border-2 border-white shadow-lg rotate-3">
                    <Trash2 className="w-8 h-8 text-red-600" />
                  </div>
                </div>
                <AlertDialogTitle className="font-black text-3xl text-slate-800 tracking-tighter">¿Cortar de raíz?</AlertDialogTitle>
                <AlertDialogDescription className="text-center font-medium text-[15px] text-slate-500">Esta extirpación fotográfica es irreversible. Perderás sus logs de vida de forma permanente.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-col gap-3 w-full mt-2">
                <AlertDialogAction onClick={handleDeleteCrop} className="bg-red-500 hover:bg-red-600 h-14 rounded-xl text-[15px] font-black w-full border-none shadow-xl shadow-red-500/20 active:scale-95 transition-transform">Sí, Erradicar</AlertDialogAction>
                <AlertDialogCancel className="h-14 rounded-xl text-[15px] border-none font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 hover:text-slate-700 w-full mt-0 transition-colors">Mantener viva</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Modal Premium */}
        <Dialog open={showPremiumModal} onOpenChange={setShowPremiumModal}>
          <DialogContent className="sm:max-w-[400px] text-center p-8 bg-white/95 backdrop-blur-3xl border-amber-200/50 shadow-2xl rounded-[2rem]">
            <DialogHeader className="flex flex-col items-center">
              <div className="relative mb-5">
                <div className="absolute inset-0 bg-amber-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-50 rounded-3xl flex items-center justify-center border-2 border-white shadow-lg rotate-3">
                  <Sparkles className="w-10 h-10 text-amber-500 drop-shadow-sm" />
                </div>
              </div>
              <DialogTitle className="text-3xl text-slate-800 font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-500 pb-1">Análisis Límite</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <p className="text-[15px] font-medium text-slate-600 mb-4 leading-relaxed">
                Has utilizado tus consultas gratuitas del mes. AgroAlerta IA necesita Premium para procesar consultas ilimitadas y profundas.
              </p>
            </div>
            <DialogFooter className="flex-col sm:flex-col gap-3 w-full mt-2">
              <Button onClick={() => router.push("/premium")} className="w-full h-14 rounded-xl text-[15px] font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xl shadow-amber-500/25 border-none hover:-translate-y-1 active:scale-95 transition-all">Mejorar Invernadero IA</Button>
              <Button variant="ghost" onClick={() => setShowPremiumModal(false)} className="w-full text-slate-500 font-bold hover:bg-slate-100 rounded-xl h-12">Me arriesgo sin IA</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
