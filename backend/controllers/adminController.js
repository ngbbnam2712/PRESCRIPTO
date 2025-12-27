import validator from 'validator'
import bcrypt from 'bcrypt'
import { v2 as cloudinary } from "cloudinary"
import doctorModel from '../models/doctorModel.js'
import jwt from 'jsonwebtoken'
import appointmentModel from '../models/appointmentModel.js'
import userModel from '../models/userModel.js'
import medicineModel from '../models/medicineModel.js'
import guestRequestModel from '../models/guestRequestModel.js'
import nurseModel from '../models/nurseModel.js'
//API for adding doctor 
const addDoctor = async (req, res) => {
    try {
        const { name, email, password, speciality, degree, experience, about, fees, address } = req.body
        const imageFile = req.file

        //check exits doctor
        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address) {
            return res.json({ success: false, message: "Missing Details" })
        }

        //validating email
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }

        //validating strong password
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }

        //hasing password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
        const imageUrl = imageUpload.secure_url

        const doctorData = {
            name,
            email,
            image: imageUrl,
            password: hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fees,
            address: JSON.parse(address),
            date: Date.now()
        }
        const newDoctor = new doctorModel(doctorData)
        await newDoctor.save()
        res.json({ success: true, message: "Doctor added" })


        console.log(req.body)
        console.log(imageFile)
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

///API for admin login 
const loginAdmin = async (req, res) => {
    try {

        const { email, password } = req.body
        if (email == process.env.ADMIN_EMAIL && password == process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email + password, process.env.JWT_SECRET)
            res.json({ success: true, message: "Admin logged in", token: token })
        } else {
            res.json({ success: false, message: "Invalid email or password" })
        }


    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const allDoctors = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select('-password')
        res.json({ success: true, doctors })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

/// API to get all apointment list 

const appointmentsAdmin = async (req, res) => {

    try {
        const appointments = await appointmentModel.find({ payment: true }).sort({ date: -1 })
        res.json({ success: true, appointments })



    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })

    }

}

/// API for appointment cancellation

