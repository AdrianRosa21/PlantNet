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

/**
 * Servicio de Chat para AgroAlerta IA.
 * Maneja el envío de mensajes, subida de imágenes y respuestas simuladas.
 */
export const ChatService = {
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
        // Usamos una ruta de storage simplificada
        const storagePath = `users/${userId}/crops/${cropId}/${fileName}`;
        const storageRef = ref(storage, storagePath);
        
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      } catch (error: any) {
        console.error("Error crítico en Storage:", error);
        throw new Error("Error al subir la imagen. Verifica tu conexión.");
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
      // Usamos setDoc para asegurar que el ID del documento coincida con el campo 'id'
      await setDoc(messageDocRef, userMessage);
      
      // Respuesta simulada (disparada sin esperar)
      this.generateSimulatedResponse(db, userId, cropId);
    } catch (error: any) {
      console.error("Error en Firestore al guardar mensaje:", error);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `users/${userId}/crops/${cropId}/chatMessages/${messageId}`,
        operation: 'create',
        requestResourceData: userMessage
      }));
      throw error;
    }
  },

  async generateSimulatedResponse(db: Firestore, userId: string, cropId: string) {
    // Simulamos un retraso de procesamiento
    setTimeout(async () => {
      try {
        const messagesRef = collection(db, 'users', userId, 'crops', cropId, 'chatMessages');
        const messageId = doc(messagesRef).id;
        
        const systemMessage: ChatMessageData = {
          id: messageId,
          userId: userId,
          cropId: cropId,
          messageType: 'system',
          text: `**Análisis de AgroAlerta:**\n\n- **Posible Problema:** Basado en la información recibida, detecto un posible desbalance hídrico o estrés ambiental.\n- **Urgencia:** Media.\n- **Acción sugerida:** Revisa la humedad del suelo a 5cm de profundidad. Si está muy seco, realiza un riego ligero.\n\n*Nota: Esta es una orientación inicial simulada.*`,
          timestamp: serverTimestamp(),
          status: 'responded'
        };

        const messageDocRef = doc(db, 'users', userId, 'crops', cropId, 'chatMessages', messageId);
        await setDoc(messageDocRef, systemMessage);
      } catch (e) {
        console.error("Error en respuesta simulada:", e);
      }
    }, 2500);
  }
};
