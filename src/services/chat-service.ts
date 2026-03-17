'use client';

import { 
  collection, 
  doc,
  setDoc,
  serverTimestamp, 
  Firestore 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  FirebaseStorage 
} from 'firebase/storage';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface ChatMessageData {
  id: string;
  userId: string;
  cropId: string;
  messageType: 'user' | 'system';
  text: string;
  imageUrl?: string;
  timestamp: any;
  status: 'sent' | 'processing' | 'responded';
}

export const ChatService = {
  /**
   * Envía un mensaje. Maneja la subida a Storage y el guardado en Firestore.
   */
  async sendMessage(
    db: Firestore,
    storage: FirebaseStorage,
    userId: string,
    cropId: string,
    text: string,
    imageFile?: File
  ) {
    let imageUrl = '';

    // 1. Subida a Storage si hay imagen
    if (imageFile) {
      try {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const storagePath = `users/${userId}/crops/${cropId}/chats/${fileName}`;
        const storageRef = ref(storage, storagePath);
        
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      } catch (error: any) {
        console.error("Error en Storage:", error);
        throw new Error("Error al subir la imagen: " + (error.message || "Fallo desconocido"));
      }
    }

    // 2. Preparar documento de Firestore
    const messagesRef = collection(db, 'users', userId, 'crops', cropId, 'chatMessages');
    const messageId = doc(messagesRef).id;
    
    const userMessage: ChatMessageData = {
      id: messageId,
      userId: userId,
      cropId: cropId,
      messageType: 'user',
      text: text.trim() || (imageUrl ? "Imagen adjunta" : "Analizando..."),
      timestamp: serverTimestamp(),
      status: 'sent'
    };

    if (imageUrl) {
      userMessage.imageUrl = imageUrl;
    }

    try {
      const messageDocRef = doc(db, 'users', userId, 'crops', cropId, 'chatMessages', messageId);
      await setDoc(messageDocRef, userMessage);
      
      // Respuesta simulada
      this.generateSimulatedResponse(db, userId, cropId);
    } catch (error: any) {
      console.error("Error en Firestore:", error);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `users/${userId}/crops/${cropId}/chatMessages/${messageId}`,
        operation: 'create',
        requestResourceData: userMessage
      }));
      throw error;
    }
  },

  async generateSimulatedResponse(db: Firestore, userId: string, cropId: string) {
    setTimeout(async () => {
      try {
        const messagesRef = collection(db, 'users', userId, 'crops', cropId, 'chatMessages');
        const messageId = doc(messagesRef).id;
        
        const systemMessage: ChatMessageData = {
          id: messageId,
          userId: userId,
          cropId: cropId,
          messageType: 'system',
          text: `**Diagnóstico Sugerido:**\n\n- **Problema:** Posible desajuste en el pH del suelo o falta de luz.\n- **Urgencia:** Media.\n- **Acción:** Asegúrate de que reciba al menos 6 horas de luz indirecta y revisa el drenaje.\n\n*Nota: Esto es una simulación de orientación.*`,
          timestamp: serverTimestamp(),
          status: 'responded'
        };

        const messageDocRef = doc(db, 'users', userId, 'crops', cropId, 'chatMessages', messageId);
        await setDoc(messageDocRef, systemMessage);
      } catch (e) {
        console.error("Error en respuesta simulada:", e);
      }
    }, 2000);
  }
};
