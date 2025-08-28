/**
 * Vercel API Route: Tavily API Proxy
 * File: /api/search/tavily.js
 * 
 * This route proxies requests to Tavily API to avoid CORS issues
 * when calling Tavily API directly from the browser.
 */

export default async function handler(req, res) {
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

    console.log('🔍 Proxying Tavily API request:', query);

    // Make request to Tavily API
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "basic",
        include_answer: false,
        include_images: false,
        include_raw_content: false,
        max_results: 5
      })
    });

    if (!response.ok) {
      console.error('❌ Tavily API request failed:', response.status, response.statusText);
      return res.status(response.status).json({
        success: false,
        message: `Tavily API request failed: ${response.status} ${response.statusText}`
      });
    }

    const data = await response.json();

    // Check for Tavily API errors
    if (data.error) {
      console.error('❌ Tavily API error:', data.error);
      return res.status(400).json({
        success: false,
        message: `Tavily API error: ${data.error}`
      });
    }

    // Transform the response to our standard format
    const results = data.results?.map((result) => ({
      title: result.title || '',
      url: result.url || '',
      snippet: result.content || '',
      publishedDate: result.published_date
    })) || [];

    console.log(`✅ Tavily API returned ${results.length} results`);

    return res.status(200).json({
      success: true,
      data: {
        query,
        results
      }
    });

  } catch (error) {
    console.error('❌ Tavily API proxy error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
