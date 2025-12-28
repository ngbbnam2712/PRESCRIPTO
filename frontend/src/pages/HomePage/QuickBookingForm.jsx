import React, { useState, useContext, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../../context/AppContext';

const QuickBookingForm = ({ onCloseModal }) => {

    const { backendUrl, doctors, specializations, token, setToken } = useContext(AppContext);
    const daysOfWeek = ['CN', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy'];

    // --- STATE DỮ LIỆU & UI ---
    const [docSlots, setDocSlots] = useState([]);
    const [slotIndex, setSlotIndex] = useState(0);
    const [slotTime, setSlotTime] = useState('');
    const [selectedDocId, setSelectedDocId] = useState('');
    const [loading, setLoading] = useState(false);
    const [bookingType, setBookingType] = useState('Clinic');

    const [formData, setFormData] = useState({
        speciality: '',
        name: '',
        phone: '',
        email: '',
        dob: '',
        gender: 'Male',
        address: ''
    });

    // --- 1. LẤY DATA BÁC SĨ (Giữ nguyên) ---
    const selectedDoctorObj = useMemo(() => doctors.find(doc => doc._id === selectedDocId), [selectedDocId, doctors]);
    const availableDoctors = useMemo(() => {
        if (!formData.speciality) return [];
        return doctors.filter(doc => doc.specializationId === formData.speciality || doc.speciality === formData.speciality);
    }, [formData.speciality, doctors]);

    // --- 2. LOGIC TẠO SLOT (Giữ nguyên logic đã tối ưu trước đó) ---
    useEffect(() => {
        if (!selectedDoctorObj) { setDocSlots([]); return; }
        const getAvailableSlots = () => {
            let allSlots = [];
            let today = new Date();
            for (let i = 0; i < 14; i++) {
                let currentDate = new Date(today);
                currentDate.setDate(today.getDate() + i);
                let endTime = new Date(today);
                endTime.setDate(today.getDate() + i);
                endTime.setHours(21, 0, 0, 0);

                if (i === 0) {
                    let curHour = currentDate.getHours();
                    if (curHour >= 10) {
                        currentDate.setHours(curHour + 1);
                        currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0);
                    } else {
                        currentDate.setHours(10);
                        currentDate.setMinutes(0);
                    }
                } else {
                    currentDate.setHours(10);
                    currentDate.setMinutes(0);
                }
                currentDate.setSeconds(0);
                currentDate.setMilliseconds(0);

                let timeSlots = [];
                while (currentDate < endTime) {
                    let startHours = currentDate.getHours();
                    let startMinutes = currentDate.getMinutes();
                    let endSlotTime = new Date(currentDate);
                    endSlotTime.setMinutes(endSlotTime.getMinutes() + 30);
                    let endHours = endSlotTime.getHours();
                    let endMinutes = endSlotTime.getMinutes();
                    let slotRange = `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')} - ${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
                    const slotDateKey = `${currentDate.getDate()}_${currentDate.getMonth() + 1}_${currentDate.getFullYear()}`;
                    const bookedSlots = selectedDoctorObj.slots_booked || {};
                    if (!(bookedSlots[slotDateKey] && bookedSlots[slotDateKey].includes(slotRange))) {
                        timeSlots.push({ datetime: new Date(currentDate), time: slotRange });
                    }
                    currentDate.setMinutes(currentDate.getMinutes() + 30);
                }
                const dateObj = new Date(today.getTime() + i * 86400000);
                if (timeSlots.length > 0 || i < 3) {
                    allSlots.push({
                        day: daysOfWeek[dateObj.getDay()],
                        date: dateObj.getDate(),
                        displayDate: dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                        backendDate: `${dateObj.getDate()}_${dateObj.getMonth() + 1}_${dateObj.getFullYear()}`,
                        slots: timeSlots
                    });
                }
            }
            setDocSlots(allSlots);
            setSlotIndex(0);
            setSlotTime('');
        };
        getAvailableSlots();
    }, [selectedDoctorObj]);

    // --- 3. HANDLERS ---
    const handleOnChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (e.target.name === 'speciality') { setSelectedDocId(''); setSlotTime(''); }
    };

    // --- QUAN TRỌNG: HÀM XỬ LÝ ĐẶT LỊCH MỚI ---
    const handleBookAppointment = async () => {
        // 1. Validation
        if (!formData.speciality) return toast.warn("Vui lòng chọn chuyên khoa!");
        if (!selectedDocId) return toast.warn("Vui lòng chọn bác sĩ!");
        if (!slotTime) return toast.warn("Vui lòng chọn giờ khám!");
        if (!token && (!formData.name || !formData.phone || !formData.email || !formData.dob)) {
            return toast.warn("Vui lòng nhập đầy đủ thông tin cá nhân!");
        }

        setLoading(true);

        try {
            let currentToken = token;

            // 2. NẾU CHƯA LOGIN -> GỌI API ĐĂNG KÝ TRƯỚC
            if (!currentToken) {
                // Tạo payload đăng ký
                const registerPayload = {
                    name: formData.name,
                    email: formData.email,
                    password: "ngbbn2712", // Mật khẩu mặc định theo yêu cầu
                    phone: formData.phone,
                    dob: formData.dob,
                    gender: formData.gender,
                    address: formData.address || ""
                };

                try {
                    // Gọi API Register chuẩn của hệ thống
                    const regRes = await axios.post(backendUrl + '/api/user/register', registerPayload);

                    if (regRes.data.success) {
                        currentToken = regRes.data.token;
                        // Lưu token ngay lập tức
                        setToken(currentToken);
                        localStorage.setItem('token', currentToken);
                        toast.success("Đã tự động tạo tài khoản cho bạn!");
                    } else {
                        toast.error("Đăng ký thất bại: " + regRes.data.message);
                        setLoading(false);
                        return; // Dừng lại nếu không tạo được user
                    }
                } catch (regError) {
                    console.error("Lỗi đăng ký:", regError);
                    // Nếu lỗi là do email đã tồn tại, có thể xem xét gọi API login hoặc báo lỗi
                    toast.error(regError.response?.data?.message || "Lỗi khi tạo tài khoản mới");
                    setLoading(false);
                    return;
                }
            }

            // 3. TIẾN HÀNH ĐẶT LỊCH (Lúc này chắc chắn đã có currentToken)
            const appointmentPayload = {
                docId: selectedDocId,
                slotDate: docSlots[slotIndex].backendDate,
                slotTime: slotTime,
                amount: selectedDoctorObj.fees,
                appointmentType: bookingType,
                userData: null // Đã có token nên không cần gửi userData nữa
            };

            // Gọi API book-appointment chuẩn (không dùng guest nữa)
            const bookRes = await axios.post(
                backendUrl + '/api/user/book-appointment',
                appointmentPayload,
                { headers: { token: currentToken } } // Header chứa token vừa tạo/hoặc có sẵn
            );

            if (bookRes.data.success) {
                toast.success("Đặt lịch thành công!");
                setSlotTime(''); // Reset giờ
                if (onCloseModal) onCloseModal(); // Đóng modal, không chuyển trang
            } else {
                toast.error(bookRes.data.message);
            }

        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Lỗi kết nối server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white w-full rounded-xl shadow-xl border border-gray-200 overflow-hidden relative font-sans">
            {onCloseModal && (
                <button onClick={onCloseModal} className="absolute top-3 right-3 z-10 p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
            )}

            <div className="flex text-sm font-semibold border-b border-gray-200">
                <button onClick={() => setBookingType('Clinic')} className={`flex-1 py-3 transition-colors ${bookingType === 'Clinic' ? 'bg-blue-600 text-white' : 'text-gray-600 bg-gray-50 hover:bg-gray-100'}`}>Tại Phòng Khám</button>
                <button onClick={() => setBookingType('Remote')} className={`flex-1 py-3 transition-colors ${bookingType === 'Remote' ? 'bg-blue-600 text-white' : 'text-gray-600 bg-gray-50 hover:bg-gray-100'}`}>Khám Từ Xa</button>
            </div>

            <div className="p-6 space-y-4">
                <h3 className="text-lg font-bold text-gray-800 text-center uppercase">ĐẶT LỊCH NHANH</h3>

                {/* 1. CHỌN CHUYÊN KHOA */}
                <div>
                    <label className="text-xs font-bold text-gray-500 ml-1">CHUYÊN KHOA <span className='text-red-500'>*</span></label>
                    <select name="speciality" value={formData.speciality} onChange={handleOnChange} className="w-full mt-1 p-2.5 border border-gray-300 rounded text-sm bg-gray-50 focus:border-blue-500 outline-none">
                        <option value="">-- Chọn chuyên khoa --</option>
                        {specializations.map((item) => (<option key={item._id} value={item._id}>{item.name}</option>))}
                    </select>
                </div>

                {/* 2. CHỌN BÁC SĨ */}
                {formData.speciality && (
                    <div className="animate-fade-in-up">
                        <label className="text-xs font-bold text-gray-500 ml-1">BÁC SĨ <span className='text-red-500'>*</span></label>
                        <select value={selectedDocId} onChange={(e) => setSelectedDocId(e.target.value)} className="w-full mt-1 p-2.5 border border-blue-300 rounded text-sm bg-blue-50 focus:border-blue-500 outline-none">
                            <option value="">-- Chọn bác sĩ --</option>
                            {availableDoctors.length > 0 ? (availableDoctors.map((doc) => <option key={doc._id} value={doc._id}>{doc.name} — {doc.fees.toLocaleString()} VND</option>)) : (<option disabled>Không tìm thấy bác sĩ</option>)}
                        </select>
                    </div>
                )}

                {/* 3. CHỌN SLOT NGÀY & GIỜ */}
                {selectedDocId && (
                    <div className="mt-2 animate-fade-in-up">
                        <div className="bg-blue-50 p-3 rounded border border-blue-100 mb-3 flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-700">📅 Chọn lịch khám</span>
                            <span className="text-xs font-bold text-blue-700 bg-white px-2 py-1 rounded shadow-sm">
                                {docSlots[slotIndex]?.displayDate} {slotTime ? `| ${slotTime}` : ''}
                            </span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {docSlots.map((item, index) => (
                                <div key={index} onClick={() => { setSlotIndex(index); setSlotTime(''); }} className={`min-w-[4.5rem] text-center py-2 px-2 rounded-lg cursor-pointer border transition-all ${slotIndex === index ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}>
                                    <p className="text-[10px] uppercase font-bold opacity-80">{item.day}</p>
                                    <p className="text-lg font-bold">{item.date}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 flex gap-2 flex-wrap">
                            {docSlots[slotIndex]?.slots.length > 0 ? (
                                docSlots[slotIndex].slots.map((item, index) => (
                                    <button key={index} onClick={() => setSlotTime(item.time)} className={`px-3 py-1.5 text-[11px] font-medium rounded-full border transition-all ${slotTime === item.time ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:text-blue-600 hover:border-blue-400'}`}>
                                        {item.time}
                                    </button>
                                ))
                            ) : (<p className="text-xs text-gray-400 italic w-full text-center py-2">Không còn lịch trống.</p>)}
                        </div>
                    </div>
                )}

                {/* 4. FORM THÔNG TIN (CHỈ HIỆN KHI CHƯA CÓ TOKEN) */}
                {!token && (
                    <div className="animate-fade-in-down border-t border-dashed border-gray-300 pt-4 mt-2">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-3">Thông tin đăng ký nhanh</p>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <input type="text" name="name" value={formData.name} onChange={handleOnChange} placeholder="Họ và tên *" className="p-2.5 border border-gray-300 rounded text-sm focus:border-blue-500 outline-none w-full" />
                            <input type="text" name="phone" value={formData.phone} onChange={handleOnChange} placeholder="Số điện thoại *" className="p-2.5 border border-gray-300 rounded text-sm focus:border-blue-500 outline-none w-full" />
                        </div>
                        <div className="mb-3">
                            <input type="email" name="email" value={formData.email} onChange={handleOnChange} placeholder="Email *" className="p-2.5 border border-gray-300 rounded text-sm focus:border-blue-500 outline-none w-full" />
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <input type="date" name="dob" value={formData.dob} onChange={handleOnChange} className={`p-2.5 border border-gray-300 rounded text-sm focus:border-blue-500 outline-none w-full ${!formData.dob ? 'text-gray-400' : 'text-gray-900'}`} />
                            <select name="gender" value={formData.gender} onChange={handleOnChange} className="p-2.5 border border-gray-300 rounded text-sm focus:border-blue-500 outline-none w-full">
                                <option value="Male">Nam</option>
                                <option value="Female">Nữ</option>
                            </select>
                        </div>
                        <input type="text" name="address" value={formData.address} onChange={handleOnChange} placeholder="Địa chỉ (Tùy chọn)" className="p-2.5 border border-gray-300 rounded text-sm focus:border-blue-500 outline-none w-full" />
                    </div>
                )}

                <button onClick={handleBookAppointment} disabled={loading} className={`w-full font-bold py-3 rounded shadow-md text-white transition-all uppercase tracking-wide mt-2 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 active:scale-95'}`}>
                    {loading ? 'Đang xử lý...' : 'Xác Nhận Đặt Lịch'}
                </button>
            </div>
        </div>
    );
};

export default QuickBookingForm;