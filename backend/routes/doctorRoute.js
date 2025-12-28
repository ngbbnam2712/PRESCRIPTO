import express from 'express';
import { doctorList, loginDoctor, appointmentsDoctor, appointmentComplete, appointmentCancel, doctorDashboard, doctorProfile, updateDoctorProfile, getDoctorReviews, getPatientHistory, addMedicine, listMedicines, savePrescription } from '../controllers/doctorController.js';
import authDoctor from '../middlewares/authDoctor.js'
const doctorRouter = express.Router()


doctorRouter.get('/list', doctorList)
doctorRouter.post('/login', loginDoctor)
doctorRouter.get('/appointments', authDoctor, appointmentsDoctor)
doctorRouter.post('/complete-appointment', authDoctor, appointmentComplete)
doctorRouter.post('/cancel-appointment', authDoctor, appointmentCancel)
doctorRouter.get('/dashboard', authDoctor, doctorDashboard)
doctorRouter.get('/profile', authDoctor, doctorProfile)
doctorRouter.post('/update-profile', authDoctor, updateDoctorProfile)
doctorRouter.get('/reviews/:docId', getDoctorReviews)
doctorRouter.get('/patient-history', authDoctor, getPatientHistory)

doctorRouter.post('/add-medicine', authDoctor, addMedicine)
doctorRouter.get('/list-medicines', authDoctor, listMedicines)
doctorRouter.post('/save-prescription', authDoctor, savePrescription)
export default doctorRouter