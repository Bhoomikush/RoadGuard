import { Bot, User } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../../types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex gap-4 ${isAssistant ? '' : 'flex-row-reverse'}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
        isAssistant 
          ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' 
          : 'bg-slate-800 border-slate-700 text-slate-300'
      }`}>
        {isAssistant ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
      </div>
      
      <div className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'} max-w-[80%]`}>
        <div className={`px-5 py-3.5 rounded-2xl ${
          isAssistant 
            ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none' 
            : 'bg-teal-600 text-white rounded-tr-none shadow-[0_0_15px_rgba(13,148,136,0.3)]'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        <span className="text-xs text-slate-500 mt-2 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
