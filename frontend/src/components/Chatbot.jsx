import React, { useState, useRef, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

// Import Modal Wrapper mới (chứa QuickBookingForm)
import BookingModalWrapper from '../pages/HomePage/BookingModelWrapper'; // Đảm bảo đường dẫn đúng file bạn lưu

const ChatBot = () => {
    const navigate = useNavigate();
    const { backendUrl, token } = useContext(AppContext);

    // --- STATE ---
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            text: "Xin chào! 👋\nTôi là Trợ lý ảo Prescripto.\nBạn cần tìm bác sĩ chuyên khoa nào hay muốn đặt lịch hẹn?",
            isUser: false
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // State cho Modal Đặt lịch mới
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [bookingInitialData, setBookingInitialData] = useState(null);

    const messagesEndRef = useRef(null);

    // --- EFFECTS ---
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // --- HANDLERS ---

    // Xử lý phím tắt: Enter để gửi, Shift+Enter để xuống dòng
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Ngăn xuống dòng mặc định
            handleSend();
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { text: input, isUser: true };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput("");
        setIsLoading(true);

        try {
            // Lấy lịch sử 6 tin gần nhất để AI hiểu ngữ cảnh
            const historyText = newMessages
                .slice(-6)
                .map(msg => msg.isUser ? `Khách: ${msg.text}` : `Trợ lý: ${msg.text}`)
                .join('\n');

            const { data } = await axios.post(
                `${backendUrl}/api/user/chat-ai`,
                { question: userMessage.text, history: historyText },
                { headers: { token: token } }
            );

            if (data.success) {
                setMessages(prev => [...prev, { text: data.reply, isUser: false }]);

                // ACTION: Mở form đặt lịch
                if (data.action === "OPEN_GUEST_PAYMENT_MODAL") {

                    // 1. Lưu dữ liệu AI trích xuất được
                    setBookingInitialData(data.bookingData);
                    console.log(data.bookingdata)
                    // 2. Mở Modal chứa QuickBookingForm
                    setTimeout(() => {
                        setIsBookingModalOpen(true);
                    }, 1000);
                }

                // ACTION: Redirect (Dành cho user đã đăng nhập)
                if (data.action === "REDIRECT_TO_MY_APPOINTMENTS") {
                    setTimeout(() => {
                        setIsOpen(false);
                        navigate('/my-appointments');
                        toast.info("Đang chuyển hướng đến lịch hẹn...");
                    }, 1500);
                }

                // ACTION: Hủy lịch
                if (data.action === "CANCEL_APPOINTMENT") {
                    setTimeout(() => {
                        setIsOpen(false);
                        toast.success("Đã hủy lịch hẹn thành công!");
                        if (window.location.pathname === '/my-appointments') {
                            window.location.reload();
                        } else {
                            navigate('/my-appointments');
                        }
                    }, 2000);
                }

            } else {
                toast.error(data.message || "Có lỗi từ phía AI server.");
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { text: "Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.", isUser: false }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 font-sans">

            {/* --- KHUNG CHAT --- */}
            {isOpen && (
                <div className="w-[90vw] sm:w-96 h-[80vh] sm:h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-fade-in-up transition-all">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white p-4 flex justify-between items-center shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                                <img src={assets.logo} alt="Bot" className="w-5 h-5 object-contain" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Trợ lý Prescripto</h3>
                                <p className="text-[10px] text-indigo-100 flex items-center gap-1 opacity-90">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white hover:rotate-90 transition-all duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Body: Danh sách tin nhắn */}
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 scroll-smooth">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex gap-2 mb-4 ${msg.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border shadow-sm
                                    ${msg.isUser ? 'bg-indigo-100 border-indigo-200' : 'bg-white border-gray-200'}`}>
                                    {msg.isUser ? '👤' : '🤖'}
                                </div>

                                {/* Bong bóng chat */}
                                <div className={`max-w-[75%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap break-words
                                    ${msg.isUser
                                        ? 'bg-indigo-600 text-white rounded-tr-none'
                                        : 'bg-white text-gray-700 border border-gray-200 rounded-tl-none'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}

                        {/* Loading Animation */}
                        {isLoading && (
                            <div className="flex gap-2 items-center text-xs text-gray-400 ml-10 mb-2">
                                <div className="flex space-x-1">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                                </div>
                                <span>Đang trả lời...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer Input Area */}
                    <div className="p-3 bg-white border-t border-gray-100">
                        <div className="flex items-end gap-2 bg-gray-100 rounded-3xl px-4 py-2 border border-transparent focus-within:border-indigo-400 focus-within:bg-white focus-within:shadow-sm transition-all">
                            {/* Đổi Input thành Textarea để hỗ trợ xuống dòng */}
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Nhập câu hỏi..."
                                className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 resize-none max-h-24 py-2"
                                rows={1}
                                style={{ minHeight: '24px' }}
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className={`p-2 rounded-full mb-0.5 transition-all transform hover:scale-110 active:scale-95
                                    ${isLoading || !input.trim() ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:bg-indigo-50'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- NÚT BẬT/TẮT CHATBOT --- */}
            <div className="group relative">
                {!isOpen && (
                    <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs font-medium px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                        Chat với AI
                    </span>
                )}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-lg shadow-indigo-300 flex items-center justify-center hover:shadow-xl hover:scale-105 transition-all duration-300"
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

            {/* --- MODAL WRAPPER (CHỨA QUICK BOOKING FORM) --- */}
            {/* Đây là phần quan trọng nhất: Mở form đặt lịch thay vì tự xử lý payment */}
            <BookingModalWrapper
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                dataFromChat={bookingInitialData} // Truyền dữ liệu AI đã trích xuất vào form
            />

        </div>
    );
};

export default ChatBot;