import React, { useState, useContext, useMemo, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../../context/AppContext.jsx';
import BookingSuccessModal from '../HomePage/BookingSuccessModal.jsx';
import BookingPaymentModal from '../HomePage/BookingPaymentModal.jsx';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';

const QuickBookingForm = ({ initialData, onCloseModal }) => {

    const { backendUrl, doctors } = useContext(AppContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const specialties = [
        { speciality: 'General physician' },
        { speciality: 'Gynecologist' },
        { speciality: 'Dermatologist' },
        { speciality: 'Pediatricians' },
        { speciality: 'Neurologist' },
        { speciality: 'Gastroenterologist' }
    ];

    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    // --- STATE QUẢN LÝ SLOT ---
    const [docInfo, setDocInfo] = useState(null); // Lưu thông tin chi tiết bác sĩ (có slots_booked)
    const [docSlots, setDocSlots] = useState([]); // Danh sách slot hiển thị
    const [slotIndex, setSlotIndex] = useState(0);
    const [slotDate, setSlotDate] = useState('');
    const [slotTime, setSlotTime] = useState('');

    // --- STATE FORM ---
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        dob: '',
        gender: 'Male',
        line1: '',
        line2: '',
        reason: '',
        appointmentType: 'Clinic',
        speciality: '',
    });

    const [bookingType, setBookingType] = useState('clinic');
    const [selectedDocId, setSelectedDocId] = useState('');

    // Modal states
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // --- 1. LẤY THÔNG TIN BÁC SĨ KHI CHỌN ---
    useEffect(() => {
        const fetchDocInfo = async () => {
            if (selectedDocId) {
                // Lấy thông tin bác sĩ từ danh sách có sẵn (hoặc gọi API nếu cần data mới nhất)
                const doc = doctors.find(d => d._id === selectedDocId);
                setDocInfo(doc);

                // Reset slot khi đổi bác sĩ
                setSlotTime('');
                setSlotIndex(0);
            } else {
                setDocInfo(null);
                setDocSlots([]);
            }
        };
        fetchDocInfo();
    }, [selectedDocId, doctors]);

    // --- 2. LOGIC TẠO SLOT (Dựa trên logic bạn cung cấp + Thêm cấu trúc cho UI) ---
    useEffect(() => {
        const generateSlots = () => {
            if (!docInfo) {
                return;
            }

            // Reset mảng cũ
            setDocSlots([]);

            let today = new Date();

            // Loop 7 ngày
            for (let i = 0; i < 7; i++) {
                let currentDate = new Date(today);
                currentDate.setDate(today.getDate() + i);

                let endTime = new Date();
                endTime.setDate(today.getDate() + i);
                endTime.setHours(21, 0, 0, 0); // Kết thúc 9 PM

                // --- Logic xử lý giờ bắt đầu (Start Time Logic) ---
                if (i === 0) {
                    let currentHour = currentDate.getHours();
                    let currentMinute = currentDate.getMinutes();

                    if (currentHour >= 10) {
                        currentDate.setHours(currentHour + 1);
                        currentDate.setMinutes(currentMinute > 30 ? 30 : 0);
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

                // --- Vòng lặp tạo slot ---
                while (currentDate < endTime) {
                    let hours = currentDate.getHours();
                    let minutes = currentDate.getMinutes();
                    let ampm = hours >= 12 ? 'PM' : 'AM';

                    let displayHour = hours % 12;
                    displayHour = displayHour ? displayHour : 12;
                    let displayMinute = minutes < 10 ? '0' + minutes : minutes;

                    let formatedTime = `${displayHour}:${displayMinute} ${ampm}`; // 10:00 AM

                    // Tạo key ngày để check trong slots_booked
                    let day = currentDate.getDate();
                    let month = currentDate.getMonth() + 1;
                    let year = currentDate.getFullYear();

                    const slotDateKey = day + '_' + month + '_' + year; // Format key trong DB: 24_12_2025

                    // Lấy danh sách đã book từ docInfo
                    const bookedSlots = docInfo.slots_booked || {};

                    // Kiểm tra trùng lịch
                    const isSlotAvailable = bookedSlots[slotDateKey] && bookedSlots[slotDateKey].includes(formatedTime) ? false : true;

                    if (isSlotAvailable) {
                        timeSlots.push({
                            datetime: new Date(currentDate),
                            time: formatedTime
                        });
                    }
                    currentDate.setMinutes(currentDate.getMinutes() + 30);
                }

                // --- Tạo cấu trúc dữ liệu cho UI hiển thị ---
                const dateObj = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);

                setDocSlots(prev => [...prev, {
                    datetime: dateObj,
                    day: daysOfWeek[dateObj.getDay()], // MON, TUE...
                    date: dateObj.getDate(), // 24
                    formattedDate: dateObj.toLocaleDateString('en-GB'), // 24/12/2025 (để hiển thị và lưu)
                    slots: timeSlots
                }]);
            }
        };

        generateSlots();
    }, [docInfo]); // Chạy lại khi docInfo thay đổi

    // --- 3. TỰ ĐỘNG CHỌN NGÀY ĐẦU TIÊN ---
    useEffect(() => {
        if (docSlots.length > 0 && !slotDate) {
            setSlotDate(docSlots[0].formattedDate);
        }
    }, [docSlots, slotDate]);

    // --- 4. XỬ LÝ INITIAL DATA TỪ CHATBOT ---
    useEffect(() => {
        if (initialData) {
            setFormData((prev) => ({
                ...prev,
                name: initialData.name || '',
                phone: initialData.phone || '',
                email: initialData.email || '',
                dob: initialData.dob || '',
                speciality: initialData.speciality || prev.speciality,
            }));

            if (initialData.doctorId) {
                setSelectedDocId(initialData.doctorId);
                const preSelectedDoc = doctors.find(doc => doc._id === initialData.doctorId);
                if (preSelectedDoc) {
                    setFormData(prev => ({ ...prev, speciality: preSelectedDoc.speciality }));
                }
            }
            if (initialData.time) setSlotTime(initialData.time);

            // Map ngày từ Chatbot (nếu có logic convert date)
            if (initialData.date) {
                setSlotDate(initialData.date);
            }
        }
    }, [initialData, doctors]);


    // --- HELPERS ---
    const availableDoctors = useMemo(() => {
        if (!formData.speciality) return [];
        return doctors.filter(doc => doc.speciality === formData.speciality);
    }, [formData.speciality, doctors]);

    const selectedDoctorObj = doctors.find(doc => doc._id === selectedDocId);

    // --- XỬ LÝ THANH TOÁN ---
    const handleConfirmAndPay = async () => {
        setLoading(true);
        try {
            const finalUserData = {
                ...formData,
                address: { line1: formData.line1, line2: formData.line2 }
            };

            const payload = {
                userData: finalUserData,
                appointmentType: formData.appointmentType,
                docId: selectedDocId,
                amount: selectedDoctorObj ? selectedDoctorObj.fees : 0,
                slotDate: slotDate,
                slotTime: slotTime
            };

            console.log("Payload Sending:", payload);

            const { data } = await axios.post(backendUrl + '/api/user/create-guest-payment', payload);

            if (data.success && data.paymentUrl) {
                window.location.href = data.paymentUrl;
            } else {
                toast.error(data.message || "Lỗi tạo thanh toán");
                setLoading(false);
            }

        } catch (error) {
            console.error(error);
            toast.error("Connection Error");
            setLoading(false);
        }
    };

    // --- HANDLERS ---
    const handleModeChange = (mode) => {
        setBookingType(mode);
        setFormData(prev => ({ ...prev, appointmentType: mode === 'clinic' ? 'Clinic' : 'Remote' }));
    };

    const handleOnChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'speciality') setSelectedDocId('');
    };

    const handleInitiateBooking = () => {
        if (!formData.name || !formData.phone) return toast.warning("Please enter Name and Phone!");
        if (!formData.dob) return toast.warning("Please enter Date of Birth!");
        if (!formData.speciality) return toast.warning("Please select a Specialty!");
        if (!selectedDocId) return toast.warning("Please select a Doctor!");
        if (!slotTime) return toast.warning("Please select a Time Slot!");

        setShowPaymentModal(true);
    };

    const handleCloseSuccess = () => {
        setShowSuccessModal(false);
        setFormData({
            name: '', phone: '', email: '', dob: '',
            line1: '', line2: '',
            gender: 'Male', reason: '', appointmentType: 'Clinic', speciality: '',
        });
        setSlotIndex(0);
        setSlotTime('');
        setSelectedDocId('');
        if (onCloseModal) onCloseModal();
    };

    useEffect(() => {
        const paymentStatus = searchParams.get("payment");
        if (paymentStatus === "success") {
            setShowSuccessModal(true);
            toast.success("Thanh toán thành công!");
            navigate(location.pathname, { replace: true });
        } else if (paymentStatus === "failed") {
            toast.error("Giao dịch bị hủy hoặc lỗi.");
            navigate(location.pathname, { replace: true });
        }
    }, [searchParams, navigate, location.pathname]);

    return (
        <>
            <div className="bg-white w-full rounded-xl shadow-xl border border-gray-200 overflow-hidden relative">
                {onCloseModal && (
                    <button onClick={onCloseModal} className="absolute top-2 right-2 z-10 p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}

                {/* Tabs */}
                <div className="flex text-sm font-semibold border-b border-gray-200 bg-gray-50">
                    {['clinic', 'home'].map(mode => (
                        <button key={mode} className={`flex-1 py-3 text-center capitalize transition-colors ${bookingType === mode ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`} onClick={() => handleModeChange(mode)}>
                            {mode === 'clinic' ? 'At the Clinic' : 'Home Service'}
                        </button>
                    ))}
                </div>

                <div className="p-6 flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-gray-800 text-center uppercase">Make an Appointment</h3>

                    {/* Chọn Chuyên Khoa */}
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500 font-semibold mb-1 ml-1">Specialty <span className='text-red-500'>*</span></label>
                        <select name="speciality" value={formData.speciality} onChange={handleOnChange} className="w-full p-3 border border-gray-300 rounded text-sm bg-gray-50 focus:outline-blue-500">
                            <option value="">Select Specialty</option>
                            {specialties.map((item, index) => <option key={index} value={item.speciality}>{item.speciality}</option>)}
                        </select>
                    </div>

                    {/* Chọn Bác Sĩ */}
                    {formData.speciality && (
                        <div className="flex flex-col animate-fade-in-up">
                            <label className="text-xs text-gray-500 font-semibold mb-1 ml-1">Select Doctor <span className='text-red-500'>*</span></label>
                            <select value={selectedDocId} onChange={(e) => setSelectedDocId(e.target.value)} className="w-full p-3 border border-blue-300 rounded text-sm bg-blue-50 focus:outline-blue-500 font-medium text-gray-700">
                                <option value="">-- Choose a Doctor --</option>
                                {availableDoctors.length > 0 ? (
                                    availableDoctors.map((doc) => <option key={doc._id} value={doc._id}>{doc.name} — Fee: ${doc.fees}</option>)
                                ) : (
                                    <option disabled>No doctors available</option>
                                )}
                            </select>
                            {selectedDoctorObj && <p className="text-xs text-green-600 font-bold mt-1 ml-1">Fee: ${selectedDoctorObj.fees}</p>}
                        </div>
                    )}

                    {/* --- GIAO DIỆN SLOT --- */}
                    {selectedDocId && (
                        <div className="mt-4">
                            <p className="text-sm text-gray-700 font-bold mb-3 flex items-center">
                                <span className="bg-blue-100 text-blue-600 p-1 rounded mr-2">📅</span>
                                Booking Slots <span className='text-red-500 ml-1'>*</span>
                                <span className="ml-auto text-xs font-normal text-gray-500">Selected: {slotDate}</span>
                            </p>

                            {/* Danh sách 7 ngày */}
                            <div className="flex gap-4 items-center w-full overflow-x-auto pb-4">
                                {docSlots.length > 0 && docSlots.map((item, index) => (
                                    <div
                                        key={index}
                                        onClick={() => {
                                            setSlotIndex(index);
                                            setSlotDate(item.formattedDate);
                                            setSlotTime('');
                                        }}
                                        className={`flex-shrink-0 text-center py-4 min-w-[5rem] rounded-xl cursor-pointer transition-all border
                                            ${slotIndex === index
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                                                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        <p className="text-xs font-semibold uppercase tracking-wide mb-1">{item.day}</p>
                                        <p className="text-xl font-bold">{item.date}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Danh sách Giờ */}
                            <div className="mt-4">
                                <p className="text-xs font-semibold text-gray-500 mb-2 ml-1">Available Time:</p>
                                <div className="flex gap-3 items-center w-full overflow-x-auto pb-4 scroll-smooth">
                                    {docSlots.length > 0 && docSlots[slotIndex] && docSlots[slotIndex].slots.length > 0 ? (
                                        docSlots[slotIndex].slots.map((item, index) => (
                                            <p
                                                key={index}
                                                onClick={() => setSlotTime(item.time)}
                                                className={`flex-shrink-0 text-sm font-medium px-5 py-2 rounded-full cursor-pointer transition-all border whitespace-nowrap
                                                    ${item.time === slotTime
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                        : 'text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-500'}`}
                                            >
                                                {item.time.toLowerCase()}
                                            </p>
                                        ))
                                    ) : (
                                        <p className="text-xs text-gray-400 ml-1 italic">No slots available.</p>
                                    )}
                                </div>
                            </div>
                            {!slotTime && <p className="text-xs text-red-500 mt-1 ml-1 italic animate-pulse">⚠️ Please select a time slot</p>}
                        </div>
                    )}

                    {/* Inputs Thông tin cá nhân */}
                    <div className="grid grid-cols-2 gap-3 mt-2">
                        <input type="text" name="name" value={formData.name} onChange={handleOnChange} placeholder="Full Name *" className="p-3 border border-gray-300 rounded text-sm bg-gray-50" />
                        <input type="text" name="phone" value={formData.phone} onChange={handleOnChange} placeholder="Phone *" className="p-3 border border-gray-300 rounded text-sm bg-gray-50" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <input type="email" name="email" value={formData.email} onChange={handleOnChange} placeholder="Email Address *" className="p-3 border border-gray-300 rounded text-sm bg-gray-50" />
                        <div className="relative">
                            <input
                                type="date"
                                name="dob"
                                value={formData.dob}
                                onChange={handleOnChange}
                                className={`p-3 border rounded text-sm w-full bg-gray-50 focus:outline-blue-500 ${!formData.dob ? 'text-gray-400' : 'text-gray-900'}`}
                            />
                            {!formData.dob && <span className="absolute left-3 top-3.5 text-sm text-gray-400 pointer-events-none"></span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <select name="gender" value={formData.gender} onChange={handleOnChange} className="p-3 border border-gray-300 rounded text-sm bg-gray-50 cursor-pointer">
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                        <input type="text" name="line1" value={formData.line1} onChange={handleOnChange} placeholder="Address Line 1" className="p-3 border border-gray-300 rounded text-sm bg-gray-50 w-full" />
                    </div>

                    <input type="text" name="line2" value={formData.line2} onChange={handleOnChange} placeholder="Address Line 2 (Optional)" className="p-3 border border-gray-300 rounded text-sm bg-gray-50 w-full" />
                    <textarea name="reason" rows="2" value={formData.reason} onChange={handleOnChange} placeholder="Reason / Symptoms..." className="p-3 border border-gray-300 rounded text-sm w-full bg-gray-50 resize-none"></textarea>

                    <button onClick={handleInitiateBooking} disabled={loading} className="w-full font-bold py-3 rounded mt-2 uppercase shadow-md transition-all active:scale-95 bg-yellow-400 hover:bg-yellow-500 text-gray-900">
                        {loading ? 'Processing...' : selectedDoctorObj ? `Book Now ($${selectedDoctorObj.fees})` : 'Book Now'}
                    </button>
                </div>
            </div>

            <BookingPaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} doctor={selectedDoctorObj} onConfirm={handleConfirmAndPay} />
            <BookingSuccessModal isOpen={showSuccessModal} onClose={handleCloseSuccess} />
        </>
    );
};

export default QuickBookingForm;