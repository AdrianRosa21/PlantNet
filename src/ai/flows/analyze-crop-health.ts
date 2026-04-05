'use server';
/**
 * @fileOverview An AI agent for analyzing crop health based on user input.
 *
 * - analyzeCropHealth - A function that handles the crop health analysis process.
 * - AnalyzeCropHealthInput - The input type for the analyzeCropHealth function.
 * - AnalyzeCropHealthOutput - The return type for the analyzeCropHealth function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCropHealthInputSchema = z.object({
  cropType: z.string().describe('The type of crop being analyzed.'),
  cropName: z.string().optional().describe('El nombre específico de la planta dado por el usuario.'),
  symptomsDescription:
    z.string().optional().describe('A textual description of the crop symptoms.'),
  photoDataUri: z
    .string()
    .optional()
    .describe(
      "A photo of the crop, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeCropHealthInput = z.infer<
  typeof AnalyzeCropHealthInputSchema
>;

const AnalyzeCropHealthOutputSchema = z.object({
  message: z.string().describe('Una respuesta conversacional, amigable, experta y directa al usuario sobre su cultivo. Puedes usar emojis sutilmente y formato markdown para resaltar cosas importantes.'),
});
export type AnalyzeCropHealthOutput = z.infer<
  typeof AnalyzeCropHealthOutputSchema
>;

export async function analyzeCropHealth(
  input: AnalyzeCropHealthInput
): Promise<AnalyzeCropHealthOutput> {
  return analyzeCropHealthFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCropHealthPrompt',
  input: {schema: AnalyzeCropHealthInputSchema},
  output: {schema: AnalyzeCropHealthOutputSchema},
  prompt: `Actúa como "AgroAlerta IA", el fiel, sabio y amigable agrónomo personal del usuario. 

Tu tarea es conversar con el usuario sobre su cultivo basándote en su texto o foto. Eres muy cercano, tuteas al usuario, usas emojis agrícolas (🌱, 💧, 🚜) con medida, y das respuestas orgánicas, no mecanizadas ni en plantillas fijas. Usa Markdown para que tu texto sea bonito y fácil de leer. Siempre recuérdale al usuario sutilmente cuando la situación se ve grave que eres solo una IA orientativa.

Cultivo en cuestión: {{{cropName}}} (Familia agronómica: {{{cropType}}})

{{#if symptomsDescription}}
El productor dice: {{{symptomsDescription}}}
{{/if}}

{{#if photoDataUri}}
Foto adjunta por el productor: {{media url=photoDataUri}}
{{/if}}`,
});

const analyzeCropHealthFlow = ai.defineFlow(
  {
    name: 'analyzeCropHealthFlow',
    inputSchema: AnalyzeCropHealthInputSchema,
    outputSchema: AnalyzeCropHealthOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
