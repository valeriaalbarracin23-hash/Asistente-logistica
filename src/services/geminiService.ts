import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function askAssistant(prompt: string, context: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: `Eres Lucas, un asistente personal logístico inteligente. Tu objetivo es ayudar al usuario a organizar tareas, recordatorios, reuniones y logística diaria del trabajo.
        
El usuario te está haciendo una pregunta o pidiendo un resumen.
Responde de manera amable, profesional y concisa.
Usa emojis relacionados con el trabajo y la logística.
Usa frases como:
- "Hola Lucas, buen día ☀️"
- "Hoy tienes X tareas pendientes."
- "No olvides tu reunión a las XX:XX."
- "Excelente trabajo, completaste todas las tareas de hoy."

Aquí tienes el contexto actual del usuario (tareas, reuniones, etc.):
${context}

Responde a la siguiente solicitud del usuario basándote en el contexto proporcionado.`,
      },
    });
    return response.text || 'Lo siento, no pude procesar tu solicitud.';
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return 'Hubo un error al conectar con el asistente. Por favor, intenta de nuevo más tarde.';
  }
}
