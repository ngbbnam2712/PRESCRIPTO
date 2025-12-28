import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'

const AllAppointment = () => {

  // 1. Lấy dữ liệu và các hàm hỗ trợ từ Context
  const { aToken, appointments, getAllAppointments, cancelAppointment } = useContext(AdminContext)
  const { calculateAge, slotDateFormat, currency } = useContext(AppContext)

  // 2. Trạng thái bộ lọc
  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filteredAppointments, setFilteredAppointments] = useState([])

  // 3. Tải dữ liệu ban đầu khi có Token Admin
  useEffect(() => {
    if (aToken) {
      getAllAppointments()
    }
  }, [aToken])

  // 4. Logic lọc danh sách lịch hẹn
  useEffect(() => {
    if (appointments) {
      let temp = appointments.slice().reverse() // Hiển thị lịch hẹn mới nhất lên đầu

      // Lọc theo trạng thái cuộc hẹn
      if (filterStatus !== 'All') {
        temp = temp.filter(item => {
          if (filterStatus === 'Completed') return item.isCompleted && !item.cancelled;
          if (filterStatus === 'Cancelled') return item.cancelled;
          if (filterStatus === 'Pending') return !item.isCompleted && !item.cancelled;
          return true;
        })
      }

      // Lọc theo ngày khám cụ thể
      if (filterDate) {
        const dateParts = filterDate.split('-');
        // Chuyển YYYY-MM-DD sang D_M_YYYY để khớp với Database
        const formattedDate = `${Number(dateParts[2])}_${Number(dateParts[1])}_${dateParts[0]}`;
        temp = temp.filter(item => item.slotDate === formattedDate);
      }

      setFilteredAppointments(temp);
    }
  }, [appointments, filterStatus, filterDate])

  return (
    <div className='w-full max-w-6xl m-5'>

      <div className="flex justify-between items-center mb-3">
        <p className='text-lg font-medium text-gray-800'>Quản Lý Tất Cả Lịch Hẹn</p>
      </div>

      {/* --- THANH CÔNG CỤ LỌC --- */}
      <div className='flex flex-wrap gap-4 bg-white p-4 mb-4 rounded border items-end shadow-sm'>
        <div className='flex flex-col gap-1'>
          <label className='text-xs text-gray-500 font-bold uppercase'>Trạng thái:</label>
          <select
            onChange={(e) => setFilterStatus(e.target.value)}
            className='border rounded px-3 py-2 text-sm outline-none focus:border-primary bg-gray-50'
          >
            <option value="All">Tất cả</option>
            <option value="Pending">Đang chờ khám</option>
            <option value="Completed">Đã hoàn thành</option>
            <option value="Cancelled">Đã hủy</option>
          </select>
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-xs text-gray-500 font-bold uppercase'>Ngày khám:</label>
          <input
            type="date"
            onChange={(e) => setFilterDate(e.target.value)}
            className='border rounded px-3 py-2 text-sm outline-none focus:border-primary bg-gray-50'
          />
        </div>
      </div>

      {/* --- DANH SÁCH CUỘC HẸN --- */}
      <div className='bg-white border rounded text-sm min-h-[60vh] max-h-[80vh] overflow-y-scroll'>

        {/* Tiêu đề bảng (Header) */}
        <div className='hidden sm:grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] py-3 px-6 border-b font-bold bg-gray-100 text-gray-600 uppercase text-[12px]'>
          <p>STT</p>
          <p>Bệnh nhân</p>
          <p>Tuổi</p>
          <p>Ngày & Giờ</p>
          <p>Bác sĩ & Hình thức</p>
          <p>Phí khám</p>
          <p className='text-center'>Thao tác</p>
        </div>

        {/* Danh sách các mục dữ liệu */}
        {filteredAppointments.length === 0 ? (
          <div className="p-10 text-center text-gray-500 italic">Không tìm thấy cuộc hẹn nào phù hợp với bộ lọc.</div>
        ) : (
          filteredAppointments.map((item, index) => (
            <div
              className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-blue-50 transition-colors'
              key={index}
            >
              <p className='max-sm:hidden'>{index + 1}</p>

              {/* Thông tin bệnh nhân */}
              <div className='flex items-center gap-2'>
                <img className='w-8 h-8 rounded-full object-cover border bg-white' src={item.userData?.image || assets.upload_area} alt="Avatar" />
                <p className='font-semibold text-gray-800'>{item.userData?.name || "Người dùng ẩn danh"}</p>
              </div>

              <p className='max-sm:hidden'>{item.userData ? calculateAge(item.userData.dob) : "N/A"}</p>

              <div>
                <p className='font-medium text-gray-700'>{slotDateFormat(item.slotDate)}</p>
                <p className='text-xs text-blue-500 font-bold'>{item.slotTime}</p>
              </div>

              {/* Thông tin bác sĩ và hình thức khám */}
              <div className='flex items-center gap-2'>
                <img className='w-8 h-8 rounded-full bg-gray-200 object-cover border border-white shadow-sm' src={item.docData?.image} alt="Doctor" />
                <div className='flex flex-col'>
                  <p className='text-gray-800 font-medium text-xs'>{item.docData?.name}</p>
                  <span className={`text-[10px] font-bold w-fit px-2 py-0.5 rounded border mt-1 
                    ${item.appointmentType === 'Remote'
                      ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                      : 'bg-green-50 text-green-600 border-green-200'}`}>
                    {item.appointmentType === 'Remote' ? '💻 Tư vấn từ xa' : '🏥 Tại phòng khám'}
                  </span>
                </div>
              </div>

              <p className='font-bold text-gray-700'>{currency}{item.amount.toLocaleString()}</p>

              {/* Trạng thái và Hành động */}
              <div className='text-center flex justify-center'>
                {item.cancelled ? (
                  <span className='text-red-500 text-xs font-bold bg-red-50 px-3 py-1 rounded-full border border-red-100'>Đã hủy</span>
                ) : item.isCompleted ? (
                  <span className='text-green-600 text-xs font-bold bg-green-50 px-3 py-1 rounded-full border border-green-100'>Hoàn thành</span>
                ) : (
                  <img
                    onClick={() => cancelAppointment(item._id)}
                    className='w-10 cursor-pointer opacity-80 hover:opacity-100 hover:scale-110 transition-all p-1 hover:bg-red-50 rounded-full'
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
  )
}

export default AllAppointment