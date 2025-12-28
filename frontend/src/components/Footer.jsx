import React from 'react'
import { assets } from '../assets/assets'
const Footer = () => {
  return (
    <div className='md:mx-10'>
      <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>
        {/* --Left Section --- */}
        <div>
          <img className='mb-5 w-40' src={assets.logo} alt="" />
          <p className='w-full md:w-2/3 text-gray-600 leading-6'>
            Chúng tôi cam kết mang đến trải nghiệm đặt lịch khám bệnh trực tuyến thuận tiện và nhanh chóng nhất.
            Kết nối bệnh nhân với đội ngũ bác sĩ chuyên khoa hàng đầu, giúp bạn chủ động chăm sóc sức khỏe cho bản thân và gia đình.
          </p>
        </div>

        {/* --Center Section --- */}
        <div>
          <p className='text-xl font-medium mb-5'>VỀ CHÚNG TÔI</p>
          <ul className='flex flex-col gap-2 text-gray-600'>
            <li>Trang chủ</li>
            <li>Giới thiệu</li>
            <li>Liên hệ</li>
            <li>Chính sách bảo mật</li>
          </ul>
        </div>

        {/* --Right Section --- */}
        <div>
          <p className='text-xl font-medium mb-5' >LIÊN HỆ NGAY</p>
          <ul className='flex flex-col gap-2 text-gray-600'>
            <li>(+84) 961 493 932</li>
            <li>n21dcpt052@student.ptithcm.edu.vn</li>
          </ul>
        </div>
      </div>

      <div>
        {/* ---Copyright Text --- */}
        <div>
          <hr />
          <p className='py-5 text-sm text-center'>Bản quyền © 2025 Nguyen Ba Bao Nam - Bảo lưu mọi quyền.</p>
        </div>
      </div>

    </div>
  )
}

export default Footer