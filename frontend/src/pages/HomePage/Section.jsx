import React from 'react';
import { useNavigate } from 'react-router-dom';

// --- 1. ĐỊNH NGHĨA ICON SVG TRỰC TIẾP (Giữ nguyên) ---
const ArrowIcon = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
        stroke="currentColor"
        className={className}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
);

// --- 2. MŨI TÊN PHẢI (NEXT) - (Giữ nguyên) ---
export const SectionNextArrow = (props) => {
    const { onClick } = props;
    return (
        <div
            onClick={onClick}
            className="group absolute top-1/2 -translate-y-1/2 -right-3 md:-right-5 z-10 
                 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center
                 bg-white border border-gray-300 rounded-full shadow-md 
                 cursor-pointer transition-all duration-300
                 hover:shadow-lg hover:border-primary hover:bg-gray-50"
        >
            <ArrowIcon className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors duration-300" />
        </div>
    );
};

// --- 3. MŨI TÊN TRÁI (PREV) - (Giữ nguyên) ---
export const SectionPrevArrow = (props) => {
    const { onClick } = props;
    return (
        <div
            onClick={onClick}
            className="group absolute top-1/2 -translate-y-1/2 -left-3 md:-left-5 z-10 
                 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center
                 bg-white border border-gray-300 rounded-full shadow-md 
                 cursor-pointer transition-all duration-300
                 hover:shadow-lg hover:border-primary hover:bg-gray-50"
        >
            <ArrowIcon className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors duration-300 rotate-180" />
        </div>
    );
};

// --- 4. SECTION CHÍNH ---
const Section = ({
    title,
    btnText = "Xem thêm", // Sửa thành tiếng Anh
    bgColor = "bg-white",
    children,
    onBtnClick,
    seeMoreLink, // Thêm prop link
    className = ""
}) => {
    const navigate = useNavigate();


    const handleBtnClick = () => {
        if (seeMoreLink) {
            navigate(seeMoreLink); // Ưu tiên chuyển trang nếu có link
        } else if (onBtnClick) {
            onBtnClick(); // Nếu không có link thì chạy hàm callback cũ
        }
    };

    return (
        <div className={`${bgColor} py-8 border-b border-gray-100 ${className}`}>
            <div className="max-w-6xl mx-auto px-4">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 uppercase leading-snug tracking-wide">{title}</h2>

                    {/* Chỉ hiện nút nếu có link hoặc hàm xử lý click */}
                    {(seeMoreLink || onBtnClick) && (
                        <button
                            onClick={handleBtnClick}
                            className="hidden md:block text-sm font-semibold text-gray-600 bg-[#ebebeb] hover:bg-[#ffc107] hover:text-black px-4 py-2.5 rounded uppercase transition duration-300"
                        >
                            {btnText}
                        </button>
                    )}
                </div>

                <div className="relative px-2">
                    {children}
                </div>

            </div>
        </div>
    );
};

export default Section;