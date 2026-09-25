import ConeMascot from '../ConeMascot';
import type { ChatMessage as ChatMessageType } from '../../types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex gap-3 sm:gap-4 ${isAssistant ? '' : 'flex-row-reverse'}`}>
      {isAssistant && (
        <div className="shrink-0 pt-1">
          <ConeMascot waving={false} size={28} title="" />
        </div>
      )}
      
      <div className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'} max-w-[85%] sm:max-w-[75%]`}>
        <div className={`px-5 py-3.5 rounded-[20px] ${
          isAssistant 
            ? 'bg-[#161A20] border border-[rgba(255,255,255,0.08)] text-[#F3F4F6] rounded-bl-none' 
            : 'bg-[#FFC629] text-[#0E1013] rounded-br-none'
        }`}>
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        
        {/* Render citation if present */}
        {(message as any).citation && (
          <div className="mt-2 px-3 py-1.5 rounded-full bg-[#0E1013] border border-[rgba(255,255,255,0.08)] text-[#9CA3AF] text-xs">
            {(message as any).citation}
          </div>
        )}
      </div>
    </div>
  );
}
