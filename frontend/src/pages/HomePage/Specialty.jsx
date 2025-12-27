import React from 'react';
import Slider from "react-slick";
import Section, { SectionNextArrow, SectionPrevArrow } from './Section';
import { specialityData } from '../../assets/assets.js';
import { useNavigate } from 'react-router-dom';

const Specialty = () => {
    const navigate = useNavigate();

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
        <Section title="Chuyên khoa phổ biến"
            bgColor="bg-gray-50"
        >
            <div className="px-2">
                <Slider {...settings}>
                    {specialityData.map((item, index) => (
                        <div
                            key={index}
                            className="px-2 py-3 outline-none cursor-pointer" // Padding py-3 để bóng đổ không bị cắt
                            onClick={() => navigate(`/doctors/${item.speciality}`)}
                        >
                            {/* --- CARD GIAO DIỆN GIỐNG BÁC SĨ --- */}
                            <div className="border border-gray-100 bg-white rounded-xl p-4 flex flex-col items-center text-center hover:shadow-lg transition-all duration-300 group h-full">

                                {/* Ảnh tròn bao quanh bởi viền */}
                                <div className="w-36 h-36 mb-4 relative">
                                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm">
                                        <img
                                            className="w-full h-full object-cover object-top"
                                            src={item.image}
                                            alt={item.name}
                                        />
                                    </div>
                                </div>

                                {/* Thông tin Text */}
                                <div className="flex-1 flex flex-col justify-center">
                                    <h3 className="font-bold text-gray-800 text-sm md:text-base mb-1 group-hover:text-primary transition-colors">
                                        {item.speciality}
                                    </h3>
                                    {/* Có thể thêm dòng mô tả nhỏ nếu muốn giống hệt chiều cao card bác sĩ */}
                                    {/* <p className="text-gray-400 text-xs">100+ Bác sĩ</p> */}
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

export default Specialty;