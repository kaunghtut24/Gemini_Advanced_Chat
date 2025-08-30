import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { Message, Role, AIProvider, ProviderConfig, ModelConfig, SearchProvider } from '../types';
import { performWebSearch, getActiveSearchProvider, SearchResult } from './webSearchService';

// Default provider configurations
const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    provider: AIProvider.GEMINI,
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY || '',
    models: [
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite'
    ]
  },
  {
    provider: AIProvider.OPENAI,
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo'
    ]
  }
];

/**
 * Load provider configurations from localStorage
 */
function getStoredProviderConfigs(): ProviderConfig[] {
  try {
    const stored = localStorage.getItem('aiProviders');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.providers || DEFAULT_PROVIDERS;
    }
  } catch (error) {
    console.error('Error loading provider configurations:', error);
  }
  return DEFAULT_PROVIDERS;
}

/**
 * Check if we're in development mode
 */
function isDevelopmentMode(): boolean {
  return import.meta.env.DEV || import.meta.env.MODE === 'development';
}

/**
 * Get merged provider configurations (default + stored + custom)
 * In development mode, environment variables take priority over localStorage
 */
function getAllProviderConfigs(): ProviderConfig[] {
  const storedConfigs = getStoredProviderConfigs();
  const stored = localStorage.getItem('aiProviders');
  let customConfigs: ProviderConfig[] = [];

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      customConfigs = parsed.customProviders || [];
    } catch (error) {
      console.error('Error loading custom provider configurations:', error);
    }
  }

  const isDevMode = isDevelopmentMode();
  console.log(`🔧 Running in ${isDevMode ? 'development' : 'production'} mode`);

  // Merge stored configs with defaults, with proper priority handling
  const mergedConfigs = DEFAULT_PROVIDERS.map(defaultConfig => {
    const storedConfig = storedConfigs.find(c => c.provider === defaultConfig.provider);

    let finalConfig: ProviderConfig;

    if (isDevMode) {
      // In development mode: Environment variables take priority over localStorage
      finalConfig = {
        ...defaultConfig,
        ...(storedConfig || {}),
        // Override with environment variable if present
        apiKey: defaultConfig.apiKey || storedConfig?.apiKey || ''
      };
    } else {
      // In production mode: localStorage takes priority over environment variables
      finalConfig = storedConfig ? { ...defaultConfig, ...storedConfig } : defaultConfig;
    }

    const envKeyPresent = !!defaultConfig.apiKey;
    const storedKeyPresent = !!(storedConfig?.apiKey);
    const finalKeyPresent = !!finalConfig.apiKey;

    console.log(`🔧 Provider ${defaultConfig.provider}:`);
    console.log(`   - Environment key: ${envKeyPresent ? '✅' : '❌'}`);
    console.log(`   - Stored key: ${storedKeyPresent ? '✅' : '❌'}`);
    console.log(`   - Final key: ${finalKeyPresent ? '✅' : '❌'}`);

    if (isDevMode && envKeyPresent && finalKeyPresent) {
      console.log(`   🌍 Using environment variable for ${defaultConfig.provider}`);
    } else if (storedKeyPresent && finalKeyPresent) {
      console.log(`   💾 Using stored key for ${defaultConfig.provider}`);
    }

    return finalConfig;
  });

  console.log(`📋 Total provider configs: ${mergedConfigs.length} default + ${customConfigs.length} custom`);
  return [...mergedConfigs, ...customConfigs];
}

// Provider instances cache
const providerInstances = new Map<string, GoogleGenAI | OpenAI>();

// Current model configuration
let currentModelConfig: ModelConfig | null = null;

/**
 * Get or create provider instance
 */
