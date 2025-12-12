import validator from 'validator'

import bcrypt from 'bcrypt'

import userModel from '../models/userModel.js'

import doctorModel from '../models/doctorModel.js'

import jwt from 'jsonwebtoken'

import { v2 as cloudinary } from 'cloudinary'

import appointmentModel from '../models/appointmentModel.js'
import paypal from 'paypal-rest-sdk'

import nodemailer from 'nodemailer'


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

        const userId = req.userId;

        const { docId, slotDate, slotTime } = req.body;



        // 1. Kiểm tra availability và lấy dữ liệu Doctor

        // Dữ liệu này chỉ được dùng để kiểm tra 'available' và lấy 'fees'

        const docData = await doctorModel.findById(docId).select('-password');

        if (!docData || !docData.available) {

            return res.json({ success: false, message: "Doctor is not available or not found" });

        }



        // --- XÓA: let slots_booked = docData.slots_booked (Gây lỗi ghi đè) ---



        // 2. Cố gắng cập nhật slot ĐỒNG THỜI (Atomic Update)

        const updateResult = await doctorModel.findOneAndUpdate(

            {

                _id: docId,

                [`slots_booked.${slotDate}`]: { $ne: slotTime }

            },

            {

                $push: { [`slots_booked.${slotDate}`]: slotTime }

            },

            { new: true } // Trả về tài liệu đã được cập nhật

        );



        if (!updateResult) {

            return res.json({ success: false, message: "Slot Already Booked" });

        }



        // 3. Lấy dữ liệu người dùng

        const userData = await userModel.findById(userId).select('-password');



        // 4. Chuẩn bị dữ liệu Doctor cho Appointment Model (Sử dụng docData gốc)

        // Tạo bản sao và xóa trường slots_booked

        const docDataForAppointment = docData.toObject();

        delete docDataForAppointment.slots_booked;



        // 5. Tạo và Lưu lịch hẹn

        const appointmentData = {

            userId,

            docId,

            userData,

            docData: docDataForAppointment, // SỬ DỤNG ĐỐI TƯỢNG ĐÃ LÀM SẠCH

            amount: docData.fees, // Lấy fees từ docData ban đầu

            slotTime,

            slotDate,

            date: Date.now()

        };



        const newAppointment = new appointmentModel(appointmentData);

        await newAppointment.save();



        // --- XÓA: await doctorModel.findByIdAndUpdate(docId, { slots_booked }) ---



        res.json({ success: true, message: "Appointment Booked Successfully" });



    } catch (error) {

        console.error(error);

        res.status(500).json({ success: false, message: "Server error during booking", error: error.message });

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


// backend/controllers/userController.js

const cancelAppointment = async (req, res) => {
    try {
        // Lấy userId (từ middleware auth) và appointmentId (từ client gửi lên)
        const userId = req.userId
        const { appointmentId } = req.body;

        // BƯỚC 1: Tìm cuộc hẹn trong DB
        const appointmentData = await appointmentModel.findById(appointmentId);

        // Kiểm tra xem cuộc hẹn có tồn tại không
        if (!appointmentData) {
            return res.json({ success: false, message: "Appointment not found" });
        }

        // BƯỚC 2: Xác thực quyền (Chỉ chủ sở hữu mới được hủy)
        // Lưu ý: convert sang string để so sánh
        if (appointmentData.userId.toString() !== userId) {
            return res.json({ success: false, message: "Unauthorized action" });
        }

        // BƯỚC 3: Cập nhật trạng thái cuộc hẹn (Hủy, Reset hoàn thành, Đánh dấu chưa thanh toán)
        await appointmentModel.findByIdAndUpdate(appointmentId, {
            cancelled: true,
            status: 'Cancelled',
            isCompleted: false, // Reset để tránh tính doanh thu
            payment: false      // Hủy thì coi như tiền chưa vào túi
        });

        // BƯỚC 4: Giải phóng Slot cho bác sĩ (Release Slot)
        const { docId, slotDate, slotTime } = appointmentData;

        const doctorData = await doctorModel.findById(docId);

        // Dùng kỹ thuật $pull của MongoDB để xóa 1 phần tử khỏi mảng nhanh gọn
        if (doctorData.slots_booked[slotDate]) {
            await doctorModel.findByIdAndUpdate(docId, {
                $pull: { [`slots_booked.${slotDate}`]: slotTime }
            });
        }

        res.json({ success: true, message: 'Appointment Cancelled' });

    } catch (error) {
        console.log(error);
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
                return res.redirect(`${process.env.FRONTEND_URL}?success=false&appointmentId=${appointmentId}`);
            } else {
                if (payment.state === 'approved') {
                    // Thanh toán thành công -> Update DB
                    await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true });
                    // Redirect về Frontend báo thành công
                    return res.redirect(`${process.env.FRONTEND_URL}?success=true&appointmentId=${appointmentId}`);
                } else {
                    return res.redirect(`${process.env.FRONTEND_URL}?success=false&appointmentId=${appointmentId}`);
                }
            }
        });

    } catch (error) {
        console.error(error);
        return res.redirect(`${process.env.FRONTEND_URL}?success=false`);
    }
};

