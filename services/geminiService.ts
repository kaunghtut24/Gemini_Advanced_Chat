import { GoogleGenAI } from "@google/genai";
import { Message, Role } from '../types';

// Environment variable API key as fallback
const envApiKey = import.meta.env.VITE_API_KEY;

// Function to get GoogleGenAI instance with proper API key
function getGoogleGenAI(apiKey?: string): GoogleGenAI {
  const keyToUse = apiKey || envApiKey;
  
  if (!keyToUse) {
    throw new Error('No API key provided. Please set VITE_API_KEY environment variable or provide an API key in settings.');
  }
  
  return new GoogleGenAI({ apiKey: keyToUse });
}

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
 * @param apiKey Optional API key to use (falls back to environment variable)
 * @returns Promise<boolean> indicating if the model is available
 */
export async function testModelAvailability(model: string, apiKey?: string): Promise<{ available: boolean; error?: string }> {
  try {
    console.log(`Testing model availability: ${model}`);
    const ai = getGoogleGenAI(apiKey);
    
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
 * Truncates conversation history to fit within context window limits
 * @param history The full conversation history
 * @param maxMessages Maximum number of recent messages to include
 * @returns Truncated message history
 */
function truncateHistory(history: Message[], maxMessages: number = 50): Message[] {
  // Always keep the first message if it's a system message or greeting
  if (history.length <= maxMessages) {
    return history;
  }

  // Keep the first message (usually a greeting) and the most recent messages
  const firstMessage = history[0];
  const recentMessages = history.slice(-(maxMessages - 1));
  
  // If first message is just a greeting, we can skip it for context
  if (firstMessage?.role === Role.ASSISTANT && 
      firstMessage.content.includes("Hello! How can I help you today?")) {
    return recentMessages;
  }
  
  return [firstMessage, ...recentMessages];
}

/**
 * Estimates the token count for a message (rough approximation)
 * @param message The message to estimate tokens for
 * @returns Estimated token count
 */
function estimateTokens(message: Message): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(message.content.length / 4);
}

/**
 * Intelligently manages context window by keeping important messages
 * @param history The full conversation history
 * @param maxTokens Maximum tokens to use for context (model-dependent)
 * @returns Optimized message history
 */
function manageContextWindow(history: Message[], maxTokens: number = 30000): Message[] {
  if (history.length === 0) return history;

  let totalTokens = 0;
  const contextHistory: Message[] = [];
  
  // Start from the most recent messages and work backwards
  for (let i = history.length - 1; i >= 0; i--) {
    const message = history[i];
    const messageTokens = estimateTokens(message);
    
    if (totalTokens + messageTokens > maxTokens && contextHistory.length > 0) {
      break;
    }
    
    contextHistory.unshift(message);
    totalTokens += messageTokens;
  }
  
  console.log(`Context window: Using ${contextHistory.length}/${history.length} messages (~${totalTokens} tokens)`);
  return contextHistory;
}

/**
 * Generates a streaming response from the Gemini model.
 * @param history The conversation history.
 * @param prompt The user's text prompt.
 * @param files An array of files to include in the prompt.
 * @param useWebSearch A boolean indicating whether to use web search.
 * @param apiKey Optional API key to use (falls back to environment variable).
 * @returns An async generator that yields response chunks.
 */
export async function* generateResponseStream(
  history: Message[],
  prompt: string,
  files: File[],
  useWebSearch: boolean,
  apiKey?: string
): AsyncGenerator<{ text?: string; sources?: any[] }> {
  const model = selectedModel; // Use the dynamically selected model
  const ai = getGoogleGenAI(apiKey);

  console.log(`🤖 generateResponseStream called with:`);
  console.log(`📜 History: ${history.length} messages`);
  console.log(`💬 Prompt: "${prompt}"`);
  console.log(`📁 Files: ${files.length}`);
  
  if (history.length > 0) {
    console.log(`🧠 History preview:`, history.map(m => ({ role: m.role, content: m.content.substring(0, 50) + '...' })));
  }

  // Declare variables at function scope for fallback access
  let contents: any[] = [];
  let config: any = {};

  try {
    const fileParts = await Promise.all(files.map(fileToGenerativePart));

    // Determine context window size based on model
    let maxTokens = 30000; // Default for most models
    if (model.includes('2.5')) {
      maxTokens = 100000; // Gemini 2.5 has larger context window
    } else if (model.includes('1.5')) {
      maxTokens = 30000; // Gemini 1.5 Pro context window
    }

    // Manage context window to prevent token limit issues
    const contextHistory = manageContextWindow(history, maxTokens);
    
    console.log(`📊 Context window management:`);
    console.log(`   Input history: ${history.length} messages`);
    console.log(`   After context window: ${contextHistory.length} messages`);
    console.log(`   Max tokens: ${maxTokens}`);
    
    if (contextHistory.length > 0) {
      console.log(`📝 Context history preview:`, contextHistory.map(m => ({ role: m.role, content: m.content.substring(0, 30) + '...' })));
    }

    // Check if the last message in history is the current user prompt
    const lastMessage = contextHistory[contextHistory.length - 1];
    const isLastMessageCurrentPrompt = lastMessage && lastMessage.role === Role.USER && lastMessage.content === prompt;

    console.log(`🔍 Last message check:`);
    console.log(`   Last message exists: ${!!lastMessage}`);
    if (lastMessage) {
      console.log(`   Last message role: ${lastMessage.role}`);
      console.log(`   Last message content: "${lastMessage.content}"`);
      console.log(`   Current prompt: "${prompt}"`);
      console.log(`   Messages match: ${lastMessage.content === prompt}`);
    }
    console.log(`   Using integrated history: ${isLastMessageCurrentPrompt}`);

    // Construct the conversation history for the API call.
    if (isLastMessageCurrentPrompt) {
      console.log(`✅ Using integrated history approach`);
      // If the last message is the current prompt, just use the history as-is
      contents = contextHistory.map(msg => ({
        role: msg.role === Role.USER ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
      
      // Add files to the last user message if any
      if (fileParts.length > 0) {
        const lastContent = contents[contents.length - 1];
        lastContent.parts = [{ text: lastContent.parts[0].text }, ...fileParts];
      }
    } else {
      console.log(`⚠️ Using legacy separate prompt approach`);
      // Legacy behavior: add prompt as separate message
      contents = [
        ...contextHistory.map(msg => ({
          role: msg.role === Role.USER ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })),
        // Add the new user prompt with text and files.
        {
          role: 'user',
          parts: [{ text: prompt }, ...fileParts]
        }
      ];
    }

    // Configure model-specific settings with correct Google Search tool
    config = {
      tools: useWebSearch ? [{ googleSearch: {} }] : undefined,
    };

    // Log web search configuration
    if (useWebSearch) {
      console.log(`🔍 Web search enabled for ${model} with Google Search tool`);
    } else {
      console.log(`📝 Web search disabled for ${model}`);
    }

    // For Gemini 2.5 models, we may need specific configurations
    if (model.includes('2.5')) {
      // Add any 2.5-specific configurations if needed
      // Based on the documentation, thinking is enabled by default for 2.5 models
      console.log(`Using ${model} with default thinking enabled`);
    }

    console.log(`Generating response with model: ${model}`);
    console.log(`📤 Sending ${contents.length} messages to API`);
    console.log(`🧠 Context: ${contents.filter(c => c.role === 'model').length} assistant messages, ${contents.filter(c => c.role === 'user').length} user messages`);
    console.log(`📋 Final contents being sent to API:`, contents.map(c => ({ role: c.role, text: c.parts[0]?.text?.substring(0, 30) + '...' })));
    
    console.log(`🔄 Starting API stream request...`);
    
    // Add timeout mechanism to prevent hanging requests
    const timeoutMs = 30000; // 30 seconds timeout

    // Use the new SDK format for generateContentStream
    const streamPromise = ai.models.generateContentStream({
      model,
      contents,
      config
    });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs);
    });
    
    const stream = await Promise.race([streamPromise, timeoutPromise]) as any;
    console.log(`✅ Stream created successfully`);

    let chunkCount = 0;
    let lastChunkTime = Date.now();
    
    for await (const chunk of stream) {
      chunkCount++;
      const now = Date.now();
      console.log(`📦 Received chunk ${chunkCount} (${now - lastChunkTime}ms since last):`, { hasText: !!chunk.text, textLength: chunk.text?.length });
      lastChunkTime = now;
      
      // Yield text chunks as they arrive.
      const text = chunk.text;
      if (text) {
        yield { text };
      }

      // Check for and yield grounding metadata for web search based on official API docs
      const candidate = chunk.candidates?.[0];
      const groundingMetadata = candidate?.groundingMetadata;

      if (groundingMetadata) {
        console.log(`🔍 Grounding metadata found in chunk ${chunkCount}:`, groundingMetadata);

        let sources: any[] = [];

        // Extract sources from groundingChunks (official format)
        if (groundingMetadata.groundingChunks) {
          sources = groundingMetadata.groundingChunks
            .map((chunk: any) => {
              if (chunk.web) {
                return {
                  title: chunk.web.title || 'Web Source',
                  uri: chunk.web.uri || '#', // Use 'uri' to match Source interface
                  snippet: chunk.web.snippet || ''
                };
              }
              return null;
            })
            .filter(Boolean);
        }

        // Log web search queries if available
        if (groundingMetadata.webSearchQueries) {
          console.log(`🔍 Web search queries used:`, groundingMetadata.webSearchQueries);
        }

        if (sources.length > 0) {
          console.log(`📚 Found ${sources.length} web sources in chunk ${chunkCount}:`, sources);
          yield { sources: sources };
        } else {
          console.log(`⚠️ Grounding metadata present but no extractable sources in chunk ${chunkCount}`);
        }
      }
    }
    console.log(`🏁 Stream completed with ${chunkCount} chunks`);
  } catch (error) {
    console.error(`❌ Streaming error with model ${model}:`, error);
    
    // Try fallback to non-streaming if streaming fails
    if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('stream'))) {
      console.log(`🔄 Attempting fallback to non-streaming mode...`);
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config
        });
        
        const text = response.text;
        if (text) {
          console.log(`✅ Non-streaming fallback successful`);
          yield { text };
          return;
        }
      } catch (fallbackError) {
        console.error(`❌ Non-streaming fallback also failed:`, fallbackError);
      }
    }
    
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
      } else if (error.message.includes('timeout')) {
        throw new Error(`Request timed out for model "${model}". Please try again or use a different model.`);
      }
    }
    
    // Re-throw the original error if it doesn't match our specific cases
    throw error;
  }
}

/**
 * Generates a short title for a conversation.
 * @param userPrompt The first user prompt in the conversation.
 * @param apiKey Optional API key to use (falls back to environment variable).
 * @returns A promise that resolves to a short string title.
 */
export async function generateTitle(userPrompt: string, apiKey?: string): Promise<string> {
  const model = selectedModel; // Use the selected model for title generation
  const ai = getGoogleGenAI(apiKey);
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
