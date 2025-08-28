# Gemini Advanced Chat UI

A powerful, responsive chat application with multi-provider AI support and advanced web search capabilities. Connect to Google Gemini, OpenAI, or any OpenAI-compatible provider for streaming conversations with real-time web search integration. Built with React, TypeScript, and Vite for optimal performance and developer experience.

## ✨ Features

### Multi-Provider AI Support
-   **Google Gemini:** Native integration with Google's advanced AI models
-   **OpenAI Integration:** Support for GPT-4, GPT-3.5-turbo, and other OpenAI models
-   **Custom Providers:** Connect to any OpenAI-compatible API with configurable base URLs
-   **Dynamic Model Support:** Add custom model names for specialized AI providers
-   **Flexible API Key Management:** Per-provider API key configuration with secure local storage
-   **Real-time Streaming:** Get instant, word-by-word responses from all supported providers

### Advanced Web Search Integration
-   **Multiple Search Providers:** Choose from Google Search (via Gemini), Tavily, or SerpAPI
-   **Universal Search Support:** Web search works with all AI providers, including custom models
-   **Intelligent Context Injection:** Search results are automatically included in AI conversations
-   **Source Attribution:** Responses include links to search sources for verification
-   **Configurable Search:** Toggle web search on/off and switch between search providers
-   **CORS-Free Integration:** Serverless proxy functions ensure seamless search API access

### Intelligent Conversation
-   **Markdown Rendering:** Model responses are parsed as Markdown, with syntax highlighting and a "Copy" button for code blocks
-   **Multimodal Input:** Attach supported files to your prompts for rich, contextual conversations
-   **File Type Validation:** Automatic validation ensures only supported file formats are uploaded
-   **Copy Response:** Copy AI responses with proper formatting for word processors - converts markdown to readable plain text while preserving structure
-   **Provider Switching:** Seamlessly switch between AI providers mid-conversation

### Advanced Session Management
-   **Persistent Chat History:** Conversations are automatically saved to your browser's local storage
-   **Multi-Session Interface:** Manage multiple conversations in a clean sidebar. You can create, switch between, rename, and delete chats
-   **Automatic Conversation Titling:** New chats are automatically given a concise title based on your first message
-   **Import & Export:** Save any chat session as a JSON file for backup or transfer, and import it back into the app at any time
-   **Cross-Provider Sessions:** Continue conversations across different AI providers

### Supported File Types
The application validates and supports the following file formats for upload:
- **Images:** JPEG, JPG, PNG, WebP, HEIC, HEIF
- **Documents:** PDF
- **Audio:** WAV, MP3, MPEG, AIFF, AAC, OGG, FLAC
- **Video:** MP4, MPEG, MOV, AVI, FLV, MPG, WEBM, WMV, 3GPP

### Polished User Experience
-   **Modern UI:** Clean, beautiful, and fully responsive chat interface that looks great on any device.
-   **"Thinking" Indicator:** A subtle animation shows when the AI is generating a response.
-   **Auto-growing Textarea:** The message input box expands as you type for a seamless user experience.
-   **Copy Functions:** Copy individual code blocks or entire responses formatted for word processors.
-   **Error Handling:** Comprehensive error messages with helpful guidance for different error scenarios.
-   **Favicon Support:** Includes proper favicon configuration for better browser integration.

### Developer Friendly
-   **Built with Vite:** Fast development and build process.
-   **TypeScript:** Full type safety throughout the application.
-   **React Hooks Compliance:** Follows React best practices and hooks rules.
-   **No setState During Render:** Optimized state management to prevent React warnings.

## 🛠️ Tech Stack

