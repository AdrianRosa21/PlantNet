'use client';

import { doc, getDoc, updateDoc, Firestore, serverTimestamp } from 'firebase/firestore';
import { generateSmartRecommendation } from '@/ai/flows/generate-smart-recommendation';

export const RecommendationService = {
  async generateRecommendation(
    db: Firestore,
    userId: string,
    cropId: string,
    cropName: string,
    cropType: string,
    dailyIrrigationGoal: number,
    growthStage?: string | null,
    lightCondition?: string | null
  ) {
    // 1. Validar Límites por Usuario
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return { success: false, error: 'Usuario no encontrado.' };

    const userData = userSnap.data();
    const today = new Date();
    // Ajustar zona horaria si es necesario, o usar formato local YYYY-MM-DD
    const todayStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-" + String(today.getDate()).padStart(2, '0');
    
    let usos = 0;
    let fecha = '';
    
    if (userData.recomendaciones_ia) {
      usos = userData.recomendaciones_ia.usos || 0;
      fecha = userData.recomendaciones_ia.fecha || '';
    }

    if (fecha !== todayStr) {
      // Es un nuevo día, reseteamos usos
      usos = 0;
      fecha = todayStr;
    }

    const isPremium = userData.tipo_cuenta !== 'gratuita' && userData.tipo_cuenta !== undefined;
    const maxUses = isPremium ? 2 : 1;

    if (usos >= maxUses) {
      return { 
        success: false, 
        error: "Límite diario alcanzado. Tu plan permite " + maxUses + " recomendación(es) por día.",
        limitReached: true
      };
    }

    // 2. Ejecutar Flow de Genkit
    try {
      const result = await generateSmartRecommendation({
        cropName,
        cropType,
        dailyIrrigationGoal,
        growthStage,
        lightCondition
      });

      // 3. Escribir metadatos y recomendación en la Planta
      const cropRef = doc(db, 'users', userId, 'crops', cropId);
      await updateDoc(cropRef, {
        'contexto_agricola.etapa_crecimiento': growthStage || null,
        'contexto_agricola.ubicacion': lightCondition || null,
        'contexto_agricola.ultima_actualizacion_contexto': serverTimestamp(),
        'contexto_agricola.ultima_recomendacion_ia': {
          texto: result.recommendationText,
          tip: result.tip,
          fecha: serverTimestamp()
        }
      });

      // 4. Actualizar conteo de usuario
      await updateDoc(userRef, {
        'recomendaciones_ia.usos': usos + 1,
        'recomendaciones_ia.fecha': todayStr
      });

      return {
        success: true,
        data: result
      };

    } catch (e: any) {
      console.error('Error generando recomendación:', e);
      return {
        success: false,
        error: 'Hubo un error al generar la recomendación. Inténtalo de nuevo más tarde.',
      };
    }
  }
};
