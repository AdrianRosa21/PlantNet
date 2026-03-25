'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VerifyCropCreationInputSchema = z.object({
  cropName: z.string().describe('El nombre de la planta o cultivo ingresado por el usuario.'),
});
export type VerifyCropCreationInput = z.infer<typeof VerifyCropCreationInputSchema>;

const VerifyCropCreationOutputSchema = z.object({
  isValidPlant: z.boolean().describe('Verdadero si el nombre es una planta o cultivo que se puede sembrar.'),
  reason: z.string().describe('Una explicación cortés del porqué es o no es válido.'),
  suggestedType: z.string().describe('Ej. Hortaliza, Árbol Frutal, Suculenta, etc. Vacío si es inválido.'),
  dailyIrrigationGoal: z.number().describe('La meta ideal de riegos diarios recomendada (ej 1, 2). 0 si es inválido.'),
  idealTemperature: z.number().describe('La temperatura ideal en Celsius para el cultivo. 0 si es inválido.')
});
export type VerifyCropCreationOutput = z.infer<typeof VerifyCropCreationOutputSchema>;

export async function verifyCropCreation(input: VerifyCropCreationInput): Promise<VerifyCropCreationOutput> {
  return verifyCropCreationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'verifyCropCreationPrompt',
  input: { schema: VerifyCropCreationInputSchema },
  output: { schema: VerifyCropCreationOutputSchema },
  prompt: `Actúa como un agrónomo estricto experto en cultivos. El usuario quiere registrar una nueva planta en su huerto digital y ha introducido el siguiente nombre:

Nombre del cultivo: "{{{cropName}}}"

Tu tarea es:
1. Validar estrictamente si el texto ingresado se refiere a una planta real, semilla, vegetal, hierba, árbol, flor o cultivo que se pueda sembrar y mantener.
2. Si el usuario ingresa un nombre absurdo o que no es una planta (como "Mesa", "Perro", "Carro", "Juguete"), marca 'isValidPlant' como falso y explica en 'reason' que AgroAlerta es para plantas y que ingrese una especie botánica real. NO PERMITAS NOMBRES FALSOS.
3. Si es válido (isValidPlant: true), deduce los siguientes valores para la planta en su etapa de crecimiento regular:
   - 'suggestedType': El tipo de planta agronómico (por ejemplo: "Hortaliza de raíz", "Árbol Frutal", "Hierba aromática", "Cactus o Suculenta", etc.).
   - 'dailyIrrigationGoal': Un número entero representando los riegos recomendados promedio por día (casi siempre 1 o 2).
   - 'idealTemperature': Un número entero en grados Celsius que represente el clima diurno óptimo para que esta planta crezca saludablemente.`,
});

const verifyCropCreationFlow = ai.defineFlow({
  name: 'verifyCropCreationFlow',
  inputSchema: VerifyCropCreationInputSchema,
  outputSchema: VerifyCropCreationOutputSchema,
}, async input => {
  const { output } = await prompt(input);
  return output!;
});
