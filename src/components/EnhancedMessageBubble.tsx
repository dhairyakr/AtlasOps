import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message } from '../types/chat';
import { Bot, User, Loader2, Heart, ThumbsUp, Copy, Share, MoreHorizontal, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { SearchResultsPanel } from './SearchResultsPanel';

interface EnhancedMessageBubbleProps {
  message: Message;
  onReaction: (reaction: string) => void;
  isLatest: boolean;
}

export const EnhancedMessageBubble: React.FC<EnhancedMessageBubbleProps> = ({ 
  message, 
  onReaction, 
  isLatest 
}) => {
  const { theme } = useTheme();
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const isUser = message.sender === 'user';
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share && navigator.canShare && navigator.canShare({
      title: 'AI Chat Message',
      text: message.text,
    })) {
      try {
        await navigator.share({
          title: 'AI Chat Message',
          text: message.text,
        });
      } catch (error) {
        // If sharing fails (permission denied, user cancelled, etc.), fall back to copy
        handleCopy();
      }
    } else {
      // Fall back to copy if Web Share API is not available or cannot share
      handleCopy();
    }
  };

  // Enhanced code block component
  const CodeBlock = ({ language, children }: { language?: string; children: string }) => {
    const [codeCopied, setCodeCopied] = useState(false);
    
    const handleCodeCopy = async () => {
      try {
        await navigator.clipboard.writeText(children);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy code:', error);
      }
    };

    return (
      <div className="relative group code-block animate-fade-in-up overflow-x-auto max-w-full">
        <div className="flex items-center justify-between bg-gray-800 dark:bg-gray-900 px-4 py-2 text-sm flex-shrink-0">
          <span className="text-gray-300 font-medium">
            {language || 'code'}
          </span>
          <button
            onClick={handleCodeCopy}
            className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100 btn-hover-lift flex-shrink-0"
          >
            {codeCopied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <div className="overflow-x-auto">
          <SyntaxHighlighter
            style={theme === 'dark' ? oneDark : oneLight}
            language={language || 'text'}
            customStyle={{
              margin: 0,
              borderRadius: '0 0 0.75rem 0.75rem',
              fontSize: '0.875rem',
              minWidth: 'max-content',
            }}
          >
            {children}
          </SyntaxHighlighter>
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`group flex items-start space-x-4 ${isUser ? 'flex-row-reverse space-x-reverse' : ''} animate-fade-in-up transition-all duration-300 relative`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Enhanced Avatar */}
      <div 
        className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 relative overflow-hidden avatar-orb ${
        isUser 
          ? 'user-avatar-orb animate-bounce-in' 
          : 'ai-avatar-orb animate-bounce-in'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isUser ? (
          <User className="w-6 h-6 text-white relative z-10" />
        ) : (
          <Bot className="w-6 h-6 text-white relative z-10" />
        )}
      </div>
      
      <div className={`max-w-sm sm:max-w-md lg:max-w-2xl xl:max-w-4xl ${isUser ? 'text-right' : 'text-left'} flex-1`}>
        {/* Enhanced Message Bubble */}
        <div className={`relative inline-block px-6 py-4 rounded-3xl transition-all duration-500 message-glass-bubble overflow-hidden break-words word-wrap ${
          isUser
            ? 'user-message-bubble text-white rounded-tr-lg'
            : 'ai-message-bubble text-white rounded-tl-lg'
        }`}>
          
          {/* Image Display */}
          {message.image && (
            <div className="mb-3 animate-scale-in relative overflow-hidden rounded-lg">
              <img
                src={`data:${message.image.mimeType};base64,${message.image.data}`}
                alt="Uploaded image"
                className="max-w-full h-auto rounded-lg border border-white/20 shadow-neural-glow hover:shadow-cosmic-glow transition-all duration-300 hover:scale-105"
                style={{ maxHeight: '300px', maxWidth: '400px' }}
              />
            </div>
          )}
          
          {message.isLoading ? (
            <div className="flex items-center space-x-3 relative z-10 typing-liquid-pulse">
              <div className="ai-processing-visual"></div>
              <div className="typing-liquid-pulse">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          ) : isUser ? (
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed relative z-10">{message.text}</p>
          ) : (
            <div className="text-sm prose prose-sm max-w-none dark:prose-invert relative z-10 break-words">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                children={message.text.trim()}
                components={{
                  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-white/90 break-words">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold text-white break-words">{children}</strong>,
                  em: ({ children }) => <em className="italic break-words">{children}</em>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 text-white/90 break-words">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 text-white/90 break-words">{children}</ol>,
                  li: ({ children }) => <li className="text-white/90 break-words">{children}</li>,
                  h1: ({ children }) => <h1 className="text-lg font-bold mb-3 text-white break-words">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-white break-words">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold mb-2 text-white break-words">{children}</h3>,
                  code: ({ node, inline, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : '';

                    if (!inline && language) {
                      return (
                        <CodeBlock language={language}>
                          {String(children).replace(/\n$/, '')}
                        </CodeBlock>
                      );
                    }

                    return (
                      <code
                        className="bg-white/20 text-white px-2 py-1 rounded text-xs font-mono backdrop-blur-sm break-words"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => {
                    // This will be handled by the code component above
                    return <>{children}</>;
                  },
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-neo-tech-quantum-cyan pl-4 italic text-white/80 mb-3 bg-neo-tech-quantum-cyan/10 py-2 rounded-r-lg backdrop-blur-sm break-words">
                      {children}
                    </blockquote>
                  ),
                }}
              >
              </ReactMarkdown>
            </div>
          )}
          
        </div>
        
        {/* Enhanced Message Actions, Reactions, and Timestamp */}
        {!message.isLoading && (
          <div className={`mt-3 px-2 opacity-0 group-hover:opacity-100 transition-all duration-300 animate-fade-in ${isUser ? 'text-right' : 'text-left'}`}>
            <div className={`flex items-center space-x-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {/* Message Actions */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleCopy}
                  className="p-2 reaction-glass-button rounded-full transition-all duration-300 btn-hover-lift"
                  title={copied ? 'Copied!' : 'Copy message'}
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-neo-tech-quantum-cyan" />
                  ) : (
                    <Copy className="w-3 h-3 text-white/80" />
                  )}
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 reaction-glass-button rounded-full transition-all duration-300 btn-hover-lift"
                  title="Share message"
                >
                  <Share className="w-3 h-3 text-white/80" />
                </button>
              </div>

              {/* Reactions (only for AI messages) */}
              {!isUser && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onReaction('like')}
                    className="flex items-center space-x-1 px-2 py-1 reaction-glass-button rounded-full text-xs transition-all duration-300 btn-hover-lift"
                  >
                    <ThumbsUp className="w-3 h-3 text-white/80" />
                    <span className="text-white/80">{message.reactions?.like || 0}</span>
                  </button>
                  <button
                    onClick={() => onReaction('love')}
                    className="flex items-center space-x-1 px-2 py-1 reaction-glass-button rounded-full text-xs transition-all duration-300 btn-hover-lift"
                  >
                    <Heart className="w-3 h-3 text-white/80" />
                    <span className="text-white/80">{message.reactions?.love || 0}</span>
                  </button>
                </div>
              )}

              {/* Timestamp */}
              <p className="text-xs text-white/50 font-medium">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        )}

        {/* Search Results Panel */}
        {message.searchSources && message.searchSources.length > 0 && (
          <div className="mt-4">
            <SearchResultsPanel
              sources={message.searchSources}
              onClose={() => setShowSources(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};