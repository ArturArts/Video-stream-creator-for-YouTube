
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { ImageSize, AspectRatio } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Utility to handle transient API errors with simple retries.
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries: number = 2): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0) {
      console.warn(`API call failed, retrying... (${retries} left)`, error);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return callWithRetry(fn, retries - 1);
    }
    throw error;
  }
}

/**
 * Optimizes prompts for high-fidelity photorealism.
 */
async function optimizePromptForRealism(rawPrompt: string, isThumbnail: boolean = false): Promise<string> {
  const ai = getAI();
  const systemPrompt = isThumbnail 
    ? `ACT AS A YOUTUBE THUMBNAIL STRATEGIST AND PHOTOGRAPHER. 
       Rewrite this into a prompt for a high-CTR thumbnail.
       - Use close-up or mid-shot for emotional impact.
       - Dramatic lighting: High contrast, vibrant but natural colors.
       - Style: Photorealistic, professional photography.`
    : `ACT AS AN EXPERT CINEMATOGRAPHER. 
       Rewrite the following description into a technical prompt for a high-fidelity image generator.
       INCLUDE: Camera gear (e.g., 35mm lens), Lighting (volumetric, rim light), and Texture details.
       CRITICAL: Ensure secondary characters are described with historical and ethnic details suitable to the era.`;

  const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `${systemPrompt}\n\nOriginal Description: ${rawPrompt}\n\nProfessional Prompt:`,
  }));

  return response.text || rawPrompt;
}

/**
 * Analyzes the script to extract scenes with bilingual metadata.
 */
export async function analyzeScript(script: string, useSearch: boolean = false) {
  const ai = getAI();
  const config: any = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        scenes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              timestamp: { type: Type.STRING },
              description: { 
                type: Type.STRING, 
                description: "Descrição visual curta em PORTUGUÊS DO BRASIL para o usuário." 
              },
              imagePrompt: { 
                type: Type.STRING, 
                description: "Detailed visual prompt in ENGLISH for the image generator." 
              }
            },
            required: ["timestamp", "description", "imagePrompt"]
          }
        }
      },
      required: ["scenes"]
    }
  };

  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze this YouTube script. 
    1. 'description' MUST be in PORTUGUÊS DO BRASIL.
    2. 'imagePrompt' MUST be in ENGLISH.
    3. Identify 'PROTAGONIST' when present.
    4. Describe other characters as 'SECONDARY CHARACTERS' with unique faces and context-appropriate features (ethnicity, age, era clothing).
    
    Script:
    ${script}`,
    config
  }));

  return JSON.parse(response.text || '{}');
}

export async function generateCharacterVariations(base64Face: string): Promise<string[]> {
  const ai = getAI();
  const mimeType = base64Face.split(';')[0].split(':')[1];
  const base64Data = base64Face.split(',')[1];
  
  const scenarios = [
    "Full-body studio portrait, neutral background.",
    "Candid full-body shot walking in a city.",
    "Dramatic low-angle shot in nature."
  ];

  const results: string[] = [];
  for (const scenario of scenarios) {
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: `Full-body view of THIS PROTAGONIST. 100% facial fidelity. Scenario: ${scenario}` }
        ]
      },
      config: { imageConfig: { aspectRatio: "9:16" } }
    }));
    
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) results.push(`data:image/png;base64,${part.inlineData.data}`);
      }
    }
  }
  return results;
}

export async function generateImage(prompt: string, aspectRatio: AspectRatio = "16:9", references: string[] = []) {
  const ai = getAI();
  const optimizedPrompt = await optimizePromptForRealism(prompt);
  const parts: any[] = references.map(ref => ({
    inlineData: { data: ref.split(',')[1], mimeType: ref.split(';')[0].split(':')[1] }
  }));

  parts.push({ 
    text: `IDENTITY RULES:
    1. PROTAGONIST: Use references ONLY for characters labeled 'PROTAGONIST'.
    2. OTHERS: For anyone else, generate unique faces that match the scene's historical/geographic context. DO NOT use reference faces for these people.
    
    STYLE: ${optimizedPrompt}` 
  });

  const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: { imageConfig: { aspectRatio: aspectRatio as any } }
  }));

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Geração de imagem falhou.");
}

export async function generateImagePro(prompt: string, size: ImageSize = "1K", aspectRatio: AspectRatio = "16:9", useSearch: boolean = false, references: string[] = []) {
  const ai = getAI();
  const config: any = { imageConfig: { aspectRatio, imageSize: size } };
  if (useSearch) config.tools = [{ googleSearch: {} }];

  const optimizedPrompt = await optimizePromptForRealism(prompt);
  const parts: any[] = references.map(ref => ({
    inlineData: { data: ref.split(',')[1], mimeType: ref.split(';')[0].split(':')[1] }
  }));

  parts.push({ 
    text: `PRO IDENTITY MANAGEMENT:
    - references ONLY for 'PROTAGONIST'.
    - all other figures MUST have unique, era-accurate, diverse faces.
    
    STYLE: ${optimizedPrompt}` 
  });

  const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts },
    config
  }));

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Geração Pro falhou.");
}

export async function generateThumbnail(script: string, referenceImages: string[] = []) {
  const ai = getAI();
  const conceptResponse = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Viral YouTube thumbnail concept for: ${script}. Prompt in English.`,
  }));
  
  const rawConcept = conceptResponse.text || "High impact cinematic shot.";
  const optimizedPrompt = await optimizePromptForRealism(rawConcept, true);

  const parts: any[] = referenceImages.map(ref => ({
    inlineData: { data: ref.split(',')[1], mimeType: ref.split(';')[0].split(':')[1] }
  }));
  
  parts.push({ text: `PROTAGONIST: Use references. CONCEPT: ${optimizedPrompt}` });

  const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: { imageConfig: { aspectRatio: "16:9" } }
  }));

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return { url: `data:image/png;base64,${part.inlineData.data}`, prompt: optimizedPrompt };
    }
  }
  throw new Error("Thumbnail falhou.");
}

