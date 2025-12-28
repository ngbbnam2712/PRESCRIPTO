import React, { useContext, useEffect } from 'react'
import { DoctorContext } from '../../context/DoctorContext.jsx'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext.jsx'

const DoctorDashboard = () => {

    const { dToken, dashData, getDashData, completeAppointment, cancelAppointment } = useContext(DoctorContext)
    const { currency, slotDateFormat } = useContext(AppContext)

    useEffect(() => {
        if (dToken) {
            getDashData()
        }
    }, [dToken])

    return dashData && (
        <div className='m-5 w-full max-w-6xl'>

            {/* --- CÁC THẺ THỐNG KÊ (STATS CARDS) --- */}
            <div className='flex flex-wrap gap-3'>

                {/* 1. Tổng thu nhập */}
                <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all shadow-sm'>
                    <img className='w-14' src={assets.earning_icon} alt="Thu nhập" />
                    <div>
                        <p className='text-xl font-semibold text-gray-600'>{dashData.earnings.toLocaleString()} {currency}</p>
                        <p className='text-gray-400 font-medium'>Tổng thu nhập</p>
                    </div>
                </div>

                {/* 2. Tổng số cuộc hẹn */}
                <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all shadow-sm'>
                    <img className='w-14' src={assets.appointments_icon} alt="Cuộc hẹn" />
                    <div>
                        <p className='text-xl font-semibold text-gray-600'>{dashData.appointments}</p>
                        <p className='text-gray-400 font-medium'>Lịch hẹn</p>
                    </div>
                </div>

                {/* 3. Số lượng bệnh nhân */}
                <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all shadow-sm'>
                    <img className='w-14' src={assets.patients_icon} alt="Bệnh nhân" />
                    <div>
                        <p className='text-xl font-semibold text-gray-600'>{dashData.patients}</p>
                        <p className='text-gray-400 font-medium'>Bệnh nhân</p>
                    </div>
                </div>
            </div>

            {/* --- DANH SÁCH ĐẶT CHỖ GẦN ĐÂY (LATEST BOOKINGS) --- */}
            <div className='bg-white mt-10 rounded-lg border shadow-sm'>
                <div className='flex items-center gap-2.5 px-6 py-4 border-b bg-gray-50 rounded-t-lg'>
                    <img src={assets.list_icon} alt="" />
                    <p className='font-bold text-gray-800 uppercase text-sm tracking-wide'>Đặt chỗ mới nhất</p>
                </div>

                <div className='pt-2'>
                    {dashData.latestAppointments.length === 0 ? (
                        <p className='p-10 text-center text-gray-400 italic'>Chưa có lịch hẹn nào gần đây.</p>
                    ) : (
                        dashData.latestAppointments.map((item, index) => (
                            <div className='flex items-center px-6 py-4 gap-4 hover:bg-gray-50 transition-all border-b last:border-0' key={index}>

                                {/* Ảnh đại diện Bệnh nhân */}
                                <img className='rounded-full w-12 h-12 object-cover border-2 border-indigo-50' src={item.userData.image || assets.upload_area} alt="" />

                                <div className='flex-1 text-sm'>
                                    <p className='text-gray-800 font-bold text-base'>{item.userData.name}</p>

                                    <div className="flex items-center gap-3 mt-1">
                                        {/* Ngày + Giờ */}
                                        <p className='text-gray-600 font-medium'>
                                            {slotDateFormat(item.slotDate)} | <span className='text-blue-600 font-bold'>{item.slotTime}</span>
                                        </p>

                                        {/* Badge hình thức khám */}
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase
                                            ${item.appointmentType === 'Remote'
                                                ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                                                : 'bg-green-50 text-green-600 border-green-200'
                                            }`}>
                                            {item.appointmentType === 'Remote' ? '💻 Từ xa' : '🏥 Tại PK'}
                                        </span>
                                    </div>
                                </div>

                                {/* Trạng thái hoặc Hành động */}
                                <div className='min-w-[100px] text-right'>
                                    {item.cancelled ? (
                                        <span className='text-red-400 text-xs font-bold bg-red-50 px-3 py-1 rounded-full border border-red-100'>Đã hủy</span>
                                    ) : item.isCompleted ? (
                                        <span className='text-green-500 text-xs font-bold bg-green-50 px-3 py-1 rounded-full border border-green-100'>Đã hoàn thành</span>
                                    ) : (
                                        <div className='flex justify-end gap-3'>
                                            <img
                                                onClick={() => cancelAppointment(item._id)}
                                                className='w-9 cursor-pointer opacity-70 hover:opacity-100 hover:scale-110 transition-all p-1.5 hover:bg-red-50 rounded-full'
                                                src={assets.cancel_icon}
                                                alt="Hủy"
                                                title="Hủy lịch hẹn"
                                            />
                                            <img
                                                onClick={() => completeAppointment(item._id)}
                                                className='w-9 cursor-pointer opacity-70 hover:opacity-100 hover:scale-110 transition-all p-1.5 hover:bg-green-50 rounded-full'
                                                src={assets.tick_icon}
                                                alt="Xác nhận"
                                                title="Hoàn thành buổi khám"
                                            />
                                        </div>
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

export default DoctorDashboard