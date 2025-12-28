import React, { useContext } from 'react';
import Slider from "react-slick";
import Section, { SectionNextArrow, SectionPrevArrow } from './Section';
import { specialityData } from '../../assets/assets.js';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext.jsx';

const Specialty = () => {
    const navigate = useNavigate();
    const { specializations } = useContext(AppContext);
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
        <Section title="Chuyên khoa phổ biến" bgColor="bg-gray-50">
            <div className="px-2">
                {/* 3. Kiểm tra dữ liệu trước khi render */}
                {specializations && specializations.length > 0 ? (
                    <Slider {...settings}>
                        {specializations.map((item, index) => (
                            <div
                                key={index}
                                className="px-2 py-3 outline-none cursor-pointer"
                                onClick={() => {
                                    window.scrollTo(0, 0);
                                    // 4. Điều hướng theo ID (_id) của MongoDB
                                    navigate(`/doctors/${item._id}`);
                                }}
                            >
                                {/* --- CARD GIAO DIỆN --- */}
                                <div className="border border-gray-100 bg-white rounded-xl p-4 flex flex-col items-center text-center hover:shadow-lg transition-all duration-300 group h-full">

                                    {/* Ảnh đại diện chuyên khoa */}
                                    <div className="w-36 h-36 mb-4 relative">
                                        <div className="w-full h-full rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm">
                                            <img
                                                className="w-full h-full object-cover object-center"
                                                src={item.image} // Dùng trường image từ model
                                                alt={item.name}
                                            />
                                        </div>
                                    </div>

                                    {/* Tên chuyên khoa */}
                                    <div className="flex-1 flex flex-col justify-center">
                                        <h3 className="font-bold text-gray-800 text-sm md:text-base mb-1 group-hover:text-primary transition-colors">
                                            {item.name} {/* Dùng trường name từ model */}
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Slider>
                ) : (
                    // Hiển thị khi đang tải hoặc không có dữ liệu
                    <div className="flex justify-center py-10">
                        <p className="text-gray-500">Đang tải danh sách chuyên khoa...</p>
                    </div>
                )}
            </div>
        </Section>
    );
};

export default Specialty;