import { GoogleGenerativeAI } from "@google/generative-ai";
import reviewModel from '../models/reviewModel.js'

const chatWithAI = async (req, res) => {
    try {
        const { question } = req.body;

        if (!question) {
            return res.json({ success: false, message: "Vui lòng nhập câu hỏi." });
        }

        // 1. LẤY DỮ LIỆU BÁC SĨ (FULL DATA)
        // -password -email: Dấu trừ (-) nghĩa là loại bỏ 2 trường này
        // available: true: Chỉ lấy bác sĩ đang làm việc
        const doctors = await doctorModel.find({ available: true }).select('-password -email');

        if (!doctors || doctors.length === 0) {
            return res.json({ success: true, reply: "Hiện tại không có bác sĩ nào khả dụng." });
        }

        // 2. CẤU HÌNH AI
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // 3. TẠO PROMPT THÔNG MINH
        // Lấy giờ hiện tại để AI có khái niệm về thời gian
        const now = new Date();
        const currentDateTime = now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

        const prompt = `
        Bạn là Trợ lý Lễ tân của Phòng khám Prescripto.
        
        --- THÔNG TIN QUAN TRỌNG ---
        1. Thời gian hiện tại của hệ thống: ${currentDateTime}
        2. GIỜ LÀM VIỆC CỦA BỆNH VIỆN: Từ 10:00 AM (Sáng) đến 09:00 PM (Tối). 
           (Tuyệt đối không nhận khách ngoài khung giờ này).

        --- DỮ LIỆU BÁC SĨ & LỊCH TRÌNH ---
        Dưới đây là danh sách bác sĩ và lịch đã kín (slots_booked) của họ:
        ${JSON.stringify(doctors)}

        --- CÂU HỎI CỦA KHÁCH ---
        "${question}"

        --- YÊU CẦU TRẢ LỜI ---
        1. Kiểm tra giờ làm việc: Nếu khách muốn hẹn lúc 8h sáng hay 10h đêm, hãy từ chối khéo và nhắc lại giờ mở cửa (10h-21h).
        2. Kiểm tra lịch bận (slots_booked): 
           - Cấu trúc slots_booked là { "timestamp_ngày": ["giờ_bận_1", "giờ_bận_2"] }.
           - Hãy xem kỹ xem giờ khách muốn đặt có bị trùng trong danh sách này không.
        3. Tư vấn bác sĩ: Dựa vào chuyên khoa (speciality), kinh nghiệm (experience), và giá (fees).
        4. Trả lời ngắn gọn, thân thiện bằng tiếng Việt.
        `;

        // 4. GỬI CHO AI XỬ LÝ
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        res.json({ success: true, reply: responseText });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}







/// API forgot password
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Email của bạn (VD: hotro.phongkham@gmail.com)
        pass: process.env.EMAIL_PASS  // Mật khẩu ứng dụng (App Password)
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
    console.log('--- SCANNING FOR EXPIRED APPOINTMENTS ---');
    try {
        const timeLimit = new Date(Date.now() - 15 * 60 * 1000); // 15 phút trước

        // 1. Tìm lịch hẹn quá hạn
        const expiredAppointments = await appointmentModel.find({
            status: 'Pending',
            payment: false,
            createdAt: { $lt: timeLimit }
        });

        if (expiredAppointments.length > 0) {
            console.log(`Found ${expiredAppointments.length} expired appointments.`);

            for (const app of expiredAppointments) {
                // 2. Trả slot cho bác sĩ
                const { docId, slotDate, slotTime } = app;
                await doctorModel.findByIdAndUpdate(docId, {
                    $pull: { [`slots_booked.${slotDate}`]: slotTime }
                });

                // 3. Hủy lịch hẹn
                await appointmentModel.findByIdAndUpdate(app._id, {
                    cancelled: true,
                    status: 'Cancelled (System Auto)',
                    isCompleted: false
                });
            }
            console.log('--- CLEANUP COMPLETE ---');
        }
    } catch (error) {
        console.error('Error in checkExpiredAppointments:', error);
    }
}





export { registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointments, cancelAppointment, createPayPalPayment, executePayPalPayment, chatWithAI, forgotPassword, resetPassword, addReview, checkExpiredAppointments }