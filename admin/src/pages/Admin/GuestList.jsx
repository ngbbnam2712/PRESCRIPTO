import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const GuestList = () => {

    const { aToken, backendUrl } = useContext(AdminContext)
    const [requests, setRequests] = useState([])

    const fetchGuestRequests = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/guest-requests', { headers: { aToken } })
            if (data.success) {
                setRequests(data.requests)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }
    const handleComplete = async (requestId) => {
        try {
            const { data } = await axios.post(
                backendUrl + '/api/admin/complete-guest-request',
                { requestId },
                { headers: { aToken } }
            );

            if (data.success) {
                toast.success(data.message);
                fetchGuestRequests(); // Tải lại dữ liệu để cập nhật UI
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }
    useEffect(() => {
        if (aToken) {
            fetchGuestRequests()
        }
    }, [aToken])

    return (
        <div className='w-full max-w-6xl m-5'>
            <p className='mb-3 text-lg font-medium'>Guest Consultation Requests</p>

            <div className='bg-white border rounded-xl shadow-sm overflow-hidden'>

                {/* --- HEADER: Đã sửa grid-cols khớp với row bên dưới (6 cột) --- */}
                <div className='hidden sm:grid grid-cols-[0.5fr_2fr_2fr_2fr_1fr_1fr] gap-4 py-3 px-6 border-b bg-gray-50 font-semibold text-gray-600 text-sm'>
                    <p>#</p>
                    <p>Customer Info</p>
                    <p>Doctor & Service</p> {/* Sửa tên cho khớp dữ liệu Bác sĩ */}
                    <p>Date & Mode</p>     {/* Sửa tên cho khớp dữ liệu Ngày/Kiểu khám */}
                    <p>Payment</p>         {/* Thêm cột Payment */}
                    <p>Action</p>          {/* Thêm cột Action */}
                </div>

                {/* --- BODY: Danh sách items --- */}
                {requests.map((item, index) => (
                    <div key={index} className='grid grid-cols-[0.5fr_2fr_2fr_2fr_1fr_1fr] gap-4 py-3 px-6 border-b hover:bg-gray-50 items-center'>

                        {/* 1. STT */}
                        <p>{index + 1}</p>

                        {/* 2. Thông tin bệnh nhân */}
                        <div className='flex flex-col gap-1'>
                            <p className='font-medium text-gray-900'>{item.name}</p>
                            <p className='text-xs text-gray-500'>{item.phone}</p>
                            <p className='text-xs text-gray-400 truncate w-3/4' title={item.email}>{item.email}</p>
                        </div>

                        {/* 3. Thông tin Bác sĩ & Dịch vụ */}
                        <div className='flex flex-col gap-1'>
                            <p className='font-medium text-blue-600'>
                                {/* Lưu ý: Đảm bảo item.docName khớp với key API trả về (có thể là item.doctorName) */}
                                {item.docName || item.doctorName || "Not Selected"}
                            </p>
                            <span className='text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full w-fit'>
                                {item.speciality || "General"}
                            </span>
                            <p className='text-xs text-gray-500 italic'>
                                Fee: ${item.amount}
                            </p>
                        </div>

                        {/* 4. Ngày giờ & Hình thức khám */}
                        <div className='flex flex-col'>
                            {item.slotDate === "Not Selected" ? (
                                <span className="font-medium text-gray-700">Not Selected</span>
                            ) : (
                                <div className='flex flex-col'>
                                    <span className='font-medium text-gray-700'>{item.slotDate}</span>
                                    <span className='text-xs text-blue-600'>{item.slotTime}</span>
                                </div>
                            )}
                            <span className='text-xs text-gray-400 mt-1'>
                                {item.preferredMode === 'Clinic' ? '🏥 At Clinic' : '🏠 Home Service'}
                            </span>
                        </div>

                        {/* 5. Trạng thái thanh toán */}
                        <div>
                            {item.paymentStatus ? (
                                <span className='px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-md border border-green-200'>
                                    Paid
                                </span>
                            ) : (
                                <span className='px-2 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 rounded-md border border-yellow-200'>
                                    Pending
                                </span>
                            )}
                        </div>

                        {/* 6. Action Buttons */}
                        <div className='flex justify-start'>
                            {item.isHandled ? (
                                <div className="flex items-center gap-1 text-green-500 font-medium">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                    </svg>
                                    <span className='text-xs'>Done</span>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleComplete(item._id)}
                                    className='text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded transition-colors text-xs font-medium border border-red-200 shadow-sm'
                                    title="Mark as Done"
                                >
                                    Mark Done
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {requests.length === 0 && (
                    <div className="p-10 text-center text-gray-500">No requests found.</div>
                )}

            </div>
        </div>
    )
}

export default GuestList