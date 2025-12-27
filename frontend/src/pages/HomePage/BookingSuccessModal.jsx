import React from 'react';

const BookingSuccessModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-sm w-full text-center animate-fade-in-up transform transition-all scale-100">

                {/* Icon Success (Dấu tích xanh) */}
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>

                {/* Tiêu đề */}
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Thành công!</h3>

                {/* Nội dung thông báo */}
                <p className="text-gray-600 mb-6">
                    Bạn đã đặt lịch thành công.<br />
                    Chúng tôi sẽ liên lạc với bạn sớm nhất.
                </p>

                {/* Nút đóng */}
                <button
                    onClick={onClose}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                >
                    OK, Đã hiểu
                </button>
            </div>
        </div>
    );
};

export default BookingSuccessModal;