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
 * Servicio para gestionar el chat de cultivos.
 * Esta capa está preparada para integrar Gemini en el futuro.
 */
export const ChatService = {
  /**
   * Envía un mensaje del usuario y dispara la respuesta simulada.
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

    // 1. Subir imagen si existe
    if (imageFile) {
      try {
        const fileExtension = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
        const storageRef = ref(storage, `users/${userId}/crops/${cropId}/chats/${fileName}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      } catch (error) {
        console.error("Storage upload error:", error);
        throw error;
      }
    }

    // 2. Generar ID y preparar mensaje del usuario
    const messagesRef = collection(db, 'users', userId, 'crops', cropId, 'chatMessages');
    const messageId = doc(messagesRef).id;
    
    const userMessage: ChatMessageData = {
      id: messageId,
      userId,
      cropId,
      messageType: 'user',
      text: text || (imageUrl ? "Imagen adjunta" : ""),
      imageUrl: imageUrl || undefined,
      timestamp: serverTimestamp(),
      status: 'sent'
    };

    try {
      const messageDocRef = doc(db, 'users', userId, 'crops', cropId, 'chatMessages', messageId);
      // Usamos setDoc para asegurar que el ID generado esté en el cuerpo del documento
      await setDoc(messageDocRef, userMessage);
      
      // Simular respuesta después del guardado exitoso
      this.generateSimulatedResponse(db, userId, cropId);
    } catch (error) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `users/${userId}/crops/${cropId}/chatMessages/${messageId}`,
        operation: 'create',
        requestResourceData: userMessage
      }));
      throw error;
    }
  },

  /**
   * Genera una respuesta simulada estructurada.
   */
  async generateSimulatedResponse(db: Firestore, userId: string, cropId: string) {
    const messagesRef = collection(db, 'users', userId, 'crops', cropId, 'chatMessages');
    
    // Simular retraso de procesamiento
    setTimeout(async () => {
      const messageId = doc(messagesRef).id;
      const simulatedText = `**Análisis de Situación:**
- **Posible problema:** Estrés hídrico o desbalance de nutrientes detectado visualmente.
- **Nivel de urgencia:** Medio.
- **Acción sugerida:** Verifica la humedad del suelo a 5cm de profundidad y evita mojar las hojas directamente durante el riego.

*Nota: Esta es una orientación inicial automatizada basada en los datos proporcionados. Consulta a un agrónomo para un diagnóstico definitivo.*`;

      const systemMessage: ChatMessageData = {
        id: messageId,
        userId,
        cropId,
        messageType: 'system',
        text: simulatedText,
        timestamp: serverTimestamp(),
        status: 'responded'
      };

      try {
        const messageDocRef = doc(db, 'users', userId, 'crops', cropId, 'chatMessages', messageId);
        await setDoc(messageDocRef, systemMessage);
      } catch (error) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `users/${userId}/crops/${cropId}/chatMessages/${messageId}`,
          operation: 'create',
          requestResourceData: systemMessage
        }));
      }
    }, 2000);
  }
};