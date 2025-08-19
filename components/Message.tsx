import React, { useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Role, Source } from '../types';
import { BotIcon, UserIcon, CopyIcon } from './Icons';

interface MessageProps {
  role: Role;
  content: string;
  sources?: Source[];
  messageIndex?: number;
}

export const Message: React.FC<MessageProps> = ({ role, content, sources, messageIndex = 0 }) => {
  const bubbleRef = useRef<HTMLDivElement>(null);

  const parsedContent = role === Role.ASSISTANT ? DOMPurify.sanitize(marked.parse(content) as string) : null;

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
      let textToCopy = convertToPlainText(content);
      
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
             <div dangerouslySetInnerHTML={{ __html: parsedContent! }}></div>
          ) : (
            content
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
