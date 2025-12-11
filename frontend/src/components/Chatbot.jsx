import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets'; // Import assets của dự án Prescripto (để lấy ảnh logo/avatar)

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            text: "Xin chào! 👋\nTôi là Trợ lý ảo Prescripto.\nBạn cần tìm bác sĩ chuyên khoa nào hay muốn đặt lịch hẹn?",
            isUser: false
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // URL Backend
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { text: input, isUser: true };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const { data } = await axios.post(`${backendUrl}/api/user/chat-ai`, {
                question: userMessage.text
            });

            if (data.success) {
                setMessages(prev => [...prev, { text: data.reply, isUser: false }]);
            } else {
                toast.error(data.message);
                setMessages(prev => [...prev, { text: "Hệ thống đang bảo trì, vui lòng thử lại sau.", isUser: false }]);
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { text: "Lỗi kết nối!", isUser: false }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 font-sans">

            {/* KHUNG CHAT (Responsive: w-full trên mobile, w-96 trên PC) */}
            {isOpen && (
                <div className="w-[90vw] sm:w-96 h-[80vh] sm:h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-fade-in-up">

                    {/* Header: Gradient đẹp hơn */}
                    <div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white p-4 flex justify-between items-center shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                <img src={assets.logo} alt="Bot" className="w-6 h-6 object-contain" /> {/* Dùng logo Prescripto */}
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Trợ lý Prescripto</h3>
                                <p className="text-xs text-indigo-100 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Online
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 scroll-smooth">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex gap-2 mb-4 ${msg.isUser ? 'flex-row-reverse' : 'flex-row'}`}>

                                {/* Avatar nhỏ bên cạnh tin nhắn */}
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border 
                  ${msg.isUser ? 'bg-indigo-100 border-indigo-200' : 'bg-white border-gray-200'}`}>
                                    {msg.isUser ? '👤' : '🤖'}
                                </div>

                                {/* Bong bóng chat */}
                                <div
                                    className={`max-w-[75%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-line
                    ${msg.isUser
                                            ? 'bg-indigo-600 text-white rounded-tr-none'
                                            : 'bg-white text-gray-700 border border-gray-200 rounded-tl-none'
                                        }`}
                                >
                                    {/* Hàm render text để in đậm các từ khóa nếu cần */}
                                    {msg.text}
                                </div>
                            </div>
                        ))}

                        {/* Loading Indicator (3 chấm nhảy) */}
                        {isLoading && (
                            <div className="flex gap-2 items-center text-xs text-gray-500 ml-10">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                                </div>
                                Đang soạn tin...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer Input */}
                    <div className="p-3 bg-white border-t border-gray-100">
                        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 border border-transparent focus-within:border-indigo-400 focus-within:bg-white transition-all">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Nhập câu hỏi..."
                                className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className={`p-2 rounded-full text-white transition-all transform hover:scale-105 active:scale-95
                  ${isLoading || !input.trim() ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-800'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* NÚT TOGGLE CÓ TOOLTIP */}
            <div className="group relative">
                {!isOpen && (
                    <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Chat với AI
                    </span>
                )}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xl shadow-indigo-300 flex items-center justify-center hover:shadow-2xl hover:scale-110 transition-all duration-300"
                >
                    {isOpen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ChatBot;