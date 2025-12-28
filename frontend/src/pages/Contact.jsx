import React from 'react'
import { assets } from '../assets/assets'

const Contact = () => {
  return (
    <div>
      <div className='text-center text-2xl pt-10 text-gray-500'>
        <p>LIÊN HỆ <span className='text-gray-700 font-semibold'>VỚI CHÚNG TÔI</span></p>
      </div>

      <div className='my-10 flex flex-col justify-center md:flex-row gap-10 mb-28 text-sm'>
        <img className='w-full md:max-w-[360px]' src={assets.contact_image} alt="Liên hệ" />
        <div className='flex flex-col justify-center items-start gap-6'>
          <p className='text-gray-600 font-semibold text-lg'>VĂN PHÒNG CỦA CHÚNG TÔI</p>
          <p className='text-gray-500 '>97 Man Thiện <br />Hiệp Phú, TP. Hồ Chí Minh</p>
          <p className='text-gray-500 '>SĐT: 096149392 <br />Email: n21dcpt052@student.ptithcm.edu.vn</p>
          <p className='text-gray-600 font-semibold text-lg'>CƠ HỘI NGHỀ NGHIỆP TẠI PRESCRIPTO</p>
          <p className='text-gray-500 '>Tìm hiểu thêm về đội ngũ và các vị trí đang tuyển dụng.</p>
          <button className='border border-black px-8 py-4 text-sm hover:bg-black hover:text-white transition-all duration-500'>
            Khám phá công việc
          </button>
        </div>
      </div>
    </div>
  )
}

export default Contact