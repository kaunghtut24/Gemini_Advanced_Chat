/**
 * Vercel API Route: SerpAPI Proxy
 * File: /api/search/serpapi.js
 * 
 * This route proxies requests to SerpAPI to avoid CORS issues
 * when calling SerpAPI directly from the browser.
 */

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { query, apiKey } = req.body;

    if (!query || !apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Query and API key are required'
      });
    }

    // Build SerpAPI request URL
    const params = new URLSearchParams({
      engine: 'google',
      q: query,
      api_key: apiKey,
      num: '5',
      hl: 'en',
      gl: 'us'
    });

    const serpApiUrl = `https://serpapi.com/search?${params}`;

    console.log('🔍 Proxying SerpAPI request:', query);

    // Make request to SerpAPI
    const response = await fetch(serpApiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Gemini Advanced Chat UI/1.0'
      }
    });

    if (!response.ok) {
      console.error('❌ SerpAPI request failed:', response.status, response.statusText);
      return res.status(response.status).json({
        success: false,
        message: `SerpAPI request failed: ${response.status} ${response.statusText}`
      });
    }

    const data = await response.json();

    // Check for SerpAPI errors
    if (data.error) {
      console.error('❌ SerpAPI error:', data.error);
      return res.status(400).json({
        success: false,
        message: `SerpAPI error: ${data.error}`
      });
    }

    // Transform the response to our standard format
    const results = data.organic_results?.map((result) => ({
      title: result.title || '',
      url: result.link || '',
      snippet: result.snippet || '',
      publishedDate: result.date
    })) || [];

    console.log(`✅ SerpAPI returned ${results.length} results`);

    return res.status(200).json({
      success: true,
      data: {
        query,
        results
      }
    });

  } catch (error) {
    console.error('❌ SerpAPI proxy error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
