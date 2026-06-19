import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  ArrowLeft, 
  MessageSquare, 
  CheckCheck, 
  HelpCircle,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Smile
} from 'lucide-react';
import { ChatConversation, Message } from '../types';

interface ChatTabProps {
  conversations: ChatConversation[];
  activeConversationId: string | null;
  onSetActiveConversationId: (id: string | null) => void;
  onSendMessage: (conversationId: string, text: string, sender: 'user' | 'other', type?: 'text' | 'image' | 'video', content?: string) => void;
  onExitChat?: () => void;
}

export default function ChatTab({ 
  conversations, 
  activeConversationId, 
  onSetActiveConversationId, 
  onSendMessage,
  onExitChat
}: ChatTabProps) {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeChat = conversations.find(c => c.id === activeConversationId);

  // Scroll to bottom when chat opens or new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages.length, activeConversationId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversationId) return;

    const messageContent = inputText.trim();
    // Send user message
    onSendMessage(activeConversationId, messageContent, 'user');
    setInputText('');
  };

  return (
    <div id="chat-tab-container" className="flex h-full bg-slate-50 overflow-hidden">
      <AnimatePresence mode="wait">
        {!activeConversationId ? (
          /* Conversation Sidebar List */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex flex-col h-full bg-white"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-white flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-slate-700" />
                  Interactions
                </h2>
                <p className="text-xs text-slate-500 mt-1">Connect with contract candidates, sellers, or gig seekers</p>
              </div>
              {onExitChat && (
                <button
                  type="button"
                  onClick={onExitChat}
                  className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-semibold select-none cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Exit Chat</span>
                </button>
              )}
            </div>

            {/* Conversation List */}
            <div id="conversation-scrolled-list" className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-slate-50 rounded-2xl m-4 border border-dashed border-slate-200">
                  <div className="p-4 bg-white rounded-full mb-3 text-slate-300 shadow-xs">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">No active discussions</p>
                  <p className="text-xs text-slate-400 mt-1">Start a conversation from the Gigs list or the Market catalog!</p>
                </div>
              ) : (
                conversations.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => onSetActiveConversationId(chat.id)}
                    className="w-full text-left p-4 rounded-xl hover:bg-slate-50/80 active:bg-slate-100 transition-colors cursor-pointer flex items-center gap-3.5 focus:outline-none"
                  >
                    {/* Participant Circle Avatar */}
                    <div className="relative">
                      <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-700">
                        {chat.title.charAt(0)}
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-950 text-sm truncate">{chat.title}</span>
                        <span className="text-[10px] text-slate-400 leading-none">{chat.lastMessageTime}</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 truncate block mt-0.5 uppercase tracking-wide">
                        {chat.subtitle}
                      </span>
                      <p className="text-xs text-slate-500 truncate mt-1">
                        {chat.lastMessageText}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          /* Active Chat Thread Timeline */
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full flex flex-col h-full bg-slate-55"
          >
            {/* Thread Header */}
            <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between z-10 shadow-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onSetActiveConversationId(null)}
                  className="p-2 -ml-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                    {activeChat?.title.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-950 tracking-tight leading-none">
                      {activeChat?.title}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-semibold block mt-1 leading-none uppercase">
                      {activeChat?.subtitle}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-slate-700">
                <div className="px-2 py-1 bg-slate-50 rounded-lg text-[9px] font-bold text-slate-500 uppercase tracking-widest border border-slate-100">
                  Secure Socket
                </div>
              </div>
            </div>

            {/* Conversation Log Space */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50">
              <div className="text-center py-2">
                <span className="px-3 py-1 bg-slate-100 text-[10px] font-medium text-slate-500 rounded-full border border-slate-200">
                  System initiated connection
                </span>
              </div>

              {activeChat?.messages.map((msg, index) => {
                const isUser = msg.senderId === 'user';
                return (
                  <div
                    key={msg.id || index}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-xs border ${
                        isUser
                          ? 'bg-slate-900 border-slate-950 text-white rounded-br-none'
                          : 'bg-white border-slate-100 text-slate-800 rounded-bl-none'
                      }`}
                    >
                      <p>{msg.text}</p>
                      
                      <div className={`flex items-center gap-1 justify-end mt-1.5 text-[9px] ${
                        isUser ? 'text-slate-400' : 'text-slate-400'
                      }`}>
                        <span>{msg.timestamp || 'Just now'}</span>
                        {isUser && <CheckCheck className="w-3 h-3 text-emerald-400" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Simulated Typist Indicator (when typing) */}
            {/* Chat Entry Composer */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex items-center gap-3">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    onSendMessage(activeConversationId!, '', 'user', file.type.startsWith('image/') ? 'image' : 'video', reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }} />
              <button 
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Smile className="w-5 h-5" />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-20 left-4 bg-white border border-slate-200 rounded-xl shadow-lg p-3 grid grid-cols-5 gap-2 w-48 z-10">
                  {['😊', '😂', '😍', '😎', '🤩', '👍', '🔥', '🚀', '🎉', '💡', '❤️', '🙌', '✨', '👏', '🎵'].map(emoji => (
                    <button key={emoji} onClick={() => { setInputText(prev => prev + emoji); setShowEmojiPicker(false); }} className="hover:bg-slate-100 p-1 rounded">
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              <button                
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={`Write a message to ${activeChat?.title}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-400 transition-colors text-slate-800"
                />
              </div>
              <button
                type="submit"
                disabled={!inputText.trim()}
                className={`p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  inputText.trim() 
                    ? 'bg-slate-950 text-white hover:bg-slate-800 shadow-sm' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
