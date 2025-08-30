import React, { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Role, Source } from '../types';
import { BotIcon, UserIcon, CopyIcon } from './Icons';

interface MessageProps {
  role: Role;
  content: string;
  sources?: Source[];
  messageIndex?: number;
  onRetry?: () => void;
  isLastMessage?: boolean;
  searchQuery?: string;
}

interface ParsedThinkingContent {
  hasThinking: boolean;
  thinking: string;
  finalAnswer: string;
}

export const Message: React.FC<MessageProps> = ({ role, content, sources, messageIndex = 0, onRetry, isLastMessage = false, searchQuery }) => {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [showThinking, setShowThinking] = useState(false);

  // Function to parse thinking model responses
  const parseThinkingContent = (text: string): ParsedThinkingContent => {
    // Skip parsing for very short responses
    if (text.length < 100) {
      return { hasThinking: false, thinking: '', finalAnswer: text };
    }

    // Common patterns for thinking models
    const patterns = [
      // Gemini 2.5 thinking patterns - more specific
      /^(.*?(?:let me think|i need to|first, i|let me consider|i should|let me analyze).*?)\n\n(?:here's|let me provide|i'll give you|based on this|to answer|the answer is|in summary|so,|therefore,)(.*)/si,
      /^(.*?(?:step 1|first step|initially|to start|beginning with).*?)\n\n(?:final answer|conclusion|result|summary|in summary|therefore|so the answer)(.*)/si,
      // Pattern for explicit thinking tags
      /<thinking>(.*?)<\/thinking>\s*(.*)/s,
      // Pattern for thinking blocks
      /\[THINKING\](.*?)\[\/THINKING\]\s*(.*)/s,
      // Pattern for reasoning followed by conclusion
      /^(.*?(?:because|since|given that|considering|analyzing).*?)\n\n(?:therefore|thus|so|in conclusion|finally|as a result)(.*)/si,
      // Pattern for question analysis followed by answer
      /^(.*?(?:the question|this asks|you're asking|to understand|breaking this down).*?)\n\n(?:the answer|my response|here's what|to answer this)(.*)/si,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const thinking = match[1]?.trim();
        const finalAnswer = match[2]?.trim();

        // Validate that we have substantial content in both parts
        if (thinking && finalAnswer && thinking.length > 50 && finalAnswer.length > 20) {
          // Check if thinking part looks like reasoning (contains question words, analysis, etc.)
          const thinkingIndicators = /\b(let me|i need to|first|then|because|since|if|when|how|why|what|should|could|would|consider|analyze|think|reason|step|approach|method)\b/i;

          if (thinkingIndicators.test(thinking)) {
            return {
              hasThinking: true,
              thinking,
              finalAnswer
            };
          }
        }
      }
    }

    // Check for implicit thinking patterns (long responses with clear structure)
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
    if (paragraphs.length >= 4 && text.length > 300) {
      // Try different split points
      const splitPoints = [
        Math.floor(paragraphs.length * 0.4),
        Math.floor(paragraphs.length * 0.5),
        Math.floor(paragraphs.length * 0.6)
      ];

      for (const splitPoint of splitPoints) {
        const firstPart = paragraphs.slice(0, splitPoint).join('\n\n');
        const secondPart = paragraphs.slice(splitPoint).join('\n\n');

        // Enhanced reasoning detection
        const reasoningPattern = /\b(let me|i need to|first|consider|analyze|think about|step|approach|because|since|given|assuming|if we|when we|to understand|breaking down|looking at|examining)\b/i;
        const conclusionPattern = /\b(so|therefore|thus|in conclusion|finally|to summarize|the answer is|here's|based on this|as a result|consequently|this means|we can conclude)\b/i;

        // Check for reasoning indicators in first part and conclusion in second part
        const hasReasoning = reasoningPattern.test(firstPart);
        const hasConclusion = conclusionPattern.test(secondPart);
        const goodLength = firstPart.length > 150 && secondPart.length > 50;

        // Additional check: first part should have more questions/analysis, second part more statements
        const questionCount = (firstPart.match(/\?/g) || []).length;
        const analysisWords = (firstPart.match(/\b(analyze|consider|examine|evaluate|assess|determine|identify|understand)\b/gi) || []).length;
        const hasAnalyticalContent = questionCount > 0 || analysisWords > 1;

        if (hasReasoning && hasConclusion && goodLength && hasAnalyticalContent) {
          return {
            hasThinking: true,
            thinking: firstPart,
            finalAnswer: secondPart
          };
        }
      }
    }

    return {
      hasThinking: false,
      thinking: '',
      finalAnswer: text
    };
  };

  // Function to highlight search terms in content
  const highlightSearchTerms = (text: string, query: string): string => {
    if (!query.trim()) return text;
    
    // Split query into individual words for better matching
    const words = query.trim().split(/\s+/).filter(word => word.length > 0);
    let highlightedText = text;
    
    words.forEach(word => {
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedWord})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="search-highlight">$1</mark>');
    });
    
    return highlightedText;
  };

  // Parse thinking content for assistant messages
  const thinkingContent = role === Role.ASSISTANT ? parseThinkingContent(content) : null;

  const parsedContent = role === Role.ASSISTANT ?
    DOMPurify.sanitize(marked.parse(thinkingContent?.hasThinking ? thinkingContent.finalAnswer : content) as string, {
      ADD_TAGS: ['mark'],
      ADD_ATTR: ['class']
    }) : null;

  const parsedThinking = thinkingContent?.hasThinking ?
    DOMPurify.sanitize(marked.parse(thinkingContent.thinking) as string, {
      ADD_TAGS: ['mark'],
      ADD_ATTR: ['class']
    }) : null;

  // Function to convert markdown content to plain text suitable for word processors
  const convertToPlainText = (markdownContent: string): string => {
    // Convert markdown to a more readable plain text format
    let plainText = markdownContent
      // Convert headers with proper spacing
      .replace(/^#{6}\s+(.+)$/gm, '$1\n')
      .replace(/^#{5}\s+(.+)$/gm, '$1\n')
      .replace(/^#{4}\s+(.+)$/gm, '$1\n')
      .replace(/^#{3}\s+(.+)$/gm, '$1\n')
      .replace(/^#{2}\s+(.+)$/gm, '$1\n\n')
      .replace(/^#{1}\s+(.+)$/gm, '$1\n\n')
      // Convert bold/italic (preserve some emphasis with CAPS for bold)
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      // Convert unordered lists
      .replace(/^\s*[-*+]\s+(.+)$/gm, '• $1')
      // Convert ordered lists 
      .replace(/^\s*(\d+)\.\s+(.+)$/gm, '$1. $2')
      // Convert code blocks with clear delimiters
      .replace(/```[\w]*\n?([\s\S]*?)```/g, (match, code) => {
        return '\n--- CODE START ---\n' + code.trim() + '\n--- CODE END ---\n';
      })
      // Convert inline code
      .replace(/`([^`]+)`/g, '$1')
      // Convert blockquotes
      .replace(/^>\s*(.+)$/gm, '"$1"')
      // Convert horizontal rules
      .replace(/^---+$/gm, '---')
      // Convert line breaks properly
      .replace(/\n{3,}/g, '\n\n')
      // Clean up whitespace
      .trim();

    return plainText;
  };

  const copyResponse = async () => {
    try {
      let contentToCopy = content;

      // Handle thinking model responses
      if (thinkingContent?.hasThinking && showThinking) {
        contentToCopy = `THINKING PROCESS:\n${thinkingContent.thinking}\n\nFINAL ANSWER:\n${thinkingContent.finalAnswer}`;
      } else if (thinkingContent?.hasThinking) {
        // If thinking is hidden, only copy the final answer
        contentToCopy = thinkingContent.finalAnswer;
      }

      let textToCopy = convertToPlainText(contentToCopy);

      // Add sources if available
      if (sources && sources.length > 0) {
        textToCopy += '\n\nSources:\n';
        sources.forEach((source, index) => {
          textToCopy += `${index + 1}. ${source.title || 'Source'}: ${source.uri}\n`;
        });
      }

      await navigator.clipboard.writeText(textToCopy);
      
      // Show feedback
      const buttonId = `copy-response-${messageIndex}`;
      const button = document.getElementById(buttonId) as HTMLButtonElement;
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.backgroundColor = '#10b981';
        button.style.color = 'white';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.backgroundColor = '';
          button.style.color = '';
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to copy response: ', err);
      const buttonId = `copy-response-${messageIndex}`;
      const button = document.getElementById(buttonId) as HTMLButtonElement;
      if (button) {
        button.textContent = 'Error';
        setTimeout(() => {
          button.textContent = 'Copy Response';
        }, 2000);
      }
    }
  };

  useEffect(() => {
    if (parsedContent && bubbleRef.current) {
      const codeBlocks = bubbleRef.current.querySelectorAll('pre');
      codeBlocks.forEach(block => {
        if (block.querySelector('.copy-code-btn')) return; // Avoid adding multiple buttons

        const header = document.createElement('div');
        header.className = 'code-block-header';

        const language = block.querySelector('code')?.className.replace('language-', '') || '';
        if (language) {
          const langSpan = document.createElement('span');
          langSpan.className = 'language-name';
          langSpan.textContent = language;
          header.appendChild(langSpan);
        }

        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy';
        copyButton.className = 'copy-code-btn';
        copyButton.setAttribute('aria-label', 'Copy code to clipboard');
        copyButton.onclick = () => {
          const code = block.querySelector('code')?.innerText || '';
          navigator.clipboard.writeText(code).then(() => {
            copyButton.textContent = 'Copied!';
            setTimeout(() => {
              copyButton.textContent = 'Copy';
            }, 2000);
          }).catch(err => {
            console.error('Failed to copy code: ', err);
            copyButton.textContent = 'Error';
          });
        };
        header.appendChild(copyButton);
        block.prepend(header);
      });
    }
  }, [content, parsedContent]);

  // The spinner is handled in ChatWindow for empty assistant messages.
  if (!content && role === Role.ASSISTANT && (!sources || sources.length === 0)) {
    return null;
  }

  return (
    <div className={`message ${role}`}>
      <div className="avatar">{role === Role.ASSISTANT ? <BotIcon /> : <UserIcon />}</div>
      <div className="bubble-container">
        <div className="bubble" ref={bubbleRef}>
          {role === Role.ASSISTANT ? (
            <>
              {/* Show thinking toggle if this is a thinking model response */}
              {thinkingContent?.hasThinking && (
                <div className="thinking-toggle">
                  <button
                    className="thinking-toggle-btn"
                    onClick={() => setShowThinking(!showThinking)}
                    title={showThinking ? "Hide thinking process" : "Show thinking process"}
                  >
                    {showThinking ? "🧠 Hide Thinking" : "🧠 Show Thinking"}
                  </button>
                </div>
              )}

              {/* Show thinking content if enabled */}
              {thinkingContent?.hasThinking && showThinking && (
                <div className="thinking-content">
                  <div className="thinking-header">
                    <span className="thinking-label">💭 Thinking Process</span>
                  </div>
                  <div className="thinking-body" dangerouslySetInnerHTML={{
                    __html: searchQuery ?
                      highlightSearchTerms(parsedThinking!, searchQuery) :
                      parsedThinking!
                  }}></div>
                  <div className="thinking-separator">
                    <span className="thinking-separator-label">Final Answer</span>
                  </div>
                </div>
              )}

              {/* Show final answer */}
              <div className={thinkingContent?.hasThinking && showThinking ? "final-answer-content" : ""}>
                <div dangerouslySetInnerHTML={{
                  __html: searchQuery ?
                    highlightSearchTerms(parsedContent!, searchQuery) :
                    parsedContent!
                }}></div>
              </div>
            </>
          ) : (
            <div dangerouslySetInnerHTML={{
              __html: searchQuery ?
                highlightSearchTerms(content, searchQuery) :
                content
            }}></div>
          )}
        </div>
        {role === Role.ASSISTANT && content && (
          <div className="message-actions">
            <button 
              id={`copy-response-${messageIndex}`}
              className="copy-response-btn"
              onClick={copyResponse}
              title="Copy response to clipboard (formatted for word processors)"
            >
              <CopyIcon />
              Copy Response
            </button>
            {isLastMessage && onRetry && (
              <button 
                className="retry-btn"
                onClick={onRetry}
                title="Regenerate this response"
              >
                🔄 Retry
              </button>
            )}
          </div>
        )}
        {sources && sources.length > 0 && (
          <div className="sources-container">
            <strong>Sources:</strong>
            <ul className="sources-list">
              {sources.map((source, index) => (
                <li key={index}>
                  <a href={source.uri} target="_blank" rel="noopener noreferrer" className="source-link">
                    {source.title || source.uri}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
