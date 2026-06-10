import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import axios from 'axios';

const Chat = () => {
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Hello! I am the Engineering Intelligence Hub. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Add empty bot message initially
      setMessages(prev => [...prev, { role: 'bot', content: '', sources: [] }]);
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content })
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      setLoading(false); // Remove loading spinner since stream has started

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (!dataStr) continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.error) throw new Error(data.error);
              
              setMessages(prev => {
                const newMessages = [...prev];
                const lastIndex = newMessages.length - 1;
                // Shallow copy the last message object to avoid mutating previous state
                const lastMsg = { ...newMessages[lastIndex] };
                
                if (data.type === 'sources') {
                  lastMsg.sources = data.sources;
                } else if (data.type === 'chunk') {
                  lastMsg.content += data.text;
                }
                
                newMessages[lastIndex] = lastMsg;
                return newMessages;
              });
            } catch (err) {
              console.error("Error parsing JSON chunk", err);
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg.role === 'bot' && lastMsg.content === '') {
          lastMsg.content = 'Sorry, I encountered an error while processing your request.';
        }
        return newMessages;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Engineering Intelligence Hub</h1>
      </div>
      
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="avatar">
              {msg.role === 'bot' ? <Bot size={24} color="var(--accent-color)" /> : <User size={24} color="#fff" />}
            </div>
            <div className="message-content">
              {msg.role === 'bot' ? (
                <>
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                  
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="sources-list">
                      <strong>Sources:</strong>
                      <div>
                        {Array.from(new Set(msg.sources.map(s => s.source))).map((source, i) => (
                          <span key={i} className="source-item">{source}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message bot">
            <div className="avatar">
              <Bot size={24} color="var(--accent-color)" />
            </div>
            <div className="message-content" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Loader className="lucide-spin" size={18} /> Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form className="input-form" onSubmit={handleSend}>
          <input 
            type="text" 
            placeholder="Ask about architecture, codebase, or incidents..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="send-btn" disabled={loading || !input.trim()}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
