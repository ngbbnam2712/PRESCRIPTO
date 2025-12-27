import validator from 'validator'

import bcrypt from 'bcrypt'

import userModel from '../models/userModel.js'

import doctorModel from '../models/doctorModel.js'

import jwt from 'jsonwebtoken'

import { v2 as cloudinary } from 'cloudinary'

import appointmentModel from '../models/appointmentModel.js'
import paypal from 'paypal-rest-sdk'

import nodemailer from 'nodemailer'
import reviewModel from '../models/reviewModel.js'
import notificationModel from '../models/notificationModel.js'
import guestRequestModel from '../models/guestRequestModel.js'
import nurseModel from "../models/nurseModel.js";
//API to register user



const registerUser = async (req, res) => {



    try {

        const { name, email, password } = req.body



        //check exist

        const exists = await userModel.findOne({ email });

        if (exists) {

            return res.status(409).json({ success: false, message: "User already exists" }); // 409 Conflict

        }



        if (!name || !email || !password) {

            return res.json({ sucess: false, message: "Missing Details!" })

        }

        if (!validator.isEmail(email)) {

            return res.json({ success: false, message: "Enter A Invalid Email" })

        }







        if (password.length < 8) {

            return res.json({ success: false, message: "Enter A Strong Password" })

        }





        //hash password



        const salt = await bcrypt.genSalt(10)

        const hashedPassword = await bcrypt.hash(password, salt)



        const userData = {

            name,

            email,

            password: hashedPassword

        }





        const newUser = new userModel(userData)

        const user = await newUser.save()



        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

        res.json({ success: true, token })





    } catch (error) {

        console.log(error)

        res.json({ success: false, message: error.message })

    }







}

//API to login user

