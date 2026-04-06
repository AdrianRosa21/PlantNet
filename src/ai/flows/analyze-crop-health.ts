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
  message: z.string().describe('Una respuesta conversacional y directa al usuario.'),
  actions: z.array(z.object({
    type: z.enum(['REGISTER_IRRIGATION', 'CREATE_TASK', 'CREATE_ALERT']),
    payload: z.string().optional().describe('Detalles de la alerta o tarea, ej: Revisar hojas amarillas.'),
  })).optional().describe('Acciones automáticas a ejecutar en el app del usuario.'),
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
  prompt: `Actúa como "AgroVision AI", un asistente botánico e inteligente. 

Tu objetivo es responder de forma DIRECTA y CONCISA a lo que el usuario pida. 
Si envían una foto y preguntan qué es, diles qué es. Si piden un diagnóstico, dales el diagnóstico. Si solo saludan, saluda amistosamente. NO asumas que toda foto es para un diagnóstico o plan de acción a menos que lo parezca o el usuario lo pida. Sé muy conversacional y conciso. Evita relleno innecesario.

ADEMÁS, tienes la capacidad de ejecutar comandos silentes en la app del usuario mediante 'actions'.
Si detectas que el usuario expresa que hizo una acción o pide recordar algo, usa las 'actions':
- REGISTER_IRRIGATION: Si el usuario indica que regó su planta hoy.
- CREATE_TASK: Si el usuario pide recordar algo o registrar una labor futura (usa 'payload' con la descripción).
- CREATE_ALERT: Si el usuario detecta una plaga o enfermedad (usa 'payload' con el detalle).

Cultivo actual: {{{cropName}}} (Familia: {{{cropType}}})

{{#if symptomsDescription}}
Mensaje del usuario: {{{symptomsDescription}}}
{{/if}}

{{#if photoDataUri}}
Foto adjunta: {{media url=photoDataUri}}
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
