import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  User,
  ShieldCheck,
  Bot,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';
import api from '../../services/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const AIAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Greetings ${user?.full_name || 'there'}! I am your RakshaPay AI Financial Assistant, backed by Google Gemini. I am here to provide real-time cybersecurity advice, explain UPI fraud patterns, and help protect your simulated transactions. What security or payment question can I assist you with today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickPrompts = [
    'Do I ever need to enter my UPI PIN to receive money?',
    'Why was my transaction blocked with a high risk score?',
    'How do I spot a tampered or malicious QR code?',
    'What is the difference between Approved, Pending, and Blocked?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const newMsgs: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(newMsgs);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.post<{ reply: string; model: string }>('/ai/chat', {
        messages: newMsgs,
      });

      setMessages([...newMsgs, { role: 'assistant', content: res.data.reply }]);
    } catch (err: any) {
      setMessages([
        ...newMsgs,
        {
          role: 'assistant',
          content:
            'I encountered a temporary connection issue reaching the AI security service. Critical reminder: Never enter your UPI PIN or OTP to receive money from anyone.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Bot className="w-5 h-5 text-[#D4AF37]" />
          <span className="text-xs font-bold uppercase tracking-widest text-[#F5D78E]">
            Google Gemini Conversational AI
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          AI Financial & Security Assistant
        </h1>
        <p className="text-xs sm:text-sm text-[#A5AAA5]">
          Get financial safety guidance, scam prevention suggestions, and instant explanations of fraud alerts.
        </p>
      </div>

      {/* Main Chat Box */}
      <GlassCard className="p-0 flex flex-col h-[560px] overflow-hidden">
        {/* Chat History Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-9 h-9 rounded-2xl bg-[#080909] border border-[#D4AF37]/40 flex items-center justify-center shrink-0 shadow-glow-gold">
                    <Bot className="w-4 h-4 text-[#F5D78E]" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-3xl p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-lg ${
                    isUser
                      ? 'gold-button text-[#080909] font-bold shadow-glow-gold'
                      : 'bg-[#080909] border border-[#D4AF37]/30 text-white'
                  }`}
                >
                  {msg.content}
                </div>

                {isUser && (
                  <div className="w-9 h-9 rounded-2xl bg-[#121414] border border-[#D4AF37]/35 flex items-center justify-center shrink-0 text-[#F5D78E]">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-9 h-9 rounded-2xl bg-[#080909] border border-[#D4AF37]/40 flex items-center justify-center shrink-0 shadow-glow-gold">
                <Bot className="w-4 h-4 text-[#F5D78E] animate-pulse" />
              </div>
              <div className="bg-[#080909] border border-[#D4AF37]/30 rounded-3xl p-4 text-xs text-[#A5AAA5] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F5D78E] animate-ping" />
                <span>Gemini is generating verified security guidance...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="p-3 bg-[#080909] border-t border-white/10 flex items-center gap-2 overflow-x-auto">
          <Lightbulb className="w-4 h-4 text-[#F5D78E] shrink-0" />
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(p)}
              className="px-3 py-1.5 rounded-xl bg-[#121414] hover:bg-[#1c1f1f] border border-[#D4AF37]/25 text-[11px] text-[#A5AAA5] hover:text-[#F5D78E] whitespace-nowrap transition-all shadow-sm"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 sm:p-4 bg-[#080909] border-t border-white/10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about payment safety, collect fraud, QR tampering..."
              className="flex-1 px-4 py-3.5 bg-[#121414] border border-[#D4AF37]/35 rounded-2xl text-xs sm:text-sm text-white placeholder-[#A5AAA5]/50 focus:outline-none focus:border-[#F5D78E] focus:shadow-glow-gold"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="gold-button p-3.5 rounded-2xl disabled:opacity-50 shadow-glow-gold cursor-pointer"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </GlassCard>
    </div>
  );
};
