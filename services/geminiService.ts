import { GoogleGenAI, GenerateContentStreamResult, Part } from "@google/genai";
import { FileDoc, Message } from "../types";

/* =========================
   API KEY (HARDCODED)
   ========================= */
const API_KEY = "AIzaSyDbd2McnxPgTM2KKb2gNQ5DDXuiAyKc9YY";

const getClient = () => {
  return new GoogleGenAI({ apiKey: API_KEY });
};

const SYSTEM_INSTRUCTION_BASE = `
Identity: You are JARVIS (Just A Rather Very Intelligent System).
Tone: Precise, calm, technically advanced, devoid of conversational filler. No "I hope this helps".
Protocol: "Internal Data Node" priority.
Data Primacy:
1. Scan the provided CONTEXT DATA (uploaded files) exhaustively.
2. If the answer is in the files, cite it using [Verified via {File_Name}].
3. If the user asks a specific context-dependent question (e.g., "who is my professor?", "what is my schedule?", "analyze this code", "who is my daa professor?") and NO relevant CONTEXT DATA is present, DO NOT use Google Search. Explicitly state: "Local context data not provided. Please ingest knowledge to proceed."
4. If internal data is insufficient for GENERAL knowledge queries (e.g., "latest news", "Python syntax"), explicitly state "Data absent in local node. Engaging external grid..." and use the 'googleSearch' tool.
Language Protocol: Support English, Urdu, and Hinglish. Detect language automatically.
Technical:
- When requested to write code, provide FULL, EXECUTABLE, and PRODUCTION-GRADE code.
- NEVER use placeholders like "// ... rest of code" or "// implementation details" or "// same as above".
- Always write out the full file content from start to finish.
- If the user asks for a modification, rewrite the relevant block or the entire file if necessary to ensure it's copy-paste ready.
Image Gen: If user asks to generate an image (using /gen or natural language), do not generate ascii art. The system handles image generation separately, but you can acknowledge it.
`;

// Helper to convert conversation history to API format
const formatHistory = (messages: Message[]) => {
  return messages.map(m => ({
    role: m.role,
    parts: [{ text: m.content }]
  }));
};

export const streamChatResponse = async (
  modelName: string,
  messages: Message[],
  files: FileDoc[],
  userPrompt: string,
  onChunk: (text: string) => void
) => {
  const client = getClient();
  
  // Construct context from files
  let contextPrompt = "";
  if (files.length > 0) {
    contextPrompt = "\n\n=== INTERNAL DATA NODE (CONTEXT) ===\n";
    files.forEach(f => {
      contextPrompt += `\nFILE: ${f.name}\nCONTENT:\n${f.content.substring(0, 50000)}\n----------------\n`;
    });
    contextPrompt += "\n=== END INTERNAL DATA ===\n\n";
  }

  const systemInstruction = SYSTEM_INSTRUCTION_BASE + contextPrompt;

  const history = formatHistory(messages);
  const model = client.models;
  
  const config: any = {
    systemInstruction: systemInstruction,
    tools: [{ googleSearch: {} }]
  };

  if (modelName === 'gemini-3-pro-preview') {
    config.thinkingConfig = { thinkingBudget: 4096 };
  }

  try {
    const result: GenerateContentStreamResult = await model.generateContentStream({
      model: modelName,
      contents: [
        ...history,
        { role: 'user', parts: [{ text: userPrompt }] }
      ],
      config
    });

    for await (const chunk of result) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.text) {
            onChunk(part.text);
          }
        }
      }
    }
  } catch (error: any) {
    console.error("Gemini Stream Error:", error);
    throw error;
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  const client = getClient();
  const model = client.models;

  try {
    const response = await model.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      }
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No visual schematic generated.");
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};

export const generateTitle = async (messages: Message[]): Promise<string> => {
  const client = getClient();
  const firstExchange = messages
    .slice(0, 2)
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');
    
  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this conversation start and generate a very short, concise, and specific title (max 5 words). Do not use quotes or punctuation.\n\n${firstExchange}`,
    });
    return response.text?.trim() || "New Session";
  } catch (e) {
    console.error("Title Generation Error", e);
    return "New Session";
  }
};

export const processVoiceCommand = async (
  audioBase64: string,
  files: FileDoc[]
): Promise<string> => {
  const client = getClient();
  
  let contextPrompt = "";
  if (files.length > 0) {
    contextPrompt = "Use this attached context if relevant to the user's spoken query:\n";
    files.forEach(f => {
      contextPrompt += `FILE: ${f.name}\nCONTENT: ${f.content.substring(0, 10000)}\n---\n`;
    });
  }

  const parts: Part[] = [
    {
      inlineData: {
        mimeType: "audio/wav",
        data: audioBase64
      }
    },
    {
      text: `(System: Transcribe and answer. Language: Urdu, English, or Hinglish. ${contextPrompt})`
    }
  ];

  const response = await client.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts }
  });

  return response.text || "Audio signal degraded. Retrying recommended.";
};