function getProviderInstance(config: ProviderConfig): GoogleGenAI | OpenAI {
  const cacheKey = `${config.provider}-${config.baseUrl || 'default'}`;

  console.log(`🔧 Getting provider instance for ${config.provider}, API key present: ${!!config.apiKey}`);

  if (providerInstances.has(cacheKey)) {
    console.log(`♻️ Using cached provider instance for ${config.provider}`);
    return providerInstances.get(cacheKey)!;
  }

  let instance: GoogleGenAI | OpenAI;

  switch (config.provider) {
    case AIProvider.GEMINI:
      if (!config.apiKey) {
        console.error(`❌ No API key found for Gemini provider. Config:`, config);
        throw new Error('Gemini API key is required');
      }
      console.log(`✅ Creating Gemini instance with API key: ${config.apiKey.substring(0, 10)}...`);
      instance = new GoogleGenAI({ apiKey: config.apiKey });
      break;

    case AIProvider.OPENAI:
    case AIProvider.CUSTOM:
      if (!config.apiKey) {
        throw new Error(`${config.provider} API key is required`);
      }
      
      const openaiConfig: any = {
        apiKey: config.apiKey,
        dangerouslyAllowBrowser: true
      };
      
      // Support custom base URL for OpenAI-compatible providers
      if (config.baseUrl) {
        // Clean the base URL to avoid double path issue
        let cleanBaseUrl = config.baseUrl.trim();
        if (cleanBaseUrl.endsWith('/chat/completions')) {
          cleanBaseUrl = cleanBaseUrl.replace('/chat/completions', '');
        }
        if (cleanBaseUrl.endsWith('/')) {
          cleanBaseUrl = cleanBaseUrl.slice(0, -1);
        }
        openaiConfig.baseURL = cleanBaseUrl;
        console.log(`🔧 Using cleaned base URL: ${cleanBaseUrl} (original: ${config.baseUrl})`);
      }
      
      instance = new OpenAI(openaiConfig);
      break;

    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }

  providerInstances.set(cacheKey, instance);
  return instance;
}

/**
 * Set the current model configuration
 */
export function setCurrentModel(modelConfig: ModelConfig) {
  currentModelConfig = modelConfig;
  console.log(`🤖 Model updated to: ${modelConfig.name} (${modelConfig.provider})`);
}

/**
 * Refresh provider configurations from localStorage
 * Call this after settings are updated
 */
export function refreshProviderConfigs() {
  // Clear the provider instances cache to force reload with new API keys
  providerInstances.clear();
  console.log('🔄 Provider configurations refreshed');
}

/**
 * Get the current model configuration
 */
export function getCurrentModel(): ModelConfig | null {
  return currentModelConfig;
}

/**
 * Get available models from all configured providers
 */
export function getAvailableModels(customConfigs: ProviderConfig[] = []): ModelConfig[] {
  const allConfigs = getAllProviderConfigs();
  const models: ModelConfig[] = [];

  allConfigs.forEach((config, configIndex) => {
    if (config.apiKey) { // Only include providers with API keys
      config.models.forEach((modelId, modelIndex) => {
        // Create unique ID by including config index to avoid duplicates
        const uniqueId = config.customName
          ? `${config.provider}-${config.customName}-${modelId}-${configIndex}`
          : `${config.provider}-${modelId}-${configIndex}`;

        models.push({
          id: uniqueId,
          name: config.customName ? `${config.customName} - ${modelId}` : `${config.provider.toUpperCase()} - ${modelId}`,
          provider: config.provider,
          providerConfig: config
        });
      });
    }
  });

  console.log(`🔧 Available models loaded: ${models.length} models from ${allConfigs.length} providers`);
  return models;
}

/**
 * Convert messages to provider-specific format
 */
