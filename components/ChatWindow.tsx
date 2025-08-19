import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Message as MessageComponent } from './Message';
import { Message, Role } from '../types';
import { generateResponseStream } from '../services/geminiService';
import { PaperclipIcon } from './Icons';

interface ChatWindowProps {
    sessionMessages: Message[];
    onMessagesUpdate: (messages: Message[]) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ sessionMessages, onMessagesUpdate }) => {
  const [messages, setMessages] = useState<Message[]>(sessionMessages);
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
  }, [sessionMessages]);

  // Handle updates to parent component
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
        }, 100);
      } else {
        // Immediate update for non-streaming
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        onMessagesUpdate(messagesToUpdate);
      }
    }
  }, [messages, onMessagesUpdate]);

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
    
    // Use functional update to get the most recent state
    let historyForAPI: Message[] = [];
    setMessages(prev => {
        historyForAPI = [...prev];
        const newMessages: Message[] = [...prev, userMessage, { role: Role.ASSISTANT, content: "", sources: [] }];
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

          if (lastMessage) {
            if (chunk.text) {
              lastMessage.content += chunk.text;
            }
            if (chunk.sources) {
              // Simple merge and dedupe sources by uri
              const existingUris = new Set(lastMessage.sources?.map(s => s.uri));
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
      
      // Final update after streaming is complete
      setMessages(prev => {
        pendingUpdateRef.current = prev;
        isStreamingUpdateRef.current = false;
        return prev;
      });
    } catch (error) {
      console.error("Error streaming response:", error);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === Role.ASSISTANT) {
          // Provide more helpful error messages based on the error type
          if (error instanceof Error) {
            if (error.message.includes('Unsupported file type') || error.message.includes('Unsupported MIME type')) {
              lastMessage.content = "⚠️ One or more files you uploaded are not supported. Please use supported formats: Images (JPEG, PNG, WebP, HEIC, HEIF), PDF documents, Audio (WAV, MP3, AIFF, AAC, OGG, FLAC), or Video (MP4, MPEG, MOV, AVI, FLV, MPG, WEBM, WMV, 3GPP).";
            } else if (error.message.includes('API key')) {
              lastMessage.content = "⚠️ API key issue. Please check your Gemini API key configuration.";
            } else if (error.message.includes('quota') || error.message.includes('limit')) {
              lastMessage.content = "⚠️ API quota exceeded. Please try again later.";
            } else {
              lastMessage.content = `⚠️ An error occurred: ${error.message}`;
            }
          } else {
            lastMessage.content = "⚠️ An unexpected error occurred. Please try again.";
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

  return (
    <div className="chat-window">
      <div className="history">
        {messages.map((m, i) => (
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
