import React from 'react'
import { assets } from '../assets/assets'

const About = () => {
  return (
    <div>
      <div>
        <div className='text-center text-2xl pt-10 text-gray-500'>
          GIỚI THIỆU <span className='text-gray-700 font-medium'>VỀ CHÚNG TÔI</span>
        </div>
      </div>

      <div className='my-10 flex flex-col md:flex-row gap-12'>
        <img className='w-full md:max-w-[360px]' src={assets.about_image} alt="Giới thiệu" />
        <div className='flex flex-col justify-center gap-6 md:w-2/4 text-sm text-gray-600'>
          <p>Chào mừng bạn đến với Prescripto, đối tác tin cậy trong việc quản lý các nhu cầu chăm sóc sức khỏe một cách thuận tiện và hiệu quả. Tại Prescripto, chúng tôi thấu hiểu những khó khăn mà mọi người gặp phải khi sắp xếp lịch hẹn với bác sĩ và quản lý hồ sơ sức khỏe cá nhân.</p>
          <p>Prescripto cam kết mang lại sự xuất sắc trong công nghệ chăm sóc sức khỏe. Chúng tôi không ngừng nỗ lực cải thiện nền tảng, tích hợp những tiến bộ mới nhất để nâng cao trải nghiệm người dùng và cung cấp dịch vụ vượt trội. Cho dù bạn đang đặt lịch hẹn lần đầu hay quản lý quá trình điều trị dài hạn, Prescripto luôn đồng hành hỗ trợ bạn trên mọi bước đường.</p>
          <b className='text-gray-800'>Tầm nhìn của chúng tôi</b>
          <p>Tầm nhìn của Prescripto là tạo ra một trải nghiệm chăm sóc sức khỏe liền mạch cho mọi người dùng. Chúng tôi đặt mục tiêu xóa bỏ khoảng cách giữa bệnh nhân và các nhà cung cấp dịch vụ y tế, giúp bạn tiếp cận dịch vụ chăm sóc cần thiết một cách dễ dàng và kịp thời nhất.</p>
        </div>
      </div>

      <div className='text-xl my-4'>
        <p>TẠI SAO <span className='text-gray-700 font-semibold'>CHỌN CHÚNG TÔI </span></p>
      </div>

      <div className='flex flex-col md:flex-row mb-20'>
        <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
          <b>Hiệu quả:</b>
          <p>Quy trình đặt lịch hẹn được tối ưu hóa, phù hợp với lối sống bận rộn của bạn.</p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
          <b>Thuận tiện:</b>
          <p>Tiếp cận mạng lưới các chuyên gia y tế đáng tin cậy ngay tại khu vực của bạn.</p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
          <b>Cá nhân hóa:</b>
          <p>Đề xuất và nhắc nhở được điều chỉnh phù hợp để giúp bạn luôn duy trì sức khỏe tốt nhất.</p>
        </div>
      </div>
    </div>
  )
}

export default About