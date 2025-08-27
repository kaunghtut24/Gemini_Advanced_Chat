import { GoogleGenAI } from "@google/genai";

// Function to get GoogleGenAI instance with proper API key
function getGoogleGenAI(apiKey?: string): GoogleGenAI {
  const envApiKey = import.meta.env.VITE_API_KEY;
  const keyToUse = apiKey || envApiKey;
  
  if (!keyToUse) {
    throw new Error('No API key provided. Please set VITE_API_KEY environment variable or provide an API key in settings.');
  }
  
  return new GoogleGenAI({ apiKey: keyToUse });
}

export interface ModelTestResult {
  model: string;
  available: boolean;
  responseTime?: number;
  response?: string;
  error?: string;
  details?: any;
}

const MODELS_TO_TEST = [
  'gemini-2.5-flash',
  'gemini-2.5-pro', 
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

const TEST_QUERY = "Hi";

/**
 * Test a single model with a minimal query
 */
export async function testSingleModel(model: string, apiKey?: string): Promise<ModelTestResult> {
  console.log(`🧪 Testing model: ${model}`);
  const startTime = Date.now();
  const ai = getGoogleGenAI(apiKey);
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: TEST_QUERY,
    });
    
    const responseTime = Date.now() - startTime;
    const responseText = response.text?.trim();
    
    if (responseText) {
      console.log(`✅ ${model}: SUCCESS (${responseTime}ms) - "${responseText.substring(0, 50)}..."`);
      return {
        model,
        available: true,
        responseTime,
        response: responseText,
      };
    } else {
      console.log(`❌ ${model}: No response text`);
      return {
        model,
        available: false,
        error: "No response text received",
        responseTime,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log(`❌ ${model}: ERROR (${responseTime}ms) -`, error);
    
    let errorMessage = "Unknown error";
    let details = undefined;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      details = {
        name: error.name,
        stack: error.stack,
      };
    }
    
    return {
      model,
      available: false,
      error: errorMessage,
      responseTime,
      details,
    };
  }
}

/**
 * Test all available models
 */
export async function testAllModels(apiKey?: string): Promise<ModelTestResult[]> {
  console.log(`🚀 Starting comprehensive model test...`);
  console.log(`📝 Test query: "${TEST_QUERY}"`);
  console.log(`🎯 Models to test: ${MODELS_TO_TEST.join(', ')}`);
  console.log(`⏰ Started at: ${new Date().toLocaleTimeString()}`);
  console.log('─'.repeat(60));
  
  const results: ModelTestResult[] = [];
  
  for (const model of MODELS_TO_TEST) {
    try {
      const result = await testSingleModel(model, apiKey);
      results.push(result);
      
      // Small delay between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`💥 Critical error testing ${model}:`, error);
      results.push({
        model,
        available: false,
        error: error instanceof Error ? error.message : "Critical test failure",
      });
    }
  }
  
  console.log('─'.repeat(60));
  console.log(`✨ Test completed at: ${new Date().toLocaleTimeString()}`);
  
  // Summary
  const available = results.filter(r => r.available);
  const unavailable = results.filter(r => !r.available);
  
  console.log(`📊 SUMMARY:`);
  console.log(`   ✅ Available models: ${available.length}/${results.length}`);
  console.log(`   ❌ Unavailable models: ${unavailable.length}/${results.length}`);
  
  if (available.length > 0) {
    console.log(`\n🎉 Working models:`);
    available.forEach(r => {
      console.log(`   • ${r.model} (${r.responseTime}ms)`);
    });
  }
  
  if (unavailable.length > 0) {
    console.log(`\n⚠️  Failed models:`);
    unavailable.forEach(r => {
      console.log(`   • ${r.model}: ${r.error}`);
    });
  }
  
  return results;
}

/**
 * Test streaming functionality for a specific model
 */
export async function testModelStreaming(model: string, apiKey?: string): Promise<ModelTestResult> {
  console.log(`🌊 Testing streaming for model: ${model}`);
  const startTime = Date.now();
  const ai = getGoogleGenAI(apiKey);
  
  try {
    let chunks = 0;
    let fullResponse = "";
    
    const stream = await ai.models.generateContentStream({
      model,
      contents: "Count from 1 to 5",
    });
    
    for await (const chunk of stream) {
      if (chunk.text) {
        chunks++;
        fullResponse += chunk.text;
      }
    }
    
    const responseTime = Date.now() - startTime;
    
    if (chunks > 0) {
      console.log(`✅ ${model} streaming: SUCCESS (${chunks} chunks, ${responseTime}ms)`);
      return {
        model,
        available: true,
        responseTime,
        response: fullResponse.trim(),
        details: { chunks, streamingTest: true },
      };
    } else {
      console.log(`❌ ${model} streaming: No chunks received`);
      return {
        model,
        available: false,
        error: "No streaming chunks received",
        responseTime,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log(`❌ ${model} streaming: ERROR (${responseTime}ms) -`, error);
    
    return {
      model,
      available: false,
      error: error instanceof Error ? error.message : "Streaming test failed",
      responseTime,
      details: { streamingTest: true },
    };
  }
}

/**
 * Run comprehensive tests including regular and streaming
 */
export async function runComprehensiveTest(apiKey?: string): Promise<{
  regular: ModelTestResult[];
  streaming: ModelTestResult[];
}> {
  console.log(`🔬 COMPREHENSIVE MODEL TESTING`);
  console.log(`═`.repeat(60));
  
  // Test regular generation
  console.log(`\n📝 PHASE 1: Regular Generation Test`);
  const regularResults = await testAllModels(apiKey);
  
  // Test streaming for available models
  console.log(`\n🌊 PHASE 2: Streaming Test`);
  const streamingResults: ModelTestResult[] = [];
  
  const availableModels = regularResults.filter(r => r.available).map(r => r.model);
  
  if (availableModels.length > 0) {
    console.log(`Testing streaming for available models: ${availableModels.join(', ')}`);
    
    for (const model of availableModels) {
      const streamResult = await testModelStreaming(model, apiKey);
      streamingResults.push(streamResult);
      
      // Small delay between streaming tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } else {
    console.log(`⚠️  No models available for streaming test`);
  }
  
  console.log(`\n═`.repeat(60));
  console.log(`🎯 COMPREHENSIVE TEST COMPLETE`);
  
  return {
    regular: regularResults,
    streaming: streamingResults,
  };
}
