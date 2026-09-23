import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, Sparkles } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ChatMessage } from '../components/domain/ChatMessage';
import { Button } from '../components/ui/Button';
import type { ChatMessage as ChatMessageType } from '../types';

export function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m RoadGuard AI. I can help you understand road hazards, risk zones, and road-safety information in your area. How can I assist you today?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    "Why is this road high-risk?",
    "Which areas have the most hazards?",
    "What does a high-severity pothole mean?",
    "Show me recent hazards nearby."
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    const userMsg: ChatMessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/chat', { message: text }, { timeout: 30000 });
      const aiMsg: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.reply,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I couldn't process that request. Please try again.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-64px)] max-w-4xl mx-auto py-6">
        <div className="mb-6 text-center">
          <div className="w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(20,184,166,0.15)]">
            <Bot className="w-8 h-8 text-teal-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-50 mb-1">RoadGuard AI</h1>
          <p className="text-slate-400">Ask questions about road safety, hazards, and risk zones.</p>
        </div>

        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            
            {isTyping && (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-slate-900 border border-slate-800 px-5 py-4 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-950/50">
            {messages.length === 1 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-700 transition-colors flex items-center"
                  >
                    <Sparkles className="w-3 h-3 mr-1.5 text-teal-500" />
                    {prompt}
                  </button>
                ))}
              </div>
            )}
            
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
              className="relative flex items-center"
            >
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about local road safety..."
                className="w-full bg-slate-900 border border-slate-700 rounded-full py-4 pl-6 pr-16 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-inner transition-all"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isTyping}
                className="absolute right-2 rounded-full w-10 h-10 p-0 flex items-center justify-center bg-gradient-to-r from-teal-500 to-teal-400 text-slate-900 hover:from-teal-400 hover:to-teal-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
              >
                <Send className="w-4 h-4 ml-[-2px] text-slate-900" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
