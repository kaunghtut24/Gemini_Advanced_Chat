import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Message as MessageComponent } from './Message';
import { Message, Role } from '../types';
import { generateResponseStream, generateTitle } from '../services/geminiService';
import { PaperclipIcon } from './Icons';

const chatTemplates = [
  { 
    id: 1, 
    label: "📝 Writing Assistant", 
    content: "Help me write a professional email/document about [topic]. Please make it clear, concise, and appropriate for [audience]." 
  },
  { 
    id: 2, 
    label: "🧠 Explain Complex Topic", 
    content: "Explain [complex topic] in simple terms that a beginner can understand. Use analogies and examples to make it clear." 
  },
  { 
    id: 3, 
    label: "💡 Brainstorm Ideas", 
    content: "I need creative ideas for [project/problem]. Please suggest at least 5 innovative approaches with brief explanations for each." 
  },
  { 
    id: 4, 
    label: "🔍 Research & Analysis", 
    content: "Research and analyze [topic]. Provide key insights, current trends, and important considerations I should know about." 
  },
  { 
    id: 5, 
    label: "🛠️ Problem Solving", 
    content: "I'm facing this challenge: [describe problem]. Help me break it down and suggest step-by-step solutions." 
  },
  { 
    id: 6, 
    label: "📚 Learn Something New", 
    content: "I want to learn about [topic]. Create a beginner-friendly learning plan with key concepts and recommended resources." 
  },
  { 
    id: 7, 
    label: "💼 Career Advice", 
    content: "I need career guidance about [specific situation]. Please provide actionable advice and next steps." 
  },
  { 
    id: 8, 
    label: "🎯 Goal Planning", 
    content: "Help me create a detailed plan to achieve [specific goal]. Include milestones, timeline, and potential obstacles to consider." 
  },
  { 
    id: 9, 
    label: "🔧 Technical Help", 
    content: "I need help with [technical issue/task]. Please provide step-by-step instructions and explain any technical terms." 
  },
  { 
    id: 10, 
    label: "📊 Data Analysis", 
    content: "Analyze this data/information: [paste data]. What insights, patterns, or recommendations can you provide?" 
  },
  { 
    id: 11, 
    label: "🎨 Creative Writing", 
    content: "Help me write a creative piece about [theme/topic]. Make it engaging and include vivid descriptions." 
  },
  { 
    id: 12, 
    label: "🤔 Decision Making", 
    content: "I need to decide between [options]. Help me weigh the pros and cons and suggest the best choice based on [criteria]." 
  }
];

