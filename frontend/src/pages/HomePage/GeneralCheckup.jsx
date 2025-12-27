import React from 'react';
import Slider from "react-slick";
import Section, { SectionNextArrow, SectionPrevArrow } from './Section';
import { assets } from '../../assets/assets.js';
import { useNavigate } from 'react-router-dom';

const GeneralCheckup = () => {
    const navigate = useNavigate();

    // Dữ liệu cũ
    const checkupData = [
        { id: 1, title: "Basic Checkup", image: assets.header_img }, // Lưu ý: Nên thay bằng icon/ảnh phù hợp nếu có
        { id: 2, title: "Advanced Checkup", image: assets.header_img },
        { id: 3, title: "VIP Checkup", image: assets.header_img },
        { id: 4, title: "Men's Health", image: assets.header_img },
        { id: 5, title: "Women's Health", image: assets.header_img },
        { id: 6, title: "Pediatrics", image: assets.header_img },
        { id: 7, title: "Geriatrics", image: assets.header_img },
    ];

    // Cấu hình Settings giống hệt Specialty
    const settings = {
        dots: false,
        infinite: false,
        speed: 500,
        slidesToShow: 4,
        slidesToScroll: 1,
        nextArrow: <SectionNextArrow />,
        prevArrow: <SectionPrevArrow />,
        responsive: [
            { breakpoint: 1024, settings: { slidesToShow: 3 } },
            { breakpoint: 768, settings: { slidesToShow: 2 } },
            { breakpoint: 480, settings: { slidesToShow: 1 } }
        ]
    };

    return (
        <Section
            title="General Checkup"
            bgColor="bg-gray-50"
        >
            <div className="px-2">
                <Slider {...settings}>
                    {checkupData.map((item, index) => (
                        <div
                            key={index}
                            className="px-2 py-3 outline-none cursor-pointer"
                            onClick={() => {
                                scrollTo(0, 0);
                                const slug = item.title.toLowerCase().split(' ').join('-');
                                navigate(`/nurse/${slug}`);
                            }}
                        >
                            {/* --- CARD GIAO DIỆN THEO STYLE SPECIALTY --- */}
                            <div className="border border-gray-100 bg-white rounded-xl p-4 flex flex-col items-center text-center hover:shadow-lg transition-all duration-300 group h-full">

                                {/* Ảnh tròn bao quanh bởi viền */}
                                <div className="w-36 h-36 mb-4 relative">
                                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm flex items-center justify-center bg-gray-50">
                                        <img
                                            className="w-full h-full object-cover object-center"
                                            // Lưu ý: Nếu ảnh là icon nhỏ thì dùng object-contain, nếu là ảnh chụp thì dùng object-cover
                                            src={item.image}
                                            alt={item.title}
                                        />
                                    </div>
                                </div>

                                {/* Thông tin Text */}
                                <div className="flex-1 flex flex-col justify-center">
                                    <h3 className="font-bold text-gray-800 text-sm md:text-base mb-1 group-hover:text-primary transition-colors">
                                        {item.title}
                                    </h3>
                                </div>

                            </div>
                            {/* --- KẾT THÚC CARD --- */}
                        </div>
                    ))}
                </Slider>
            </div>
        </Section>
    );
};

export default GeneralCheckup;