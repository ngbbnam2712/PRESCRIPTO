import express from 'express'
import {
    addDoctor, allDoctors, loginAdmin, appointmentsAdmin, appointmentCancel, adminDashboard, addMedicine, listMedicines,
    savePrescription, getPatientHistory, getGuestRequests, adminBookAppointment, completeGuestRequest, addNurse, addSpeciality,
    getSpecialityList
} from '../controllers/adminController.js'
import upload from '../middlewares/multer.js'
import authAdmin from '../middlewares/authAdmin.js'
import { changeAvailablity } from '../controllers/doctorController.js'
const adminRouter = express.Router()

adminRouter.post('/add-doctor', authAdmin, upload.single("image"), addDoctor)
adminRouter.post('/login', loginAdmin)
adminRouter.post('/all-doctors', authAdmin, allDoctors)
adminRouter.post('/change-availability', authAdmin, changeAvailablity)

adminRouter.get('/appointments', authAdmin, appointmentsAdmin)
adminRouter.post('/cancel-appointment', authAdmin, appointmentCancel)
adminRouter.get('/dashboard', authAdmin, adminDashboard)




adminRouter.post('/add-medicine', authAdmin, addMedicine)
adminRouter.get('/list-medicines', authAdmin, listMedicines)
adminRouter.post('/save-prescription', authAdmin, savePrescription)
adminRouter.get('/patient-history', adminRouter.get('/speciality-list', getSpecialityList), getPatientHistory)

adminRouter.get('/guest-requests', authAdmin, getGuestRequests);
adminRouter.post('/book-appointment', authAdmin, adminBookAppointment);
adminRouter.post('/complete-guest-request', authAdmin, completeGuestRequest);

adminRouter.post('/add-nurse', authAdmin, upload.single('image'), addNurse)
adminRouter.post('/add-specialist', authAdmin, upload.single('image'), addSpeciality);
adminRouter.get('/speciality-list', authAdmin, getSpecialityList)

export default adminRouter