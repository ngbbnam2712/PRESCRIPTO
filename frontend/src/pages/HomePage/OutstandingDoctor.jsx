import React, { useContext } from 'react';
import Slider from "react-slick";
import { useNavigate } from 'react-router-dom';
import Section, { SectionNextArrow, SectionPrevArrow } from './Section';
import { AppContext } from '../../context/AppContext';

const OutstandingDoctor = () => {
    const navigate = useNavigate();
    const { doctors } = useContext(AppContext);

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
        <Section title="Bác sĩ nổi bật tuần qua"
            bgColor="bg-gray-50"
            seeMoreLink={'/doctors'}
        >
            <div className="px-2">
                <Slider {...settings}>
                    {doctors.map((item, index) => (
                        <div
                            key={index}
                            className="px-2 py-3 outline-none cursor-pointer"
                            onClick={() => {
                                scrollTo(0, 0);
                                navigate(`/appointment/${item._id}`);
                            }}
                        >
                            {/* --- CARD GIAO DIỆN THEO STYLE SPECIALTY --- */}
                            <div className="border border-gray-100 bg-white rounded-xl p-4 flex flex-col items-center text-center hover:shadow-lg transition-all duration-300 group h-full">

                                {/* Ảnh tròn bao quanh bởi viền (Chuẩn style Specialty) */}
                                <div className="w-36 h-36 mb-4 relative">
                                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm">
                                        <img
                                            className="w-full h-full object-cover object-top"
                                            src={item.image}
                                            alt={item.name}
                                        />
                                    </div>

                                    {/* (Tùy chọn) Thêm chấm xanh trạng thái nếu muốn */}
                                    <div className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-white ${item.available ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                </div>

                                {/* Thông tin Text */}
                                <div className="flex-1 flex flex-col justify-center">
                                    {/* Tên Bác sĩ */}
                                    <h3 className="font-bold text-gray-800 text-sm md:text-base mb-1 group-hover:text-primary transition-colors">
                                        {item.name}
                                    </h3>
                                    {/* Chuyên khoa (Giữ lại nội dung cũ) */}
                                    <p className="text-gray-600 text-xs font-medium">
                                        {item.speciality}
                                    </p>
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

export default OutstandingDoctor;