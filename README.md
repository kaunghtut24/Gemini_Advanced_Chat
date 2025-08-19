# Gemini Advanced Chat UI

A responsive and advanced chat application that connects to the Google Gemini API for streaming conversations. This project features a clean, modern interface with full chat history management, built with React, TypeScript, and Vite. It includes comprehensive file support validation and robust error handling.

## ✨ Features

### Intelligent Conversation
-   **Real-time Streaming:** Get instant, word-by-word responses from the Gemini API.
-   **Markdown Rendering:** Model responses are parsed as Markdown, with syntax highlighting and a "Copy" button for code blocks.
-   **Multimodal Input:** Attach supported files to your prompts for rich, contextual conversations.
-   **File Type Validation:** Automatic validation ensures only supported file formats are uploaded.
-   **Web Search:** Toggle on "Search the web" to get answers grounded in up-to-date information from Google Search.
-   **Source Citing:** Responses generated with web search include links to the sources, so you can verify the information.

### Advanced Session Management
-   **Persistent Chat History:** Conversations are automatically saved to your browser's local storage.
-   **Multi-Session Interface:** Manage multiple conversations in a clean sidebar. You can create, switch between, rename, and delete chats.
-   **Automatic Conversation Titling:** New chats are automatically given a concise title based on your first message.
-   **Import & Export:** Save any chat session as a JSON file for backup or transfer, and import it back into the app at any time.

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
-   **Error Handling:** Comprehensive error messages with helpful guidance for different error scenarios.
-   **Favicon Support:** Includes proper favicon configuration for better browser integration.

### Developer Friendly
-   **Built with Vite:** Fast development and build process.
-   **TypeScript:** Full type safety throughout the application.
-   **React Hooks Compliance:** Follows React best practices and hooks rules.
-   **No setState During Render:** Optimized state management to prevent React warnings.

## 🛠️ Tech Stack

-   **Frontend:** [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
-   **AI:** [Google Gemini API](https://ai.google.dev/gemini-api) via [`@google/genai`](https://www.npmjs.com/package/@google/genai) SDK
-   **Markdown:** [Marked](https://marked.js.org/) for parsing, [DOMPurify](https://github.com/cure53/DOMPurify) for sanitization.
-   **Styling:** Custom CSS (Mobile-first)

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

-   Node.js (version 16 or higher)
-   npm or yarn package manager
-   A Google Gemini API key. You can get one from [Google AI Studio](https://makersuite.google.com/app/apikey).

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

3.  **Set up your API key:**
    Create a `.env.local` file in the root directory and add your Gemini API key:
    ```
    VITE_API_KEY=your_gemini_api_key_here
    ```
    **Important:** The variable name must be `VITE_API_KEY` (not `GEMINI_API_KEY` or `API_KEY`) for Vite to recognize it.

### Running the Application

1.  **Start the development server:**
    ```bash
    npm run dev
    ```

2.  **Open in your browser:**
    -   The application will be available at `http://localhost:5173`
    -   You can now start chatting with the Gemini model!

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

### Environment Variables

- `VITE_API_KEY`: Your Google Gemini API key (required)

### Supported Models

The application is configured to use `gemini-2.5-flash` by default, which provides the best balance of speed and capability.

## 🐛 Troubleshooting

### Common Issues

1. **File Upload Errors:** Ensure you're uploading supported file formats. The application will show a warning for unsupported files.

2. **API Key Issues:** 
   - Make sure your API key is correctly set in the `.env.local` file
   - Verify the variable name is `VITE_API_KEY` (not `GEMINI_API_KEY` or `API_KEY`)
   - Restart the development server after changing environment variables
   - Check browser console for error messages like "An API Key must be set when running in a browser"
   - Ensure your API key has the necessary permissions from Google AI Studio

3. **React Warnings:** This version has been optimized to eliminate common React warnings like "setState during render" and "hooks order violations."

4. **Development Server Issues:** If you encounter CORS or loading issues, make sure to run `npm run dev` and access the app at `http://localhost:5173`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
