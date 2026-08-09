import React, { useState, useRef, useEffect } from 'react';
import GeminiAPI from './gemini-api';

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';

function App() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Welcome to Fracturepedia! I\'m your AI-powered fracture reference guide. Ask me anything about fractures, diagnoses, treatments, or medical imaging.',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const messagesEndRef = useRef(null);
  const geminiAPI = useRef(new GeminiAPI(GEMINI_API_KEY));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setShowInstallPrompt(true);
    });
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const aiResponse = await geminiAPI.current.askFracturepedia(inputValue);
      
      const aiMessage = {
        id: messages.length + 2,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: messages.length + 2,
        text: `Error: ${error.message}. Please try again.`,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🏥 Fracturepedia</h1>
        <p>AI-Powered Fracture Reference</p>
        {showInstallPrompt && (
          <button className="install-btn" onClick={() => setShowInstallPrompt(false)}>
            📱 Install App
          </button>
        )}
      </header>

      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message message-${message.sender}`}
          >
            <div className="message-avatar">
              {message.sender === 'ai' ? '🤖' : '👤'}
            </div>
            <div className="message-content">
              <p>{message.text}</p>
              <span className="message-time">
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message message-ai">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <textarea
          className="message-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about fractures, diagnosis, treatment..."
          rows="3"
          disabled={isLoading}
        />
        <button
          className="send-btn"
          onClick={handleSendMessage}
          disabled={isLoading || !inputValue.trim()}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default App;
