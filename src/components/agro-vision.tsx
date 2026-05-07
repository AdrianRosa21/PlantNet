"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { 
  useUser, 
  useFirestore, 
  useStorage,
  useCollection,
  useMemoFirebase 
} from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { ChatService } from "@/services/chat-service";
import { useAccessibility } from "./accessibility-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  Sparkles, 
  Sprout, 
  Image as ImageIcon, 
  X, 
  Mic, 
  MicOff, 
  Loader2, 
  Send,
  Volume2,
  Camera
} from "lucide-react";
import Webcam from "react-webcam";
import { Camera as CapacitorCamera } from '@capacitor/camera';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AgroVisionProps {
  cropId: string;
  onLimitReached: () => void;
}

export function AgroVision({ cropId, onLimitReached }: AgroVisionProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [chatInput, setChatInput] = useState("");
  const [chatImage, setChatImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const playbackIdRef = useRef<string>("0");
  const hasAutoSpokenRef = useRef(false);
  const webcamRef = useRef<Webcam>(null);
  const [showWebcam, setShowWebcam] = useState(false);

  const { isAccessibleMode } = useAccessibility();

  // Función para pedir permisos NATIVOS en Android
  const requestAndroidPermissions = async (type: 'camera' | 'mic' | 'location') => {
    if (!Capacitor.isNativePlatform()) return true;

    try {
      if (type === 'camera') {
        const status = await CapacitorCamera.requestPermissions({ permissions: ['camera'] });
        return status.camera === 'granted';
      }
      if (type === 'location') {
        // Usamos geolocalización nativa si es posible
        const { Geolocation } = await import('@capacitor/geolocation');
        const status = await Geolocation.requestPermissions();
        return status.location === 'granted';
      }
    } catch (e) {
      console.warn("Error pidiendo permisos:", e);
      return false;
    }
    return true;
  };

  // Pedir permiso de ubicación al cargar para el clima
  useEffect(() => {
    requestAndroidPermissions('location');
  }, []);

  // Al abrir la webcam, forzar permiso de cámara
  useEffect(() => {
    if (showWebcam) {
      requestAndroidPermissions('camera');
    }
  }, [showWebcam]);

  const handleCapturePhoto = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
          setChatImage(file);
          setImagePreview(imageSrc);
          setShowWebcam(false);
        });
    }
  };

  const speakText = async (text: string) => {
    // Detener cualquier reproducción previa y limpiar su memoria
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    // Opcional: silenciar posible nativo si existía
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    try {
      // Usar nuestro proxy backend hiper rápido (evita bloqueos del navegador rojo)
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) throw new Error("Fallo la síntesis de voz en el servidor");

      // Cargar archivo binario a memoria del navegador directamente
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      await new Promise((resolve) => {
        audio.onended = resolve;
        audio.onerror = resolve;
        audio.play().catch((e) => {
          // Autoplay preventido por el navegador silenciosamente
          resolve(e);
        });
      });
    } catch (e) {
      console.warn("No se pudo obtener el audio proxy:", e);
    }
  };

  // Chat Query
  const chatQuery = useMemoFirebase(() => {
    if (!firestore || !user || !cropId) return null;
    return query(
      collection(firestore, "users", user.uid, "crops", cropId, "chatMessages"),
      orderBy("timestamp", "asc")
    );
  }, [firestore, user, cropId]);

  const { data: chatMessages } = useCollection(chatQuery);

  const initialLoadRef = useRef(false);
  const prevMessagesLengthRef = useRef(0);

  // Auto-speak ONLY new system messages, avoid initial mount history
  useEffect(() => {
    if (!chatMessages || chatMessages.length === 0 || isSendingChat) return;

    if (!initialLoadRef.current) {
      // Es la carga inicial desde Firebase (el historial)
      initialLoadRef.current = true;
      prevMessagesLengthRef.current = chatMessages.length;
      return;
    }

    // Si recibimos un mensaje nuevo añadido (no carga inicial)
    if (chatMessages.length > prevMessagesLengthRef.current) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      
      // En modo accesible hablamos siempre que sea del bot/sistema
      // En modo normal, tal vez solo ciertos mensajes especiales (si los hay)
      const isSystem = lastMsg.messageType === 'system';
      
      if (isSystem && (isAccessibleMode || lastMsg.id !== playbackIdRef.current.toString())) {
        speakText(lastMsg.text);
        if (lastMsg.id) {
           playbackIdRef.current = lastMsg.id;
        }
      }
      prevMessagesLengthRef.current = chatMessages.length;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages, isAccessibleMode]);

  // Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "es-ES";

        recognition.onresult = (event: any) => {
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setChatInput((prev) => {
              const current = prev.trim();
              return current ? current + " " + finalTranscript.trim() : finalTranscript.trim();
            });
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
        };
        recognition.onend = () => setIsRecording(false);
        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleRecording = async () => {
    if (!recognitionRef.current) {
      toast({ variant: "destructive", title: "No soportado", description: "Reconocimiento de voz no soportado por tu navegador actual." });
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      
      // Auto-enviar si estamos en modo accesible y hay texto
      if (isAccessibleMode) {
        // Usamos un pequeño delay para asegurar que el último transcript entró al estado
        setTimeout(() => {
          if (inputRef.current?.value || chatInput) {
            handleSendChatMessage();
          }
        }, 300);
      }
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
        toast({ variant: "destructive", title: "Error", description: "No se pudo acceder al micrófono." });
      }
    }
  };

  // Auto-scroll
  useEffect(() => {
    if (chatScrollRef.current) {
      const viewport = chatScrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [chatMessages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.scrollLeft = inputRef.current.scrollWidth;
    }
  }, [chatInput]);

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
    if (!firestore || !user || !cropId || !storage || (!chatInput.trim() && !chatImage)) return;
    setIsSendingChat(true);
    try {
      const result = await ChatService.sendMessage(
        firestore,
        storage,
        user.uid,
        cropId,
        chatInput,
        chatImage || undefined
      );

      if (result && result.success === false && result.error?.includes("límite mensual")) {
        onLimitReached();
        setIsSendingChat(false);
        return;
      }

      setChatInput("");
      setChatImage(null);
      setImagePreview(null);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Error al enviar",
        description: error.message || "No se pudo enviar el mensaje. Inténtalo de nuevo."
      });
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <Card id="tour-chat" className="rounded-[2.5rem] border border-foreground/15 shadow-[0_16px_40px_rgba(0,0,0,0.08)] bg-background/50 backdrop-blur-2xl overflow-hidden mt-6 animate-in slide-in-from-bottom-8 duration-700 delay-700 ease-out relative">
      <CardHeader className="pb-4 pt-6 px-6 bg-background/80 border-b border-foreground/15 flex flex-row items-center justify-between relative">
        <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-background/90 to-transparent z-0 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/40 border-2 border-background relative overflow-hidden">
            <img src="/logo.png" alt="CultivIA" className="w-full h-full object-cover relative z-10" />
            {isSendingChat && <div className="absolute inset-0 bg-white/20 opacity-50 animate-pulse z-20" />}
          </div>
          <div>
            <CardTitle className="text-xl font-black text-foreground tracking-tight">Cultiv<span className="text-primary">IA</span></CardTitle>
            <p className="text-[11px] font-black text-foreground/80 uppercase tracking-widest mt-0.5">Asistente General</p>
          </div>
        </div>
        <div className="relative z-10 flex h-3.5 w-3.5 sm:mr-2">
          <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75 shadow-lg", isSendingChat ? "bg-primary animate-ping" : "bg-primary animate-ping")}></span>
          <span className={cn("relative inline-flex rounded-full h-3.5 w-3.5 shadow-sm border-2 border-background", isSendingChat ? "bg-primary" : "bg-primary")}></span>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 bg-transparent relative">
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes scanline {
            0% { transform: translateY(-10%); }
            50% { transform: translateY(110%); }
            100% { transform: translateY(-10%); }
          }
          .animate-scanner-laser {
            animation: scanline 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
        `}} />
        <div className="absolute inset-0 bg-background/30 backdrop-blur-[2px] z-0 pointer-events-none" />
        <ScrollArea className="h-[350px] relative z-10" ref={chatScrollRef}>
          <div className="space-y-6 flex flex-col justify-end min-h-[max-content] h-full p-4 sm:p-6" style={{ minHeight: '100%' }}>
            {chatMessages && chatMessages.length > 0 ? (
              chatMessages.map((msg: any) => (
                <div key={msg.id} className={cn(
                  "flex flex-col max-w-[88%] sm:max-w-[80%] animate-in fade-in slide-in-from-bottom-4 duration-500",
                  msg.messageType === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                )}>
                  <div className={cn(
                    "p-4 rounded-3xl text-[15px] font-medium leading-relaxed shadow-sm relative overflow-hidden",
                    msg.messageType === 'user' 
                      ? "bg-primary text-primary-foreground rounded-tr-sm" 
                      : "bg-background text-foreground rounded-tl-sm border border-primary/10 shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
                  )}>
                    {msg.messageType === 'user' && <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />}
                    {msg.imageUrl && (
                      <div className="relative w-full min-w-[200px] max-w-[240px] aspect-square mb-3 rounded-2xl overflow-hidden border border-black/5 shadow-inner">
                         <Image src={msg.imageUrl} alt="Imagen adjunta" fill sizes="(max-width: 768px) 100vw, 240px" className="object-cover" />
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                    {msg.messageType === 'system' && (
                      <button 
                        onClick={() => speakText(msg.text)}
                        className="absolute bottom-2 right-2 p-1.5 rounded-full text-primary/50 hover:text-primary hover:bg-muted transition-colors"
                        title="Escuchar mensaje"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground/80 mt-1.5 px-2 tracking-wider">
                    {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Ahora'}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-16 opacity-80 animate-in zoom-in duration-700">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/10 shadow-inner">
                  <Sprout className="w-10 h-10 text-primary drop-shadow-sm" />
                </div>
                <p className="text-sm font-bold text-muted-foreground max-w-[220px] mx-auto leading-relaxed">Conectado a la red. Pregunta, habla o envía una imagen.</p>
              </div>
            )}
            
            {isSendingChat && (
              <div className="flex flex-col mr-auto items-start max-w-[80%] animate-in fade-in duration-300">
                <div className="p-4 rounded-3xl bg-background text-muted-foreground rounded-tl-sm border border-primary/10 shadow-sm flex items-center gap-2">
                   <span className="text-[13px] font-bold text-primary animate-pulse">Analizando...</span>
                   <span className="flex gap-1 ml-1">
                     <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{animationDelay: "0ms"}}></span>
                     <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{animationDelay: "150ms"}}></span>
                     <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{animationDelay: "300ms"}}></span>
                   </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 sm:p-5 bg-background/90 backdrop-blur-xl border-t border-primary/10 space-y-3 relative z-10 m-2 rounded-[2rem] shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
          {imagePreview && (
            <div className="relative inline-block animate-in zoom-in duration-300 mb-1">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border border-primary/20 shadow-md relative">
                <Image src={imagePreview} alt="Preview" fill sizes="80px" className="object-cover" />
                <div className="absolute inset-0 bg-primary/20 z-10 mix-blend-overlay" />
                <div className="absolute top-0 left-0 w-full h-[2px] bg-primary shadow-sm z-20 animate-scanner-laser pointer-events-none" />
              </div>
              {!isSendingChat && (
                <button 
                  onClick={() => {setChatImage(null); setImagePreview(null);}}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-lg hover:scale-110 transition-transform z-30"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          
          {isAccessibleMode ? (
            <div className="flex flex-col items-center gap-3">
              <Button
                size="lg"
                onClick={toggleRecording}
                disabled={isSendingChat}
                className={cn(
                  "w-full h-24 rounded-[2rem] text-lg font-black tracking-wider shadow-xl transition-all relative overflow-hidden",
                  isRecording 
                    ? "bg-destructive hover:bg-destructive text-white animate-pulse shadow-destructive/30" 
                    : "bg-primary hover:bg-primary/90 text-white shadow-primary/30"
                )}
              >
                {isRecording ? (
                  <span className="flex items-center gap-3"><MicOff className="w-8 h-8" /> SOLTAR Y ENVIAR</span>
                ) : (
                  <span className="flex items-center gap-3"><Mic className="w-8 h-8" /> TOCAR PARA HABLAR</span>
                )}
              </Button>
              {chatInput && (
                <div className="w-full flex gap-2">
                  <Input 
                    disabled 
                    value={chatInput} 
                    className="flex-1 rounded-full bg-muted/50 border-transparent text-center font-medium opacity-60" 
                  />
                  <Button 
                    onClick={handleSendChatMessage}
                    disabled={isSendingChat}
                    className="rounded-full bg-primary text-white"
                  >
                     <Send className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2 items-center bg-muted/30 p-1.5 rounded-full border border-primary/20 shadow-inner overflow-hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button disabled={isSendingChat} className={cn("w-11 h-11 flex items-center justify-center rounded-full hover:bg-background hover:shadow-sm hover:text-primary transition-all flex-shrink-0 z-10 outline-none", isSendingChat ? "text-muted-foreground pointer-events-none" : "text-muted-foreground")}>
                    <ImageIcon className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="rounded-xl border-primary/10 w-48 p-2">
                  <DropdownMenuItem asChild className="mb-1 rounded-lg">
                    <label className="cursor-pointer flex items-center gap-3 w-full p-2 hover:bg-muted font-semibold">
                      <ImageIcon className="w-4 h-4 text-primary" />
                      <span>Subir Galería</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                    </label>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowWebcam(true)} className="cursor-pointer flex items-center gap-3 p-2 hover:bg-muted font-semibold rounded-lg">
                    <Camera className="w-4 h-4 text-primary" />
                    <span>Tomar Foto</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleRecording}
                disabled={isSendingChat}
                className={cn(
                  "w-11 h-11 rounded-full transition-all shrink-0 flex items-center justify-center z-10",
                  isRecording ? "text-destructive bg-destructive/10 border border-destructive/20 shadow-sm animate-pulse" : "text-muted-foreground hover:bg-background hover:shadow-sm hover:text-primary border border-transparent"
                )}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
              
              <Input 
                ref={inputRef}
                placeholder={isRecording ? "Modo dictado activo..." : "Describe el problema o sube imagen..."}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                disabled={isSendingChat}
                className="rounded-full border-none h-11 text-[15px] font-medium bg-transparent focus-visible:ring-0 px-2 placeholder:text-muted-foreground/70 text-foreground z-10"
              />
              
              <Button 
                size="icon" 
                onClick={handleSendChatMessage} 
                disabled={isSendingChat || (!chatInput.trim() && !chatImage)}
                className={cn(
                  "rounded-full h-11 w-11 shrink-0 transition-all shadow-md duration-300 z-10",
                  (chatInput.trim() || chatImage) && !isSendingChat
                    ? "bg-primary hover:bg-primary/90 shadow-primary/25 hover:shadow-primary/40 text-primary-foreground"
                    : "bg-muted text-muted-foreground/60 cursor-not-allowed border-none shadow-none"
                )}
              >
                {isSendingChat ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
              </Button>

              {isSendingChat && (
                <div className="absolute inset-0 bg-primary/5 opacity-50 z-0 animate-pulse pointer-events-none" />
              )}
            </div>
          )}
        </div>
        
        {showWebcam && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-md z-50 flex flex-col items-center justify-center rounded-[2.5rem] p-4 animate-in fade-in zoom-in-95 duration-300">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
              className="w-full h-auto max-h-[60vh] object-cover rounded-2xl shadow-2xl border border-primary/20"
            />
            <div className="flex gap-4 mt-6">
              <Button variant="outline" size="lg" onClick={() => setShowWebcam(false)} className="rounded-full h-14 px-8 font-bold border-primary/20">Cancelar</Button>
              <Button onClick={handleCapturePhoto} size="lg" className="rounded-full h-14 px-8 bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/30">
                <Camera className="w-5 h-5 mr-2" /> Capturar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
