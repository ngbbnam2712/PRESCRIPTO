
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import appointmentModel from '../models/appointmentModel.js'
import doctorModel from '../models/doctorModel.js';
import reviewModel from '../models/reviewModel.js';
import prescriptionModel from "../models/prescriptionModel.js";
import medicineModel from "../models/medicineModel.js";



const changeAvailablity = async (req, res) => {
    try {

        const { docId } = req.body
        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
        res.json({ success: true, message: "Availablity Changed" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}


const doctorList = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select(['-password', '-email'])
        res.json({ success: true, doctors })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

///API for doctor login  
const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body
        const doctor = await doctorModel.findOne({ email })

        if (!doctor) {
            return res.json({ success: false, message: 'Invalid credentials' })
        }

        const isMatch = await bcrypt.compare(password, doctor.password)


        if (isMatch) {
            const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: 'Invalid credentials' })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

/// API to get doctor appointment for doctor panel

const appointmentsDoctor = async (req, res) => {
    try {
        const docId = req.docId
        const appointments = await appointmentModel.find({ docId, payment: true }).sort({ date: -1 })
        res.json({ success: true, appointments })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })

    }
}


/// API to mark appointment completed for doctor panel

const appointmentComplete = async (req, res) => {
    try {


        const docId = req.docId
        const { appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)

        if (appointmentData && appointmentData.docId.toString() === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, {
                status: 'Completed', // Cập nhật Text hiển thị
                isCompleted: true,   // Cập nhật Logic (để hiện nút Review)
                payment: true        // Mặc định khám xong là phải trả tiền rồi
            });
            return res.json({ success: true, message: 'Appointment Completed' })
        } else {
            console.log(appointmentData)
            return res.json({ success: false, message: 'Mark Failed' })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}


/// API to cancel appointments for doctor panel 
const appointmentCancel = async (req, res) => {
    try {



        const { appointmentId } = req.body
        const docId = req.docId
        const appointmentData = await appointmentModel.findById(appointmentId)

        if (appointmentData && appointmentData.docId.toString() === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, {
                cancelled: true,
                status: 'Cancelled'
            })
            return res.json({ success: true, message: 'Cancellation Completed' })
        } else {
            return res.json({ success: false, message: 'Mark Failed' })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}


/// API get dashboard for doctor panel 
const doctorDashboard = async (req, res) => {
    try {
        const docId = req.docId

        const appointments = await appointmentModel.find({ docId, payment: true })

        let earnings = 0
        const uniquePatients = new Set();

        appointments.forEach((item) => {

            if (item.isCompleted || item.payment) {
                earnings += item.amount;
            }


            if (item.userId) {

                uniquePatients.add(item.userId.toString());
            }
        });

        const dashData = {
            earnings,
            appointments: appointments.length,
            patients: uniquePatients.size,
            latestAppointments: appointments.reverse().slice(0, 5)
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}
/// API to get doctor profile for doctor panel

const doctorProfile = async (req, res) => {

    try {
        const docId = req.docId
        const profileData = await doctorModel.findById(docId).select('-password')
        res.json({ success: true, profileData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}
/// API to update doctor profile data from doctor panel

const updateDoctorProfile = async (req, res) => {
    try {
        const docId = req.docId
        const { fees, address, available } = req.body
        await doctorModel.findByIdAndUpdate(docId, { fees, address, available })
        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}


///API get doctor review 
const getDoctorReviews = async (req, res) => {
    try {
        const { docId } = req.params;
        // Tìm trong bảng reviews, populate thêm thông tin User để lấy tên và ảnh
        const reviews = await reviewModel.find({ doctorId: docId })
            .populate('userId', 'name image')
            .sort({ createdAt: -1 }); // Sắp xếp mới nhất lên đầu

        res.json({ success: true, reviews });

    } catch (error) {
        console.log("Lỗi lấy reviews:", error);
        res.json({ success: false, message: error.message });
    }
}

const getPatientHistory = async (req, res) => {
    try {
        const { userId, docId } = req.query;

        // 1. Lấy tất cả cuộc hẹn đã hoàn thành của bệnh nhân này
        const appointments = await appointmentModel.find({
            userId,
            docId,
            isCompleted: true,
            cancelled: false
        }).sort({ slotDate: -1 }); // Sắp xếp mới nhất lên đầu

        // 2. Duyệt qua từng cuộc hẹn để tìm Đơn thuốc (Prescription) tương ứng
        const historyData = await Promise.all(appointments.map(async (appt) => {

            // Tìm đơn thuốc dựa vào appointmentId
            const prescription = await prescriptionModel.findOne({ appointmentId: appt._id });

            // 3. Trả về object đã gộp dữ liệu
            return {
                ...appt.toObject(), // Lấy toàn bộ thông tin lịch hẹn (ngày, giờ, symptoms...)

                // Gán thêm thông tin từ Prescription vào (để Frontend dễ lấy)
                diagnosis: prescription ? prescription.diagnosis : 'Chưa có chẩn đoán',
                symptoms: prescription ? prescription.symptoms : 'Chưa có chẩn đoán',
                note: prescription ? prescription.note : '',

                // Gán toàn bộ object prescription vào biến prescriptionData để frontend map danh sách thuốc
                prescriptionData: prescription || null
            }
        }));

        res.json({ success: true, history: historyData });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
const addMedicine = async (req, res) => {
    try {
        const {
            name,
            price,
            description,
            stock,
            unit,
            specializationId,
            isGeneral
        } = req.body;

        // Kiểm tra trùng tên thuốc
        const exists = await medicineModel.findOne({ name });
        if (exists) {
            return res.json({ success: false, message: "Tên thuốc đã tồn tại trong kho" });
        }

        // Tạo thuốc mới với đầy đủ trường
        const newMedicine = new medicineModel({
            name,
            price,
            description,
            stock: stock || 100, // Mặc định nếu không gửi
            unit: unit || 'Viên',
            specializationId: specializationId || null, // Có thể null nếu là thuốc chung
            isGeneral: isGeneral || false
        });

        await newMedicine.save();
        res.json({ success: true, message: "Đã thêm thuốc vào kho thành công" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
const listMedicines = async (req, res) => {
    try {
        // Lấy tất cả thuốc, sắp xếp thuốc mới nhất lên đầu
        const medicines = await medicineModel.find({}).sort({ createdAt: -1 });
        res.json({ success: true, medicines });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
const savePrescription = async (req, res) => {
    try {
        const { appointmentId, diagnosis, medicines, symptoms, note } = req.body;

        // 1. Kiểm tra cuộc hẹn
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            return res.json({ success: false, message: "Không tìm thấy cuộc hẹn" });
        }

        const prescriptionMedicines = [];

        // 2. Xử lý danh sách thuốc (Trừ kho & Lấy thông tin)
        for (const item of medicines) {
            // Lấy thuốc từ DB kho để check tồn kho và lấy ID
            const drugInDb = await medicineModel.findOne({ name: item.name });

            const quantity = Number(item.quantity);

            // Chuẩn bị object để lưu vào PrescriptionModel
            prescriptionMedicines.push({
                medicineId: drugInDb ? drugInDb._id : null,
                name: item.name,
                quantity: quantity,
                unit: item.unit || (drugInDb ? drugInDb.unit : 'Viên'),
                dosage: item.dosage // <--- QUAN TRỌNG: Phải lưu liều dùng bác sĩ kê
            });

            // Trừ tồn kho (Inventory Management)
            if (drugInDb) {
                // Kiểm tra nếu đủ thuốc mới trừ, hoặc cho phép âm tùy logic của bạn
                if (drugInDb.stock >= quantity) {
                    drugInDb.stock -= quantity;
                    await drugInDb.save();
                }
            }
        }

        // 3. TẠO MỚI PRESCRIPTION
        const newPrescription = new prescriptionModel({
            appointmentId: appointmentId,
            doctorId: appointment.doctorId,
            patientId: appointment.userId,
            diagnosis: diagnosis,
            symptoms: symptoms,
            note: note || '',
            medicines: prescriptionMedicines
        });

        await newPrescription.save();

        // 4. CẬP NHẬT APPOINTMENT
        await appointmentModel.findByIdAndUpdate(appointmentId, {
            hasPrescription: true,  // Đánh dấu đã có đơn
            isCompleted: true,      // <--- QUAN TRỌNG: Đánh dấu cuộc hẹn đã hoàn thành
        });

        res.json({ success: true, message: "Đã lưu đơn thuốc và hoàn thành cuộc hẹn" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export { changeAvailablity, doctorList, loginDoctor, appointmentsDoctor, appointmentComplete, appointmentCancel, doctorDashboard, doctorProfile, updateDoctorProfile, getDoctorReviews, getPatientHistory, addMedicine, listMedicines, savePrescription }