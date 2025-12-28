import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'

const AllAppointment = () => {

  // 1. Lấy data và hàm từ Context (Bỏ các hàm thuốc/bệnh án)
  const { aToken, appointments, getAllAppointments, cancelAppointment } = useContext(AdminContext)
  const { calculateAge, slotDateFormat, currency } = useContext(AppContext)

  // 2. State bộ lọc
  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filteredAppointments, setFilteredAppointments] = useState([])

  // 3. Load dữ liệu ban đầu
  useEffect(() => {
    if (aToken) {
      getAllAppointments()
    }
  }, [aToken])

  // 4. Logic Lọc danh sách (Giữ nguyên)
  useEffect(() => {
    if (appointments) {
      let temp = appointments.slice().reverse() // Mới nhất lên đầu

      // Lọc theo trạng thái
      if (filterStatus !== 'All') {
        temp = temp.filter(item => {
          if (filterStatus === 'Completed') return item.isCompleted && !item.cancelled;
          if (filterStatus === 'Cancelled') return item.cancelled;
          if (filterStatus === 'Pending') return !item.isCompleted && !item.cancelled;
          return true;
        })
      }

      // Lọc theo ngày
      if (filterDate) {
        const dateParts = filterDate.split('-');
        const formattedDate = `${Number(dateParts[2])}_${Number(dateParts[1])}_${dateParts[0]}`;
        temp = temp.filter(item => item.slotDate === formattedDate);
      }

      setFilteredAppointments(temp);
    }
  }, [appointments, filterStatus, filterDate])

  // ==========================================
  // RENDER GIAO DIỆN
  // ==========================================
  return (
    <div className='w-full max-w-6xl m-5'>

      <div className="flex justify-between items-center mb-3">
        <p className='text-lg font-medium'>All Appointments</p>
      </div>

      {/* --- THANH CÔNG CỤ LỌC --- */}
      <div className='flex flex-wrap gap-4 bg-white p-4 mb-4 rounded border items-end shadow-sm'>
        <div className='flex flex-col gap-1'>
          <label className='text-xs text-gray-500 font-medium'>Trạng thái:</label>
          <select
            onChange={(e) => setFilterStatus(e.target.value)}
            className='border rounded px-3 py-2 text-sm outline-none focus:border-primary'
          >
            <option value="All">Tất cả</option>
            <option value="Pending">Đang chờ</option>
            <option value="Completed">Đã xong</option>
            <option value="Cancelled">Đã hủy</option>
          </select>
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-xs text-gray-500 font-medium'>Ngày khám:</label>
          <input
            type="date"
            onChange={(e) => setFilterDate(e.target.value)}
            className='border rounded px-3 py-2 text-sm outline-none focus:border-primary'
          />
        </div>
      </div>

      {/* --- DANH SÁCH CUỘC HẸN --- */}
      <div className='bg-white border rounded text-sm min-h-[60vh] max-h-[80vh] overflow-y-scroll'>

        {/* Header Bảng */}
        <div className='hidden sm:grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] grid-flow-col py-3 px-6 border-b font-medium bg-gray-50 text-gray-500'>
          <p>#</p>
          <p>Patient</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Doctor & Mode</p>
          <p>Fees</p>
          <p>Actions</p>
        </div>

        {/* Danh sách Item */}
        {filteredAppointments.length === 0 ? (
          <div className="p-10 text-center text-gray-500">Không tìm thấy cuộc hẹn nào.</div>
        ) : (
          filteredAppointments.map((item, index) => (
            <div
              className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'
              key={index}
            >
              <p className='max-sm:hidden'>{index + 1}</p>

              {/* Patient Info */}
              <div className='flex items-center gap-2'>
                <img className='w-8 h-8 rounded-full object-cover' src={item.userData?.image || assets.upload_area} alt="" />
                <p className='font-medium text-gray-800'>{item.userData?.name || "Unknown User"}</p>
              </div>

              <p className='max-sm:hidden'>{item.userData ? calculateAge(item.userData.dob) : "N/A"}</p>
              <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>

              {/* Doctor Info */}
              <div className='flex items-center gap-2'>
                <img className='w-8 h-8 rounded-full bg-gray-200 object-cover' src={item.docData?.image} alt="" />
                <div className='flex flex-col'>
                  <p className='text-gray-800 font-medium text-xs'>{item.docData?.name}</p>
                  <span className={`text-[10px] w-fit px-2 py-0.5 rounded border ${item.appointmentType === 'Remote' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                    {item.appointmentType === 'Remote' ? 'Remote' : 'Clinic'}
                  </span>
                </div>
              </div>

              <p>{currency}{item.amount}</p>

              {/* Actions (Chỉ giữ Cancel hoặc hiển thị trạng thái) */}
              <div className='flex items-center gap-2'>
                {item.cancelled ? (
                  <p className='text-red-400 text-xs font-medium'>Cancelled</p>
                ) : item.isCompleted ? (
                  <p className='text-green-500 text-xs font-medium'>Completed</p>
                ) : (
                  <img
                    onClick={() => cancelAppointment(item._id)}
                    className='w-10 cursor-pointer opacity-80 hover:opacity-100 hover:scale-105 transition-all'
                    src={assets.cancel_icon}
                    alt="Cancel"
                    title="Hủy lịch hẹn"
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