-   **Frontend:** [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
-   **AI Providers:** 
    -   [Google Gemini API](https://ai.google.dev/gemini-api) via [`@google/genai`](https://www.npmjs.com/package/@google/genai) SDK
    -   [OpenAI API](https://openai.com/api/) via [`openai`](https://www.npmjs.com/package/openai) SDK
    -   OpenAI-compatible providers (Anthropic, Together AI, etc.)
-   **Web Search:** 
    -   [Tavily API](https://tavily.com/) for web search
    -   [SerpAPI](https://serpapi.com/) for Google search results
    -   Google Search via Gemini integration
-   **Deployment:** [Vercel](https://vercel.com/) with serverless functions for CORS-free API proxying
-   **Markdown:** [Marked](https://marked.js.org/) for parsing, [DOMPurify](https://github.com/cure53/DOMPurify) for sanitization
-   **Styling:** Custom CSS (Mobile-first responsive design)

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

-   Node.js (version 16 or higher)
-   npm or yarn package manager
-   **AI Provider API Keys** (at least one required):
    -   [Google Gemini API key](https://makersuite.google.com/app/apikey) for Gemini models
    -   [OpenAI API key](https://platform.openai.com/api-keys) for GPT models
    -   API key for your preferred OpenAI-compatible provider
-   **Web Search API Keys** (optional but recommended):
    -   [Tavily API key](https://tavily.com/) for enhanced web search
    -   [SerpAPI key](https://serpapi.com/) for Google search results

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/kaunghtut24/Gemini_Advanced_Chat.git
    cd Gemini_Advanced_Chat
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up your primary API key:**
    Create a `.env.local` file in the root directory and add your primary Gemini API key:
    ```
    VITE_API_KEY=your_gemini_api_key_here
    ```
    **Note:** Additional API keys for other providers and web search can be configured through the Settings UI after starting the application.

### Running the Application

1.  **Start the development server:**
    ```bash
    npm run dev
    ```

2.  **Open in your browser:**
    -   The application will be available at `http://localhost:5173`
    -   Go to Settings (⚙️ icon) to configure additional AI providers and web search
    -   You can now start chatting with any configured AI model!

### Deploying to Vercel

This application is optimized for Vercel deployment with serverless functions:

1.  **Build and deploy:**
    ```bash
    npm run build
    vercel --prod
    ```

2.  **Configure environment variables in Vercel:**
    -   `GEMINI_API_KEY`: Your Google Gemini API key
    -   Additional API keys can be configured through the app's Settings UI

3.  **Features in production:**
    -   All web search providers work seamlessly via serverless proxy functions
    -   CORS issues are automatically handled
    -   Multi-provider AI support is fully functional

### Building for Production

1.  **Build the application:**
    ```bash
    npm run build
    ```

2.  **Preview the production build:**
    ```bash
    npm run preview
    ```

## 🔧 Configuration

### AI Providers Setup

Navigate to **Settings → AI Providers** to configure multiple AI providers:

#### Google Gemini
-   Uses your `VITE_API_KEY` environment variable
-   Supports all Gemini models (gemini-1.5-pro, gemini-1.5-flash, etc.)
-   Includes built-in web search capabilities

#### OpenAI
-   **API Key:** Your OpenAI API key
-   **Base URL:** `https://api.openai.com/v1` (default)
-   **Models:** gpt-4, gpt-3.5-turbo, gpt-4-turbo, etc.

#### Custom Providers (OpenAI-Compatible)
-   **Provider Name:** Your custom name (e.g., "Anthropic", "Together AI")
-   **API Key:** Your provider's API key
-   **Base URL:** Your provider's API endpoint
-   **Models:** Comma-separated list of available models

### Web Search Configuration

Navigate to **Settings → Search Providers** to configure web search:

#### Search Provider Options
-   **Google Search (via Gemini):** Uses your existing Gemini API key
-   **Tavily:** Requires Tavily API key for enhanced web search
-   **SerpAPI:** Requires SerpAPI key for Google search results

#### Usage
-   Web search is automatically available for all custom AI models
-   Toggle "Search the web" in conversations to enable/disable
-   Search results are automatically injected into AI context

### Environment Variables

#### Required
- `VITE_API_KEY`: Your Google Gemini API key

#### Optional (can be configured via Settings UI)
- Additional API keys for other providers
- Web search provider API keys

### Supported Models

The application supports:
-   **Gemini Models:** All available Gemini models
-   **OpenAI Models:** GPT-4, GPT-3.5-turbo, GPT-4-turbo, and newer models
-   **Custom Models:** Any model from OpenAI-compatible providers

## 🐛 Troubleshooting

### Common Issues

1. **AI Provider Issues:**
   - **API Key Errors:** Configure API keys in Settings → AI Providers
   - **Model Not Found:** Verify custom model names are correct for your provider
   - **Rate Limits:** Check your provider's usage limits and billing status
   - **Connection Errors:** Verify base URLs for custom providers

2. **Web Search Issues:**
   - **Search Not Working:** Configure API keys in Settings → Search Providers
   - **CORS Errors:** These are automatically handled by serverless functions in production
   - **Rate Limits:** Respect search provider rate limits (Tavily, SerpAPI)
   - **No Results:** Try different search providers or check API key validity

3. **File Upload Errors:** 
   - Ensure you're uploading supported file formats
   - The application will show a warning for unsupported files
   - Check file size limits based on your AI provider

4. **Environment & Setup Issues:**
   - Make sure your primary API key is set as `VITE_API_KEY` in `.env.local`
   - Restart the development server after changing environment variables
   - Check browser console for detailed error messages
   - For Vercel deployment, ensure environment variables are set in the Vercel dashboard

5. **Development Server Issues:** 
   - If you encounter loading issues, make sure to run `npm run dev` and access the app at `http://localhost:5173`
   - Clear browser cache if Settings changes don't persist

### Testing New Features

Use the built-in test utilities:
- `/utils/testNewFeatures.js` - Comprehensive feature testing
- Settings UI has connectivity testing for all providers
- Check browser developer tools for detailed logs

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify all API keys are correctly configured
3. Test provider connectivity in Settings
4. Review the [Vercel Deployment Checklist](VERCEL_DEPLOYMENT_CHECKLIST.md) for deployment issues

## 🌟 Key Benefits

### For Users
-   **Provider Flexibility:** Switch between AI providers based on your needs and budget
-   **Enhanced Research:** Get up-to-date information with integrated web search
-   **Cost Optimization:** Use different providers for different types of tasks
-   **Privacy Control:** All API keys stored locally in your browser
-   **Seamless Experience:** One interface for multiple AI providers

### For Developers
-   **Easy Deployment:** Optimized for Vercel with serverless functions
-   **Extensible Architecture:** Simple to add new AI providers or search engines
-   **Type Safety:** Full TypeScript implementation
-   **Modern Stack:** React, Vite, and modern web standards
-   **CORS-Free:** No backend complexity, handles external APIs via serverless functions

### Enterprise Ready
-   **Multi-Provider Support:** Reduce vendor lock-in
-   **Configurable Endpoints:** Connect to private AI deployments
-   **Web Search Integration:** Enhanced AI capabilities with real-time information
-   **Scalable Architecture:** Serverless deployment scales automatically

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
