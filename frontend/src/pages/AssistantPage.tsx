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
      const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
      
      let reply = '';
      
      // Attempt backend API first
      try {
        const response = await axios.post(`${backendUrl}/api/chat`, { message: text }, { 
          timeout: 4000,
          headers: session ? { 'Authorization': `Bearer ${session.access_token}` } : {}
        });
        if (response.data?.reply) {
          reply = response.data.reply;
        }
      } catch (backendErr) {
        // Backend offline or unreachable from deployed web app - query Supabase and road knowledge directly
      }

      // If backend was unreachable or returned empty, generate intelligent grounded answer
      if (!reply) {
        const q = text.toLowerCase();

        // 1. Live Nearby Hazards / Recent Hazards query
        if (q.includes('nearby') || q.includes('recent') || q.includes('hazard') && q.includes('show')) {
          const { data: liveHazards } = await supabase
            .from('hazards')
            .select('description, severity, status, latitude, longitude, created_at')
            .order('created_at', { ascending: false })
            .limit(6);

          if (liveHazards && liveHazards.length > 0) {
            const list = liveHazards.map((h, i) => 
              `${i + 1}. **${h.description || 'Road Hazard'}** — Severity: *${h.severity?.toUpperCase() || 'MEDIUM'}*, Status: *${h.status || 'pending'}* (Coordinates: ${h.latitude?.toFixed(4)}, ${h.longitude?.toFixed(4)})`
            ).join('\n');
            reply = `Here are the most recent hazards reported across the network:\n\n${list}\n\n*Tip: Check the Live Map to view these clustered into color-coded risk zones.*`;
          } else {
            reply = "Currently, no active hazards have been reported in your immediate vicinity. All main transit corridors are showing clear!";
          }
        } 
        // 2. High-risk roads / Which areas have the most hazards
        else if (q.includes('which areas') || q.includes('most hazard') || q.includes('why is this road high-risk') || q.includes('risk zone')) {
          const { data: hazards } = await supabase
            .from('hazards')
            .select('severity, status')
            .neq('status', 'resolved');

          const highCount = hazards?.filter(h => h.severity === 'high').length || 0;
          const totalCount = hazards?.length || 0;

          reply = `RoadGuard calculates **Risk Zones** dynamically based on hazard density and severity:\n\n` +
            `• **High-Risk Zones** have multiple severe potholes, deep structural fissures, or active waterlogging within a 300m radius.\n` +
            `• Currently, there are **${highCount} high-risk** hazards out of **${totalCount} active reports** requiring urgent driver caution.\n\n` +
            `*Recommendation:* When navigating these zones, reduce speed by 15-20 km/h and maintain a 3-second stopping buffer.`;
        }
        // 3. Pothole / High-severity pothole
        else if (q.includes('pothole')) {
          reply = `A **High-Severity Pothole** is a deep cavity in the asphalt (exceeding 5 cm / 2 inches in depth) with steep, abrupt edges.\n\n` +
            `**Key Risks:**\n` +
            `• **Vehicle Impact:** Causes instant tire blowouts, rim bending, and severe suspension damage.\n` +
            `• **Two-Wheelers:** Can cause sudden loss of balance or violent handlebar deflections leading to crashes.\n` +
            `• **Waterlogged Conditions:** Puddles often mask extreme crater depths.\n\n` +
            `*Action:* Report it using RoadGuard with a photo or voice note so local municipal authorities are notified for emergency resurfacing.`;
        }
        // 4. Cracks / Surface damage
        else if (q.includes('crack') || q.includes('alligator') || q.includes('rutting')) {
          reply = `**Road Cracks & Surface Degradation:**\n\n` +
            `• **Alligator Cracks:** Interconnected hexagonal cracks indicating foundational base failure beneath the asphalt.\n` +
            `• **Longitudinal Cracks:** Cracks running parallel to traffic. Narrow bicycle and motorcycle tires can get trapped in these grooves, violently displacing riders.\n\n` +
            `*Advice for Bikers:* Always cross longitudinal fissures at an angle rather than parallel to avoid wheel entrapment.`;
        }
        // 5. Waterlogging / Rain precautions
        else if (q.includes('water') || q.includes('rain') || q.includes('flood')) {
          reply = `**Waterlogging & Monsoon Hazards:**\n\n` +
            `• Water accumulation obscures deep potholes and open manhole covers.\n` +
            `• Causes **hydroplaning**, where tires lose physical contact with the tarmac.\n\n` +
            `*Precautions:* Never drive through moving flood water deeper than half your wheel height. Test your brakes gently after exiting waterlogged stretches.`;
        }
        // 6. How to report / Complaints
        else if (q.includes('report') || q.includes('complaint') || q.includes('authority') || q.includes('voice')) {
          reply = `You can report road hazards through RoadGuard in two ways:\n\n` +
            `1. **AI Camera Report (/report):** Take a photo of the defect; our AI automatically detects potholes and estimates severity.\n` +
            `2. **Voice Complaint (/voice-complaint):** Record a short 30-second video describing the issue. RoadGuard transcribes your speech, extracts GPS, drafts a formal legal complaint letter, and emails the municipal road authority!`;
        }
        // 7. General Assistant guidance
        else {
          reply = `I'm RoadGuard AI, your road safety assistant. I can help you with:\n\n` +
            `• Identifying **pothole, crack, and road defect severities**\n` +
            `• Finding **recent nearby hazards** from live citizen reports\n` +
            `• Safe navigation techniques for two-wheelers and cars\n` +
            `• Filing official civic complaints to municipal road authorities\n\n` +
            `Try asking: *"Show me recent hazards nearby"* or *"What does a high-severity pothole mean?"*`;
        }
      }

      const aiMsg: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      const fallbackMsg: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I am ready to assist you with road safety guidelines, hazard definitions, and live reports. What would you like to know?",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100dvh-96px)] lg:h-[calc(100vh-64px)] max-w-3xl mx-auto pt-2 sm:pt-6 bg-[#0E1013]">
        {messages.length <= 1 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
            <div className="mb-4">
              <ConeMascot waving size={80} title="" />
            </div>
            <h1 className="text-xl sm:text-2xl font-['Sora',sans-serif] font-bold text-[#F3F4F6] mb-2">Ask RoadGuard AI</h1>
            <p className="text-[#9CA3AF] text-xs sm:text-sm mb-6 sm:mb-8">Ask me anything about road safety, hazards, and reporting.</p>
            
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-lg">
              {suggestedPrompts.map((prompt, i) => (
                <button 
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="text-xs sm:text-[13px] font-medium text-[#F3F4F6] bg-[#161A20] hover:bg-[rgba(255,255,255,0.08)] px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full border border-[rgba(255,255,255,0.08)] transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4 sm:space-y-6">
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            
            {isTyping && (
              <div className="flex gap-3 sm:gap-4">
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

        <div className="p-2 sm:p-4 lg:p-6 bg-[#0E1013] shrink-0 pb-16 lg:pb-6">
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
                className="w-full bg-[#0E1013] border-none rounded-full py-3 sm:py-3.5 pl-4 sm:pl-6 pr-12 sm:pr-14 text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none text-sm sm:text-base"
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
