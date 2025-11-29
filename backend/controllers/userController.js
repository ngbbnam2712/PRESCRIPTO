import validator from 'validator'

import bcrypt from 'bcrypt'

import userModel from '../models/userModels.js'

import doctorModel from '../models/doctorModels.js'

import jwt from 'jsonwebtoken'

import { v2 as cloudinary } from 'cloudinary'

import appointmentModel from '../models/appointmentModels.js'
import paypal from 'paypal-rest-sdk'




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



const cancelAppointment = async (req, res) => {

    try {



        const userId = req.userId

        const { appointmentId } = req.body



        const appointmentData = await appointmentModel.findById(appointmentId)



        //verify appointment

        if (appointmentData.userId !== userId) {

            return res.json({ success: false, message: 'Unauthorized action' })

        }



        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })









        //release slot







        const { docId, slotDate, slotTime } = appointmentData



        const doctorData = await doctorModel.findById(docId)



        await doctorModel.findByIdAndUpdate(docId, {

            $pull: { [`slots_booked.${slotDate}`]: slotTime }

        })

        res.json({ success: true, message: 'Appointment Cancelled' })





    } catch (error) {

        console.log(error)

        res.json({ success: false, message: error.message })



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



export { registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointments, cancelAppointment, createPayPalPayment, executePayPalPayment }