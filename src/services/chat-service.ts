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
 * Servicio de Chat de AgroAlerta IA.
 * Maneja el envío de mensajes, subida de fotos y respuestas simuladas.
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
        const fileName = `${Date.now()}_${imageFile.name.replace(/\s+/g, '_')}`;
        // Usamos una ruta más simple para evitar conflictos de permisos
        const storagePath = `users/${userId}/${fileName}`;
        const storageRef = ref(storage, storagePath);
        
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      } catch (error: any) {
        console.error("Error en Storage:", error);
        throw new Error("No se pudo subir la imagen. Revisa los permisos de Storage.");
      }
    }

    // 2. Preparar el mensaje para Firestore
    const messagesRef = collection(db, 'users', userId, 'crops', cropId, 'chatMessages');
    const messageId = doc(messagesRef).id;
    
    const userMessage: ChatMessageData = {
      id: messageId,
      userId: userId,
      cropId: cropId,
      messageType: 'user',
      text: text.trim() || (imageUrl ? "Imagen para analizar" : "..."),
      timestamp: serverTimestamp(),
      status: 'sent'
    };

    if (imageUrl) {
      userMessage.imageUrl = imageUrl;
    }

    // 3. Guardar mensaje en Firestore
    try {
      const messageDocRef = doc(db, 'users', userId, 'crops', cropId, 'chatMessages', messageId);
      await setDoc(messageDocRef, userMessage);
      
      // 4. Iniciar respuesta simulada
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
          text: `**AgroAlerta IA - Análisis de Cultivo**\n\nHe recibido tu información. Analizando los datos de tu cultivo, te recomiendo mantener una observación constante sobre la humedad del suelo.\n\n⚠️ **Sugerencia:** Asegúrate de que el drenaje sea óptimo.\n✅ **Próximo paso:** Revisa las hojas en busca de manchas amarillas.\n\n*Respuesta automática del sistema.*`,
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
