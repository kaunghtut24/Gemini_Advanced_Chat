import React, { useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Role, Source } from '../types';
import { BotIcon, UserIcon } from './Icons';

interface MessageProps {
  role: Role;
  content: string;
  sources?: Source[];
}

export const Message: React.FC<MessageProps> = ({ role, content, sources }) => {
  const bubbleRef = useRef<HTMLDivElement>(null);

  const parsedContent = role === Role.ASSISTANT ? DOMPurify.sanitize(marked.parse(content) as string) : null;

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
