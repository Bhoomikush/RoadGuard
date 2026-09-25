import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ChatMessage } from '../components/domain/ChatMessage';
import { supabase } from '../lib/supabase';
import ConeMascot from '../components/ConeMascot';

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
      const { data: { session } } = await supabase.auth.getSession();
      const response = await axios.post('http://127.0.0.1:8000/api/chat', { message: text }, { 
        timeout: 30000,
        headers: session ? { 'Authorization': `Bearer ${session.access_token}` } : {}
      });
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
      <div className="flex flex-col h-[calc(100vh-64px)] max-w-3xl mx-auto pt-6 bg-[#0E1013]">
        {messages.length <= 1 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-4">
              <ConeMascot waving size={80} title="" />
            </div>
            <h1 className="text-2xl font-['Sora',sans-serif] font-bold text-[#F3F4F6] mb-2">Ask RoadGuard AI</h1>
            <p className="text-[#9CA3AF] text-sm mb-8">Ask me anything about road safety, hazards, and reporting.</p>
            
            <div className="flex flex-wrap justify-center gap-3 max-w-lg">
              {suggestedPrompts.map((prompt, i) => (
                <button 
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="text-[13px] font-medium text-[#F3F4F6] bg-[#161A20] hover:bg-[rgba(255,255,255,0.08)] px-4 py-2.5 rounded-full border border-[rgba(255,255,255,0.08)] transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6">
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            
            {isTyping && (
              <div className="flex gap-4">
                <div className="shrink-0 pt-1">
                  <ConeMascot waving={false} size={28} title="" />
                </div>
                <div className="bg-[#161A20] border border-[rgba(255,255,255,0.08)] px-4 py-3.5 rounded-[20px] rounded-bl-none flex items-center gap-1.5 h-10">
                  <div className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-pulse"></div>
                  <div className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-pulse [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-pulse [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        <div className="p-4 sm:p-6 bg-[#0E1013] shrink-0">
          <div className="bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[28px] p-1.5 flex items-center relative shadow-lg">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
              className="relative flex items-center w-full"
            >
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about local road safety..."
                className="w-full bg-[#0E1013] border-none rounded-full py-3.5 pl-6 pr-14 text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none text-base"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isTyping}
                className="absolute right-2 rounded-full w-10 h-10 p-0 flex items-center justify-center bg-[#FFC629] text-[#0E1013] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4 ml-[-2px]" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