function convertMessages(messages: Message[], provider: AIProvider): any[] {
  switch (provider) {
    case AIProvider.GEMINI:
      return messages.map(msg => {
        // Gemini doesn't have a system role, so convert system messages to user messages with special formatting
        if (msg.role === Role.SYSTEM) {
          return {
            role: 'user',
            parts: [{ text: `[SYSTEM CONTEXT] ${msg.content}` }]
          };
        }
        return {
          role: msg.role === Role.USER ? 'user' : 'model',
          parts: [{ text: msg.content }]
        };
      });

    case AIProvider.OPENAI:
    case AIProvider.CUSTOM:
      return messages.map(msg => ({
        role: msg.role, // OpenAI supports system, user, and assistant roles
        content: msg.content
      }));

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Generate streaming response from current model
 */
export async function* generateResponse(
  messages: Message[],
  prompt: string,
  files: File[] = [],
  useWebSearch: boolean = false
): AsyncGenerator<{ text?: string; sources?: any[] }> {
  if (!currentModelConfig) {
    throw new Error('No model selected. Please select a model first.');
  }

  const { provider, providerConfig } = currentModelConfig;
  const instance = getProviderInstance(providerConfig);

  // Add current prompt to messages
  const allMessages = [...messages, { role: Role.USER, content: prompt }];
  
  // Add current date context to help the AI provide accurate time-sensitive information
  const currentDate = new Date();
  const dateContext = `Current date and time: ${currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })} (${currentDate.toISOString().split('T')[0]})`;

  // Add web search capability context if enabled
  const webSearchContext = useWebSearch && provider === AIProvider.GEMINI
    ? "IMPORTANT: You have access to real-time web search capabilities through Google Search. When users ask about current events, recent news, weather, stock prices, or any time-sensitive information, you WILL automatically search the web to provide up-to-date and accurate information. Do not say you cannot access real-time information - you can and should use web search to answer current questions. Always provide the most recent and accurate information available through web search."
    : "";

  // Insert context as system messages
  const systemMessages = [
    { role: Role.SYSTEM, content: dateContext },
    ...(webSearchContext ? [{ role: Role.SYSTEM, content: webSearchContext }] : [])
  ];

  const messagesWithDateContext = [
    ...systemMessages,
    ...allMessages
  ];
  
  const convertedMessages = convertMessages(messagesWithDateContext, provider);

  console.log(`🚀 Generating response with ${provider} model: ${currentModelConfig.name}`);
  console.log(`📝 Message count: ${convertedMessages.length}`);
  console.log(`📎 File count: ${files.length}`);
  console.log(`🔍 Web search enabled: ${useWebSearch}`);

  if (useWebSearch) {
    const activeSearchProvider = getActiveSearchProvider();
    console.log(`🔍 Active search provider: ${activeSearchProvider.provider}`);
    if (provider === AIProvider.GEMINI) {
      console.log(`🤖 Using Gemini built-in web search with Google Search Retrieval tool`);
    } else {
      console.log(`🌐 Using external search provider: ${activeSearchProvider.provider}`);
    }
  }

  try {
    switch (provider) {
      case AIProvider.GEMINI:
        try {
          yield* generateGeminiResponse(instance as GoogleGenAI, convertedMessages, useWebSearch);
        } catch (error) {
          if (useWebSearch && error instanceof Error && error.message.includes('googleSearchRetrieval')) {
            console.warn('⚠️ Web search failed, retrying without web search...');
            yield* generateGeminiResponse(instance as GoogleGenAI, convertedMessages, false);
          } else {
            throw error;
          }
        }
        break;

      case AIProvider.OPENAI:
      case AIProvider.CUSTOM:
        yield* generateOpenAIResponse(instance as OpenAI, convertedMessages, useWebSearch);
        break;

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    console.error(`❌ Error generating response with ${provider}:`, error);
    throw error;
  }
}

/**
 * Generate response using Gemini
 */
async function* generateGeminiResponse(
  ai: GoogleGenAI,
  messages: any[],
  useWebSearch: boolean
): AsyncGenerator<{ text?: string; sources?: any[] }> {
  const modelId = currentModelConfig!.providerConfig.models.find(m => 
    currentModelConfig!.id.includes(m)
  ) || currentModelConfig!.providerConfig.models[0];

  const generationConfig = {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 8192,
  };

  // Configure web search tool based on official documentation
  // Check if model supports Google Search tool
  const supportsGoogleSearch = modelId.includes('2.5') || modelId.includes('2.0') || modelId.includes('1.5');

  let tools = undefined;
  if (useWebSearch) {
    if (supportsGoogleSearch) {
      // Use camelCase format for JavaScript SDK as per official documentation
      tools = [{ googleSearch: {} }];
      console.log(`✅ Model ${modelId} supports Google Search tool`);
    } else {
      console.warn(`⚠️ Model ${modelId} may not support Google Search tool`);
      tools = [{ googleSearch: {} }]; // Try anyway
    }
  }

  console.log(`🔍 Gemini request configured with web search: ${useWebSearch}`);
  if (useWebSearch) {
    console.log(`🛠️ Using googleSearch tool for model: ${modelId}`);
    console.log(`📋 Tools config:`, tools);
  }

  // Use the new SDK format for generateContentStream
  const streamPromise = ai.models.generateContentStream({
    model: modelId,
    contents: messages,
    config: {
      ...generationConfig,
      tools: tools,
    }
  });

  console.log(`📋 Full request object:`, JSON.stringify({
    model: modelId,
    contents: messages,
    config: {
      ...generationConfig,
      tools: tools,
    }
  }, null, 2));

  const stream = await streamPromise;

  for await (const chunk of stream) {
    // Log the entire chunk structure for debugging
    console.log(`📦 Raw chunk received:`, chunk);
    console.log(`📦 Chunk candidates:`, chunk.candidates);
    console.log(`📦 First candidate:`, chunk.candidates?.[0]);
    console.log(`📦 Grounding metadata:`, chunk.candidates?.[0]?.groundingMetadata);

    const text = chunk.text;
    if (text && text.trim()) {
      yield { text };
    }

    // Handle grounding metadata for web search based on official API documentation
    // Check multiple possible locations for grounding metadata
    const candidate = (chunk as any).candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata || (chunk as any).groundingMetadata;

    if (groundingMetadata) {
      console.log(`🔍 Grounding metadata found:`, groundingMetadata);

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
        console.log(`📚 Extracted ${sources.length} web sources from grounding metadata:`, sources);
        yield { sources };
      } else {
        console.log(`⚠️ Grounding metadata present but no extractable sources found`);
      }
    }
  }

  // Check for grounding metadata in the final response
  console.log(`🏁 Stream completed. Checking for final grounding metadata...`);
  try {
    const response = await stream;
    if (response && (response as any).candidates?.[0]?.groundingMetadata) {
      const finalGroundingMetadata = (response as any).candidates[0].groundingMetadata;
      console.log(`🔍 Final grounding metadata found:`, finalGroundingMetadata);

      if (finalGroundingMetadata.groundingChunks) {
        const finalSources = finalGroundingMetadata.groundingChunks
          .map((chunk: any) => {
            if (chunk.web) {
              return {
                title: chunk.web.title || 'Web Source',
                uri: chunk.web.uri || '#',
                snippet: chunk.web.snippet || ''
              };
            }
            return null;
          })
          .filter(Boolean);

        if (finalSources.length > 0) {
          console.log(`📚 Final sources extracted:`, finalSources);
          yield { sources: finalSources };
        }
      }
    }
  } catch (error) {
    console.log(`⚠️ Could not check final response for grounding metadata:`, error);
  }
}

/**
 * Generate response using OpenAI
 */
async function* generateOpenAIResponse(
  ai: OpenAI,
  messages: any[],
  useWebSearch: boolean = false
): AsyncGenerator<{ text?: string; sources?: any[] }> {
  const modelId = currentModelConfig!.providerConfig.models.find(m => 
    currentModelConfig!.id.includes(m)
  ) || currentModelConfig!.providerConfig.models[0];

  let searchResults: SearchResult[] = [];
  let enhancedMessages = [...messages];

  // Perform web search if requested and not using Gemini built-in search
  if (useWebSearch) {
    const activeSearchProvider = getActiveSearchProvider();
    
    if (activeSearchProvider.provider !== SearchProvider.GEMINI) {
      try {
        // Find the last user message
        const userMessages = messages.filter(m => m.role === 'user');
        const lastUserMessage = userMessages[userMessages.length - 1];
        
        if (lastUserMessage?.content) {
          console.log(`🔍 Performing web search for: "${lastUserMessage.content}"`);
          const searchResponse = await performWebSearch(lastUserMessage.content);
          searchResults = searchResponse.results;
          
          if (searchResults.length > 0) {
            // Add search context to the conversation with clear instructions including current date
            const currentDate = new Date();
            const searchContext = `IMPORTANT: Web search has been performed and current information is available below. You DO have access to recent web search results for this query. Please use this information to provide a comprehensive, up-to-date answer.

CURRENT DATE: ${currentDate.toLocaleDateString('en-US', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})} (${currentDate.toISOString().split('T')[0]})

🔍 SEARCH RESULTS FOR: "${lastUserMessage.content}"

${searchResults.map((result, index) => 
  `${index + 1}. **${result.title}**
   Summary: ${result.snippet}
   Source: ${result.url}
   `
).join('\n')}

Based on these search results and the current date above, please provide a detailed and current response. Do not claim you lack browsing access - you have current web information above.`;

            // Insert search context before the last user message
            enhancedMessages = [
              ...messages.slice(0, -1),
              { role: Role.SYSTEM, content: searchContext },
              lastUserMessage
            ];
            
            console.log(`✅ Added ${searchResults.length} search results to context`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Web search failed, proceeding without search results:', error);
      }
    }
  }

  // Check if this provider has known streaming issues
  const hasStreamingIssues = modelId.includes('hyperbolic') || modelId.includes('gpt-oss');
  const useStreaming = !hasStreamingIssues;

  if (hasStreamingIssues) {
    console.log('⚡ Using non-streaming mode for provider with known streaming issues');
  }

  try {
    if (useStreaming) {
      // Handle streaming response
      const stream = await ai.chat.completions.create({
        model: modelId,
        messages: enhancedMessages,
        stream: true,
        max_tokens: 4096,
        temperature: 0.7,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield { text: content };
        }
      }
    } else {
      // Handle non-streaming response
      const response = await ai.chat.completions.create({
        model: modelId,
        messages: enhancedMessages,
        stream: false,
        max_tokens: 4096,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        yield { text: content };
      }
    }
    
    // Yield search sources at the end if we have any
    if (searchResults.length > 0) {
      yield { 
        sources: searchResults.map(result => ({
          title: result.title,
          uri: result.url,
          snippet: result.snippet
        }))
      };
    }
    
  } catch (error) {
    console.error('❌ OpenAI streaming error:', error);
    
    // Special handling for specific provider issues
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('JSON') && modelId.includes('hyperbolic')) {
      console.warn('⚠️ Hyperbolic API streaming format issue detected, using non-streaming mode');
    }
    
    // If streaming fails, try non-streaming as fallback
    try {
      console.log('🔄 Falling back to non-streaming response...');
      const response = await ai.chat.completions.create({
        model: modelId,
        messages: enhancedMessages,
        stream: false,
        max_tokens: 4096,
        temperature: 0.7,
      });
      
      const content = response.choices[0]?.message?.content;
      if (content) {
        yield { text: content };
        
        // Yield search sources if we have any
        if (searchResults.length > 0) {
          yield { 
            sources: searchResults.map(result => ({
              title: result.title,
              uri: result.url,
              snippet: result.snippet
            }))
          };
        }
      }
    } catch (fallbackError) {
      console.error('❌ Non-streaming fallback also failed:', fallbackError);
      
      // Provide helpful error message for common issues
      const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      
      if (fallbackMessage.includes('500')) {
        yield { text: `⚠️ The ${modelId} model is currently experiencing server issues (500 error). This appears to be a temporary problem with the API provider. Please try again later or switch to a different model.` };
      } else if (fallbackMessage.includes('rate limit')) {
        yield { text: `⚠️ Rate limit exceeded for ${modelId}. Please wait a moment before trying again.` };
      } else if (fallbackMessage.includes('authentication') || fallbackMessage.includes('401')) {
        yield { text: `⚠️ Authentication error with ${modelId}. Please check your API key configuration.` };
      } else {
        yield { text: `⚠️ Error communicating with ${modelId}: ${fallbackMessage}` };
      }
    }
  }
}

/**
 * Generate title for conversation
 */
export async function generateTitle(userPrompt: string): Promise<string> {
  if (!currentModelConfig) {
    throw new Error('No model selected for title generation');
  }

  const { provider, providerConfig } = currentModelConfig;
  const instance = getProviderInstance(providerConfig);

  const titlePrompt = `Generate a concise, 5-word-or-less title for the following user prompt. Speak in the same language as the prompt. Do not include quotes, asterisks, or any other formatting.

Prompt: "${userPrompt}"

Title:`;

  try {
    console.log(`🏷️ Generating title with ${provider} model`);

    switch (provider) {
      case AIProvider.GEMINI:
        return generateGeminiTitle(instance as GoogleGenAI, titlePrompt);

      case AIProvider.OPENAI:
      case AIProvider.CUSTOM:
        return generateOpenAITitle(instance as OpenAI, titlePrompt);

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    console.error(`❌ Title generation failed with ${provider}:`, error);
    return userPrompt.substring(0, 40).trim() + '...';
  }
}

async function generateGeminiTitle(ai: GoogleGenAI, prompt: string): Promise<string> {
  const modelId = currentModelConfig!.providerConfig.models[0];
  
  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
  });
  
  const title = response.text?.trim().replace(/["*]/g, '') || 'Untitled Chat';
  return title;
}

async function generateOpenAITitle(ai: OpenAI, prompt: string): Promise<string> {
  const modelId = currentModelConfig!.providerConfig.models[0];
  
  const response = await ai.chat.completions.create({
    model: modelId,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 20,
    temperature: 0.5,
  });
  
  const title = response.choices[0]?.message?.content?.trim().replace(/["*]/g, '') || 'Untitled Chat';
  return title;
}

/**
 * Test model availability
 */
export async function testModelAvailability(modelConfig: ModelConfig): Promise<{ available: boolean; error?: string }> {
  try {
    console.log(`🧪 Testing model: ${modelConfig.name}`);
    
    const { provider, providerConfig } = modelConfig;
    const instance = getProviderInstance(providerConfig);

    switch (provider) {
      case AIProvider.GEMINI:
        await testGeminiModel(instance as GoogleGenAI, modelConfig);
        break;

      case AIProvider.OPENAI:
      case AIProvider.CUSTOM:
        await testOpenAIModel(instance as OpenAI, modelConfig);
        break;

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    console.log(`✅ Model ${modelConfig.name} is available`);
    return { available: true };
  } catch (error) {
    console.error(`❌ Model ${modelConfig.name} test failed:`, error);
    return { 
      available: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

async function testGeminiModel(ai: GoogleGenAI, modelConfig: ModelConfig) {
  const modelId = modelConfig.providerConfig.models.find(m => 
    modelConfig.id.includes(m)
  ) || modelConfig.providerConfig.models[0];

  const response = await ai.models.generateContent({
    model: modelId,
    contents: "Hi",
  });

  if (!response.text) {
    throw new Error("No response from model");
  }
}

async function testOpenAIModel(ai: OpenAI, modelConfig: ModelConfig) {
  const modelId = modelConfig.providerConfig.models.find(m => 
    modelConfig.id.includes(m)
  ) || modelConfig.providerConfig.models[0];

  console.log(`🧪 Testing OpenAI-compatible model: ${modelId}`);
  console.log(`🔧 Provider config:`, {
    baseUrl: modelConfig.providerConfig.baseUrl,
    provider: modelConfig.providerConfig.provider,
    hasApiKey: !!modelConfig.providerConfig.apiKey
  });

  const response = await ai.chat.completions.create({
    model: modelId,
    messages: [{ role: 'user', content: 'Hi' }],
    max_tokens: 10,
  });

  if (!response.choices[0]?.message?.content) {
    throw new Error("No response from model");
  }
}
