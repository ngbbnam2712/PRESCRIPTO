import validator from 'validator'
import bcrypt from 'bcrypt'
import { v2 as cloudinary } from "cloudinary"
import doctorModel from '../models/doctorModel.js'
import jwt from 'jsonwebtoken'
import appointmentModel from '../models/appointmentModel.js'
import userModel from '../models/userModel.js'
import medicineModel from '../models/medicineModel.js'
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
        const appointments = await appointmentModel.find({})
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
        const appointments = await appointmentModel.find({})


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
        const { appointmentId, diagnosis, medicines } = req.body;

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
            diagnosis: diagnosis,
            prescription: finalPrescription,
            amount: newAmount, // Cập nhật tổng tiền mới
            isPrescribed: true,
            isCompleted: true,
            payment: false // Reset lại trạng thái thanh toán (vì tiền tăng lên, cần thu thêm)
        });

        res.json({ success: true, message: "Lưu đơn & Cập nhật viện phí thành công" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export { addDoctor, loginAdmin, allDoctors, appointmentsAdmin, appointmentCancel, adminDashboard, addMedicine, listMedicines, savePrescription }