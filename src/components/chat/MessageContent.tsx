'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';
import { useTheme } from 'nest/contexts/ThemeContext';

interface MessageContentProps {
  content: string;
}

interface CodeBlock {
  language: string;
  code: string;
}

export default function MessageContent({ content }: MessageContentProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { isDark } = useTheme();

  // Parse content to separate text and code blocks
  const parseContent = (content: string) => {
    const parts: (string | CodeBlock)[] = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const textBefore = content.slice(lastIndex, match.index);
        if (textBefore.trim()) {
          parts.push(textBefore);
        }
      }

      // Add code block
      const language = match[1] || 'text';
      const code = match[2].trim();
      parts.push({ language, code });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex);
      if (remainingText.trim()) {
        parts.push(remainingText);
      }
    }

    return parts;
  };

  const copyToClipboard = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const formatText = (text: string) => {
    // Handle inline code with backticks
    const inlineCodeRegex = /`([^`]+)`/g;
    const parts = text.split(inlineCodeRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is inline code
        return (
          <code
            key={index}
            className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-red-600 dark:text-red-400"
          >
            {part}
          </code>
        );
      }
      
      // Handle bold text **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      const textWithBold = part.split(boldRegex).map((boldPart, boldIndex) => {
        if (boldIndex % 2 === 1) {
          return <strong key={boldIndex}>{boldPart}</strong>;
        }
        return boldPart;
      });
      
      return <span key={index}>{textWithBold}</span>;
    });
  };

  const parts = parseContent(content);

  if (parts.length === 1 && typeof parts[0] === 'string') {
    // No code blocks, just format the text
    return (
      <div className="whitespace-pre-wrap break-words">
        {formatText(parts[0])}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          return (
            <div key={index} className="whitespace-pre-wrap break-words">
              {formatText(part)}
            </div>
          );
        } else {
          // This is a code block
          return (
            <div key={index} className="relative group">
              <div className="flex items-center justify-between bg-gray-800 dark:bg-gray-900 text-gray-300 px-4 py-2 text-sm rounded-t-lg">
                <span className="font-medium">{part.language}</span>
                <button
                  onClick={() => copyToClipboard(part.code, index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                >
                  {copiedIndex === index ? (
                    <>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
              <SyntaxHighlighter
                language={part.language}
                style={isDark ? vscDarkPlus : vs}
                customStyle={{
                  margin: 0,
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  borderBottomLeftRadius: '0.5rem',
                  borderBottomRightRadius: '0.5rem',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                }}
                showLineNumbers={part.code.split('\n').length > 5}
                wrapLines={true}
                wrapLongLines={true}
              >
                {part.code}
              </SyntaxHighlighter>
            </div>
          );
        }
      })}
    </div>
  );
}