const loginUser = async (req, res) => {

    try {

        const { email, password } = req.body

        const user = await userModel.findOne({ email })



        if (!user) {

            return res.status(404).json({ success: false, message: "User not found" }) // 404 Not Found

        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {

            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

            return res.status(200).json({ success: true, token })

        } else {

            return res.status(401).json({ success: false, message: "Invalid Credentials" }) // 401 Unauthorized

        }



    } catch (error) {

        console.log(error)

        return res.status(500).json({ success: false, message: error.message })

    }

}

/// api get user profile

const getProfile = async (req, res) => {

    try {



        const userId = req.userId



        if (!userId) {

            return res.status(401).json({ success: false, message: 'User not found. Unauthorized access.' });

        }



        const userData = await userModel.findById(userId).select('-password')





        if (!userData) {



            return res.status(404).json({ success: false, message: 'User profile not found' });

        }



        return res.status(200).json({ success: true, message: userData })



    } catch (error) {

        console.error("Error: ", error)



        return res.status(500).json({ success: false, message: "Error" })

    }

}



/// api update user profile

const updateProfile = async (req, res) => {

    try {

        const userId = req.userId



        const { name, phone, address: addressString, dob, gender } = req.body

        const imageFile = req.file





        const updateFields = {};





        if (!name || !phone || !dob || !gender) {

            return res.status(400).json({ success: false, message: "Data Missing (Name, Phone, DOB, Gender)" });

        }





        updateFields.name = name;

        updateFields.phone = phone;

        updateFields.dob = dob;

        updateFields.gender = gender;







        if (addressString && addressString !== 'null' && addressString.trim() !== '') {

            try {



                updateFields.address = JSON.parse(addressString);

            } catch (e) {

                console.error("Error JSON parsing :", e);



            }

        }





        if (imageFile) {

            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' })



            updateFields.image = imageUpload.secure_url

        }



        console.log('Final Update Fields:', updateFields);





        const updatedUser = await userModel.findByIdAndUpdate(

            userId,

            updateFields,

            { new: true }

        );



        if (!updatedUser) {

            return res.status(404).json({ success: false, message: "User profile not found." });

        }





        res.status(200).json({ success: true, message: "Profile Updated Successfully" })

    } catch (error) {

        console.error("Server error:", error)



        res.status(500).json({ success: false, message: "Server Error" })

    }

}

/// API to book appointment



const bookAppointment = async (req, res) => {
    try {
        const userId = req.userId
        const { docId, slotDate, slotTime, appointmentType } = req.body;

        const docData = await doctorModel.findById(docId).select('-password');

        if (!docData.available) {
            return res.json({ success: false, message: "Doctor not available" });
        }

        let slots_booked = docData.slots_booked;

        // Logic kiểm tra slot trùng
        if (slots_booked[slotDate]) {
            if (slots_booked[slotDate].includes(slotTime)) {
                return res.json({ success: false, message: "Slot not available" });
            }
        } else {
            slots_booked[slotDate] = [];
        }

        const userData = await userModel.findById(userId).select('-password');

        // Tạo bản sao data bác sĩ để lưu snapshot
        const docDataSnapshot = docData.toObject();
        delete docDataSnapshot.slots_booked;

        const appointmentData = {
            userId,
            docId,
            userData,
            docData: docDataSnapshot,
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now(),
            appointmentType, // Mặc định cho User Login
            cancelled: false,
            payment: false,
            isCompleted: false
        }

        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();

        // Cập nhật slot bác sĩ
        await doctorModel.findByIdAndUpdate(docId, {
            $push: { [`slots_booked.${slotDate}`]: slotTime }
        });

        res.json({ success: true, message: "Appointment Booked Successfully" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
const bookGuestAppointment = async (req, res) => {
    try {
        const { userData, appointmentType, docId, paymentStatus, transactionId, amount } = req.body;

        if (!userData || !userData.phone) return res.json({ success: false, message: "Phone required" });

        // Tìm thông tin bác sĩ nếu có docId (để lưu tên cho đẹp)
        let docName = "Not Selected";
        if (docId) {

            const doc = await doctorModel.findById(docId);
            if (doc) docName = doc.name;

        }

        const newRequest = new guestRequestModel({
            name: userData.name,
            phone: userData.phone,
            email: userData.email,
            address: { line1: userData.address || '', line2: '' },
            gender: userData.gender,
            speciality: userData.speciality,
            reason: userData.reason,
            preferredMode: appointmentType || 'Clinic',
            preferredDate: userData.bookingDate || "ASAP",

            // --- THÔNG TIN MỚI ---
            docId: docId || "NOT_SELECTED",
            amount: amount || 0,
            paymentStatus: paymentStatus || false,
            transactionId: transactionId || "",

            isHandled: false,
            date: Date.now()
        });

        await newRequest.save();
        res.json({ success: true, message: "Booking Request Sent!" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
/// API to list appointments for a user

const listAppointments = async (req, res) => {

    try {

        const userId = req.userId

        const appointments = await appointmentModel.find({ userId })



        res.json({ success: true, appointments })



    } catch (error) {

        console.log(error)

        res.json({ success: false, message: error.message })

    }



}



/// API to cancel appointments



const cancelAppointment = async (req, res) => {
    try {
        const userId = req.userId
        const { appointmentId } = req.body;

        // 1. Lấy dữ liệu cuộc hẹn
        const appointmentData = await appointmentModel.findById(appointmentId);

        if (!appointmentData) {
            return res.json({ success: false, message: "Không tìm thấy cuộc hẹn" });
        }


        if (String(appointmentData.userId) !== String(userId)) {
            return res.json({ success: false, message: "Không có quyền hủy lịch này" });
        }
        let updateData = { cancelled: true };
        let message = "Đã hủy cuộc hẹn thành công.";

        // KIỂM TRA ĐÃ THANH TOÁN HAY CHƯA
        if (appointmentData.payment) {
            updateData.isRefund = true; // Bật cờ hoàn tiền
            message = "Đã hủy lịch. Hệ thống đang xử lý hoàn tiền.";
        }

        // Cập nhật trạng thái hủy vào DB
        await appointmentModel.findByIdAndUpdate(appointmentId, updateData);
        /// trả lại slot
        const docId = appointmentData.docId;
        const doctorData = await doctorModel.findById(docId);

        if (doctorData) {
            let slots_booked = doctorData.slots_booked;
            const { slotDate, slotTime } = appointmentData;

            // Dùng .get() để lấy dữ liệu từ Map
            if (slots_booked.has(slotDate)) {

                // Lấy mảng giờ hiện tại
                let bookedSlots = slots_booked.get(slotDate);

                // Lọc bỏ giờ đã hủy
                bookedSlots = bookedSlots.filter(e => e !== slotTime);

                // Cập nhật lại Map
                if (bookedSlots.length === 0) {
                    slots_booked.delete(slotDate); // Xóa key nếu rỗng
                } else {
                    slots_booked.set(slotDate, bookedSlots); // Set lại mảng mới
                }

                // Lưu thay đổi
                await doctorData.save();

                console.log(`✅ Đã trả slot ${slotTime} ngày ${slotDate} (Map Updated)`);
            } else {
                console.log(`⚠️ Ngày ${slotDate} không tồn tại trong Map.`);
            }
        }

        if (appointmentData.payment) {
            const userEmail = appointmentData.userId.email || appointmentData.userData.email;
            const userName = appointmentData.userId.name || appointmentData.userData.name;

            // Gọi hàm gửi mail báo hoàn tiền
            sendCancellationEmail({
                email: userEmail,
                name: userName,
                docName: appointmentData.docData.name,
                date: appointmentData.slotDate,
                time: appointmentData.slotTime,
                isRefund: true // Chắc chắn là true vì nằm trong if payment
            }).catch(err => console.log("Lỗi gửi mail hủy:", err.message));

            console.log(`📧 Đã gửi mail hoàn tiền cho user: ${userEmail}`);
        } else {
            console.log(`ℹ️ Cuộc hẹn chưa thanh toán, không cần gửi mail hủy.`);
        }


        res.json({ success: true, message: "Đã hủy cuộc hẹn thành công" });

    } catch (error) {
        console.log("❌ Lỗi Hủy Lịch:", error);
        res.json({ success: false, message: error.message });
    }
}



// paypal config
paypal.configure({
    'mode': process.env.PAYPAL_MODE || 'sandbox', // 'sandbox' hoặc 'live'
    'client_id': process.env.PAYPAL_CLIENT_ID,
    'client_secret': process.env.PAYPAL_CLIENT_SECRET
});


// ==========================================
// PAYPAL PAYMENT INTEGRATION
// ==========================================

// 1. Tạo Link Thanh Toán
const createPayPalPayment = async (req, res) => {
    try {
        const userId = req.userId;
        const { appointmentId } = req.body;

        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment || appointment.userId.toString() !== userId.toString()) {
            return res.status(404).json({ success: false, message: 'Appointment not found or unauthorized.' });
        }

        // amout = fees
        const totalAmount = appointment.amount.toString();

        const create_payment_json = {
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                // Trả về Backend để xử lý logic execute
                "return_url": `${process.env.PAYPAL_RETURN_URL}?appointmentId=${appointmentId}`,
                "cancel_url": process.env.PAYPAL_CANCEL_URL
            },
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": `Appointment Fee - ${appointment.docData.name}`,
                        "sku": appointmentId,
                        "price": totalAmount,
                        "currency": "USD",
                        "quantity": 1
                    }]
                },
                "amount": {
                    "currency": "USD",
                    "total": totalAmount
                },
                "description": `Payment for Appointment ${appointmentId}`
            }]
        };

        paypal.payment.create(create_payment_json, function (error, payment) {
            if (error) {
                console.error("PayPal Create Error:", error);
                return res.json({ success: false, message: "PayPal Create Failed" });
            } else {
                for (let i = 0; i < payment.links.length; i++) {
                    if (payment.links[i].rel === 'approval_url') {
                        return res.json({ success: true, paymentUrl: payment.links[i].href });
                    }
                }
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Xử lý khi PayPal trả về (Execute Payment)
const executePayPalPayment = async (req, res) => {
    try {
        const { paymentId, PayerID, appointmentId } = req.query;

        const execute_payment_json = {
            "payer_id": PayerID,
        };

        paypal.payment.execute(paymentId, execute_payment_json, async function (error, payment) {
            if (error) {
                console.error("PayPal Execute Error:", error.response);
                // Redirect về Frontend báo lỗi
                return res.redirect(`${process.env.FRONTEND_URL}/my-appointments/?success=false&appointmentId=${appointmentId}`);
            } else {
                if (payment.state === 'approved') {
                    // Thanh toán thành công -> Update DB
                    await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true });
                    const appointmentData = await appointmentModel.findById(appointmentId); // Hoặc model tương ứng

                    if (appointmentData) {
                        // 2. Gọi hàm gửi mail (Không cần await để tránh user phải chờ lâu)
                        sendAppointmentEmail({
                            email: appointmentData.userData.email,
                            name: appointmentData.userData.email,
                            docName: appointmentData.docData.name,
                            date: appointmentData.slotDate,
                            time: appointmentData.slotTime,
                            type: appointmentData.appointmentType || 'Clinic',
                            fee: appointmentData.amount
                        });
                    }
                    // Redirect về Frontend báo thành công
                    return res.redirect(`${process.env.FRONTEND_URL}/my-appointments/?success=true&appointmentId=${appointmentId}`);
                } else {
                    return res.redirect(`${process.env.FRONTEND_URL}/my-appointments/?success=false&appointmentId=${appointmentId}`);
                }
            }
        });

    } catch (error) {
        console.error(error);
        return res.redirect(`${process.env.FRONTEND_URL}/my-appointments/?success=false`);
    }
};














const formatPrice = (price) => {
    return parseFloat(price).toFixed(2);
};

const createGuestPayment = async (req, res) => {
    try {
        const { userData, appointmentType, docId, amount, slotDate, slotTime } = req.body;
        console.log("Server received date:", slotDate, "time:", slotTime);
        if (!userData || !userData.phone) {
            return res.json({ success: false, message: "Missing Phone Number" });
        }

        // Lấy tên bác sĩ (để hiển thị trong PayPal bill cho đẹp)
        let docName = "General Consultation";
        if (docId) {
            const doc = await doctorModel.findById(docId);
            if (doc) docName = doc.name;
        }
        const finalAmount = formatPrice(amount); // Chuyển "10" thành "10.00"
        // A. LƯU VÀO DB TRƯỚC (Trạng thái paymentStatus: false)
        const newRequest = new guestRequestModel({
            name: userData.name,
            phone: userData.phone,
            email: userData.email,
            address: userData.address || { line1: '', line2: '' }, // Đảm bảo cấu trúc object
            gender: userData.gender,
            speciality: userData.speciality,
            reason: userData.reason,
            preferredMode: appointmentType || 'Clinic',
            preferredDate: userData.bookingDate || "Not Found Appointment Date",
            docName: docName,
            amount: Number(finalAmount),
            slotDate: slotDate || "Not Selected",
            slotTime: slotTime || "Not Selected",
            paymentStatus: false, // Chưa thanh toán
            transactionId: "",
            isHandled: false,
            date: Date.now()
        });

        const savedRequest = await newRequest.save();
        const requestId = savedRequest._id.toString();

        // B. TẠO GIAO DỊCH PAYPAL
        const create_payment_json = {
            "intent": "sale",
            "payer": { "payment_method": "paypal" },
            "redirect_urls": {

                "return_url": `http://localhost:4000/api/user/payment-execute?requestId=${requestId}`,
                "cancel_url": `http://localhost:5173?payment=cancel`
            },
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": `Booking: ${docName}`,
                        "sku": requestId,
                        "price": finalAmount,
                        "currency": "USD",
                        "quantity": 1
                    }]
                },
                "amount": {
                    "currency": "USD",
                    "total": finalAmount
                },
                "description": `Medical Booking Fee for ${userData.phone}`
            }]
        };

        // Gọi SDK PayPal
        paypal.payment.create(create_payment_json, function (error, payment) {
            if (error) {
                console.log("PayPal Error Details:", JSON.stringify(error.response, null, 2));
                return res.json({ success: false, message: "Cannot create PayPal link" });
            } else {
                for (let i = 0; i < payment.links.length; i++) {
                    if (payment.links[i].rel === 'approval_url') {
                        // Trả về Link để Frontend redirect
                        return res.json({ success: true, paymentUrl: payment.links[i].href });
                    }
                }
            }
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
// ==========================================
// 2. XỬ LÝ SAU KHI PAYPAL TRẢ VỀ (EXECUTE)
// ==========================================
const executeGuestPayment = async (req, res) => {
    try {
        const { paymentId, PayerID, requestId } = req.query;

        const execute_payment_json = { "payer_id": PayerID };

        paypal.payment.execute(paymentId, execute_payment_json, async function (error, payment) {
            if (error) {
                console.log("PayPal Execute Failed:", error.response);
                return res.redirect(`${process.env.FRONTEND_URL}?payment=failed`);
            } else {
                if (payment.state === 'approved') {

                    // Cập nhật DB: Đã thanh toán thành công
                    await guestRequestModel.findByIdAndUpdate(requestId, {
                        paymentStatus: true,
                        transactionId: payment.id
                    });
                    const appointmentData = await guestRequestModel.findById(requestId); // Hoặc model tương ứng

                    if (appointmentData) {
                        // 2. Gọi hàm gửi mail (Không cần await để tránh user phải chờ lâu)
                        sendAppointmentEmail({
                            email: appointmentData.email,
                            name: appointmentData.name,
                            docName: appointmentData.docName,
                            date: appointmentData.slotDate,
                            time: appointmentData.slotTime,
                            type: appointmentData.preferredMode || 'Clinic',
                            fee: appointmentData.amount
                        });
                    }
                    // Redirect về Frontend với cờ success
                    return res.redirect(`${process.env.FRONTEND_URL}?payment=success`);
                } else {
                    return res.redirect(`${process.env.FRONTEND_URL}?payment=failed`);
                }
            }
        });

    } catch (error) {
        console.log(error);
        return res.redirect(`${process.env.FRONTEND_URL}?payment=error`);
    }
}












import { GoogleGenerativeAI } from "@google/generative-ai";


const chatWithAI = async (req, res) => {
    try {
        const { question, history } = req.body;
        const { token } = req.headers;
        // BƯỚC 2: Gửi kèm userId vào body
        if (!question) {
            return res.json({ success: false, message: "Vui lòng nhập câu hỏi." });
        }
        let userId = null;

        if (token) {
            try {
                // Giải mã token bằng Secret Key
                const token_decode = jwt.verify(token, process.env.JWT_SECRET);
                userId = token_decode.id; // <--- ĐÃ LẤY ĐƯỢC USER ID Ở ĐÂY
            } catch (err) {
                // Nếu token lỗi hoặc hết hạn, coi như là khách vãng lai (không làm gì cả)
                console.log("Guest User");
            }
        }
        // --- BƯỚC 1: XÁC ĐỊNH TRẠNG THÁI NGƯỜI DÙNG (GUEST vs MEMBER) ---
        const isGuest = !userId;
        let userAppointments = [];
        let currentUser = null;

        // Chỉ lấy dữ liệu cá nhân nếu đã đăng nhập
        if (!isGuest) {
            currentUser = await userModel.findById(userId).select('-password');
            if (currentUser) {
                userAppointments = await appointmentModel.find({ userId: userId })
                    .select('_id docId slotDate slotTime isCompleted cancelled docData amount');
            }
        }

        // --- BƯỚC 2: LẤY DỮ LIỆU CHUNG (BÁC SĨ) ---

        const doctors = await doctorModel.find({ available: true })
            .select('_id name speciality fees experience slots_booked');
        const doctorContextData = doctors.map(doc =>
            `- Bác sĩ: ${doc.name} (ID: ${doc._id})
     - Chuyên khoa: ${doc.speciality}
     - Kinh nghiệm: ${doc.experience} năm
     - Phí khám: $${doc.fees}
     - Lịch rảnh (Giả định): 09:00, 10:30, 14:00, 16:00 (Hôm nay)`
        ).join("\n");

        // 3. Ghép vào System Instruction
        const systemPrompt = `
        Bạn là Trợ lý ảo Y tế của phòng khám Prescripto.
        Dưới đây là DANH SÁCH BÁC SĨ THỰC TẾ của phòng khám (Hãy chỉ tư vấn dựa trên danh sách này):${doctorContextData}`;
        // --- BƯỚC 3: CẤU HÌNH AI & PROMPT ---
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const now = new Date();
        const currentDateTime = now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
        const userContext = isGuest
            ? "KHÁCH VÃNG LAI (Chưa có hồ sơ). Cần thu thập đủ thông tin."
            : `MEMBER (Đã có hồ sơ): ${currentUser.name}, ${currentUser.phone} `;

        const prompt = `
            Bạn là Trợ lý Lễ tân AI của Phòng khám Prescripto.
            
            --- NGỮ CẢNH ---
            - Người dùng: ${userContext}
            - Thời gian: ${currentDateTime}
            - Danh sách Bác sĩ: ${JSON.stringify(doctors)}
            - Lịch sử hẹn (Member): ${JSON.stringify(userAppointments)}
            
            --- LỊCH SỬ TRÒ CHUYỆN ---
            Dưới đây là nội dung cuộc hội thoại vừa diễn ra, hãy ghi nhớ thông tin khách hàng:
            ${history || "Chưa có lịch sử trò chuyện."}
            Khách vừa nói: "${question}"
    
            --- NHIỆM VỤ ---
            Phân tích và trả về JSON theo 1 trong 6 loại (type) sau:
    
            1. LOẠI 1: CẬP NHẬT THÔNG TIN (type: "update_profile") -> Chỉ cho Member.
            2. LOẠI 2: ĐẶT LỊCH CHO MEMBER (type: "book_appointment") -> Chỉ cho Member.
            3. LOẠI 3: HỦY LỊCH HẸN (type: "cancel_appointment") -> Chỉ cho Member.
            
            4. LOẠI 4: CHUẨN BỊ ĐẶT LỊCH CHO GUEST (type: "guest_booking_ready")
               - KHI NÀO: Khách chốt đặt lịch hoặc thể hiện ý định rõ ràng muốn đặt.
               - HÀNH ĐỘNG: Ngừng hỏi thông tin
    5. LOẠI 5:"health_advice": TƯ VẤN SỨC KHỎE / TRIỆU CHỨNG
               - KHI NÀO: Khách mô tả triệu chứng (đau, sốt, mệt, cần lời khuyên y tế...).
               - OUTPUT BẮT BUỘC: 
                 {
                    "type": "health_advice",
                    "prediction": "Dự đoán bệnh sơ bộ (ngắn gọn)",
                    "home_care": "Lời khuyên chăm sóc tại nhà (gạch đầu dòng)",
                    "specialty": "Tên chuyên khoa nên khám (Ví dụ: General physician, Neurologist...)",
                    "suggested_docId": "ID của bác sĩ phù hợp nhất trong danh sách (nếu có, hoặc null)"
                 }
            6. LOẠI 6: TƯ VẤN & TRA CỨU (type: "response")
               - Dùng để trả lời câu hỏi thông thường, tư vấn bác sĩ, giá tiền.
               - Output: { "type": "response", "message": "Nội dung trả lời..." }
            `;
        // --- BƯỚC 4: GỬI VÀ XỬ LÝ KẾT QUẢ ---
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        let aiResponse;
        try {
            aiResponse = JSON.parse(responseText);
        } catch (e) {
            return res.json({ success: true, reply: responseText });
        }

        // Xử lý các trường hợp logic
        if (aiResponse.type === "guest_booking_ready") {
            return res.json({
                success: true,
                reply: "Bạn hãy điền thông tin vào form để hoàn tất đặt lịch nhé",
                action: "OPEN_GUEST_PAYMENT_MODAL",

            });
        }
        // CASE 1: Cập nhật thông tin User
        if (aiResponse.type === "update_profile") {
            const updateData = aiResponse.updates;

            // Xử lý logic Address (giữ nguyên cái cũ nếu AI không gửi đủ line)
            if (updateData.address) {
                const currentAddress = currentUser.address || {};
                updateData.address = {
                    line1: updateData.address.line1 || currentAddress.line1 || "",
                    line2: updateData.address.line2 || currentAddress.line2 || ""
                };
            }

            await userModel.findByIdAndUpdate(userId, updateData);
            return res.json({
                success: true,
                reply: aiResponse.message || "Đã cập nhật thông tin thành công!"
            });
        }
        if (aiResponse.type === "book_appointment") {
            const { docId, date, time } = aiResponse.data;
            const docInfo = await doctorModel.findById(docId);

            if (!docInfo) return res.json({ success: true, reply: "Không tìm thấy bác sĩ này." });

            // Check lại slot lần cuối (Database check)
            let slots_booked = docInfo.slots_booked || {};
            if (slots_booked[date] && slots_booked[date].includes(time)) {
                return res.json({ success: true, reply: "Rất tiếc, khung giờ này vừa bị đặt mất rồi." });
            }

            // Update slot
            if (slots_booked[date]) slots_booked[date].push(time);
            else slots_booked[date] = [time];
            await doctorModel.findByIdAndUpdate(docId, { slots_booked });

            // Tạo Appointment
            const newAppt = new appointmentModel({
                userId,
                docId,
                slotDate: date,
                slotTime: time,
                userData: currentUser, // Lưu snapshot thông tin user tại thời điểm đặt
                docData: docInfo,
                amount: docInfo.fees,
                date: Date.now()
            });

            await newAppt.save();

            return res.json({
                success: true,
                reply: `Đã đặt lịch thành công với BS ${docInfo.name}. Tôi sẽ chuyển bạn đến trang thanh toán ngay.`,
                action: "REDIRECT_TO_MY_APPOINTMENTS" // Signal cho Frontend
            });
        }

        // CASE 3: Hủy lịch hẹn
        if (aiResponse.type === "cancel_appointment") {
            const { appointmentId } = aiResponse;

            // Tìm lịch hẹn
            const appointment = await appointmentModel.findById(appointmentId);

            // Validate
            if (!appointment) {
                return res.json({ success: true, reply: "Không tìm thấy lịch hẹn này trong hệ thống." });
            }
            if (appointment.userId !== userId) {
                return res.json({ success: true, reply: "Bạn không có quyền hủy lịch hẹn này." });
            }
            if (appointment.cancelled) {
                return res.json({ success: true, reply: "Lịch hẹn này đã bị hủy trước đó rồi." });
            }

            // 1. Cập nhật trạng thái lịch hẹn thành Cancelled
            await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

            // 2. GIẢI PHÓNG SLOT CHO BÁC SĨ (Quan trọng)
            const { docId, slotDate, slotTime } = appointment;
            const doctorData = await doctorModel.findById(docId);

            let slots_booked = doctorData.slots_booked;

            if (slots_booked[slotDate]) {
                // Lọc bỏ giờ đã hủy ra khỏi mảng
                slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);
                await doctorModel.findByIdAndUpdate(docId, { slots_booked });
            }

            return res.json({
                success: true,
                reply: aiResponse.message || "Đã hủy lịch hẹn thành công.",
                action: "CANCEL_APPOINTMENT" // Signal cho Frontend
            });
        }
        if (aiResponse.type === "health_advice") {
            const { prediction, home_care, specialty, suggested_docId } = aiResponse;

            // Format câu trả lời đẹp mắt cho Chatbot
            let replyMessage = `🤖 **Dự đoán sơ bộ:** ${prediction}\n\n` +
                `💊 **Lời khuyên tại nhà:**\n${home_care}\n\n` +
                `🏥 **Chuyên khoa gợi ý:** ${specialty}`;

            // Nếu AI tìm được bác sĩ phù hợp trong danh sách, gợi ý luôn
            if (suggested_docId) {
                const suggestedDoc = doctors.find(d => String(d._id) === String(suggested_docId));
                if (suggestedDoc) {
                    replyMessage += `\n\n👨‍⚕️ **Bác sĩ phù hợp:** Dr. ${suggestedDoc.name} (${suggestedDoc.speciality})`;
                }
            }

            replyMessage += `\n\n_(Lưu ý: Đây chỉ là tham khảo từ AI, vui lòng đặt lịch khám để có chẩn đoán chính xác)_`;

            return res.json({
                success: true,
                reply: replyMessage,
                action: "SHOW_DOCTORS" // Frontend có thể bắt action này để cuộn xuống list bác sĩ
            });
        }

        return res.json({ success: true, reply: aiResponse.message });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }

}







/// API forgot password
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // 1. Kiểm tra email có tồn tại không
        const user = await userModel.findOne({ email });
        if (!user) {

            return res.json({ success: false, message: "Email không tồn tại trong hệ thống" });
        }

        // 2. Tạo Token (Có thể dùng JWT hoặc random string)
        // Token này chỉ chứa ID user và hết hạn sau 15 phút
        const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

        // 3. Lưu Token vào DB
        await userModel.findByIdAndUpdate(user._id, {
            resetPasswordToken: resetToken,
            resetPasswordExpire: Date.now() + 15 * 60 * 1000 // 15 phút tính bằng miliseconds
        });

        // 4. Tạo Link reset (Trỏ về Frontend)
        // Giả sử Frontend chạy port 5173
        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

        // 5. Gửi Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Đặt lại mật khẩu - Hệ thống đặt lịch khám',
            text: `Bạn nhận được email này vì đã yêu cầu đặt lại mật khẩu.\n\n 
            Vui lòng click vào link sau để đặt lại mật khẩu (Link hết hạn sau 15 phút):\n\n 
            ${resetUrl}\n\n
            Nếu bạn không yêu cầu, vui lòng bỏ qua email này.`
        };

        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: "Link đặt lại mật khẩu đã được gửi vào email của bạn!" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}


/// API set new pass
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // 1. Tìm user có token khớp VÀ chưa hết hạn
        const user = await userModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpire: { $gt: Date.now() } // $gt: Greater Than (Lớn hơn thời gian hiện tại)
        });

        if (!user) {
            return res.json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn" });
        }

        // 2. Mã hóa mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 3. Cập nhật User & Xóa token tạm
        await userModel.findByIdAndUpdate(user._id, {
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpire: null
        });

        res.json({ success: true, message: "Mật khẩu đã được thay đổi thành công! Vui lòng đăng nhập lại." });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