const appointmentCancel = async (req, res) => {

    try {
        const { appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        //verify appointment
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
/// API to get dashboard data for admin panel 

const adminDashboard = async (req, res) => {
    try {
        const doctors = await doctorModel.find({})
        const users = await userModel.find({})
        const appointments = await appointmentModel.find({ payment: true })


        const dashData = {
            doctors: doctors.length,
            appointments: appointments.length,
            patients: users.length,
            latestAppointments: appointments.reverse().slice(0, 5)
        }
        let totalRevenue = 0;
        let appointmentsToday = 0;
        const today = new Date().setHours(0, 0, 0, 0);
        appointments.map((item) => {
            // Tính tiền nếu đã hoàn thành
            if (item.isCompleted) {
                totalRevenue += item.amount;
            }


            const currentDateStr = new Date().getDate() + "_" + (new Date().getMonth() + 1) + "_" + new Date().getFullYear();
            if (item.slotDate === currentDateStr) {
                appointmentsToday += 1;
            }
        });

        dashData.revenue = totalRevenue;
        dashData.appointmentsToday = appointmentsToday;


        const topDoctors = await doctorModel.find({})
            .sort({ averageRating: -1 })
            .limit(3)
            .select('name speciality image averageRating totalRatings');

        dashData.topDoctors = topDoctors;
        res.json({ success: true, dashData })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}


/// API get medicine

const addMedicine = async (req, res) => {
    try {
        const { name, price, description, stock, unit } = req.body;
        const newMedicine = new medicineModel({ name, price, description, stock, unit });
        await newMedicine.save();
        res.json({ success: true, message: "Đã thêm thuốc thành công" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API get medicine list
const listMedicines = async (req, res) => {
    try {
        const medicines = await medicineModel.find({});
        res.json({ success: true, medicines });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API save prescription
const savePrescription = async (req, res) => {
    try {
        const { appointmentId, diagnosis, medicines, symptoms } = req.body;

        // 1. Lấy thông tin cuộc hẹn hiện tại để lấy phí khám (amount)
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) return res.json({ success: false, message: "Không tìm thấy cuộc hẹn" });

        let totalMedicineCost = 0;
        const finalPrescription = [];

        // 2. Duyệt qua danh sách thuốc gửi lên để lấy giá chuẩn từ DB và tính tiền
        for (const item of medicines) {
            // Tìm thuốc trong kho để lấy giá hiện tại
            const drugInDb = await medicineModel.findOne({ name: item.name });

            const price = drugInDb ? drugInDb.price : 0; // Nếu không tìm thấy (thuốc ngoài luồng) thì giá = 0 hoặc lấy giá từ frontend gửi lên
            const cost = price * Number(item.quantity);

            totalMedicineCost += cost;

            // Lưu snapshot (giá tại thời điểm kê đơn)
            finalPrescription.push({
                medicineId: drugInDb ? drugInDb._id : null,
                name: item.name,
                dosage: item.dosage,
                quantity: item.quantity,
                price: price
            });

            // (Nâng cao: Tại đây có thể trừ tồn kho: drugInDb.stock -= item.quantity; await drugInDb.save();)
        }

        // 3. Tính tổng viện phí
        const baseFee = appointment.docData.fees || 0;
        const newAmount = baseFee + totalMedicineCost;
        // 4. Cập nhật Database
        await appointmentModel.findByIdAndUpdate(appointmentId, {
            symptoms: symptoms, // <--- LƯU VÀO DB
            diagnosis: diagnosis,
            prescription: finalPrescription,
            amount: newAmount,
            isPrescribed: true,
            isCompleted: true,
            payment: false
        });

        res.json({ success: true, message: "Lưu đơn & Cập nhật viện phí thành công" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const getPatientHistory = async (req, res) => {
    try {
        const { userId } = req.query; // Nhận userId từ query param

        const history = await appointmentModel.find({
            userId: userId,
            isCompleted: true
        }).sort({ slotDate: -1 }); // Mới nhất lên đầu

        res.json({ success: true, history });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

/// Admin đặt lịch thủ công
const adminBookAppointment = async (req, res) => {
    try {
        const { docId, slotDate, slotTime, userData, appointmentType } = req.body;

        // 1. Kiểm tra/Tạo User (Shadow Account)
        let userId = null;

        // Tìm xem SĐT này đã có trong hệ thống chưa
        const existingUser = await userModel.findOne({ phone: userData.phone });

        if (existingUser) {
            userId = existingUser._id;
            // (Tùy chọn) Cập nhật lại tên/địa chỉ nếu Admin nhập khác
        } else {
            // Tạo User mới
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash("admin_created_123", salt); // Mật khẩu mặc định

            const newUser = new userModel({
                name: userData.name,
                email: userData.email || "",
                phone: userData.phone,
                password: hashedPassword,
                address: { line1: userData.address || '', line2: '' },
                gender: userData.gender || 'Male',
                isGuest: true // Đánh dấu khách vãng lai
            });
            const savedUser = await newUser.save();
            userId = savedUser._id;
        }

        // 2. Lấy thông tin bác sĩ
        const docData = await doctorModel.findById(docId).select('-password');
        if (!docData.available) {
            return res.json({ success: false, message: "Doctor is not available" });
        }

        // 3. Kiểm tra Slot (Quan trọng: Tránh trùng lặp)
        let slots_booked = docData.slots_booked;
        if (slots_booked[slotDate] && slots_booked[slotDate].includes(slotTime)) {
            return res.json({ success: false, message: "Slot is already booked!" });
        }

        // 4. Tạo Appointment
        // Snapshot data bác sĩ
        const docDataSnapshot = docData.toObject();
        delete docDataSnapshot.slots_booked;

        const appointmentData = {
            userId,
            docId,
            userData: { ...userData, speciality: docData.speciality }, // Đảm bảo lưu đủ info
            docData: docDataSnapshot,
            amount: docData.fees,
            slotTime,
            slotDate,
            appointmentType: appointmentType || 'Clinic',
            date: Date.now(),
            cancelled: false,
            payment: false,
            isCompleted: false
        }

        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();

        // 5. Cập nhật Slot Bác sĩ (Đánh dấu đã bận)
        await doctorModel.findByIdAndUpdate(docId, {
            $push: { [`slots_booked.${slotDate}`]: slotTime }
        });

        res.json({ success: true, message: "Appointment Booked Successfully by Admin" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
const getGuestRequests = async (req, res) => {
    try {
        // Lấy tất cả yêu cầu, sắp xếp mới nhất lên đầu
        const requests = await guestRequestModel.find({}).sort({ date: -1 });
        res.json({ success: true, requests });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const completeGuestRequest = async (req, res) => {
    try {
        const { requestId } = req.body;

        const requestData = await guestRequestModel.findById(requestId);
        if (!requestData) {
            return res.json({ success: false, message: "Request not found" });
        }

        // Cập nhật trạng thái
        await guestRequestModel.findByIdAndUpdate(requestId, { isHandled: true });

        res.json({ success: true, message: "Request marked as Completed" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const addNurse = async (req, res) => {
    try {
        const { name, email, password, speciality, degree, experience, about, fees, address } = req.body;
        const imageFile = req.file;

        // 1. Kiểm tra dữ liệu đầu vào
        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address) {
            return res.json({ success: false, message: "Missing Details" });
        }

        // 2. Validate Email
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        // 3. Validate Password
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" });
        }

        // 4. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 5. Upload Image lên Cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
        const imageUrl = imageUpload.secure_url;

        // 6. Parse dữ liệu JSON từ Frontend
        // Frontend gửi speciality dưới dạng chuỗi '["A", "B"]' -> Cần parse thành Mảng ["A", "B"]
        let specialityArray = [];
        try {
            specialityArray = JSON.parse(speciality);
        } catch (error) {
            // Fallback: nếu gửi dạng string thường cách nhau dấu phẩy
            specialityArray = typeof speciality === 'string' ? speciality.split(',') : [speciality];
        }

        const nurseData = {
            name,
            email,
            image: imageUrl,
            password: hashedPassword,
            speciality: specialityArray, // Lưu dưới dạng Mảng
            degree,
            experience,
            about,
            fees,
            address: JSON.parse(address), // Parse địa chỉ
            date: Date.now()
        }

        // 7. Lưu vào Database
        const newNurse = new nurseModel(nurseData);
        await newNurse.save();

        res.json({ success: true, message: "Nurse Added Successfully" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
export {
    addDoctor, loginAdmin, allDoctors, appointmentsAdmin, appointmentCancel, adminDashboard, addMedicine, listMedicines,
    savePrescription, getPatientHistory, adminBookAppointment, getGuestRequests, completeGuestRequest, addNurse
}