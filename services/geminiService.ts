import { GoogleGenAI } from "@google/genai";
import { Message, Role } from '../types';

// The API key is provided via the `import.meta.env.VITE_API_KEY` environment variable.
// This is automatically configured in Vite using .env.local file.
const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
  throw new Error('VITE_API_KEY environment variable is not set. Please check your .env.local file.');
}

const ai = new GoogleGenAI({ apiKey });

/**
 * Converts a File object to a GoogleGenerativeAI.Part object.
 */
async function fileToGenerativePart(file: File) {
  // Validate file type
  const supportedTypes = [
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
    // Documents
    'application/pdf',
    // Audio
    'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/aiff', 'audio/aac', 'audio/ogg', 'audio/flac',
    // Video
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/x-flv', 
    'video/mpg', 'video/webm', 'video/x-ms-wmv', 'video/3gpp'
  ];

  if (!supportedTypes.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}. File: ${file.name}`);
  }

  const base64EncodedData = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
}

/**
 * Generates a streaming response from the Gemini model.
 * @param history The conversation history.
 * @param prompt The user's text prompt.
 * @param files An array of files to include in the prompt.
 * @param useWebSearch A boolean indicating whether to use web search.
 * @returns An async generator that yields response chunks.
 */
export async function* generateResponseStream(
  history: Message[],
  prompt: string,
  files: File[],
  useWebSearch: boolean
): AsyncGenerator<{ text?: string; sources?: any[] }> {

  const model = 'gemini-2.5-flash';

  const fileParts = await Promise.all(files.map(fileToGenerativePart));

  // Construct the conversation history for the API call.
  const contents = [
    ...history.map(msg => ({
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })),
    // Add the new user prompt with text and files.
    {
      role: 'user',
      parts: [{ text: prompt }, ...fileParts]
    }
  ];

  const config = {
     tools: useWebSearch ? [{googleSearch: {}}] : undefined,
  };

  const stream = await ai.models.generateContentStream({
    model,
    contents,
    config
  });

  for await (const chunk of stream) {
    // Yield text chunks as they arrive.
    const text = chunk.text;
    if (text) {
      yield { text };
    }

    // Check for and yield grounding metadata for web search.
    const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata?.groundingChunks) {
        const sources = groundingMetadata.groundingChunks
            .map((c: any) => c.web)
            .filter(Boolean);
        if (sources.length > 0) {
            yield { sources: sources };
        }
    }
  }
}

/**
 * Generates a short title for a conversation.
 * @param userPrompt The first user prompt in the conversation.
 * @returns A promise that resolves to a short string title.
 */
export async function generateTitle(userPrompt: string): Promise<string> {
  const model = 'gemini-2.5-flash';
  const titlePrompt = `Generate a concise, 5-word-or-less title for the following user prompt. Speak in the same language as the prompt. Do not include quotes, asterisks, or any other formatting.

Prompt: "${userPrompt}"

Title:`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: titlePrompt,
    });
    const title = response.text.trim().replace(/["*]/g, ''); // Clean up response
    return title || 'Untitled Chat';
  } catch (error) {
    console.error("Title generation failed:", error);
    return userPrompt.substring(0, 40) + '...';
  }
}