/// send email  

const sendAppointmentEmail = async ({ email, name, docName, date, time, type, fee }) => {

    // Template HTML cho Email (Trình bày đẹp)
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #5f6FFF; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">Xác Nhận Đặt Lịch Thành Công</h1>
            <p>Cảm ơn bạn đã tin tưởng Prescripto!</p>
        </div>
        
        <div style="padding: 20px; background-color: #ffffff;">
            <p>Xin chào <strong>${name}</strong>,</p>
            <p>Cuộc hẹn của bạn đã được thanh toán và xác nhận thành công. Dưới đây là chi tiết:</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>👨‍⚕️ Bác sĩ:</strong> ${docName}</p>
                <p><strong>📅 Ngày:</strong> ${date}</p>
                <p><strong>⏰ Giờ:</strong> ${time}</p>
                <p><strong>🏥 Hình thức:</strong> ${type}</p>
                <p><strong>💰 Phí đã thanh toán:</strong> $${fee}</p>
            </div>

            <p style="color: #666; font-size: 14px;">
                *Vui lòng đến trước 10 phút nếu khám tại phòng khám. 
                Nếu là khám từ xa, đường link video call sẽ được kích hoạt tại thời điểm hẹn.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
                <a href="http://localhost:5173/my-appointments" style="background-color: #5f6FFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Xem Cuộc Hẹn Của Tôi</a>
            </div>
        </div>

        <div style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            <p>&copy; 2025 Prescripto Healthcare. All rights reserved.</p>
            <p>Đây là email tự động, vui lòng không trả lời.</p>
        </div>
    </div>
    `;

    // Cấu hình mail option
    const mailOptions = {
        from: `"Prescripto Support" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: `✅ Xác nhận đặt lịch khám: ${date} - ${time}`,
        html: htmlContent
    };

    // Gửi mail
    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent successfully to ${email}`);
        return true;
    } catch (error) {
        console.error("❌ Error sending email:", error);
        return false;
    }
};

const sendCancellationEmail = async ({ email, name, docName, date, time, isRefund }) => {

    // Tạo nội dung HTML dựa trên trạng thái hoàn tiền
    const refundMessage = isRefund
        ? `<div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 12px; border-radius: 6px; margin-top: 10px;">
             <strong>💰 TRẠNG THÁI HOÀN TIỀN:</strong> Đã ghi nhận.<br/>
             <span style="font-size: 13px;">Hệ thống đang xử lý hoàn tiền về ví của bạn trong vòng 3-5 ngày làm việc.</span>
           </div>`
        : `<p style="color: #6b7280; font-style: italic; font-size: 13px;">(Lịch hẹn này chưa thanh toán nên không phát sinh hoàn tiền).</p>`;

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        
        <div style="background-color: #ef4444; padding: 20px; text-align: center;">
            <h2 style="margin: 0; color: #ffffff;">XÁC NHẬN HỦY LỊCH HẸN</h2>
        </div>
        
        <div style="padding: 24px; background-color: #ffffff;">
            <p>Xin chào <strong>${name}</strong>,</p>
            <p>Chúng tôi xác nhận yêu cầu hủy lịch khám của bạn đã được xử lý thành công.</p>
            
            <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>👨‍⚕️ Bác sĩ:</strong> ${docName}</p>
                <p style="margin: 5px 0;"><strong>📅 Ngày hẹn:</strong> ${date}</p>
                <p style="margin: 5px 0;"><strong>⏰ Giờ hẹn:</strong> ${time}</p>
                
                ${refundMessage}
            </div>

            <p style="color: #4b5563; font-size: 14px;">
                Nếu bạn muốn đặt lại lịch khám mới, vui lòng truy cập website hoặc ứng dụng của chúng tôi.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
                <a href="http://localhost:5173/doctors" style="display: inline-block; background-color: #5f6FFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Đặt Lịch Mới
                </a>
            </div>
        </div>

        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
            <p>&copy; 2025 Prescripto. All rights reserved.</p>
        </div>
    </div>
    `;

    // Cấu hình mail gửi đi
    const mailOptions = {
        from: `"Prescripto Support" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: `🚫 Xác nhận hủy lịch khám: ${date} lúc ${time}`,
        html: htmlContent
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email hủy lịch đã gửi đến: ${email} (Refund: ${isRefund})`);
    } catch (error) {
        console.error("❌ Lỗi gửi email hủy:", error);
    }
};
/// API add reviews 
const addReview = async (req, res) => {
    try {
        const { appointmentId, rating, comment } = req.body;
        const userId = req.userId; // Lấy từ middleware authUser
        // --- BƯỚC 1: TÌM CUỘC HẸN ---
        const appointment = await appointmentModel.findById(appointmentId);
        console.log("---------------- DEBUG REVIEW ----------------");
        console.log("1. Appointment ID:", appointmentId);
        console.log("2. ID chủ cuộc hẹn (Database):", appointment.userId.toString());
        console.log("3. ID người đang login (Token):", userId);
        console.log("----------------------------------------------");
        // 1.1 Kiểm tra cuộc hẹn có tồn tại không
        if (!appointment) {
            return res.json({ success: false, message: "Cuộc hẹn không tìm thấy!" });
        }

        // 1.2 Kiểm tra cuộc hẹn có đúng là của User đang đăng nhập không (Chống đánh giá hộ)
        if (appointment.userId.toString() !== userId) {
            return res.json({ success: false, message: "Bạn không có quyền đánh giá cuộc hẹn này!" });
        }

        // --- BƯỚC 2: KIỂM TRA TRẠNG THÁI (CORE LOGIC) ---
        // Chỉ khi status === 'Completed' mới được đi tiếp
        if (!appointment.isCompleted) {
            return res.json({
                success: false,
                message: "Bạn chưa hoàn thành buổi khám, không thể đánh giá!"
            });
        }

        // --- BƯỚC 3: KIỂM TRA ĐÃ ĐÁNH GIÁ CHƯA ---
        if (appointment.isReviewed) {
            return res.json({ success: false, message: "Bạn đã đánh giá cuộc hẹn này rồi!" });
        }

        // --- BƯỚC 4: XÁC ĐỊNH BÁC SĨ (CHÍNH XÁC TUYỆT ĐỐI) ---
        // Thay vì lấy docId từ req.body (User gửi lên có thể sai), 
        // ta lấy docId TRỰC TIẾP từ appointment tìm được trong Database.
        const docId = appointment.docId;

        // --- BƯỚC 5: THỰC HIỆN LƯU ---
        const newReview = new reviewModel({
            docId: docId, // Đảm bảo review gắn đúng vào bác sĩ của cuộc hẹn
            userId: userId,
            appointmentId: appointmentId,
            rating: rating,
            comment: comment
        });

        await newReview.save();

        // --- BƯỚC 6: TÍNH LẠI ĐIỂM CHO BÁC SĨ ---
        const reviews = await reviewModel.find({ docId });
        let totalStars = 0;
        reviews.map((item) => totalStars += item.rating);
        let avg = reviews.length > 0 ? totalStars / reviews.length : 0;

        await doctorModel.findByIdAndUpdate(docId, {
            averageRating: avg,
            totalRatings: reviews.length
        });

        // --- BƯỚC 7: KHÓA CUỘC HẸN ---
        await appointmentModel.findByIdAndUpdate(appointmentId, { isReviewed: true });

        res.json({ success: true, message: "Đánh giá thành công!" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const checkExpiredAppointments = async () => {
    try {
        // 1. Lấy tất cả lịch chưa hoàn thành và chưa bị hủy
        const appointments = await appointmentModel.find({
            isCompleted: false,
            cancelled: false
        });

        const now = new Date();

        // 2. Duyệt qua từng lịch hẹn
        for (const appointment of appointments) { // <--- Đặt tên biến là 'appointment'

            // --- BẮT ĐẦU XỬ LÝ THỜI GIAN ---
            // Format trong DB: slotDate="21_12_2025", slotTime="10:30 AM"
            const dateParts = appointment.slotDate.split('_'); // [21, 12, 2025]
            const day = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1; // Tháng trong JS bắt đầu từ 0
            const year = parseInt(dateParts[2]);

            // Tạo đối tượng Date cho ngày hẹn
            const appointmentDate = new Date(year, month, day);

            // Xử lý giờ (slotTime)
            // Giả sử slotTime dạng "10:30 AM" hoặc "02:00 PM"
            const timeParts = appointment.slotTime.split(' '); // ["10:30", "AM"]
            const time = timeParts[0].split(':'); // ["10", "30"]
            let hour = parseInt(time[0]);
            const minute = parseInt(time[1]);
            const ampm = timeParts[1];

            if (ampm === 'PM' && hour < 12) hour += 12;
            if (ampm === 'AM' && hour === 12) hour = 0;

            appointmentDate.setHours(hour, minute, 0);
            // --- KẾT THÚC XỬ LÝ THỜI GIAN ---

            // 3. So sánh với thời gian hiện tại
            // LỖI CŨ CỦA BẠN NẰM Ở ĐÂY: Có thể bạn đã viết if (app.slotDate...)
            if (appointmentDate < now) {
                // Nếu thời gian hẹn nhỏ hơn thời gian hiện tại -> Đã qua

                // Cập nhật trạng thái (Ví dụ: Đánh dấu là đã hoàn thành hoặc hết hạn)
                // Ở đây tôi set isCompleted = true (hoặc bạn có thể thêm field isExpired)
                await appointmentModel.findByIdAndUpdate(appointment._id, {
                    isCompleted: true
                });

                console.log(`Đã cập nhật hoàn thành cho lịch hẹn ID: ${appointment._id}`);
            }
        }
    } catch (error) {
        console.error("Lỗi trong checkExpiredAppointments:", error);
    }
};

const getUserNotifications = async (req, res) => {
    try {
        const userId = req.userId; // Lấy từ authUser middleware

        // Lấy thông báo, sắp xếp mới nhất lên đầu
        const notifications = await notificationModel.find({ userId }).sort({ createdAt: -1 });

        res.json({ success: true, notifications });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const getAllNurses = async (req, res) => {
    try {
        // Lấy tất cả nurse, bỏ trường password
        const nurses = await nurseModel.find({}).select('-password');
        res.json({ success: true, nurses });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}


export {
    registerUser, loginUser, getProfile, updateProfile, bookAppointment, bookGuestAppointment, listAppointments, cancelAppointment, createPayPalPayment, executePayPalPayment, createGuestPayment, executeGuestPayment, chatWithAI,
    forgotPassword, resetPassword, addReview, checkExpiredAppointments, getUserNotifications, getAllNurses
}