/**
 * Restyles an image based on a reference style image.
 */
export async function restyleImage(sourceBase64: string, styleRefBase64: string, prompt: string) {
  const ai = getAI();
  const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: sourceBase64.split(',')[1], mimeType: sourceBase64.split(';')[0].split(':')[1] } },
        { inlineData: { data: styleRefBase64.split(',')[1], mimeType: styleRefBase64.split(';')[0].split(':')[1] } },
        { text: `ACT AS A HIGH-END ART DIRECTOR. Redraw the content and composition of the FIRST image using the EXACT artistic style, lighting, color palette, and mood of the SECOND image. Maintain the original subject matter: ${prompt}` },
      ],
    },
    config: { imageConfig: { aspectRatio: "16:9" } }
  }));

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Falha ao aplicar estilo.");
}

export async function generateNarration(text: string) {
  const ai = getAI();
  const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Narrate in Portuguese: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
    },
  }));
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Áudio falhou.");
  return `data:audio/wav;base64,${base64Audio}`;
}

export async function editImage(base64Image: string, prompt: string) {
  const ai = getAI();
  const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1], mimeType: base64Image.split(';')[0].split(':')[1] } },
        { text: `PHOTO EDIT: ${prompt}. Professional photorealistic blending.` },
      ],
    },
  }));
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Edição falhou.");
}

export async function generateVideo(base64Image: string, prompt: string = "Cinematic video", aspectRatio: AspectRatio = '16:9') {
  const ai = getAI();
  let operation: any = await callWithRetry(() => ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `Cinematic: ${prompt}. Realistic motion.`,
    image: { imageBytes: base64Image.split(',')[1], mimeType: base64Image.split(';')[0].split(':')[1] },
    config: { numberOfVideos: 1, resolution: '720p', aspectRatio: aspectRatio as any }
  }));
  
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 8000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }
  
  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Link de download do vídeo não encontrado.");
  
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
