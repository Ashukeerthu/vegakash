import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendChatMessage, ChatResponse } from '../services/expenseService';
import './Chatbot.css';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'failed';
  retryCount?: number;
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

// Market-standard quick replies for better UX
const QUICK_REPLIES = [
  "💰 Total spending this month",
  "📊 Category breakdown", 
  "💡 Savings suggestions",
  "📈 Spending trends",
  "🎯 Budget advice",
  "❓ Help me with finances"
];

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm VegaKash AI 🤖\n\nI'm your personal financial assistant powered by advanced AI. I can help you with:\n\n💰 Expense analysis\n📊 Spending insights\n💡 Savings recommendations\n📈 Budget optimization\n\nWhat would you like to know about your finances?",
      isUser: false,
      timestamp: new Date(),
      status: 'sent'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'offline'>('connected');
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Enhanced scroll to bottom with animation
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  }, []);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);

  // Focus input when chatbot opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300); // Delay to ensure modal animation completes
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Enhanced message sending with retry logic
  const sendMessage = useCallback(async (messageText: string, retryCount = 0): Promise<void> => {
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText.trim(),
      isUser: true,
      timestamp: new Date(),
      status: 'sending'
    };

    // Add user message immediately
    setMessages(prev => [...prev, { ...userMessage, status: 'sent' }]);
    setIsLoading(true);
    setConnectionStatus('connecting');
    setShowQuickReplies(false);

    try {
      const response: ChatResponse = await sendChatMessage(messageText);
      setConnectionStatus('connected');
      
      // Enhanced AI response formatting
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        isUser: false,
        timestamp: new Date(response.timestamp),
        status: 'sent'
      };

      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setConnectionStatus('offline');
      
      // Retry logic for better reliability
      if (retryCount < 2) {
        setTimeout(() => {
          sendMessage(messageText, retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      // Final fallback message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting right now 😔\n\nPlease check your internet connection and try again. If the problem persists, you can still use the app offline with basic features.",
        isUser: false,
        timestamp: new Date(),
        status: 'failed',
        retryCount
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const message = inputMessage;
    setInputMessage('');
    await sendMessage(message);
  }, [inputMessage, isLoading, sendMessage]);

  const handleQuickReply = useCallback(async (reply: string) => {
    let message = "";
    
    // Map quick replies to more conversational queries
    switch (reply) {
      case "💰 Total spending this month":
        message = "How much have I spent this month?";
        break;
      case "📊 Category breakdown":
        message = "Show me my spending breakdown by category";
        break;
      case "💡 Savings suggestions":
        message = "Give me some personalized savings suggestions";
        break;
      case "📈 Spending trends":
        message = "What are my spending patterns and trends?";
        break;
      case "🎯 Budget advice":
        message = "How can I better manage my budget?";
        break;
      case "❓ Help me with finances":
        message = "What financial advice do you have for me?";
        break;
      default:
        message = reply;
    }
    
    await sendMessage(message);
  }, [sendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }, []);

  // Enhanced message formatting for better readability
  const formatMessage = useCallback((text: string) => {
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  }, []);

  if (!isOpen) return null;

  return (
    <div className="chatbot-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="chatbot-container">
        {/* Enhanced Header with Connection Status */}
        <div className="chatbot-header">
          <div className="chatbot-header-content">
            <div className="chatbot-avatar">
              <span className="avatar-emoji">🤖</span>
              <div className={`connection-indicator ${connectionStatus}`}></div>
            </div>
            <div className="chatbot-title">
              <h3>VegaKash AI</h3>
              <span className="chatbot-status">
                {connectionStatus === 'connected' && '🟢 Online'}
                {connectionStatus === 'connecting' && '🟡 Connecting...'}
                {connectionStatus === 'offline' && '🔴 Offline'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="chatbot-close" aria-label="Close chat">
            ×
          </button>
        </div>

        {/* Enhanced Messages Container */}
        <div className="chatbot-messages" ref={chatContainerRef}>
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.isUser ? 'user-message' : 'ai-message'} ${message.status || ''}`}
            >
              <div className="message-content">
                <div className="message-text">
                  {formatMessage(message.text)}
                </div>
                <div className="message-meta">
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                  {message.status === 'failed' && (
                    <button 
                      className="retry-btn"
                      onClick={() => sendMessage(message.text)}
                      aria-label="Retry message"
                    >
                      🔄 Retry
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Enhanced Typing Indicator */}
          {isLoading && (
            <div className="message ai-message typing">
              <div className="message-content">
                <div className="typing-indicator">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="typing-text">VegaKash AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Quick Replies inside messages area */}
          {showQuickReplies && messages.length <= 1 && (
            <div className="quick-replies-in-messages">
              <div className="quick-replies-title">💡 Quick actions:</div>
              <div className="quick-replies-container">
                {QUICK_REPLIES.map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickReply(reply)}
                    className="quick-reply-btn"
                    disabled={isLoading}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Enhanced Input Area - Fixed to Bottom */}
        <div className="chatbot-input">
          <div className="input-container">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isLoading ? "Processing..." : "Ask about your finances..."}
              disabled={isLoading}
              className="message-input"
              maxLength={500}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="send-button"
              aria-label="Send message"
            >
              {isLoading ? (
                <div className="loading-spinner-small"></div>
              ) : (
                <span className="send-icon">➤</span>
              )}
            </button>
          </div>
          {inputMessage.length > 400 && (
            <div className="character-count">
              {inputMessage.length}/500
            </div>
          )}
        </div>

        {/* Help Footer */}
        <div className="chatbot-footer">
          <div className="powered-by">
            Powered by OpenAI GPT-4 • <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;