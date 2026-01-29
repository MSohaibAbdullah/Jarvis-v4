
import React, { useEffect, useRef, useState } from 'react';
import { Message, JarivisStatus } from '../types';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChatAreaProps {
  messages: Message[];
  status: JarivisStatus;
  onSendMessage: (text: string) => void;
  onVoiceStart: () => void;
  onToggleSidebar?: () => void;
}

// Dedicated CodeBlock component
const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!inline && match) {
    return (
      <div className="relative my-6 rounded-xl overflow-hidden shadow-xl border border-neutral-800/30 bg-[#1e1e1e] group font-mono text-[13px] md:text-sm">
        <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-black/20">
          <div className="flex items-center gap-3">
             <div className="flex gap-1.5 opacity-80">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
             </div>
             <span className="text-[11px] text-gray-400 font-medium lowercase tracking-wide ml-1 select-none">{match[1]}</span>
          </div>
          <button 
             onClick={handleCopy}
             className={`text-[10px] font-bold tracking-wider flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${
               isCopied 
                 ? 'text-emerald-400 bg-emerald-400/10' 
                 : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
             }`}
             title="Copy Code"
          >
            {isCopied ? (
               <>
                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                 COPIED
               </>
            ) : (
               <>
                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                 COPY
               </>
            )}
          </button>
        </div>
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          showLineNumbers={true}
          wrapLines={true}
          lineNumberStyle={{ 
            minWidth: '2.5em', 
            paddingRight: '1em', 
            color: '#4b5563', 
            textAlign: 'right',
            userSelect: 'none'
          }}
          customStyle={{ 
            margin: 0, 
            padding: '1.25rem 0',
            borderRadius: 0, 
            background: '#1e1e1e', 
            lineHeight: '1.6',
          }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800 border border-gray-200" {...props}>
      {children}
    </code>
  );
};

export const ChatArea: React.FC<ChatAreaProps> = ({ messages, status, onSendMessage, onVoiceStart, onToggleSidebar }) => {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-white h-[100dvh] relative font-sans w-full">
      
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100/50">
        <div className="flex items-center gap-2">
            {onToggleSidebar && (
                <button 
                  onClick={onToggleSidebar}
                  className="p-2 -ml-2 text-gray-600 hover:text-black transition-colors rounded-lg hover:bg-gray-100"
                  title="Menu"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
            )}
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-800 tracking-wide">
               <span className="hidden md:inline text-gray-400 font-normal">Sovereign Interface</span>
               <span className="md:hidden">JARVIS</span>
            </div>
        </div>
        
        <div className="flex items-center gap-2">
           {status === JarivisStatus.THINKING && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-50 border border-amber-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">Processing</span>
              </div>
           )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
        <div className="max-w-3xl mx-auto space-y-8 md:space-y-10">
          {messages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4 opacity-50 mt-10">
                 <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"></path><path d="M12 2a10 10 0 0 1 10 10"></path><path d="M12 2v10"></path></svg>
                 </div>
                 <div>
                    <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Sovereign Intelligence Online</h2>
                    <p className="text-sm text-gray-500">Node initialized. Waiting for input.</p>
                 </div>
             </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-3 md:gap-5 group">
              
              {/* Avatar Column */}
              <div className="flex-shrink-0 mt-1">
                {msg.role === 'model' ? (
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-black flex items-center justify-center shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"></path><path d="M12 2a10 10 0 0 1 10 10"></path><path d="M12 2v10"></path></svg>
                  </div>
                ) : (
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </div>
                )}
              </div>

              {/* Content Column */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                    {msg.role === 'user' ? 'User' : 'JARVIS'}
                  </span>
                  <span className="text-[10px] text-gray-400">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>

                <div className="text-[15px] leading-relaxed text-gray-800">
                  {/* Images if any */}
                  {msg.images && msg.images.length > 0 && (
                    <div className="mb-4 grid grid-cols-1 gap-2 max-w-lg">
                      {msg.images.map((img, idx) => (
                        <div key={idx} className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                          <img src={img} alt="Generated Schematic" className="w-full h-auto" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Markdown Content */}
                  <div className="prose prose-slate prose-sm md:prose-base max-w-none prose-p:my-2 prose-headings:font-semibold prose-a:text-blue-600 prose-blockquote:border-l-2 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:text-gray-500 prose-strong:text-gray-900">
                    <ReactMarkdown
                      components={{
                        code: CodeBlock,
                        p: ({node, children}) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({node, children}) => <ul className="list-disc list-outside ml-4 mb-4 space-y-1 marker:text-gray-400">{children}</ul>,
                        ol: ({node, children}) => <ol className="list-decimal list-outside ml-4 mb-4 space-y-1 marker:text-gray-400">{children}</ol>,
                        h1: ({node, children}) => <h1 className="text-xl font-bold mt-6 mb-3">{children}</h1>,
                        h2: ({node, children}) => <h2 className="text-lg font-bold mt-5 mb-2">{children}</h2>,
                        h3: ({node, children}) => <h3 className="text-base font-bold mt-4 mb-2">{children}</h3>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {/* Footer Actions (Copy) */}
                  {msg.role === 'model' && !msg.isStreaming && (
                    <div className="mt-3 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button 
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-black transition-colors py-1 pr-2 rounded select-none"
                        title="Copy Response"
                      >
                        {copiedId === msg.id ? (
                           <>
                             <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
                             <span className="text-emerald-600">Copied</span>
                           </>
                        ) : (
                           <>
                             <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                             <span>Copy Text</span>
                           </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ))}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-gradient-to-t from-white via-white to-white/0 z-20 pb-safe relative">
        <div className="max-w-3xl mx-auto">
          <div 
            className={`
              relative flex items-end gap-2 p-1.5 rounded-[26px] border transition-all duration-300 ease-out
              ${isFocused || input.trim().length > 0 
                ? 'bg-white border-gray-200 shadow-[0_8px_40px_rgba(0,0,0,0.1)]' 
                : 'bg-[#f4f4f5] border-transparent shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
              }
            `}
          >
            
            <button 
              onClick={onVoiceStart}
              className={`
                h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-200 active:scale-90
                ${isFocused ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-400 hover:text-black hover:bg-white'}
              `}
              title="Voice Input"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Execute command..."
              className="w-full bg-transparent border-none text-gray-800 px-1 py-2 max-h-40 min-h-[36px] focus:outline-none resize-none overflow-y-auto text-[14px] leading-5 placeholder:text-gray-400"
              rows={1}
            />

            <button 
              onClick={handleSend}
              disabled={!input.trim() || status === JarivisStatus.THINKING}
              className={`h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-300 shadow-sm ${
                 input.trim() && status !== JarivisStatus.THINKING
                 ? 'bg-black text-white hover:bg-neutral-800 transform hover:scale-110 active:scale-95'
                 : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
               {status === JarivisStatus.THINKING ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
               ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={input.trim() ? "translate-x-0.5" : ""}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
               )}
            </button>
          </div>
          <div className="text-center mt-3 h-4">
             {status === JarivisStatus.THINKING ? (
               <span className="text-[10px] text-gray-400 animate-pulse tracking-widest uppercase">Neural Processing...</span>
             ) : (
               <span className="text-[10px] text-gray-300 tracking-widest uppercase opacity-50">Sovereign Mode Active</span>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