interface ChatWindowProps {
    sessionMessages: Message[];
    onMessagesUpdate: (messages: Message[]) => void;
    currentModel?: string;
    sessionTitle?: string;
    onTitleUpdate?: (title: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  sessionMessages, 
  onMessagesUpdate, 
  currentModel, 
  sessionTitle, 
  onTitleUpdate 
}) => {
  const [messages, setMessages] = useState<Message[]>(sessionMessages);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>(sessionMessages);
  const [searchQuery, setSearchQuery] = useState("");
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdateRef = useRef<Message[] | null>(null);
  const isStreamingUpdateRef = useRef(false);

  // Update local state when sessionMessages prop changes
  useEffect(() => {
    setMessages(sessionMessages);
    setFilteredMessages(sessionMessages);
    
    // Log context information for imported sessions
    if (sessionMessages.length > 1) {
      const userMessages = sessionMessages.filter(m => m.role === Role.USER);
      const assistantMessages = sessionMessages.filter(m => m.role === Role.ASSISTANT);
      console.log(`🧠 Session loaded with ${sessionMessages.length} messages (${userMessages.length} user, ${assistantMessages.length} assistant)`);
      console.log('Context is ready for follow-up questions');
    }
  }, [sessionMessages]);

  // Handle search filtering
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMessages(messages);
    } else {
      const lowerCaseQuery = searchQuery.toLowerCase();
      setFilteredMessages(
        messages.filter((message) =>
          message.content.toLowerCase().includes(lowerCaseQuery)
        )
      );
    }
  }, [searchQuery, messages]);

  // Handle updates to parent component with proper debouncing
  useEffect(() => {
    if (pendingUpdateRef.current) {
      const messagesToUpdate = pendingUpdateRef.current;
      pendingUpdateRef.current = null;

      if (isStreamingUpdateRef.current) {
        // Debounced update during streaming
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        updateTimeoutRef.current = setTimeout(() => {
          onMessagesUpdate(messagesToUpdate);
        }, 150);
      } else {
        // Immediate update for non-streaming, but clear any pending timeouts first
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
          updateTimeoutRef.current = null;
        }
        onMessagesUpdate(messagesToUpdate);
      }
    }
  }, [onMessagesUpdate]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSend = useCallback(async () => {
    const trimmedInput = input.trim();
    if ((!trimmedInput && files.length === 0) || isStreaming) return;

    setIsStreaming(true);
    const currentInput = trimmedInput;
    const currentFiles = [...files];
    setInput("");
    setFiles([]);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    const userMessage: Message = { role: Role.USER, content: currentInput };
    
    // First, calculate the history that will be sent to API
    const historyForAPI = [...messages, userMessage];
    
    // Auto-title session if this is the first user message and session is still "New Chat"
    if (sessionTitle === 'New Chat' && onTitleUpdate && messages.filter(m => m.role === Role.USER).length === 0) {
      // This is the first user message, auto-generate title immediately
      console.log(`🚀 Triggering immediate auto-title for first message: "${currentInput}"`);
      generateTitle(currentInput)
        .then(title => {
          console.log(`🏷️ Auto-generated title: "${title}"`);
          onTitleUpdate(title);
        })
        .catch(error => {
          console.error("Failed to generate title:", error);
          // Fallback title
          const fallbackTitle = currentInput.substring(0, 40).trim() + '...';
          console.log(`📝 Using fallback title: "${fallbackTitle}"`);
          onTitleUpdate(fallbackTitle);
        });
    }
    
    // Log context information
    console.log(`📤 Sending ${historyForAPI.length} messages to API for context`);
    if (historyForAPI.length > 1) {
      console.log(`🧠 Context includes conversation history for follow-up questions`);
    }
    
    // Update UI state
    setMessages(prev => {
        const newMessages: Message[] = [...prev, userMessage, { role: Role.ASSISTANT, content: "", sources: [] }];
        
        // Add context management info for long conversations
        if (historyForAPI.length > 50) {
          console.log(`🧠 Context Management: Using smart context window for conversation with ${historyForAPI.length} messages`);
        }
        
        // Schedule update to parent
        pendingUpdateRef.current = newMessages;
        isStreamingUpdateRef.current = false;
        return newMessages;
    });

    try {
      const stream = generateResponseStream(historyForAPI, currentInput, currentFiles, useWebSearch);
      
      for await (const chunk of stream) {
        setMessages(prev => {
          const updatedMessages = [...prev];
          const lastMessage = updatedMessages[updatedMessages.length - 1];

          if (lastMessage && lastMessage.role === Role.ASSISTANT) {
            if (chunk.text && chunk.text.trim()) {
              // Prevent duplicate content by checking if this chunk was already added
              const chunkText = chunk.text;
              if (!lastMessage.content.endsWith(chunkText)) {
                lastMessage.content += chunkText;
              }
            }
            if (chunk.sources) {
              // Simple merge and dedupe sources by uri
              const existingUris = new Set(lastMessage.sources?.map(s => s.uri) || []);
              const newSources = chunk.sources.filter(s => !existingUris.has(s.uri));
              lastMessage.sources = [...(lastMessage.sources || []), ...newSources];
            }
          }
          
          // Schedule debounced update during streaming
          pendingUpdateRef.current = updatedMessages;
          isStreamingUpdateRef.current = true;
          return updatedMessages;
        });
      }
      
      // Final update after streaming is complete - just change the streaming flag
      isStreamingUpdateRef.current = false;
      
    } catch (error) {
      console.error("Error streaming response:", error);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === Role.ASSISTANT) {
          // Provide more helpful error messages based on the error type
          if (error instanceof Error) {
            console.error("Detailed error:", error);
            
            if (error.message.includes('Unsupported file type') || error.message.includes('Unsupported MIME type')) {
              lastMessage.content = "⚠️ One or more files you uploaded are not supported. Please use supported formats: Images (JPEG, PNG, WebP, HEIC, HEIF), PDF documents, Audio (WAV, MP3, AIFF, AAC, OGG, FLAC), or Video (MP4, MPEG, MOV, AVI, FLV, MPG, WEBM, WMV, 3GPP).";
            } else if (error.message.includes('API key')) {
              lastMessage.content = "⚠️ API key issue. Please check your Gemini API key configuration in the settings.";
            } else if (error.message.includes('quota') || error.message.includes('limit')) {
              lastMessage.content = "⚠️ API quota exceeded. Please try again later or switch to a different model.";
            } else if (error.message.includes('model') && error.message.includes('not found')) {
              lastMessage.content = `⚠️ The selected model "${currentModel || 'Unknown'}" is not available. Please try switching to a different model like "gemini-2.5-flash".`;
            } else if (error.message.includes('permission') || error.message.includes('access')) {
              lastMessage.content = `⚠️ Access denied for model "${currentModel || 'Unknown'}". Your API key might not have access to this model. Try "gemini-2.5-flash" instead.`;
            } else if (error.message.includes('rate')) {
              lastMessage.content = `⚠️ Rate limit exceeded for model "${currentModel || 'Unknown'}". Please wait a moment before trying again.`;
            } else {
              lastMessage.content = `⚠️ Error with model "${currentModel || 'Unknown'}": ${error.message}`;
            }
          } else {
            lastMessage.content = "⚠️ An unexpected error occurred. Please try again or switch to a different model.";
          }
        }
        // Schedule immediate update for error message
        pendingUpdateRef.current = newMessages;
        isStreamingUpdateRef.current = false;
        return newMessages;
      });
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }, [input, files, isStreaming, useWebSearch]);
  
  // Supported file types for Gemini API
  const SUPPORTED_FILE_TYPES = {
    // Images
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/webp': true,
    'image/heic': true,
    'image/heif': true,
    // Documents
    'application/pdf': true,
    // Audio
    'audio/wav': true,
    'audio/mp3': true,
    'audio/mpeg': true,
    'audio/aiff': true,
    'audio/aac': true,
    'audio/ogg': true,
    'audio/flac': true,
    // Video
    'video/mp4': true,
    'video/mpeg': true,
    'video/quicktime': true, // .mov
    'video/x-msvideo': true, // .avi
    'video/x-flv': true,
    'video/mpg': true,
    'video/webm': true,
    'video/x-ms-wmv': true,
    'video/3gpp': true,
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];

      newFiles.forEach((file: File) => {
        if (SUPPORTED_FILE_TYPES[file.type as keyof typeof SUPPORTED_FILE_TYPES]) {
          validFiles.push(file);
        } else {
          invalidFiles.push(file.name);
        }
      });

      if (validFiles.length > 0) {
        setFiles(prev => [...prev, ...validFiles]);
      }

      if (invalidFiles.length > 0) {
        alert(`The following files are not supported by Gemini API and were skipped:\n${invalidFiles.join('\n')}\n\nSupported formats: Images (JPEG, PNG, WebP, HEIC, HEIF), PDF documents, Audio (WAV, MP3, AIFF, AAC, OGG, FLAC), Video (MP4, MPEG, MOV, AVI, FLV, MPG, WEBM, WMV, 3GPP)`);
      }
    }

    // Clear the input so the same file can be selected again
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };
  
  const showSpinner = isStreaming && messages.length > 0 && messages[messages.length - 1].content === '';

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleTemplateSelect = (templateContent: string) => {
    setInput(templateContent);
    inputRef.current?.focus();
  };

  return (
    <div className="chat-window">
      <div className="chat-controls">
        <div className="search-bar">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="🔍 Search messages..."
            className="search-input"
          />
        </div>
        {currentModel && (
          <div className="model-indicator">
            <span className="model-label">Model:</span>
            <span className="model-name">{currentModel}</span>
            <div className="context-indicator" title="Context is maintained throughout the conversation with intelligent context window management">
              <span className="context-icon">🧠</span>
              <span className="context-text">Smart Context</span>
              {filteredMessages.length > 50 && (
                <span className="context-warning" title={`Large conversation (${filteredMessages.length} messages). Recent messages prioritized for context.`}>
                  ⚠️
                </span>
              )}
              {filteredMessages.length > 1 && filteredMessages[0]?.content?.includes("Hello! How can I help you today?") === false && (
                <span className="imported-indicator" title="This is an imported conversation with full context available">
                  📥
                </span>
              )}
            </div>
          </div>
        )}
        <div className="template-dropdown">
          <select
            onChange={(e) => handleTemplateSelect(e.target.value)}
            defaultValue=""
            className="template-select"
          >
            <option value="" disabled>� Choose a prompt template...</option>
            {chatTemplates.map((template) => (
              <option key={template.id} value={template.content}>
                {template.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="history">
        {filteredMessages.map((m, i) => (
          <MessageComponent key={i} role={m.role} content={m.content} sources={m.sources} messageIndex={i} />
        ))}
        {showSpinner && (
          <div className="message assistant">
            <div className="avatar">🤖</div>
            <div className="bubble">
              <div className="spinner">…</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="composer-container">
        {files.length > 0 && (
          <div className="file-previews">
            {files.map((file, index) => (
              <div key={index} className="file-preview">
                {file.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(file)} alt={file.name} />
                ) : (
                  <div className="file-icon">📄</div>
                )}
                <span className="file-name">{file.name}</span>
                <button onClick={() => removeFile(index)} className="remove-file-btn">×</button>
              </div>
            ))}
          </div>
        )}

        <div className="web-search-toggle">
          <label>
            <input 
              type="checkbox" 
              checked={useWebSearch} 
              onChange={(e) => setUseWebSearch(e.target.checked)}
            />
            <span>Search the web</span>
          </label>
        </div>

        <div className="composer">
          <button 
            className="attachment-btn" 
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach files"
          >
            <PaperclipIcon />
          </button>
          <input 
            type="file" 
            multiple
            accept="image/*,application/pdf,audio/*,video/*"
            ref={fileInputRef} 
            onChange={handleFileChange}
            style={{ display: 'none' }} 
          />
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleTextareaInput}
            rows={1}
            placeholder="Type your message…"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={isStreaming || (!input.trim() && files.length === 0)}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
