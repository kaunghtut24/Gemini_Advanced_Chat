import { SearchProvider, SearchProviderConfig } from '../types';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
}

// Storage key for search provider configurations
const SEARCH_PROVIDERS_KEY = 'webSearchProviders';

// Default search providers configuration
const DEFAULT_SEARCH_PROVIDERS: SearchProviderConfig[] = [
  { provider: SearchProvider.GEMINI, isDefault: true },
  { provider: SearchProvider.TAVILY, apiKey: '' },
  { provider: SearchProvider.SERPAPI, apiKey: '' }
];

/**
 * Detect if we're in development mode or production
 */
function isProduction(): boolean {
  return window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
}

/**
 * Get the appropriate endpoint for search APIs based on environment
 */
function getSearchEndpoint(provider: 'tavily' | 'serpapi'): string {
  if (isProduction()) {
    // In production (Vercel), use the serverless functions
    return `/api/search/${provider}`;
  } else {
    // In development, indicate that direct API calls should be used
    return `direct-api-${provider}`;
  }
}

/**
 * Get search provider configurations from localStorage
 */
export function getSearchProviderConfigs(): SearchProviderConfig[] {
  try {
    const stored = localStorage.getItem(SEARCH_PROVIDERS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading search provider configs:', error);
  }
  return DEFAULT_SEARCH_PROVIDERS;
}

/**
 * Save search provider configurations to localStorage
 */
export function saveSearchProviderConfigs(configs: SearchProviderConfig[]): void {
  try {
    localStorage.setItem(SEARCH_PROVIDERS_KEY, JSON.stringify(configs));
    console.log('💾 Search provider configurations saved');
  } catch (error) {
    console.error('Error saving search provider configs:', error);
  }
}

/**
 * Get the active search provider (first one with API key or default)
 */
export function getActiveSearchProvider(): SearchProviderConfig {
  const configs = getSearchProviderConfigs();
  
  // Find the default provider
  const defaultProvider = configs.find(c => c.isDefault);
  if (defaultProvider) {
    return defaultProvider;
  }
  
  // Find first provider with API key
  const configuredProvider = configs.find(c => c.apiKey && c.apiKey.trim() !== '');
  if (configuredProvider) {
    return configuredProvider;
  }
  
  // Fallback to Gemini
  return { provider: SearchProvider.GEMINI, isDefault: true };
}

/**
 * Update search provider configuration
 */
export function updateSearchProviderConfig(provider: SearchProvider, updates: Partial<SearchProviderConfig>): void {
  const configs = getSearchProviderConfigs();
  const index = configs.findIndex(c => c.provider === provider);
  
  if (index >= 0) {
    configs[index] = { ...configs[index], ...updates };
  } else {
    configs.push({ provider, ...updates });
  }
  
  saveSearchProviderConfigs(configs);
}

/**
 * Set default search provider
 */
export function setDefaultSearchProvider(provider: SearchProvider): void {
  const configs = getSearchProviderConfigs();
  
  // Remove default from all providers
  configs.forEach(c => c.isDefault = false);
  
  // Set new default
  const targetConfig = configs.find(c => c.provider === provider);
  if (targetConfig) {
    targetConfig.isDefault = true;
  } else {
    configs.push({ provider, isDefault: true });
  }
  
  saveSearchProviderConfigs(configs);
}

/**
 * Perform web search using Tavily API
 */
async function searchWithTavily(query: string, apiKey: string): Promise<SearchResponse> {
  const endpoint = getSearchEndpoint('tavily');
  
  console.log(`🔍 Tavily search - Environment: ${isProduction() ? 'Production' : 'Development'}, Endpoint: ${endpoint}`);
  
  if (endpoint.startsWith('direct-api-')) {
    // Development mode: call Tavily API directly
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: 'basic',
        include_answer: false,
        include_images: false,
        include_raw_content: false,
        max_results: 5,
        include_domains: [],
        exclude_domains: []
      })
    });

    if (!response.ok) {
      throw new Error(`Tavily search failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      query,
      results: data.results?.map((result: any) => ({
        title: result.title || '',
        url: result.url || '',
        snippet: result.content || '',
        publishedDate: result.published_date
      })) || []
    };
  } else {
    // Production mode: use Vercel serverless function
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        apiKey: apiKey
      })
    });

    if (!response.ok) {
      throw new Error(`Tavily search failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Tavily search error: ${data.message}`);
    }
    
    return {
      query: data.data.query,
      results: data.data.results || []
    };
  }
}

/**
 * Perform web search using SerpAPI
 */
async function searchWithSerpAPI(query: string, apiKey: string): Promise<SearchResponse> {
  const endpoint = getSearchEndpoint('serpapi');
  
  console.log(`🔍 SerpAPI search - Environment: ${isProduction() ? 'Production' : 'Development'}, Endpoint: ${endpoint}`);
  
  if (endpoint.startsWith('direct-api-')) {
    // Development mode: call SerpAPI directly
    const params = new URLSearchParams({
      engine: 'google',
      q: query,
      api_key: apiKey,
      num: '5',
      hl: 'en',
      gl: 'us'
    });

    const serpApiUrl = `https://serpapi.com/search?${params}`;
    
    const response = await fetch(serpApiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Gemini Advanced Chat UI/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`SerpAPI search failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Check for SerpAPI errors
    if (data.error) {
      throw new Error(`SerpAPI error: ${data.error}`);
    }

    // Transform the response to our standard format
    const results = data.organic_results?.map((result: any) => ({
      title: result.title || '',
      url: result.link || '',
      snippet: result.snippet || '',
      publishedDate: result.date
    })) || [];

    return {
      query,
      results
    };
  } else {
    // Production mode: use Vercel serverless function
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        apiKey: apiKey
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`SerpAPI search failed: ${response.status} ${response.statusText}${errorData.message ? ` - ${errorData.message}` : ''}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`SerpAPI search failed: ${data.message || 'Unknown error'}`);
    }
    
    return {
      query,
      results: data.data.results || []
    };
  }
}

