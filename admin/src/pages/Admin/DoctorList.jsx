import React, { useContext, useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import { AdminContext } from '../../context/AdminContext'
import DoctorScheduleModal from './DoctorScheduleModal.jsx'

const DoctorList = () => {
    // 1. Lấy dữ liệu và hàm từ AdminContext
    const { doctors, aToken, getAllDoctors, changeAvailability } = useContext(AdminContext)

    // 2. Trạng thái điều khiển Modal đặt lịch
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    // 3. Gọi API lấy danh sách bác sĩ khi có Token Admin
    useEffect(() => {
        if (aToken) {
            getAllDoctors()
        }
    }, [aToken])

    // 4. Hàm mở Modal và chọn bác sĩ đích
    const handleOpenSchedule = (doctor) => {
        setSelectedDoctor(doctor);
        setIsModalOpen(true);
    }

    return (
        <div className='m-5 max-h-[90vh] overflow-y-scroll'>
            <h1 className='text-xl font-bold text-gray-800'>Danh Sách Tất Cả Bác Sĩ</h1>

            <div className='w-full flex flex-wrap gap-4 pt-5 gap-y-6'>
                {
                    doctors.map((item, index) => (
                        <div className='border border-indigo-200 rounded-xl max-w-56 overflow-hidden cursor-pointer group bg-white hover:shadow-md transition-all' key={index}>

                            {/* Ảnh bác sĩ */}
                            <img className='bg-indigo-50 group-hover:bg-primary transition-all duration-500 object-cover h-48 w-full' src={item.image} alt={item.name} />

                            <div className='p-4'>
                                <p className='text-neutral-800 text-lg font-bold'>{item.name}</p>
                                <p className='text-blue-600 text-sm font-medium'>{item.speciality}</p>

                                {/* Trạng thái sẵn sàng tiếp nhận bệnh nhân */}
                                <div className='mt-3 flex items-center gap-2 text-sm'>
                                    <input
                                        className='cursor-pointer w-4 h-4 accent-primary'
                                        onChange={() => changeAvailability(item._id)}
                                        type="checkbox"
                                        checked={item.available}
                                        id={`avail-${item._id}`}
                                    />
                                    <label htmlFor={`avail-${item._id}`} className='cursor-pointer text-gray-600 font-medium'>
                                        Sẵn sàng làm việc
                                    </label>
                                </div>

                                {/* Nút mở lịch và đặt chỗ trực tiếp cho Admin */}
                                <button
                                    onClick={() => handleOpenSchedule(item)}
                                    className="mt-4 w-full bg-indigo-50 text-primary text-xs font-bold py-2.5 rounded-lg hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 border border-indigo-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                    </svg>
                                    Lịch khám & Đặt lịch
                                </button>
                            </div>

                        </div>
                    ))
                }
            </div>

            {/* Modal hiển thị chi tiết lịch trình của bác sĩ đã chọn */}
            <DoctorScheduleModal
                doctor={selectedDoctor}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    )
}

export default DoctorList