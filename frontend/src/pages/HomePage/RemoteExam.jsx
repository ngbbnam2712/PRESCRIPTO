import React, { useContext } from 'react';
import Slider from "react-slick";
import Section, { SectionNextArrow, SectionPrevArrow } from './Section';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext'; // Import Context

const RemoteExam = () => {
    const navigate = useNavigate();

    // Lấy danh sách chuyên khoa từ Context
    const { specializations } = useContext(AppContext);

    const settings = {
        dots: false,
        infinite: true,
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
            title="Tư vấn từ xa"
            subTitle="Kết nối với bác sĩ qua Video Call ngay tại nhà"
            bgColor="bg-blue-50" // Đổi màu nền sang xanh nhạt
        >
            <div className="px-2">
                {specializations && specializations.length > 0 ? (
                    <Slider {...settings}>
                        {specializations.map((item, index) => (
                            <div
                                key={index}
                                className="px-2 py-3 outline-none cursor-pointer"
                                onClick={() => {
                                    window.scrollTo(0, 0);
                                    // Điều hướng kèm tham số query để lọc Remote
                                    navigate(`/doctors/${item._id}`);
                                }}
                            >
                                {/* --- CARD GIAO DIỆN --- */}
                                <div className="border border-blue-100 bg-white rounded-xl p-4 flex flex-col items-center text-center hover:shadow-lg transition-all duration-300 group h-full relative overflow-hidden">

                                    {/* Badge Remote */}
                                    <div className="absolute top-2 right-2 bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                                        REMOTE
                                    </div>

                                    {/* Ảnh tròn */}
                                    <div className="w-36 h-36 mb-4 relative">
                                        <div className="w-full h-full rounded-full overflow-hidden border-2 border-transparent group-hover:border-blue-500 transition-all duration-300 shadow-sm">
                                            <img
                                                className="w-full h-full object-cover object-center"
                                                src={item.image}
                                                alt={item.name}
                                            />
                                        </div>

                                        {/* Icon Video */}
                                        <div className="absolute bottom-1 right-2 bg-white rounded-full p-1.5 shadow-md border border-gray-100 group-hover:scale-110 transition-transform z-20">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-500">
                                                <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.944 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.004-2.56 1.06z" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Thông tin Text */}
                                    <div className="flex-1 flex flex-col justify-center">
                                        <h3 className="font-bold text-gray-800 text-sm md:text-base mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                                            {item.name}
                                        </h3>
                                        <p className="text-gray-400 text-xs font-medium">Video Consultation</p>
                                    </div>

                                </div>
                                {/* --- KẾT THÚC CARD --- */}
                            </div>
                        ))}
                    </Slider>
                ) : (
                    <div className="text-center py-10 text-gray-500">Đang tải danh sách chuyên khoa...</div>
                )}
            </div>
        </Section>
    );
};

export default RemoteExam;