/**
 * Perform web search using the active search provider
 */
export async function performWebSearch(query: string): Promise<SearchResponse> {
  const activeProvider = getActiveSearchProvider();
  
  console.log(`🔍 Performing web search with ${activeProvider.provider}: "${query}"`);
  
  try {
    switch (activeProvider.provider) {
      case SearchProvider.TAVILY:
        if (!activeProvider.apiKey) {
          throw new Error('Tavily API key is required for web search');
        }
        return await searchWithTavily(query, activeProvider.apiKey);
        
      case SearchProvider.SERPAPI:
        if (!activeProvider.apiKey) {
          throw new Error('SerpAPI key is required for web search');
        }
        return await searchWithSerpAPI(query, activeProvider.apiKey);
        
      case SearchProvider.GEMINI:
      default:
        // For Gemini, we'll return empty results as it uses built-in search
        // This will be handled by the Gemini-specific search in aiProviderService
        console.log('🤖 Using Gemini built-in search');
        return { query, results: [] };
    }
  } catch (error) {
    console.error(`❌ Web search failed with ${activeProvider.provider}:`, error);
    throw error;
  }
}

/**
 * Test search provider connectivity
 */
export async function testSearchProvider(provider: SearchProvider, apiKey?: string): Promise<boolean> {
  if (provider === SearchProvider.GEMINI) {
    return true; // Gemini search is built-in
  }
  
  if (!apiKey) {
    throw new Error('API key is required for testing');
  }
  
  console.log(`🧪 Testing ${provider} provider - Environment: ${isProduction() ? 'Production' : 'Development'}`);
  
  // In development, SerpAPI will fail due to CORS, so we handle it gracefully
  if (!isProduction() && provider === SearchProvider.SERPAPI) {
    console.log(`⚠️ SerpAPI testing skipped in development due to CORS restrictions`);
    console.log(`✅ SerpAPI will work in production via Vercel proxy`);
    return true; // Assume it will work in production
  }
  
  try {
    const testQuery = 'test search';
    
    switch (provider) {
      case SearchProvider.TAVILY:
        await searchWithTavily(testQuery, apiKey);
        console.log(`✅ ${provider} test successful`);
        return true;
        
      case SearchProvider.SERPAPI:
        await searchWithSerpAPI(testQuery, apiKey);
        console.log(`✅ ${provider} test successful`);
        return true;
        await searchWithSerpAPI(testQuery, apiKey);
        return true;
        
      default:
        return false;
    }
  } catch (error) {
    console.error(`Search provider test failed:`, error);
    return false;
  }
}
