import React from 'react';
import { assets } from '../assets/assets';
import QuickBookingForm from '../pages/HomePage/QuickBookingForm.jsx'; // Import Form đặt lịch (đảm bảo file này nằm cùng thư mục components)

const Header = () => {
    return (
        <React.Fragment>
            <div className='flex flex-col md:flex-row flex-wrap bg-primary rounded-lg px-6 md:px-10 lg:px-20'>

                {/* --------- Left Side (Nội dung) --------- */}
                <div className='md:w-1/2 flex flex-col items-start justify-center gap-4 py-10 m-auto md:py-[10vw] md:mb-[-30px]'>
                    <p className='text-3xl md:text-4xl lg:text-5xl text-white font-semibold leading-tight md:leading-tight lg:leading-tight'>
                        Book Appointment <br /> With Trusted Doctors
                    </p>

                    <div className='flex flex-col md:flex-row items-center gap-3 text-white text-sm font-light'>
                        {/* Ảnh nhóm avatar nhỏ */}
                        <img className='w-28' src={assets.group_profiles} alt="" />
                        <p>
                            Simply browse through our extensive list of trusted doctors, <br className='hidden sm:block' />
                            schedule your appointment hassle-free.
                        </p>
                    </div>

                    <a href="#booking-section" className='flex items-center gap-2 bg-white px-8 py-3 rounded-full text-gray-600 text-sm m-auto md:m-0 hover:scale-105 transition-all duration-300'>
                        Book appointment
                        {/* Icon mũi tên */}
                        <img className='w-3' src={assets.arrow_icon} alt="" />
                    </a>
                </div>

                {/* --------- Right Side (Hình ảnh Bác sĩ) --------- */}
                <div className='md:w-1/2 relative'>
                    <img className='w-full md:absolute bottom-0 h-auto rounded-lg' src={assets.header_img} alt="" />
                </div>

            </div>

            {/* ========================================
         HERO SECTION & QUICK BOOKING FORM
        ========================================
      */}
            <div className="relative w-full">
                {/* Container nền xanh nhạt */}
                <div className="bg-blue-50 w-full min-h-[600px] flex items-center py-10">

                    <div className="container mx-auto px-4 w-full flex flex-col lg:flex-row items-center justify-between gap-10">

                        {/* Cột trái: Text giới thiệu & Lợi ích */}
                        <div className="w-full lg:w-1/2">
                            <div className="text-4xl lg:text-5xl font-bold text-blue-900 mb-6 leading-tight">
                                MEDICAL PLATFORM <br />
                                <span className="text-blue-600">COMPREHENSIVE HEALTH CARE</span>
                            </div>

                            <div className="text-gray-600 text-lg">
                                <p className="mb-4">
                                    Connect with top doctors for seamless healthcare experiences.
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-center">
                                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">✓</span>
                                        Specialist Examination
                                    </li>
                                    <li className="flex items-center">
                                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">✓</span>
                                        Home Healthcare Services
                                    </li>
                                    <li className="flex items-center">
                                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">✓</span>
                                        24/7 Online Consulting
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Cột phải: Form đặt lịch (QuickBookingForm) */}
                        <div id="booking-section" className="w-full lg:w-1/2 flex justify-center lg:justify-end">
                            <QuickBookingForm />
                        </div>

                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};

export default Header;