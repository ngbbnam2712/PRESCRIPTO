import React, { useContext, useEffect } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { assets } from '../../assets/assets.js'
import { AppContext } from '../../context/AppContext.jsx'

const Dashboard = () => {

  const { aToken, getDashData, cancelAppointment, dashData } = useContext(AdminContext)
  const { slotDateFormat, currency } = useContext(AppContext)

  useEffect(() => {
    if (aToken) {
      getDashData()
    }
  }, [aToken])

  return dashData && (
    <div className='m-5'>

      {/* --- CÁC THẺ THỐNG KÊ (CARDS) --- */}
      <div className='flex flex-wrap gap-3'>

        {/* 1. Tổng doanh thu */}
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-14' src={assets.earning_icon} alt="Doanh thu" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.revenue.toLocaleString()} {currency}</p>
            <p className='text-gray-400'>Tổng doanh thu</p>
          </div>
        </div>

        {/* 2. Lượt khám */}
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-14' src={assets.appointments_icon} alt="Lịch hẹn" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.appointments}</p>
            <p className='text-gray-400'>Tổng lịch hẹn</p>
          </div>
        </div>

        {/* 3. Tổng số bệnh nhân */}
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-14' src={assets.patients_icon} alt="Bệnh nhân" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.patients}</p>
            <p className='text-gray-400'>Số bệnh nhân</p>
          </div>
        </div>
      </div>

      {/* --- PHẦN TOP 3 BÁC SĨ XUẤT SẮC --- */}
      <div className='bg-white mt-10 rounded-lg shadow-md p-6 border'>
        <div className='flex items-center gap-2.5 mb-6'>
          <img src={assets.list_icon} alt="" />
          <p className='font-bold text-gray-800 text-lg'>Top 3 Bác Sĩ Hoạt Động Hiệu Quả</p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
          {dashData.topDoctors.map((item, index) => (
            <div key={index} className='border rounded-xl p-5 flex flex-col items-center bg-indigo-50 hover:shadow-lg transition-all duration-300'>

              {/* Huy chương cho vị trí Top 1, 2, 3 */}
              <div className='relative'>
                <img className='w-24 h-24 rounded-full object-cover border-4 border-white shadow-md' src={item.image} alt={item.name} />
                <span className={`absolute -top-1 -right-1 w-9 h-9 flex items-center justify-center rounded-full text-white font-bold border-2 border-white shadow-sm
                            ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'}`}>
                  #{index + 1}
                </span>
              </div>

              <p className='text-lg font-bold text-gray-800 mt-4'>{item.name}</p>
              <p className='text-sm text-blue-600 font-medium'>{item.speciality}</p>

              {/* Hiển thị số sao và đánh giá */}
              <div className='flex items-center gap-1 mt-3 bg-white px-3 py-1 rounded-full shadow-sm'>
                <p className='text-yellow-500 font-bold text-xl'>
                  {Number(item.averageRating || 0).toFixed(1)}
                </p>
                <span className='text-yellow-400 text-lg'>★</span>
                <p className='text-[10px] text-gray-400 ml-1'>({item.totalRatings || 0} đánh giá)</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- DANH SÁCH ĐẶT CHỖ MỚI NHẤT --- */}
      <div className='bg-white mt-10 rounded-lg border shadow-sm'>
        <div className='flex items-center gap-2.5 px-6 py-4 border-b bg-gray-50 rounded-t-lg'>
          <img src={assets.list_icon} alt="" />
          <p className='font-bold text-gray-800'>Lịch Đặt Chỗ Gần Đây</p>
        </div>

        <div className='pt-2'>
          {dashData.latestAppointments.length === 0 ? (
            <p className='p-10 text-center text-gray-500 italic'>Chưa có lịch đặt chỗ nào mới.</p>
          ) : (
            dashData.latestAppointments.map((item, index) => (
              <div className='flex items-center px-6 py-4 gap-4 hover:bg-gray-50 border-b last:border-0 transition-colors' key={index}>

                {/* 1. Ảnh đại diện Bác sĩ */}
                <img className='rounded-full w-12 h-12 object-cover border-2 border-indigo-100' src={item.docData.image} alt="" />

                {/* 2. Thông tin chi tiết */}
                <div className='flex-1 text-sm'>
                  <p className='text-gray-800 font-bold text-base'>{item.docData.name}</p>
                  <div className='flex items-center gap-3 mt-1'>
                    <p className='text-gray-600 font-medium'>
                      {slotDateFormat(item.slotDate)} | <span className='text-blue-600'>{item.slotTime}</span>
                    </p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold
                      ${item.appointmentType === 'Remote'
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                        : 'bg-green-50 text-green-600 border-green-200'
                      }`}>
                      {item.appointmentType === 'Remote' ? '💻 Tư vấn từ xa' : '🏥 Tại phòng khám'}
                    </span>
                  </div>
                </div>

                {/* 3. Trạng thái / Hành động */}
                <div className='min-w-[100px] text-right'>
                  {item.cancelled ? (
                    <span className='text-red-500 text-xs font-bold bg-red-50 px-3 py-1 rounded-full'>Đã hủy</span>
                  ) : item.isCompleted ? (
                    <span className='text-green-600 text-xs font-bold bg-green-50 px-3 py-1 rounded-full'>Hoàn thành</span>
                  ) : (
                    <img
                      onClick={() => cancelAppointment(item._id)}
                      className='w-9 cursor-pointer opacity-70 hover:opacity-100 hover:scale-110 transition-all p-1.5 hover:bg-red-50 rounded-full'
                      src={assets.cancel_icon}
                      alt="Hủy"
                      title="Bấm để hủy lịch hẹn này"
                    />
                  )}
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard