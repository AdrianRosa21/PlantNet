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
  Volume2
} from "lucide-react";

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
  const playbackIdRef = useRef<number>(0);
  const hasAutoSpokenRef = useRef(false);

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

  // Auto-speak first system message
  useEffect(() => {
    if (chatMessages && chatMessages.length > 0 && !hasAutoSpokenRef.current) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      // Si el último mensaje es del sistema y se acaba de recibir en la sesión
      if (lastMsg.messageType === 'system') {
        hasAutoSpokenRef.current = true;
        speakText(lastMsg.text);
      }
    }
  }, [chatMessages]);

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

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast({ variant: "destructive", title: "No soportado", description: "Reconocimiento de voz no soportado por tu navegador actual." });
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
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
    <Card id="tour-chat" className="rounded-[2.5rem] border border-white/60 shadow-[0_16px_40px_rgba(0,0,0,0.08)] bg-white/70 backdrop-blur-2xl overflow-hidden mt-6 animate-in slide-in-from-bottom-8 duration-700 delay-700 ease-out">
      <CardHeader className="pb-4 pt-6 px-6 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 border-b border-white/40 flex flex-row items-center justify-between relative">
        <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-white/60 to-transparent z-0 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-emerald-100 relative overflow-hidden">
            <Sparkles className={cn("w-6 h-6 text-emerald-500 relative z-10", isSendingChat ? "animate-spin" : "")} />
            {isSendingChat && <div className="absolute inset-0 bg-emerald-100 opacity-50 animate-pulse" />}
          </div>
          <div>
            <CardTitle className="text-xl font-black text-slate-800 tracking-tight">AgroVision AI</CardTitle>
            <p className="text-[11px] font-bold text-teal-600 uppercase tracking-widest mt-0.5">Asistente General</p>
          </div>
        </div>
        <div className="relative z-10 flex h-3 w-3 sm:mr-2">
          <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", isSendingChat ? "bg-teal-400 animate-ping" : "bg-emerald-400 animate-ping")}></span>
          <span className={cn("relative inline-flex rounded-full h-3 w-3 shadow-inner", isSendingChat ? "bg-teal-500" : "bg-emerald-500")}></span>
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
        <div className="absolute inset-0 bg-slate-50/30 backdrop-blur-[2px] z-0 pointer-events-none" />
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
                      ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-tr-sm" 
                      : "bg-white text-slate-700 rounded-tl-sm border border-slate-100/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
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
                        className="absolute bottom-2 right-2 p-1.5 rounded-full text-emerald-600/50 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Escuchar mensaje"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400/80 mt-1.5 px-2 tracking-wider">
                    {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Ahora'}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-16 opacity-80 animate-in zoom-in duration-700">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-inner">
                  <Sprout className="w-10 h-10 text-emerald-400 drop-shadow-sm" />
                </div>
                <p className="text-sm font-bold text-slate-500 max-w-[220px] mx-auto leading-relaxed">Conectado a la red. Pregunta, habla o envía una imagen.</p>
              </div>
            )}
            
            {isSendingChat && (
              <div className="flex flex-col mr-auto items-start max-w-[80%] animate-in fade-in duration-300">
                <div className="p-4 rounded-3xl bg-white text-slate-500 rounded-tl-sm border border-slate-100 shadow-sm flex items-center gap-2">
                   <span className="text-[13px] font-bold text-emerald-600 animate-pulse">Analizando...</span>
                   <span className="flex gap-1 ml-1">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{animationDelay: "0ms"}}></span>
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{animationDelay: "150ms"}}></span>
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{animationDelay: "300ms"}}></span>
                   </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 sm:p-5 bg-white/90 backdrop-blur-xl border-t border-slate-100/50 space-y-3 relative z-10 m-2 rounded-[2rem] shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
          {imagePreview && (
            <div className="relative inline-block animate-in zoom-in duration-300 mb-1">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border border-emerald-100 shadow-md relative">
                <Image src={imagePreview} alt="Preview" fill sizes="80px" className="object-cover" />
                {/* Efecto Scanner Láser Wow (Se ejecuta mientras se previsualiza o envia) */}
                <div className="absolute inset-0 bg-emerald-500/20 z-10 mix-blend-overlay" />
                <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-400 shadow-[0_0_12px_2px_rgba(52,211,153,0.9)] z-20 animate-scanner-laser pointer-events-none" />
              </div>
              {!isSendingChat && (
                <button 
                  onClick={() => {setChatImage(null); setImagePreview(null);}}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:scale-110 transition-transform z-30"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          
          <div className="flex gap-2 items-center bg-slate-50/80 p-1.5 rounded-full border border-slate-200/60 shadow-inner overflow-hidden">
            <label className={cn("cursor-pointer w-11 h-11 flex items-center justify-center rounded-full hover:bg-white hover:shadow-sm hover:text-emerald-600 transition-all flex-shrink-0 z-10", isSendingChat ? "text-slate-300 pointer-events-none" : "text-slate-400")}>
              <ImageIcon className="w-5 h-5" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} disabled={isSendingChat} />
            </label>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleRecording}
              disabled={isSendingChat}
              className={cn(
                "w-11 h-11 rounded-full transition-all shrink-0 flex items-center justify-center z-10",
                isRecording ? "text-red-500 bg-red-50 border border-red-100 shadow-sm animate-pulse" : "text-slate-400 hover:bg-white hover:shadow-sm hover:text-emerald-600 border border-transparent"
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
              className="rounded-full border-none h-11 text-[15px] font-medium bg-transparent focus-visible:ring-0 px-2 placeholder:text-slate-400 z-10"
            />
            
            <Button 
              size="icon" 
              onClick={handleSendChatMessage} 
              disabled={isSendingChat || (!chatInput.trim() && !chatImage)}
              className={cn(
                "rounded-full h-11 w-11 shrink-0 transition-all shadow-md duration-300 z-10",
                (chatInput.trim() || chatImage) && !isSendingChat
                  ? "bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/25 hover:shadow-emerald-500/40 text-white"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed border-none shadow-none"
              )}
            >
              {isSendingChat ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
            </Button>

            {/* Efecto Loading Background en el input */}
            {isSendingChat && (
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-teal-50 opacity-50 z-0 animate-pulse pointer-events-none" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
