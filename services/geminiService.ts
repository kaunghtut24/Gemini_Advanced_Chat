import { GoogleGenAI } from "@google/genai";
import { Message, Role } from '../types';

// The API key is provided via the `import.meta.env.VITE_API_KEY` environment variable.
// This is automatically configured in Vite using .env.local file.
const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
  throw new Error('VITE_API_KEY environment variable is not set. Please check your .env.local file.');
}

const ai = new GoogleGenAI({ apiKey });

let selectedModel = 'gemini-2.5-flash'; // Default model

export const setSelectedModel = (model: string) => {
  selectedModel = model;
  console.log(`Model selection updated to: ${model}`);
};

export const getSelectedModel = () => {
  return selectedModel;
};

/**
 * Test if a model is available by making a simple API call
 * @param model The model name to test
 * @returns Promise<boolean> indicating if the model is available
 */
export async function testModelAvailability(model: string): Promise<{ available: boolean; error?: string }> {
  try {
    console.log(`Testing model availability: ${model}`);
    
    const testResponse = await ai.models.generateContent({
      model,
      contents: "Test",
    });
    
    if (testResponse && testResponse.text) {
      console.log(`Model ${model} is available`);
      return { available: true };
    } else {
      console.log(`Model ${model} returned no response`);
      return { available: false, error: "No response from model" };
    }
  } catch (error) {
    console.error(`Model ${model} test failed:`, error);
    if (error instanceof Error) {
      return { available: false, error: error.message };
    }
    return { available: false, error: "Unknown error" };
  }
}

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
  const model = selectedModel; // Use the dynamically selected model

  try {
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

    // Configure model-specific settings
    const config: any = {
      tools: useWebSearch ? [{googleSearch: {}}] : undefined,
    };

    // For Gemini 2.5 models, we may need specific configurations
    if (model.includes('2.5')) {
      // Add any 2.5-specific configurations if needed
      // Based on the documentation, thinking is enabled by default for 2.5 models
      console.log(`Using ${model} with default thinking enabled`);
    }

    console.log(`Generating response with model: ${model}`);
    
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
  } catch (error) {
    console.error(`Error with model ${model}:`, error);
    
    // Provide specific error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes('model') && error.message.includes('not found')) {
        throw new Error(`Model "${model}" is not available. Please try a different model.`);
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        throw new Error(`API quota exceeded for model "${model}". Please try again later or use a different model.`);
      } else if (error.message.includes('permission') || error.message.includes('access')) {
        throw new Error(`Access denied for model "${model}". Please check your API key permissions.`);
      } else if (error.message.includes('rate')) {
        throw new Error(`Rate limit exceeded for model "${model}". Please wait a moment before trying again.`);
      }
    }
    
    // Re-throw the original error if it doesn't match our specific cases
    throw error;
  }
}

/**
 * Generates a short title for a conversation.
 * @param userPrompt The first user prompt in the conversation.
 * @returns A promise that resolves to a short string title.
 */
export async function generateTitle(userPrompt: string): Promise<string> {
  const model = selectedModel; // Use the selected model for title generation
  const titlePrompt = `Generate a concise, 5-word-or-less title for the following user prompt. Speak in the same language as the prompt. Do not include quotes, asterisks, or any other formatting.

Prompt: "${userPrompt}"

Title:`;

  try {
    console.log(`Generating title with model: ${model}`);
    
    const response = await ai.models.generateContent({
      model,
      contents: titlePrompt,
    });
    const title = response.text.trim().replace(/["*]/g, ''); // Clean up response
    return title || 'Untitled Chat';
  } catch (error) {
    console.error(`Title generation failed with model ${model}:`, error);
    
    // For title generation, we'll fallback gracefully rather than showing errors
    if (error instanceof Error) {
      if (error.message.includes('model') && error.message.includes('not found')) {
        console.warn(`Model "${model}" not available for title generation, using fallback`);
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        console.warn(`API quota exceeded for title generation with model "${model}"`);
      }
    }
    
    return userPrompt.substring(0, 40) + '...';
  }
}
