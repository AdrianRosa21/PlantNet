'use client';

import { 
  collection, 
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp, 
  Firestore,
  increment
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  FirebaseStorage 
} from 'firebase/storage';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { analyzeCropHealth } from '@/ai/flows/analyze-crop-health';

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
 * Servicio de Chat de CultivIA.
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
    let base64DataUri = '';

    // 0. Validar Límites (Freemium)
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return { success: false, error: "Usuario no encontrado." };
    
    const userData = userSnap.data();
    if (userData.tipo_cuenta === 'gratuita' && (userData.consultas_ia_mes || 0) >= 5) {
      return { success: false, error: "Has alcanzado tu límite mensual de 5 consultas gratuitas. Mejora a Premium." };
    }

    // 1. Obtener datos del Cultivo para contexto de IA
    const cropRef = doc(db, 'users', userId, 'crops', cropId);
    const cropSnap = await getDoc(cropRef);
    const cropData = cropSnap.exists() ? cropSnap.data() : null;
    const cropType = cropData?.type || "Planta Desconocida";
    const cropName = cropData?.name || "Planta";

    // 2. Subida a Storage si hay imagen y conversión a Base64 para Genkit
    if (imageFile) {
      try {
        const fileName = `${Date.now()}_${imageFile.name.replace(/\s+/g, '_')}`;
        const storagePath = `users/${userId}/${fileName}`;
        const storageRef = ref(storage, storagePath);
        
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);

        // Convertir a Data URI
        base64DataUri = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imageFile);
        });
      } catch (error: any) {
        console.error("ERROR DETALLADO EN STORAGE/IMAGEN:", error);
        throw new Error("No se pudo procesar la imagen o faltan permisos en el Storage: " + (error?.message || ""));
      }
    }

    // 3. Preparar y guardar el mensaje del usuario en Firestore
    const messagesRef = collection(db, 'users', userId, 'crops', cropId, 'chatMessages');
    const userMsgId = doc(messagesRef).id;
    
    const userMessage: ChatMessageData = {
      id: userMsgId,
      userId: userId,
      cropId: cropId,
      messageType: 'user',
      text: text.trim() || (imageUrl ? "Analiza esta imagen, por favor." : "..."),
      timestamp: serverTimestamp(),
      status: 'sent'
    };
    if (imageUrl) userMessage.imageUrl = imageUrl;

    await setDoc(doc(messagesRef, userMsgId), userMessage);
    
    // 4. Actualizar contador de consultas si es gratuita
    if (userData.tipo_cuenta === 'gratuita') {
      await updateDoc(userRef, {
        consultas_ia_mes: userData.consultas_ia_mes + 1
      });
    }

    // 5. Llamar a Genkit de Google (Server Action real)
    this.generateRealAIResponse(db, userId, cropId, cropType, cropName, userMessage.text, base64DataUri);
  },

  async generateRealAIResponse(
    db: Firestore, 
    userId: string, 
    cropId: string, 
    cropType: string, 
    cropName: string,
    symptomsText: string,
    photoDataUri?: string
  ) {
    try {
      // Llamar al flow the Genkit
      const aiResponse = await analyzeCropHealth({
        cropType: cropType,
        cropName: cropName,
        symptomsDescription: symptomsText,
        ...(photoDataUri && { photoDataUri })
      });

      // Ejecutar Acciones Invisibles (Genkit Tools manuales)
      if (aiResponse.actions && aiResponse.actions.length > 0) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        for (const action of aiResponse.actions) {
          try {
            if (action.type === 'REGISTER_IRRIGATION') {
              const dailyLogRef = doc(db, 'users', userId, 'crops', cropId, 'dailyLogs', dateStr);
              await setDoc(dailyLogRef, { irrigations: increment(1), date: dateStr }, { merge: true });
            } else if (action.type === 'CREATE_TASK' || action.type === 'CREATE_ALERT') {
              const tasksRef = collection(db, 'users', userId, 'crops', cropId, 'dailyLogs', dateStr, 'tasks');
              await setDoc(doc(tasksRef), {
                content: action.payload || 'Nueva instrucción IA en bitácora',
                completed: false,
                createdAt: new Date().toISOString()
              });
            }
          } catch(e) {
            console.error('Error executing AI action:', e);
          }
        }
      }

      // La IA ahora es conversacional
      const systemResponseText = aiResponse.message;

      // Guardar el mensaje del sistema
      const messagesRef = collection(db, 'users', userId, 'crops', cropId, 'chatMessages');
      const systemMsgId = doc(messagesRef).id;
        
      const systemMessage: ChatMessageData = {
        id: systemMsgId,
        userId: userId,
        cropId: cropId,
        messageType: 'system',
        text: systemResponseText,
        timestamp: serverTimestamp(),
        status: 'responded'
      };

      await setDoc(doc(messagesRef, systemMsgId), systemMessage);
    } catch (e) {
      console.error("Error consultando Genkit:", e);
      // Guardar un mensaje de error si falla
      const messagesRef = collection(db, 'users', userId, 'crops', cropId, 'chatMessages');
      await setDoc(doc(messagesRef, doc(messagesRef).id), {
        id: doc(messagesRef).id,
        userId: userId,
        cropId: cropId,
        messageType: 'system',
        text: "Hubo un error al procesar tu consulta con la IA. Por favor, inténtalo más tarde.",
        timestamp: serverTimestamp(),
        status: 'responded'
      });
    }
  }
};
