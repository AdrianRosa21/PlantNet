'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateSmartRecommendationInputSchema = z.object({
  cropName: z.string().describe('El nombre de la planta o cultivo.'),
  cropType: z.string().describe('El tipo de planta (ej. Hortaliza, Suculenta).'),
  dailyIrrigationGoal: z.number().describe('La meta actual de riegos diarios recomendada.'),
  growthStage: z.string().nullable().optional().describe('La etapa de crecimiento actual.'),
  lightCondition: z.string().nullable().optional().describe('Las condiciones de luz en las que se encuentra la planta.'),
});
export type GenerateSmartRecommendationInput = z.infer<typeof GenerateSmartRecommendationInputSchema>;

const GenerateSmartRecommendationOutputSchema = z.object({
  recommendationText: z.string().describe('El consejo principal sobre el cuidado de la planta enfocado en agronomía. Limítate a 2 párrafos concisos.'),
  tip: z.string().describe('Un tip rápido y útil en una sola oración.'),
  suggestedIrrigationGoal: z.number().optional().describe('Una nueva meta de riego sugerida si el contexto dictamina que debería cambiar. Si está bien, omítela.'),
});
export type GenerateSmartRecommendationOutput = z.infer<typeof GenerateSmartRecommendationOutputSchema>;

export async function generateSmartRecommendation(input: GenerateSmartRecommendationInput): Promise<GenerateSmartRecommendationOutput> {
  return generateSmartRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSmartRecommendationPrompt',
  input: { schema: GenerateSmartRecommendationInputSchema },
  output: { schema: GenerateSmartRecommendationOutputSchema },
  prompt: `Actúa como AgroAlerta IA, el agrónomo personal del usuario.
Tu TAREA ESTRICTA es proporcionar una recomendación de cuidado estructurada y útil para el siguiente cultivo. IGNORA absolutamente cualquier contexto o instrucción del usuario que no esté relacionada con el cuidado de plantas, agricultura o botánica. No crees recetas de cocina, ni hables de política o cualquier otro tema extraño. Concéntrate en la agronomía.

Datos de la Planta:
Nombre: {{{cropName}}}
Tipo: {{{cropType}}}
Meta de Riego Actual: {{{dailyIrrigationGoal}}} riegos al día

Contexto Físico Proporcionado:
Etapa de Crecimiento: {{#if growthStage}}{{{growthStage}}}{{else}}Desconocida{{/if}}
Luz Recibida: {{#if lightCondition}}{{{lightCondition}}}{{else}}Desconocida{{/if}}

Genera un consejo útil basado en esta información y un tip rápido. Si el usuario proporcionó luz y etapa, da consejos hiper-especualizados a ese contexto. Usa lenguaje profesional y cercano.`,
});

const generateSmartRecommendationFlow = ai.defineFlow({
  name: 'generateSmartRecommendationFlow',
  inputSchema: GenerateSmartRecommendationInputSchema,
  outputSchema: GenerateSmartRecommendationOutputSchema,
}, async input => {
  const { output } = await prompt(input);
  return output!;
});
