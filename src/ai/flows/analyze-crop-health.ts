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
  possibleProblem:
    z.string().describe('A possible problem or condition affecting the crop.'),
  urgencyLevel:
    z.enum(['Bajo', 'Medio', 'Alto', 'Crítico']).describe('The urgency level of the identified problem.'),
  suggestedAction:
    z.string().describe('A suggested action to address the problem.'),
  disclaimer:
    z.string().describe('A brief disclaimer indicating that this is initial guidance.'),
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
  prompt: `Actúa como un asistente agrícola experto. Tu tarea es analizar la condición de un cultivo basándote en la información proporcionada (descripción de síntomas o una imagen) y generar una respuesta orientativa.

Tipo de Cultivo: {{{cropType}}}

{{#if symptomsDescription}}
Descripción de Síntomas: {{{symptomsDescription}}}
{{/if}}

{{#if photoDataUri}}
Foto: {{media url=photoDataUri}}
{{/if}}

Basándote en la información anterior, identifica un posible problema del cultivo, evalúa su nivel de urgencia (Bajo, Medio, Alto, Crítico) y sugiere una acción inicial. La respuesta debe estar en español.

Para el campo 'disclaimer', proporciona un breve descargo de responsabilidad que indique claramente que esta es una orientación inicial simulada y no un diagnóstico profesional definitivo.`,
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
