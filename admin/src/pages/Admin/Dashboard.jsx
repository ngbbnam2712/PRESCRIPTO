import React, { useContext, useEffect } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { assets } from '../../assets/assets.js'
import { AppContext } from '../../context/AppContext.jsx'

const Dashboard = () => {

  const { aToken, getDashData, cancelAppointment, dashData } = useContext(AdminContext)

  const { slotDateFormat } = useContext(AppContext)





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
          <img className='w-14' src={assets.earning_icon} alt="" /> {/* Nhớ có icon tiền */}
          <div>
            <p className='text-xl font-semibold text-gray-600'>${dashData.revenue}</p>
            <p className='text-gray-400'>Total Revenue</p>
          </div>
        </div>

        {/* 2. Lượt khám hôm nay */}
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-14' src={assets.appointments_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.appointments}</p>
            <p className='text-gray-400'>Appointments</p>
          </div>
        </div>

        {/* 3. Tổng số bệnh nhân */}
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-14' src={assets.patients_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.patients}</p>
            <p className='text-gray-400'>Patients</p>
          </div>
        </div>
      </div>

      {/* --- PHẦN TOP 3 BÁC SĨ --- */}
      <div className='bg-white mt-10 rounded-lg shadow-md p-6'>
        <div className='flex items-center gap-2.5 mb-4'>
          <img src={assets.list_icon} alt="" />
          <p className='font-semibold'>Top 3 Best Performing Doctors</p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
          {dashData.topDoctors.map((item, index) => (
            <div key={index} className='border rounded-xl p-4 flex flex-col items-center bg-indigo-50 hover:shadow-lg transition'>
              {/* Huy chương cho Top 1, 2, 3 */}
              <div className='relative'>
                <img className='w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm' src={item.image} alt="" />
                <span className={`absolute top-0 right-0 w-8 h-8 flex items-center justify-center rounded-full text-white font-bold border-2 border-white
                            ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'}`}>
                  #{index + 1}
                </span>
              </div>

              <p className='text-lg font-medium text-gray-800 mt-3'>{item.name}</p>
              <p className='text-sm text-gray-600'>{item.speciality}</p>

              {/* Hiển thị số sao */}
              <div className='flex items-center gap-1 mt-2'>
                {/* SỬA TẠI ĐÂY: Dùng Number().toFixed(1) */}
                <p className='text-yellow-500 font-bold text-xl'>
                  {Number(item.averageRating || 0).toFixed(1)}
                </p>
                <span className='text-yellow-500'>★</span>
                <p className='text-xs text-gray-400'>({item.totalRatings || 0} reviews)</p>
              </div>
            </div>
          ))}
        </div>
      </div>


      <div className='bg-white'>
        <div className='flex items-center gap-2.5 px-4 mt-10 rounded-t border'>
          <img src={assets.list_icon} alt="" />
          <p className='font-semibold'>Latest Booking</p>
        </div>


        <div className='pt-4 border border-t-0'>
          {dashData.latestAppointments.map((item, index) => (
            <div className='flex items-center px-6 py-3 gap-3 hover:bg-gray-100 border-b last:border-0' key={index}>

              {/* 1. Ảnh đại diện Bác sĩ */}
              <img className='rounded-full w-10 h-10 object-cover' src={item.docData.image} alt="" />

              {/* 2. Thông tin chi tiết (Tên, Ngày Giờ, Mode) */}
              <div className='flex-1 text-sm'>
                <p className='text-gray-800 font-medium'>{item.docData.name}</p>

                {/* Dòng phụ: Ngày giờ + Badge Mode */}
                <div className='flex items-center gap-2 mt-1'>
                  {/* Ngày & Giờ */}
                  <p className='text-gray-600 text-xs'>
                    {slotDateFormat(item.slotDate)}, {item.slotTime}
                  </p>

                  {/* Badge hiển thị Mode (Giống AllAppointments) */}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${item.appointmentType === 'Remote'
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                    : 'bg-green-50 text-green-600 border-green-200'
                    }`}>
                    {item.appointmentType === 'Remote' ? 'Remote' : 'Clinic'}
                  </span>
                </div>
              </div>

              {/* 3. Trạng thái / Nút Hủy */}
              <div className='min-w-[80px] text-right'>
                {item.cancelled ? (
                  <p className='text-red-400 text-xs font-medium'>Cancelled</p>
                ) : item.isCompleted ? (
                  <p className='text-green-500 text-xs font-medium'>Completed</p>
                ) : (
                  <img
                    onClick={() => cancelAppointment(item._id)}
                    className='w-10 cursor-pointer opacity-80 hover:opacity-100 transition-opacity'
                    src={assets.cancel_icon}
                    alt="Cancel"
                    title="Cancel Appointment"
                  />
                )}
              </div>

            </div>
          ))}
        </div>
      </div>
    </div >
  )
}

export default Dashboard