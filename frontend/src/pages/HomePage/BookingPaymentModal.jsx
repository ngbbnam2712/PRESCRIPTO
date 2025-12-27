import React, { useState } from 'react';
import { toast } from 'react-toastify';

const BookingPaymentModal = ({ isOpen, onClose, doctor, onConfirm }) => {

    if (!isOpen) return null;

    const [isProcessing, setIsProcessing] = useState(false);

    const fees = doctor ? doctor.fees : 0;
    const docName = doctor ? doctor.name : "Doctor Appointment";

    // Hàm xử lý khi nhấn nút Thanh toán
    const handlePayClick = async () => {
        setIsProcessing(true);
        try {
            // Gọi hàm onConfirm từ component cha (QuickBookingForm)
            // Hàm này sẽ gọi API Backend để lấy link PayPal và redirect
            await onConfirm();
        } catch (error) {
            console.error(error);
            toast.error("Failed to initiate payment");
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">

                {/* Header */}
                <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
                    <h3 className="text-xl font-bold text-gray-800">Review & Pay</h3>
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="text-gray-400 hover:text-red-500 text-2xl font-bold disabled:opacity-50"
                    >
                        &times;
                    </button>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 mb-6 flex flex-col gap-2">
                    <div className='flex justify-between'>
                        <span className="text-gray-600 text-sm">Doctor:</span>
                        <span className="text-gray-900 font-semibold">{docName}</span>
                    </div>
                    <div className='flex justify-between'>
                        <span className="text-gray-600 text-sm">Specialty:</span>
                        <span className="text-gray-900 font-semibold">{doctor?.speciality || 'General'}</span>
                    </div>
                    <div className="my-2 border-t border-blue-200 border-dashed"></div>
                    <div className="flex justify-between items-end">
                        <span className="text-gray-700 font-bold">Total Due:</span>
                        <span className="text-3xl font-bold text-green-600">${fees}</span>
                    </div>
                </div>

                {/* --- NÚT THANH TOÁN (REDIRECT FLOW) --- */}
                <div className="w-full relative z-0">
                    <button
                        onClick={handlePayClick}
                        disabled={isProcessing}
                        className={`w-full py-4 rounded-lg font-bold text-lg shadow-md transition-all flex justify-center items-center gap-2
                            ${isProcessing
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-[#FFC439] hover:bg-[#F4BB29] text-blue-900' // Màu vàng chuẩn PayPal
                            }
                        `}
                    >
                        {isProcessing ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Redirecting to PayPal...
                            </>
                        ) : (
                            <>
                                {/* Logo PayPal Text hoặc Icon đơn giản */}
                                <span className='italic font-serif font-black'>Pay with PayPal</span>
                            </>
                        )}
                    </button>
                </div>

                <p className="text-center text-xs text-gray-500 mt-3">
                    You will be redirected to PayPal to complete your purchase securely.
                </p>

                {/* Cancel Button */}
                <button
                    onClick={onClose}
                    disabled={isProcessing}
                    className="w-full mt-4 py-2 text-gray-400 hover:text-gray-600 text-xs uppercase font-bold tracking-wider disabled:opacity-50"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default BookingPaymentModal;