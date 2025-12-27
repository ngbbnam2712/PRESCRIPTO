import React, { useState } from 'react';
import { assets } from '../../assets/assets';

const BookingForm = () => {
    // 1. Quản lý dữ liệu Form
    const [formData, setFormData] = useState({
        bookingFor: 'self', // self | other
        name: '',
        gender: 'male',
        phone: '',
        email: '',
        dob: '',
        province: '',
        district: '',
        address: '',
        reason: '',
        notes: '', // [MỚI] Ghi chú tự do
        paymentMethod: 'cash' // cash | paypal
    });

    // 2. Quản lý lỗi Validation
    const [errors, setErrors] = useState({});

    // Danh sách địa chính giả lập (Thực tế nên lấy từ API)
    const provinces = ["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Ninh Bình"];
    const districts = ["Ba Đình", "Hoàn Kiếm", "Quận 1", "Thủ Đức", "Hoa Lư"];

    // --- HÀM XỬ LÝ NHẬP LIỆU ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        // Xóa lỗi khi người dùng bắt đầu nhập lại
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    // --- HÀM VALIDATION (KIỂM TRA DỮ LIỆU) ---
    const validateForm = () => {
        let newErrors = {};
        let isValid = true;

        // Validate Tên
        if (!formData.name.trim()) {
            newErrors.name = "Vui lòng nhập họ và tên";
            isValid = false;
        }

        // Validate Số điện thoại (VN: 10 số, bắt đầu bằng 0)
        const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
        if (!formData.phone) {
            newErrors.phone = "Vui lòng nhập số điện thoại";
            isValid = false;
        } else if (!phoneRegex.test(formData.phone)) {
            newErrors.phone = "Số điện thoại không hợp lệ";
            isValid = false;
        }

        // Validate Email (Không bắt buộc, nhưng nếu nhập thì phải đúng)
        if (formData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                newErrors.email = "Email không đúng định dạng";
                isValid = false;
            }
        }

        // Validate Năm sinh
        if (!formData.dob) {
            newErrors.dob = "Vui lòng nhập năm sinh";
            isValid = false;
        } else {
            const year = parseInt(formData.dob);
            const currentYear = new Date().getFullYear();
            if (year < 1900 || year > currentYear) {
                newErrors.dob = "Năm sinh không hợp lệ";
                isValid = false;
            }
        }

        // Validate Địa chỉ
        if (!formData.province) {
            newErrors.province = "Chọn Tỉnh/TP";
            isValid = false;
        }
        if (!formData.district) {
            newErrors.district = "Chọn Quận/Huyện";
            isValid = false;
        }

        // Validate Lý do khám (Bắt buộc để bác sĩ biết sơ bộ)
        if (!formData.reason.trim()) {
            newErrors.reason = "Vui lòng nhập lý do khám";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            alert("Đặt lịch thành công! Dữ liệu đã sẵn sàng để gửi API.");
            console.log(formData);
            // Gọi API đặt lịch tại đây
        } else {
            // Scroll lên đầu hoặc thông báo lỗi chung
            alert("Vui lòng kiểm tra lại thông tin còn thiếu.");
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-3xl mx-auto border border-gray-100">

            {/* Header Form */}
            <div className="border-b pb-4 mb-6">
                <h2 className="text-xl font-bold text-gray-800 uppercase flex items-center gap-2">
                    <span className="text-primary">📅</span> Điền thông tin đặt lịch
                </h2>
            </div>

            {/* 1. Đặt cho ai? */}
            <div className="mb-6">
                <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="bookingFor"
                            value="self"
                            checked={formData.bookingFor === 'self'}
                            onChange={handleInputChange}
                            className="accent-primary w-4 h-4"
                        />
                        <span className="text-gray-700 font-medium">Đặt cho mình</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="bookingFor"
                            value="other"
                            checked={formData.bookingFor === 'other'}
                            onChange={handleInputChange}
                            className="accent-primary w-4 h-4"
                        />
                        <span className="text-gray-700 font-medium">Đặt cho người thân</span>
                    </label>
                </div>
            </div>

            {/* 2. Thông tin bệnh nhân */}
            <div className="space-y-4">
                {/* Họ tên */}
                <div>
                    <div className="flex items-center border rounded-md px-3 py-2 bg-gray-50 focus-within:bg-white focus-within:border-primary transition">
                        <span className="text-gray-400 mr-2">👤</span>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Họ và tên bệnh nhân (Vd: Nguyễn Văn A)"
                            className="w-full bg-transparent outline-none text-gray-700"
                        />
                    </div>
                    {errors.name && <p className="text-red-500 text-xs mt-1 italic ml-1">*{errors.name}</p>}
                </div>

                {/* Giới tính */}
                <div className="flex gap-6 items-center">
                    <span className="text-gray-600 text-sm font-medium">Giới tính:</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={handleInputChange} className="accent-primary" /> Nam
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={handleInputChange} className="accent-primary" /> Nữ
                    </label>
                </div>

                {/* Số điện thoại & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <div className="flex items-center border rounded-md px-3 py-2 bg-gray-50 focus-within:border-primary">
                            <span className="text-gray-400 mr-2">📞</span>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="Số điện thoại (Bắt buộc)"
                                className="w-full bg-transparent outline-none"
                            />
                        </div>
                        {errors.phone && <p className="text-red-500 text-xs mt-1 italic">*{errors.phone}</p>}
                    </div>
                    <div>
                        <div className="flex items-center border rounded-md px-3 py-2 bg-gray-50 focus-within:border-primary">
                            <span className="text-gray-400 mr-2">✉️</span>
                            <input
                                type="text"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Email (Không bắt buộc)"
                                className="w-full bg-transparent outline-none"
                            />
                        </div>
                        {errors.email && <p className="text-red-500 text-xs mt-1 italic">*{errors.email}</p>}
                    </div>
                </div>

                {/* Năm sinh & Tỉnh thành */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <div className="flex items-center border rounded-md px-3 py-2 bg-gray-50 focus-within:border-primary">
                            <span className="text-gray-400 mr-2">📅</span>
                            <input
                                type="number"
                                name="dob"
                                value={formData.dob}
                                onChange={handleInputChange}
                                placeholder="Năm sinh"
                                className="w-full bg-transparent outline-none"
                            />
                        </div>
                        {errors.dob && <p className="text-red-500 text-xs mt-1 italic">*{errors.dob}</p>}
                    </div>

                    <div>
                        <select
                            name="province"
                            value={formData.province}
                            onChange={handleInputChange}
                            className="w-full border rounded-md px-3 py-2 bg-white focus:border-primary outline-none text-gray-600"
                        >
                            <option value="">-- Tỉnh/Thành --</option>
                            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        {errors.province && <p className="text-red-500 text-xs mt-1 italic">*{errors.province}</p>}
                    </div>

                    <div>
                        <select
                            name="district"
                            value={formData.district}
                            onChange={handleInputChange}
                            className="w-full border rounded-md px-3 py-2 bg-white focus:border-primary outline-none text-gray-600"
                        >
                            <option value="">-- Quận/Huyện --</option>
                            {districts.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        {errors.district && <p className="text-red-500 text-xs mt-1 italic">*{errors.district}</p>}
                    </div>
                </div>

                {/* Địa chỉ chi tiết */}
                <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Địa chỉ cụ thể (Số nhà, tên đường...)"
                    className="w-full border rounded-md px-3 py-2 bg-gray-50 focus:border-primary outline-none"
                />

                {/* Lý do khám */}
                <div>
                    <textarea
                        name="reason"
                        value={formData.reason}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Lý do khám? Triệu chứng gặp phải? (Bắt buộc)"
                        className="w-full border rounded-md px-3 py-2 bg-gray-50 focus:border-primary outline-none resize-none"
                    ></textarea>
                    {errors.reason && <p className="text-red-500 text-xs mt-1 italic">*{errors.reason}</p>}
                </div>

                {/* [MỚI] GHI CHÚ BỔ SUNG (Tự do) */}
                <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                    <label className="text-sm font-semibold text-yellow-800 mb-1 block">📝 Ghi chú bổ sung (Nếu có):</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows="2"
                        placeholder="Ví dụ: Bệnh nhân đi xe lăn, cần xuất hóa đơn đỏ, hoặc thông tin thêm cho tiếp tân..."
                        className="w-full border rounded border-yellow-300 bg-white px-3 py-2 text-sm focus:ring-1 focus:ring-yellow-500 outline-none"
                    ></textarea>
                </div>
            </div>

            {/* 3. Thanh toán */}
            <div className="mt-8 border-t pt-4">
                <h3 className="font-semibold text-gray-800 mb-3">Hình thức thanh toán</h3>

                <div className="space-y-3">
                    {/* Option 1: Tiền mặt */}
                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${formData.paymentMethod === 'cash' ? 'border-primary bg-indigo-50' : 'hover:bg-gray-50'}`}>
                        <input
                            type="radio"
                            name="paymentMethod"
                            value="cash"
                            checked={formData.paymentMethod === 'cash'}
                            onChange={handleInputChange}
                            className="accent-primary w-5 h-5"
                        />
                        <span className="font-medium text-gray-700">Thanh toán sau tại cơ sở y tế</span>
                    </label>

                    {/* Option 2: PayPal [MỚI] */}
                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${formData.paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
                        <input
                            type="radio"
                            name="paymentMethod"
                            value="paypal"
                            checked={formData.paymentMethod === 'paypal'}
                            onChange={handleInputChange}
                            className="accent-blue-500 w-5 h-5"
                        />
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">Thanh toán Online qua PayPal</span>
                            <img src={assets.paypal_logo || "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg"} alt="PayPal" className="h-6 object-contain" />
                        </div>
                    </label>

                    {/* HIỂN THỊ NÚT PAYPAL NẾU CHỌN */}
                    {formData.paymentMethod === 'paypal' && (
                        <div className="mt-2 pl-8 animate-fadeIn">
                            <button className="bg-[#FFC439] hover:bg-[#F4B400] text-blue-900 font-bold py-2 px-6 rounded shadow-sm w-full md:w-auto flex items-center justify-center gap-2 transition">
                                <span>Pay with</span>
                                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-5" />
                            </button>
                            <p className="text-xs text-gray-500 mt-1">Bạn sẽ được chuyển hướng đến trang thanh toán an toàn của PayPal.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Submit */}
            <div className="mt-8">
                <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 rounded">
                    <span className="text-gray-600">Giá khám:</span>
                    <span className="font-bold text-lg text-primary">500.000đ</span>
                </div>
                <button
                    onClick={handleSubmit}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                >
                    XÁC NHẬN ĐẶT LỊCH
                </button>
                <p className="text-center text-xs text-gray-400 mt-3">Bằng việc xác nhận, bạn cam kết thông tin là chính xác.</p>
            </div>

        </div>
    );
};

export default BookingForm;