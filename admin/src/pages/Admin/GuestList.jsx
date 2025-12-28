import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const GuestList = () => {

    const { aToken, backendUrl } = useContext(AdminContext)
    const [requests, setRequests] = useState([])

    // Hàm lấy danh sách yêu cầu từ khách vãng lai
    const fetchGuestRequests = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/guest-requests', { headers: { aToken } })
            if (data.success) {
                setRequests(data.requests)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error("Lỗi khi tải danh sách yêu cầu")
        }
    }

    // Hàm xử lý khi Admin xác nhận đã xử lý xong yêu cầu
    const handleComplete = async (requestId) => {
        if (!window.confirm("Xác nhận đã xử lý xong yêu cầu này?")) return;

        try {
            const { data } = await axios.post(
                backendUrl + '/api/admin/complete-guest-request',
                { requestId },
                { headers: { aToken } }
            );

            if (data.success) {
                toast.success("Đã cập nhật trạng thái thành công");
                fetchGuestRequests(); // Tải lại dữ liệu để cập nhật UI
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Lỗi khi cập nhật trạng thái");
        }
    }

    useEffect(() => {
        if (aToken) {
            fetchGuestRequests()
        }
    }, [aToken])

    return (
        <div className='w-full max-w-6xl m-5'>
            <p className='mb-3 text-lg font-medium text-gray-800'>Yêu Cầu Tư Vấn Từ Khách Vãng Lai</p>

            <div className='bg-white border rounded-xl shadow-sm overflow-hidden'>

                {/* --- TIÊU ĐỀ BẢNG (HEADER) --- */}
                <div className='hidden sm:grid grid-cols-[0.5fr_2fr_2fr_2fr_1fr_1fr] gap-4 py-3 px-6 border-b bg-gray-50 font-bold text-gray-600 text-sm uppercase'>
                    <p>#</p>
                    <p>Thông tin khách hàng</p>
                    <p>Bác sĩ & Dịch vụ</p>
                    <p>Ngày & Hình thức</p>
                    <p>Thanh toán</p>
                    <p className='text-center'>Thao tác</p>
                </div>

                {/* --- DANH SÁCH YÊU CẦU --- */}
                {requests.length === 0 ? (
                    <div className="p-10 text-center text-gray-500 italic">Hiện chưa có yêu cầu tư vấn nào từ khách.</div>
                ) : (
                    requests.map((item, index) => (
                        <div key={index} className='grid grid-cols-[0.5fr_2fr_2fr_2fr_1fr_1fr] gap-4 py-4 px-6 border-b hover:bg-blue-50 items-center text-gray-600 transition-colors'>

                            {/* 1. STT */}
                            <p>{index + 1}</p>

                            {/* 2. Thông tin bệnh nhân */}
                            <div className='flex flex-col gap-1'>
                                <p className='font-bold text-gray-900'>{item.name}</p>
                                <p className='text-xs text-blue-600 font-medium'>{item.phone}</p>
                                <p className='text-[11px] text-gray-400 truncate' title={item.email}>{item.email}</p>
                            </div>

                            {/* 3. Thông tin Bác sĩ & Dịch vụ */}
                            <div className='flex flex-col gap-1'>
                                <p className='font-bold text-indigo-600'>
                                    {item.docName || item.doctorName || "Chưa chọn bác sĩ"}
                                </p>
                                <span className='text-[11px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full w-fit font-medium border border-indigo-100'>
                                    {item.speciality || "Đa khoa"}
                                </span>
                                <p className='text-xs text-gray-500 font-medium'>
                                    Phí khám: {item.amount.toLocaleString()} VNĐ
                                </p>
                            </div>

                            {/* 4. Ngày giờ & Hình thức khám */}
                            <div className='flex flex-col'>
                                {item.slotDate === "Not Selected" ? (
                                    <span className="font-medium text-red-400 italic">Chưa chọn ngày</span>
                                ) : (
                                    <div className='flex flex-col'>
                                        <span className='font-bold text-gray-700'>{item.slotDate}</span>
                                        <span className='text-xs text-blue-500 font-bold'>{item.slotTime}</span>
                                    </div>
                                )}
                                <span className='text-[10px] font-bold mt-1 uppercase opacity-70'>
                                    {item.preferredMode === 'Clinic' ? '🏥 Tại phòng khám' : '🏠 Dịch vụ tại nhà'}
                                </span>
                            </div>

                            {/* 5. Trạng thái thanh toán */}
                            <div>
                                {item.paymentStatus ? (
                                    <span className='px-2 py-1 text-[10px] font-bold text-green-700 bg-green-100 rounded border border-green-200 uppercase'>
                                        Đã thu
                                    </span>
                                ) : (
                                    <span className='px-2 py-1 text-[10px] font-bold text-yellow-700 bg-yellow-100 rounded border border-yellow-200 uppercase'>
                                        Chờ khám
                                    </span>
                                )}
                            </div>

                            {/* 6. Nút hành động */}
                            <div className='flex justify-center'>
                                {item.isHandled ? (
                                    <div className="flex items-center gap-1 text-green-600 font-bold">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                        </svg>
                                        <span className='text-[11px]'>Xong</span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleComplete(item._id)}
                                        className='text-red-500 hover:text-white hover:bg-red-500 px-3 py-1 rounded transition-all text-[11px] font-bold border border-red-200 shadow-sm uppercase'
                                        title="Đánh dấu đã xử lý xong"
                                    >
                                        Hoàn tất
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default GuestList