import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'

const DoctorAppointments = () => {

    const {
        dToken, appointments, getAppointments,
        completeAppointment, cancelAppointment, loadPatientHistory
    } = useContext(DoctorContext)

    const { calculateAge, slotDateFormat, currency } = useContext(AppContext)

    // --- STATE BỘ LỌC ---
    const [filterDate, setFilterDate] = useState('')
    const [filterStatus, setFilterStatus] = useState('All')
    const [filteredAppointments, setFilteredAppointments] = useState([])

    // --- STATE MODAL LỊCH SỬ ---
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [patientHistory, setPatientHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        if (dToken) {
            getAppointments()
        }
    }, [dToken])

    const parseDateTime = (dateStr, timeStr) => {
        try {
            // 1. Tách ngày: "25_12_2025" -> [25, 12, 2025]
            const [day, month, year] = dateStr.split('_').map(Number);

            // 2. Tách giờ: "10:30 AM" hoặc "14:30"
            let hours = 0, minutes = 0;

            // Kiểm tra xem có AM/PM không
            if (timeStr.includes(' ')) {
                const [time, modifier] = timeStr.split(' '); // ["10:30", "PM"]
                const [h, m] = time.split(':').map(Number);
                hours = h;
                minutes = m;

                // Xử lý 12h -> 24h
                if (modifier === 'PM' && hours < 12) hours += 12;
                if (modifier === 'AM' && hours === 12) hours = 0;
            } else {
                // Giờ 24h (nếu có)
                const [h, m] = timeStr.split(':').map(Number);
                hours = h;
                minutes = m;
            }

            return new Date(year, month - 1, day, hours, minutes).getTime();
        } catch (error) {
            return 0; // Tránh lỗi crash nếu format sai
        }
    };
    // Logic Lọc (Filter Logic)
    useEffect(() => {
        if (appointments) {
            // Sort danh sách cuộc hẹn chính: Mới nhất lên đầu
            let temp = appointments.slice().reverse()

            if (filterStatus !== 'All') {
                temp = temp.filter(item => {
                    if (filterStatus === 'Completed') return item.isCompleted && !item.cancelled;
                    if (filterStatus === 'Cancelled') return item.cancelled;
                    if (filterStatus === 'Pending') return !item.isCompleted && !item.cancelled;
                    return true;
                })
            }

            if (filterDate) {
                const dateParts = filterDate.split('-');
                const formattedDate = `${Number(dateParts[2])}_${Number(dateParts[1])}_${dateParts[0]}`;
                temp = temp.filter(item => item.slotDate === formattedDate);
            }

            setFilteredAppointments(temp);
        }
    }, [appointments, filterStatus, filterDate])

    // --- HÀM MỞ MODAL & SẮP XẾP LỊCH SỬ ---
    const openHistory = async (userId) => {
        setShowHistoryModal(true);
        setHistoryLoading(true);

        const data = await loadPatientHistory(userId);

        if (data && data.length > 0) {
            // Sort Lịch sử: Mới nhất lên đầu (Dùng hàm parseDateTime đã fix lỗi)
            data.sort((a, b) => {
                return parseDateTime(b.slotDate, b.slotTime) - parseDateTime(a.slotDate, a.slotTime);
            });
        }

        setPatientHistory(data || []);
        setHistoryLoading(false);
    };

    return (
        <div className='w-full max-w-6xl m-5'>
            <p className='mb-3 text-lg font-medium'>Doctor Appointments</p>

            {/* --- THANH CÔNG CỤ LỌC --- */}
            <div className='flex flex-wrap gap-4 bg-white p-4 mb-4 rounded border items-end shadow-sm'>
                <div className='flex flex-col gap-1'>
                    <label className='text-xs text-gray-500 font-medium'>Trạng thái:</label>
                    <select
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className='border rounded px-3 py-2 text-sm outline-none focus:border-blue-500 bg-gray-50'
                    >
                        <option value="All">Tất cả</option>
                        <option value="Pending">Đang chờ khám</option>
                        <option value="Completed">Đã xong</option>
                        <option value="Cancelled">Đã hủy</option>
                    </select>
                </div>
                <div className='flex flex-col gap-1'>
                    <label className='text-xs text-gray-500 font-medium'>Ngày khám:</label>
                    <input
                        type="date"
                        onChange={(e) => setFilterDate(e.target.value)}
                        className='border rounded px-3 py-2 text-sm outline-none focus:border-blue-500 bg-gray-50'
                    />
                </div>
            </div>

            {/* --- DANH SÁCH CUỘC HẸN --- */}
            <div className='bg-white border rounded text-sm min-h-[50vh] max-h-[80vh] overflow-y-scroll scrollbar-hide'>

                {/* HEADER ROW */}
                <div className='hidden sm:grid grid-cols-[0.5fr_3fr_1fr_1fr_3fr_1fr_1fr] grid-flow-col py-3 px-6 border-b font-medium bg-gray-50 text-gray-500'>
                    <p>#</p>
                    <p>Patient</p>
                    <p>Status / Mode</p>
                    <p>Age</p>
                    <p>Date & Time</p>
                    <p>Fees</p>
                    <p>Action</p>
                </div>

                {filteredAppointments.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">Không tìm thấy cuộc hẹn nào.</div>
                ) : (
                    filteredAppointments.map((item, index) => (
                        <div
                            className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid sm:grid-cols-[0.5fr_3fr_1fr_1fr_3fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50 transition-colors'
                            key={index}
                        >
                            <p className='max-sm:hidden'>{index + 1}</p>

                            <div className='flex items-center gap-2'>
                                <img className='w-8 h-8 rounded-full object-cover shadow-sm' src={item.userData?.image || assets.upload_area} alt="" />
                                <div className='flex flex-col'>
                                    <p className='font-medium text-gray-800'>{item.userData?.name}</p>
                                    <button
                                        onClick={() => openHistory(item.userData?._id)}
                                        className='text-xs text-blue-500 hover:text-blue-700 hover:underline text-left mt-0.5'
                                    >
                                        📂 Xem hồ sơ
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 items-start">
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${item.payment ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                    {item.payment ? 'Paid' : 'Unpaid'}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.appointmentType === 'Remote' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                                    {item.appointmentType === 'Remote' ? 'Remote' : 'Clinic'}
                                </span>
                            </div>

                            <p className='max-sm:hidden'>{item.userData ? calculateAge(item.userData.dob) : "N/A"}</p>
                            <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
                            <p className='font-medium text-gray-700'>{currency}{item.amount}</p>

                            {item.cancelled ? (
                                <p className='text-red-400 text-xs font-medium'>Cancelled</p>
                            ) : item.isCompleted ? (
                                <p className='text-green-500 text-xs font-medium'>Completed</p>
                            ) : (
                                <div className='flex gap-2'>
                                    <img
                                        onClick={() => cancelAppointment(item._id)}
                                        className='w-10 cursor-pointer opacity-80 hover:opacity-100 transition-transform hover:scale-105'
                                        src={assets.cancel_icon}
                                        alt="Cancel"
                                    />
                                    <img
                                        onClick={() => completeAppointment(item._id)}
                                        className='w-10 cursor-pointer opacity-80 hover:opacity-100 transition-transform hover:scale-105'
                                        src={assets.tick_icon}
                                        alt="Complete"
                                    />
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* --- MODAL LỊCH SỬ --- */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[99]">
                    <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl animate-fade-in-up">
                        <div className="flex justify-between items-center p-4 border-b bg-blue-50 rounded-t-lg">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                📂 Hồ Sơ Bệnh Án
                            </h2>
                            <button onClick={() => setShowHistoryModal(false)} className="text-3xl text-gray-400 hover:text-red-500 transition-colors">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto bg-gray-100 flex-1">
                            {historyLoading ? (
                                <div className="flex justify-center items-center h-full text-gray-500 gap-2">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    <p>Đang tải dữ liệu...</p>
                                </div>
                            ) : patientHistory.length === 0 ? (
                                <div className="text-center text-gray-500 mt-10">Chưa có lịch sử khám.</div>
                            ) : (
                                <div className="space-y-4">
                                    {patientHistory.map((h, i) => (
                                        <div key={i} className="bg-white p-4 rounded shadow border hover:shadow-md transition-shadow">
                                            {/* Header Record */}
                                            <div className="flex justify-between font-bold text-blue-600 border-b pb-2 mb-2">
                                                <span>{slotDateFormat(h.slotDate)} - {h.slotTime}</span>
                                                <span className={`text-[10px] px-2 py-1 rounded border ${h.appointmentType === 'Remote' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                                    {h.appointmentType === 'Remote' ? 'REMOTE' : 'CLINIC'}
                                                </span>
                                            </div>

                                            {/* Body Record */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs font-bold text-gray-500 uppercase">Chẩn đoán</p>
                                                    <p className="text-gray-800 font-medium">{h.diagnosis}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-500 uppercase">Triệu chứng</p>
                                                    <p className="text-gray-600 italic">"{h.symptoms}"</p>
                                                </div>
                                            </div>

                                            {/* Prescription Preview (Nếu có) */}
                                            {h.prescription && h.prescription.length > 0 && (
                                                <div className="mt-3 pt-2 border-t border-dashed">
                                                    <p className="text-xs text-gray-400">Đơn thuốc: {h.prescription.length} loại</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-3 bg-gray-50 border-t flex justify-end">
                            <button onClick={() => setShowHistoryModal(false)} className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm font-medium">Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default DoctorAppointments