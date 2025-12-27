import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';

const DoctorScheduleModal = ({ doctor, isOpen, onClose }) => {

    const { aToken, backendUrl } = useContext(AdminContext);
    const { currencySymbol } = useContext(AppContext);

    // --- STATE 1: Quản lý thông tin Bác sĩ (Real-time update) ---
    // Khởi tạo bằng props doctor, nhưng sẽ update ngay khi mở modal
    const [currentDoc, setCurrentDoc] = useState(doctor);

    // --- STATE 2: Quản lý Slot ---
    const [docSlots, setDocSlots] = useState([]);
    const [slotIndex, setSlotIndex] = useState(0);
    const [slotTime, setSlotTime] = useState('');

    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    // --- STATE 3: Form nhập liệu của Admin (Riêng biệt với User) ---
    const [adminFormData, setAdminFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        gender: 'Male',
        reason: '',
        appointmentType: 'Clinic',
        dob: ''
    });
    const calculateAge = (dob) => {
        if (!dob) return '';
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };
    // State UI để tô màu nút chọn Mode
    const [uiMode, setUiMode] = useState('clinic');

    // =========================================================================
    // HÀM 1: LẤY DỮ LIỆU BÁC SĨ MỚI NHẤT TỪ SERVER
    // Khắc phục lỗi User đặt rồi nhưng Admin chưa thấy mất Slot
    // =========================================================================
    const fetchLatestDocInfo = async () => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/all-doctors', {}, { headers: { aToken } });
            if (data.success) {
                const freshDocData = data.doctors.find(doc => doc._id === doctor._id);
                if (freshDocData) {
                    setCurrentDoc(freshDocData);
                }
            }
        } catch (error) {
            console.log("Error fetching latest doc info:", error);
        }
    };

    // =========================================================================
    // HÀM 2: TÍNH TOÁN SLOT KHẢ DỤNG
    // =========================================================================
    const getAvailableSlots = async () => {
        setDocSlots([]);
        let today = new Date();

        // Luôn dùng dữ liệu mới nhất
        const activeDoctor = currentDoc || doctor;

        // DEBUG: Xem dữ liệu booked thực tế là gì
        console.log("--- DEBUG SLOTS ---");
        console.log("Doctor Name:", activeDoctor.name);
        console.log("Booked Data from DB:", activeDoctor.slots_booked);

        for (let i = 0; i < 7; i++) {
            let currentDate = new Date(today);
            currentDate.setDate(today.getDate() + i);

            let endTime = new Date();
            endTime.setDate(today.getDate() + i);
            endTime.setHours(21, 0, 0, 0);

            // Logic chỉnh giờ bắt đầu (Giữ nguyên)
            if (i === 0) {
                if (today.getDate() === currentDate.getDate()) {
                    if (currentDate.getHours() >= 21) {
                        currentDate.setHours(22);
                    } else {
                        currentDate.setHours(currentDate.getHours() > 10 ? currentDate.getHours() + 1 : 10);
                        currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0);
                    }
                }
            } else {
                currentDate.setHours(10);
                currentDate.setMinutes(0);
            }

            let timeSlots = [];
            while (currentDate < endTime) {
                // 1. CHUẨN HÓA GIỜ (Quan trọng: Phải khớp format với lúc User đặt)
                // Ép kiểu về 'en-US' để tránh bị 'CH/SA' nếu máy Admin để tiếng Việt
                let formattedTime = currentDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true // Hoặc false tùy vào lúc bạn lưu User lưu thế nào. Thường là true (10:00 AM)
                });

                // Loại bỏ khoảng trắng thừa nếu có (ví dụ "10:00 AM" -> "10:00 AM")
                // Nếu User lưu là "10:00" (24h) thì sửa hour12: false

                // 2. CHUẨN HÓA NGÀY (Key để tra cứu)
                let day = currentDate.getDate();
                let month = currentDate.getMonth() + 1;
                let year = currentDate.getFullYear();

                // Lưu ý: Key phải khớp tuyệt đối. Ví dụ: '5_1_2025' khác '05_01_2025'
                const slotDate = `${day}_${month}_${year}`;

                // 3. KIỂM TRA (CHECKING)
                let isSlotAvailable = true;

                // Kiểm tra an toàn: slots_booked có tồn tại không?
                if (activeDoctor.slots_booked) {
                    if (activeDoctor.slots_booked[slotDate]) {
                        // Lấy mảng giờ đã đặt trong DB (Ví dụ: ["10:00 am"])
                        const bookedTimes = activeDoctor.slots_booked[slotDate];

                        // Kiểm tra: Có giờ nào trong DB trùng với giờ hiện tại (không phân biệt hoa thường) không?
                        const isMatch = bookedTimes.some(bTime =>
                            bTime.toLowerCase() === formattedTime.toLowerCase()
                        );

                        if (isMatch) {
                            isSlotAvailable = false;
                        }
                    }
                }

                if (isSlotAvailable) {
                    timeSlots.push({
                        datetime: new Date(currentDate),
                        time: formattedTime
                    });
                }
                currentDate.setMinutes(currentDate.getMinutes() + 30);
            }
            setDocSlots(prev => [...prev, timeSlots]);
        }
    };

    // =========================================================================
    // EFFECT HOOKS
    // =========================================================================

    // 1. Khi mở Modal: Reset form & Gọi API lấy data mới
    useEffect(() => {
        if (isOpen && doctor) {
            // Reset States
            setSlotTime('');
            setAdminFormData({
                name: '', phone: '', email: '', address: '', gender: 'Male', reason: '', appointmentType: 'Clinic'
            });
            setUiMode('clinic');

            // Set tạm data cũ để UI hiện ngay
            setCurrentDoc(doctor);

            // Gọi API update ngầm
            fetchLatestDocInfo();
        }
    }, [isOpen, doctor]);

    // 2. Khi có data bác sĩ mới -> Tính lại Slot
    useEffect(() => {
        if (currentDoc) {
            getAvailableSlots();
        }
    }, [currentDoc]);

    // 3. Tự động nhảy sang ngày có slot đầu tiên
    useEffect(() => {
        if (docSlots.length > 0) {
            const firstAvailableIndex = docSlots.findIndex(daySlots => daySlots.length > 0);
            if (firstAvailableIndex !== -1) {
                setSlotIndex(firstAvailableIndex);
            }
        }
    }, [docSlots]);

    // =========================================================================
    // HANDLERS
    // =========================================================================

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setAdminFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTabChange = (mode) => {
        setUiMode(mode);
        setAdminFormData(prev => ({
            ...prev,
            appointmentType: mode === 'clinic' ? 'Clinic' : 'Remote'
        }));
    };

    const handleAdminBooking = async () => {
        // Validate
        if (!slotTime) return toast.warning('Please select a time slot!');
        if (!adminFormData.phone) return toast.warning('Please fill in patient phone!');

        try {
            // Tính ngày được chọn
            const date = new Date();
            date.setDate(date.getDate() + slotIndex);
            let day = date.getDate();
            let month = date.getMonth() + 1;
            let year = date.getFullYear();
            const slotDate = `${day}_${month}_${year}`;

            // Payload gửi xuống Backend
            // Tự động thêm chuyên khoa của bác sĩ vào userData
            const userDataPayload = {
                ...adminFormData,
                speciality: currentDoc.speciality
            };

            const { data } = await axios.post(backendUrl + '/api/admin/book-appointment', {
                docId: currentDoc._id,
                slotDate,
                slotTime,
                userData: userDataPayload,
                appointmentType: adminFormData.appointmentType
            }, { headers: { aToken } });

            if (data.success) {
                toast.success("Booking Created Successfully!");
                onClose(); // Đóng modal
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    if (!isOpen || !currentDoc) return null;

    // Tính ngày đang hiển thị để show ở Summary
    const selectedDateObj = new Date();
    selectedDateObj.setDate(selectedDateObj.getDate() + slotIndex);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl p-6 relative animate-fade-in-up h-[90vh] md:h-auto overflow-y-auto">

                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-2xl font-bold">&times;</button>

                {/* --- HEADER --- */}
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <img src={currentDoc.image} alt="" className="w-12 h-12 rounded-full object-cover border" />
                    <div>
                        <p className="text-sm font-normal text-gray-500">Booking for:</p>
                        <span className="text-blue-600">{currentDoc.name}</span>
                        <span className="text-gray-400 text-sm ml-2 px-2 py-0.5 bg-gray-100 rounded-full">{currentDoc.speciality}</span>
                    </div>
                </h2>

                <div className="flex flex-col lg:flex-row gap-10">

                    {/* --- CỘT TRÁI: SLOT SELECTOR --- */}
                    <div className="w-full lg:w-[60%] border-r border-gray-100 pr-0 lg:pr-6">
                        <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">Select Date & Time</h3>

                        {/* Day List */}
                        <p className="font-semibold text-sm text-gray-600 mb-2">Pick a Date:</p>
                        <div className='flex gap-3 items-center w-full overflow-x-scroll mt-4 pb-2 scrollbar-hide'>
                            {docSlots.length > 0 && docSlots.map((item, index) => {
                                let date = new Date();
                                date.setDate(date.getDate() + index);
                                const isDayExpired = docSlots[index].length === 0;

                                return (
                                    <div
                                        key={index}
                                        onClick={() => !isDayExpired && setSlotIndex(index)}
                                        className={`
                                            text-center py-4 min-w-[80px] rounded-xl transition-all shadow-sm flex-shrink-0 border
                                            ${isDayExpired
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                                                : slotIndex === index
                                                    ? 'bg-blue-600 text-white shadow-md scale-105 cursor-pointer'
                                                    : 'bg-white hover:border-blue-400 cursor-pointer'
                                            }
                                        `}
                                    >
                                        <p className="text-xs font-bold uppercase">{daysOfWeek[date.getDay()]}</p>
                                        <p className="text-xl font-bold">{date.getDate()}</p>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Time List */}
                        <p className="font-semibold text-sm text-gray-600 mb-2 mt-4">Pick a Time Slot:</p>
                        <div className="flex gap-3 items-center w-full flex-wrap">
                            {docSlots.length > 0 && docSlots[slotIndex] && docSlots[slotIndex].map((item, index) => (
                                <p
                                    key={index}
                                    onClick={() => setSlotTime(item.time)}
                                    className={`
                                        text-sm font-medium text-center px-4 py-2 rounded-lg cursor-pointer transition-colors border
                                        ${item.time === slotTime
                                            ? 'bg-green-600 text-white border-green-600'
                                            : 'text-gray-600 border-gray-200 hover:border-blue-500 hover:text-blue-600'
                                        }
                                    `}
                                >
                                    {item.time.toLowerCase()}
                                </p>
                            ))}
                        </div>

                        {(!docSlots.length || !docSlots[slotIndex] || docSlots[slotIndex].length === 0) && (
                            <div className="mt-4 text-center border border-dashed border-gray-300 p-4 rounded-lg bg-gray-50">
                                <p className="text-gray-500 text-sm">No slots available for this date.</p>
                            </div>
                        )}
                    </div>

                    {/* --- CỘT PHẢI: ADMIN FORM --- */}
                    <div className="w-full lg:w-[40%] flex flex-col">
                        <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">Patient Details</h3>

                        <div className="bg-gray-50 p-4 rounded-xl h-full flex flex-col justify-between border border-gray-200">

                            {/* Mode Selection Tabs */}
                            <div className="flex text-sm font-semibold border border-gray-300 bg-white rounded-lg overflow-hidden mb-4">
                                {['clinic', 'home'].map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => handleTabChange(mode)}
                                        className={`flex-1 py-2 text-center capitalize transition-colors ${uiMode === mode ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        {mode === 'clinic' ? 'At Clinic' : 'Remote/Home'}
                                    </button>
                                ))}
                            </div>

                            {/* Inputs */}
                            <div className="flex flex-col gap-3">
                                {/* Read-only Specialty */}
                                <div className="flex flex-col">
                                    <label className="text-xs text-gray-500 font-semibold mb-1">Doctor Specialty</label>
                                    <input
                                        type="text"
                                        value={currentDoc.speciality}
                                        disabled
                                        className="p-2 border border-gray-300 rounded text-sm bg-gray-200 text-gray-600 cursor-not-allowed font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="text" name="name"
                                        value={adminFormData.name} onChange={handleInputChange}
                                        placeholder="Full Name"
                                        className="p-2 border border-gray-300 rounded text-sm focus:border-blue-500 outline-none"
                                    />
                                    <input
                                        type="text" name="phone"
                                        value={adminFormData.phone} onChange={handleInputChange}
                                        placeholder="Phone *"
                                        className="p-2 border border-gray-300 rounded text-sm focus:border-blue-500 outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="email" name="email"
                                        value={adminFormData.email} onChange={handleInputChange}
                                        placeholder="Email"
                                        className="p-2 border border-gray-300 rounded text-sm focus:border-blue-500 outline-none"
                                    />
                                    <select
                                        name="gender"
                                        value={adminFormData.gender} onChange={handleInputChange}
                                        className="p-2 border border-gray-300 rounded text-sm bg-white outline-none"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2 items-center">
                                    <div className='flex flex-col'>
                                        <label className="text-xs text-gray-500 font-semibold mb-1 ml-1">Date of Birth</label>
                                        <input
                                            type="date"
                                            name="dob"
                                            value={adminFormData.dob}
                                            onChange={handleInputChange}
                                            className="p-2 border border-gray-300 rounded text-sm focus:border-blue-500 outline-none text-gray-600"
                                        />
                                    </div>

                                    {/* Hiển thị Tuổi tự động */}
                                    <div className='flex flex-col'>
                                        <label className="text-xs text-gray-500 font-semibold mb-1 ml-1">Calculated Age</label>
                                        <div className="p-2 bg-gray-100 border border-gray-200 rounded text-sm text-gray-700 font-bold text-center">
                                            {adminFormData.dob ? `${calculateAge(adminFormData.dob)} years old` : '--'}
                                        </div>
                                    </div>
                                </div>
                                <input
                                    type="text" name="address"
                                    value={adminFormData.address} onChange={handleInputChange}
                                    placeholder="Address"
                                    className="p-2 border border-gray-300 rounded text-sm w-full focus:border-blue-500 outline-none"
                                />

                                <textarea
                                    name="reason" rows="2"
                                    value={adminFormData.reason} onChange={handleInputChange}
                                    placeholder="Reason / Symptoms..."
                                    className="p-2 border border-gray-300 rounded text-sm w-full resize-none focus:border-blue-500 outline-none"
                                ></textarea>
                            </div>

                            {/* Summary & Button */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex justify-between items-center mb-2 text-sm">
                                    <span className="text-gray-600">Selected:</span>
                                    <span className="font-bold text-gray-900">
                                        {selectedDateObj.toLocaleDateString()} {slotTime ? ` at ${slotTime}` : ''}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mb-4 text-sm border-t pt-2">
                                    <span className="text-gray-600">Consultation Fee:</span>
                                    <span className="font-bold text-green-600 text-lg">{currencySymbol}{currentDoc.fees}</span>
                                </div>

                                <button
                                    onClick={handleAdminBooking}
                                    className={`
                                        w-full font-bold py-3 rounded-lg transition shadow uppercase tracking-wide flex items-center justify-center gap-2
                                        ${slotTime ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
                                    `}
                                    disabled={!slotTime}
                                >
                                    Confirm Booking
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default DoctorScheduleModal;