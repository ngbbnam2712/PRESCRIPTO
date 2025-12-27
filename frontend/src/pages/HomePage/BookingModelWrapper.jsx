import React from 'react';
import QuickBookingForm from './QuickBookingForm'; // Import form cũ của bạn

const BookingModalWrapper = ({ isOpen, onClose, dataFromChat }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            {/* Container của Modal */}
            <div className="relative w-full max-w-lg mx-4">

                {/* Gọi lại QuickBookingForm và truyền dữ liệu vào */}
                <QuickBookingForm
                    initialData={dataFromChat} // Truyền dữ liệu guestList vào đây
                    onCloseModal={onClose}     // Truyền hàm đóng modal
                />

            </div>
        </div>
    );
};

export default BookingModalWrapper;