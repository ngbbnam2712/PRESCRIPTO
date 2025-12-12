
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import appointmentModel from '../models/appointmentModel.js'
import doctorModel from '../models/doctorModel.js';
import reviewModel from '../models/reviewModel.js';






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
            return res.json({ success: true, message: 'Invalid credentials' })
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
        const appointments = await appointmentModel.find({ docId })
        res.json({ success: true, appointments })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })

    }
}


/// API to mark appointment completed for doctor panel

const appointmentComplete = async (req, res) => {
    try {



        const { appointmentId } = req.body
        const docId = req.docId
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
            await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })
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

        const appointments = await appointmentModel.find({ docId })

        let earnings = 0

        appointments.map((item) => {
            if (item.isCompleted || item.payment) {
                earnings += item.amount
            }
        })

        let patients = []
        appointments.map((item) => {
            if (!patients.includes(item.userId)) {
                patients.push(item.userId)
            }
        })

        const dashData = {
            earnings,
            appointments: appointments.length,
            patients: patients.length,
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
        const docId = req.params.docId
        // Tìm trong bảng reviews, populate thêm thông tin User để lấy tên và ảnh
        const reviews = await reviewModel.find({ docId })
            .populate('userId', 'name image') // Chỉ lấy field name và image của user
            .sort({ createdAt: -1 }); // Mới nhất lên đầu

        res.json({ success: true, reviews });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export { changeAvailablity, doctorList, loginDoctor, appointmentsDoctor, appointmentComplete, appointmentCancel, doctorDashboard, doctorProfile, updateDoctorProfile, getDoctorReviews }