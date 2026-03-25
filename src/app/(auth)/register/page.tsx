"use client";

import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, ArrowLeft, Loader2 } from "lucide-react";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { auth, firestore } = useFirebase();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });
      
      const userProfileRef = doc(firestore, 'users', user.uid);
      const profileData = {
        id: user.uid,
        email: email,
        nombre: name,
        tipo_cuenta: "gratuita",
        consultas_ia_mes: 0,
        createdAt: new Date().toISOString(),
      };

      setDoc(userProfileRef, profileData)
        .catch(async (error) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: userProfileRef.path,
            operation: 'create',
            requestResourceData: profileData,
          }));
        });

      toast({
        title: "¡Cuenta creada con éxito!",
        description: "Bienvenido a la comunidad AgroAlerta IA.",
      });
      router.push("/dashboard");
    } catch (error: any) {
      console.error(error);
      let message = "No se pudo crear la cuenta. Inténtalo de nuevo.";
      if (error.code === "auth/email-already-in-use") message = "Este correo ya está registrado.";
      if (error.code === "auth/weak-password") message = "La contraseña debe tener al menos 6 caracteres.";
      if (error.code === "auth/invalid-email") message = "El correo electrónico no es válido.";
      
      toast({
        variant: "destructive",
        title: "Error al registrarse",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F5F7F2]">
      
      {/* Tarjeta de Formulario Minimalista */}
      <div className="w-full max-w-[360px] bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-[#F0F4EC]">
        
        {/* Cabecera */}
        <div className="flex flex-col items-center text-center space-y-2 mb-6 mt-1 relative">
          
          {/* Botón Volver Integrado */}
          <button 
            type="button"
            onClick={() => router.push("/login")}
            className="absolute left-0 top-1.5 flex items-center justify-center w-8 h-8 rounded-full text-[#6B7280] hover:bg-[#F5F7F2] hover:text-[#1F2937] transition-all outline-none"
            aria-label="Volver"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 bg-[#F5F7F2] rounded-full flex items-center justify-center mb-1">
            <UserPlus className="text-[#2E7D32] w-5 h-5 ml-0.5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#1F2937]">Crear Cuenta</h1>
          <p className="text-[#6B7280] text-[13px] font-medium">
            Únete a nuestra comunidad
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-[#374151] font-medium text-[13px] ml-0.5">Nombre Completo</Label>
            <Input 
              id="name" 
              placeholder="Juan Pérez" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full h-[48px] bg-white border-[#DCE5D8] rounded-xl px-4 text-[#1F2937] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#8BC34A] focus-visible:border-[#8BC34A] transition-all shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[#374151] font-medium text-[13px] ml-0.5">Correo electrónico</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="ejemplo@agro.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-[48px] bg-white border-[#DCE5D8] rounded-xl px-4 text-[#1F2937] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#8BC34A] focus-visible:border-[#8BC34A] transition-all shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[#374151] font-medium text-[13px] ml-0.5">Contraseña</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-[48px] bg-white border-[#DCE5D8] rounded-xl px-4 text-[#1F2937] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#8BC34A] focus-visible:border-[#8BC34A] transition-all shadow-sm"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-[48px] rounded-xl text-[14px] font-bold mt-2 bg-[#2E7D32] hover:bg-[#236026] text-white shadow-md shadow-[#2E7D32]/10 transition-all border-none" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              "Registrar Cuenta Gratis"
            )}
          </Button>
        </form>

        {/* Pie de página */}
        <div className="mt-6 text-center text-[13px] text-[#6B7280] font-medium">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-[#2E7D32] font-bold hover:text-[#1F5422] transition-colors">
            Inicia sesión
          </Link>
        </div>

      </div>
    </div>
  );
}
